import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
  attachment: { name: string; type: string; size: number } | null;
  notified: false;
};

const filePath = path.join(process.cwd(), ".data", "demo-quotes.json");
let queue: Promise<void> = Promise.resolve();

async function readAll(): Promise<StoredQuote[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredQuote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(quotes: StoredQuote[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(quotes), "utf8");
}

function withLock<T>(work: () => Promise<T>) {
  const run = queue.then(work, work);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function findDemoQuote(reference: string) {
  return withLock(async () => (await readAll()).find((quote) => quote.reference === reference) ?? null);
}

export function saveDemoQuote(quote: StoredQuote) {
  return withLock(async () => {
    const quotes = await readAll();
    const existing = quotes.find((item) => item.idempotencyKey === quote.idempotencyKey);
    if (existing) return existing;
    quotes.push(quote);
    await writeAll(quotes);
    return quote;
  });
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
