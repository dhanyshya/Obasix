/**
 * The only way the admin app talks to the server: FastAPI's REST endpoints.
 *
 * - Cookies go with every request (the session is the same `obasix_session` the site uses).
 * - Every request carries a fresh X-Request-Id. FastAPI logs it and returns it, and errors
 *   show it, so a problem a staff member reports can be found in the API logs.
 */
const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly requestId: string,
    readonly errors?: Record<string, string>,
  ) {
    super(message);
  }
}

function newRequestId() {
  return crypto.randomUUID().replaceAll("-", "");
}

/** The full URL of an API path, for links (file downloads go straight to the browser). */
export function apiUrl(path: string) {
  return `${base}${path}`;
}

/** A multipart upload (files). Same error handling as api(). */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const requestId = newRequestId();
  let response: Response;
  try {
    response = await fetch(new URL(`${base}${path}`, window.location.origin), {
      method: "POST",
      credentials: "include",
      headers: { "x-request-id": requestId },
      body: form,
    });
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Check your connection and try again.", requestId);
  }
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!response.ok || data.ok === false) {
    throw new ApiError(response.status, data.message || "The upload was refused.", response.headers.get("x-request-id") ?? requestId);
  }
  return data as T;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const url = new URL(`${base}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const requestId = newRequestId();
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      credentials: "include",
      headers: {
        "x-request-id": requestId,
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Check your connection and try again.", requestId);
  }
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string; errors?: Record<string, string>; detail?: unknown };
  if (!response.ok || data.ok === false) {
    const fallback = response.status >= 500 ? "Something went wrong on the server. Try again." : "The request was refused.";
    const fieldErrors = data.errors ? Object.values(data.errors).join(" ") : "";
    throw new ApiError(response.status, data.message || fieldErrors || fallback, response.headers.get("x-request-id") ?? requestId, data.errors);
  }
  return data as T;
}

// ---------- Types returned by FastAPI ----------

export type Permission = "stock:read" | "stock:write" | "audit:read" | "staff:manage" | "quotes:read" | "proofs:read" | "proofs:write";
export type Me = { email: string; name: string; role: "admin" | "staff"; source: "config" | "granted"; permissions: Permission[] };
export type StockState = "in-stock" | "low" | "made-to-order" | "untracked";
export type StockRow = { productId: string; name: string; sku: string; onHand: number | null; state: StockState; updatedBy: string | null; updatedAt: string | null };
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
export type AuditEntry = {
  id: number;
  at: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: Record<string, unknown>;
  requestId: string;
  ip: string;
};
export type StaffMember = { email: string; role: "admin" | "staff"; source: "config" | "granted"; grantedBy?: string | null; grantedAt?: string | null };
export type QuoteLine = { productId: string; name: string; sku: string; quantity: number; catalogueUnitPrice: number; detail: string };
export type QuoteSummary = {
  reference: string;
  createdAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  boardType: string;
  product: string;
  dimensions: string;
  quantity: number;
  configurationSummary: string;
  notes: string;
  lines: QuoteLine[];
  catalogueListSubtotal: number;
  attachment: { name: string; type: string; size: number } | null;
};
export type ProofStatus = "pending" | "approved" | "changes" | "superseded";
export type Proof = {
  id: string;
  quoteReference: string;
  version: number;
  fileName: string;
  mimeType: string;
  size: number;
  staffNote: string;
  uploadedBy: string;
  createdAt: string;
  status: ProofStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  customerComment: string;
};
