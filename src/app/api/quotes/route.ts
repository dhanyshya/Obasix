import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  catalogueLine,
  cleanText,
  parseQuantity,
  quoteAttachmentMaxBytes,
  quoteAttachmentTypes,
  quoteBoardTypes,
  validateQuoteFields,
} from "@/lib/quotes/schema";
import { allowQuoteAttempt, saveDemoQuote, type StoredQuote } from "@/lib/quotes/demo-store";

export const runtime = "nodejs";

function quoteMode() {
  if (process.env.QUOTE_API_URL && process.env.QUOTE_API_TOKEN) return "real" as const;
  if (process.env.OBASIX_COMMERCE_MODE === "live") return "unconfigured" as const;
  if (process.env.OBASIX_COMMERCE_MODE === "demo" || process.env.NODE_ENV === "development") return "demo" as const;
  return "unconfigured" as const;
}

/** Confirms the file content matches its declared type (PNG, JPEG, WebP or PDF signatures). */
function sniffType(bytes: Uint8Array): string | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (starts([0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
}

const extensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const mode = quoteMode();
  const idempotencyKey = cleanText(request.headers.get("idempotency-key") ?? "", 80);
  if (idempotencyKey.length < 8) {
    return Response.json(
      { ok: false, saved: false, notified: false, message: "Submit the quote again. The request is missing an idempotency key." },
      { status: 400 },
    );
  }

  if (mode === "unconfigured") {
    return Response.json(
      {
        ok: false,
        saved: false,
        notified: false,
        message: "Quote requests are not saved. This server has no quote database.",
        required: ["QUOTE_API_URL", "QUOTE_API_TOKEN"],
      },
      { status: 503 },
    );
  }

  if (mode === "real") {
    return Response.json(
      {
        ok: false,
        saved: false,
        notified: false,
        message: "A quote API is named in the server settings, but this storefront does not call it yet. The request was not saved.",
        required: ["QUOTE_API_URL", "QUOTE_API_TOKEN"],
      },
      { status: 501 },
    );
  }

  if (!allowQuoteAttempt(clientKey(request))) {
    return Response.json(
      { ok: false, saved: false, notified: false, message: "Too many quote attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, saved: false, notified: false, message: "The quote could not be read." }, { status: 400 });
  }

  if (form.get("simulateFailure") === "1") {
    return Response.json(
      { ok: false, saved: false, notified: false, message: "Demo failure. The quote was not saved." },
      { status: 503 },
    );
  }

  const file = form.get("file");
  const attachment = file instanceof File && file.size > 0 ? file : null;
  const quantityText = String(form.get("quantity") ?? "");
  const dimensionsRequired = String(form.get("dimensionsRequired") ?? "") === "1";
  const errors = validateQuoteFields({
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    email: String(form.get("email") ?? ""),
    location: String(form.get("location") ?? ""),
    boardType: String(form.get("boardType") ?? ""),
    dimensions: String(form.get("dimensions") ?? ""),
    dimensionsRequired,
    quantity: quantityText,
    file: attachment ? { type: attachment.type, size: attachment.size } : null,
  });
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, saved: false, notified: false, message: "Check the highlighted fields.", errors }, { status: 400 });
  }

  let attachmentBytes: Uint8Array | null = null;
  if (attachment) {
    attachmentBytes = new Uint8Array(await attachment.arrayBuffer());
    if (sniffType(attachmentBytes) !== attachment.type) {
      return Response.json(
        {
          ok: false,
          saved: false,
          notified: false,
          message: "Check the highlighted fields.",
          errors: { file: "The file content does not match a PNG, JPEG, WebP, or PDF file." },
        },
        { status: 400 },
      );
    }
  }

  let rawLines: { productId?: string; quantity?: number; detail?: string }[] = [];
  try {
    const parsed = JSON.parse(String(form.get("lines") ?? "[]")) as unknown;
    rawLines = Array.isArray(parsed) ? parsed : [];
  } catch {
    return Response.json({ ok: false, saved: false, notified: false, message: "The product list could not be read." }, { status: 400 });
  }

  const lines = [];
  for (const line of rawLines.slice(0, 20)) {
    const productId = cleanText(String(line.productId ?? ""), 80);
    if (!productId) continue;
    const resolved = catalogueLine(productId, Number(line.quantity), String(line.detail ?? ""));
    if (!resolved) {
      return Response.json(
        { ok: false, saved: false, notified: false, message: "A product in this quote is not in the catalogue." },
        { status: 400 },
      );
    }
    lines.push(resolved);
  }

  const productId = cleanText(String(form.get("productId") ?? ""), 80);
  if (productId && !catalogueLine(productId, 1, "")) {
    return Response.json(
      { ok: false, saved: false, notified: false, message: "The selected product is not in the catalogue." },
      { status: 400 },
    );
  }

  const quantity = parseQuantity(quantityText)!;
  const catalogueListSubtotal = lines.reduce((sum, line) => sum + line.catalogueUnitPrice * line.quantity, 0);
  const quote: StoredQuote = {
    reference: `OBX-QUOTE-DEMO-${randomBytes(6).toString("hex").toUpperCase()}`,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    mode: "demo",
    name: cleanText(String(form.get("name") ?? ""), 80),
    company: cleanText(String(form.get("company") ?? ""), 80),
    phone: cleanText(String(form.get("phone") ?? ""), 20),
    email: cleanText(String(form.get("email") ?? ""), 120),
    location: cleanText(String(form.get("location") ?? ""), 80),
    boardType: quoteBoardTypes.includes(String(form.get("boardType")) as (typeof quoteBoardTypes)[number])
      ? String(form.get("boardType"))
      : "Custom Board",
    dimensions: cleanText(String(form.get("dimensions") ?? ""), 40),
    quantity,
    product: cleanText(String(form.get("product") ?? ""), 120),
    productId,
    frame: cleanText(String(form.get("frame") ?? ""), 80),
    colour: cleanText(String(form.get("colour") ?? ""), 40),
    surface: cleanText(String(form.get("surface") ?? ""), 60),
    features: cleanText(String(form.get("features") ?? ""), 400),
    accessories: cleanText(String(form.get("accessories") ?? ""), 400),
    branding: cleanText(String(form.get("branding") ?? ""), 200),
    notes: cleanText(String(form.get("notes") ?? ""), 2000),
    configurationSummary: cleanText(String(form.get("configurationSummary") ?? ""), 800),
    lines,
    catalogueListSubtotal,
    attachment: attachment
      ? {
          name: cleanText(attachment.name, 120),
          type: quoteAttachmentTypes.includes(attachment.type as (typeof quoteAttachmentTypes)[number]) ? attachment.type : "application/octet-stream",
          size: Math.min(attachment.size, quoteAttachmentMaxBytes),
        }
      : null,
    notified: false,
  };

  if (attachment && attachmentBytes && quote.attachment) {
    // Stored privately on the server (never under /public). Only staff with server access can read it.
    const dir = path.join(process.cwd(), ".data", "quote-files");
    await mkdir(dir, { recursive: true });
    const stored = `${quote.reference}.${extensions[attachment.type]}`;
    await writeFile(path.join(dir, stored), attachmentBytes);
    quote.attachment = { ...quote.attachment, storedAs: stored };
  }

  const saved = await saveDemoQuote(quote);
  try {
    const { readSession } = await import("@/lib/auth/session");
    const { authDatabase } = await import("@/lib/auth/db");
    const session = await readSession();
    if (session) {
      authDatabase()
        .prepare("INSERT OR REPLACE INTO customer_quotes (reference, user_id, summary, created_at) VALUES (?, ?, ?, ?)")
        .run(
          saved.reference,
          session.user.id,
          [saved.product, saved.boardType, saved.dimensions, `qty ${saved.quantity}`].filter(Boolean).join(" · "),
          saved.createdAt,
        );
    }
  } catch {
    // The demo quote is already saved. Account history is unavailable if the account store cannot be opened.
  }
  return Response.json({
    ok: true,
    saved: true,
    mode: "demo",
    notified: false,
    reference: saved.reference,
    message: "Demo quote saved on this server. No email was sent.",
  });
}
