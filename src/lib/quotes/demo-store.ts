import { readFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema } from "@/lib/db";

export type StoredQuoteLine = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  catalogueUnitPrice: number;
  detail: string;
};

export type StoredQuote = {
  reference: string;
  idempotencyKey: string;
  createdAt: string;
  mode: "demo";
  name: string;
  company: string;
  phone: string;
  email: string;
  location?: string;
  boardType: string;
  dimensions: string;
  quantity: number;
  product: string;
  productId: string;
  frame: string;
  colour: string;
  surface?: string;
  features: string;
  accessories: string;
  branding: string;
  notes: string;
  configurationSummary: string;
  lines: StoredQuoteLine[];
  catalogueListSubtotal: number;
  attachment: { name: string; type: string; size: number; storedAs?: string } | null;
  notified: false;
};

/**
 * Quote requests live in the database (Postgres in production). Each row keeps
 * the full request as JSON, plus the columns we look it up by.
 * Requests saved by earlier versions in .data/demo-quotes.json are imported once.
 */
const legacyFile = path.join(process.cwd(), ".data", "demo-quotes.json");

function db() {
  return ensureSchema("quotes", async (database) => {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS quote_requests (
        reference TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS quote_requests_created ON quote_requests(created_at);
    `);
    const legacy = await readFile(legacyFile, "utf8")
      .then((raw) => JSON.parse(raw) as StoredQuote[])
      .catch(() => []);
    for (const quote of Array.isArray(legacy) ? legacy : []) {
      await database.run(
        "INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
        quote.reference,
        quote.idempotencyKey,
        quote.email,
        quote.createdAt,
        JSON.stringify(quote),
      );
    }
  });
}

const parse = (row: { payload: string } | undefined) => (row ? (JSON.parse(row.payload) as StoredQuote) : null);

export async function findDemoQuote(reference: string) {
  return parse(await (await db()).get<{ payload: string }>("SELECT payload FROM quote_requests WHERE reference = ?", reference));
}

/** Saves a quote, or returns the earlier one if this idempotency key was already used. */
export async function saveDemoQuote(quote: StoredQuote) {
  const database = await db();
  await database.run(
    "INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
    quote.reference,
    quote.idempotencyKey,
    quote.email,
    quote.createdAt,
    JSON.stringify(quote),
  );
  return parse(await database.get<{ payload: string }>("SELECT payload FROM quote_requests WHERE idempotency_key = ?", quote.idempotencyKey))!;
}

const hits = new Map<string, number[]>();

export function allowQuoteAttempt(key: string, limit = 12, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** All stored quotes, newest first (staff view). */
export async function listDemoQuotes() {
  const rows = await (await db()).all<{ payload: string }>("SELECT payload FROM quote_requests ORDER BY created_at DESC");
  return rows.map((row) => JSON.parse(row.payload) as StoredQuote);
}
