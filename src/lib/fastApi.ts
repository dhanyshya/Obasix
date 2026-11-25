/**
 * Migration to the FastAPI service in api/ (docs/backend-migration.md).
 *
 * Each area listed in OBASIX_API_ROUTES is served by OBASIX_API_URL instead of
 * the route handlers in src/app/api. src/proxy.ts does the forwarding. With
 * OBASIX_API_URL unset, everything stays in Next.js.
 *
 * An entry is an exact path, or a prefix when it ends in "/": "/api/quotes/" covers
 * /api/quotes/<reference> but not /api/quotes itself.
 */
export const apiAreas: Record<string, string[]> = {
  auth: ["/api/auth"],
  account: ["/api/account"],
  // Staff roles, the audit log and "who am I": endpoints that only exist on FastAPI.
  "admin-core": ["/api/admin/me", "/api/admin/audit", "/api/admin/staff"],
  "admin-stock": ["/api/admin/stock"],
  // Reading a saved quote. Submitting one (POST /api/quotes, with its file) stays in Next.js.
  quotes: ["/api/quotes/"],
  // The staff quote list (FastAPI only).
  "admin-quotes": ["/api/admin/quotes"],
  // MIG-005b. Files go to the same store as the site's: Vercel Blob, or a shared OBASIX_FILES_DIR.
  "quote-submit": ["/api/quotes"],
  "admin-quote-files": ["/api/admin/quotes/"],
  proofs: ["/api/proofs", "/api/proofs/"],
  "admin-proofs": ["/api/admin/proofs"],
  // MIG-006. The Razorpay webhook is forwarded with its raw body, so its signature still checks out.
  commerce: [
    "/api/commerce/mode",
    "/api/commerce/orders",
    "/api/commerce/payment",
    "/api/commerce/payment/webhook",
    "/api/commerce/track",
  ],
  stock: ["/api/stock"],
  "admin-orders": ["/api/admin/orders"],
  // MIG-007: trade channels.
  associates: ["/api/associates", "/api/associates/ref", "/api/associates/me"],
  "admin-associates": ["/api/admin/associates", "/api/admin/commissions"],
  distributors: ["/api/distributors", "/api/distributors/me", "/api/distributors/orders"],
  "admin-distributors": ["/api/admin/distributors", "/api/admin/trade-orders"],
  partners: ["/api/partners", "/api/partners/me"],
  "admin-partners": ["/api/admin/partners", "/api/admin/projects"],
  company: ["/api/company"],
  // MIG-008. /api/ai/sign-layouts stays here, next to the signage rules the design studio also runs in the browser.
  ai: ["/api/ai/status", "/api/ai/chat", "/api/ai/frame-colours"],
};

export type FastApiConfig = { target: string; secret: string; paths: Set<string>; prefixes: string[] } | null;

/** True when `path` belongs to one of the configured areas. */
export function servedByFastApi(config: FastApiConfig, path: string) {
  if (!config) return false;
  return config.paths.has(path) || config.prefixes.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

/** Reads and checks the settings. Throws on a mistake, so a bad deploy fails at build time. */
export function fastApiConfig(env: Record<string, string | undefined> = process.env): FastApiConfig {
  const target = env.OBASIX_API_URL?.replace(/\/$/, "");
  if (!target) return null;
  if (!env.DATABASE_URL) {
    // Both sides must read the same accounts and sessions, which local SQLite can't share.
    throw new Error("OBASIX_API_URL needs DATABASE_URL: the site and the API must use the same Postgres database.");
  }
  const secret = env.OBASIX_API_PROXY_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("OBASIX_API_URL needs OBASIX_API_PROXY_SECRET (32+ characters), the same value the API has.");
  }
  const paths = new Set<string>();
  const prefixes: string[] = [];
  const areas = (env.OBASIX_API_ROUTES ?? "").split(",").map((a) => a.trim()).filter(Boolean);
  for (const area of areas) {
    const sources = apiAreas[area];
    if (!sources) throw new Error(`OBASIX_API_ROUTES: unknown area "${area}". Known: ${Object.keys(apiAreas).join(", ")}`);
    sources.forEach((path) => (path.endsWith("/") ? prefixes.push(path) : paths.add(path)));
  }
  if ((areas.includes("quotes") || areas.includes("quote-submit")) && !env.AUTH_SECRET) {
    // Quote cookies are signed with AUTH_SECRET; without it the site uses a random per-process key.
    throw new Error("OBASIX_API_ROUTES includes quotes: set AUTH_SECRET, the same value on the site and the API.");
  }
  return { target, secret, paths, prefixes };
}

/**
 * MIG-011: where the React admin app lives. When set, the site's /admin pages redirect there.
 * It must be an absolute http(s) URL, and needs the FastAPI admin areas on (the app talks only to FastAPI).
 */
export function adminAppUrl(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.OBASIX_ADMIN_APP_URL?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`OBASIX_ADMIN_APP_URL must be an absolute URL, got "${raw}".`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("OBASIX_ADMIN_APP_URL must be http or https.");
  if (!(env.OBASIX_API_ROUTES ?? "").split(",").map((a) => a.trim()).includes("admin-core")) {
    throw new Error("OBASIX_ADMIN_APP_URL needs the admin-core area in OBASIX_API_ROUTES: the admin app talks only to FastAPI.");
  }
  return url.origin + url.pathname.replace(/\/$/, "");
}
