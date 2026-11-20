import "server-only";

import { getProductById } from "@/data/catalogue";
import { ensureSchema, greatest0 } from "@/lib/db";

/**
 * Stock levels for catalogue products, entered by staff. A product with no
 * row isn't tracked: the site then says nothing about availability rather
 * than guess. Live paid orders reduce stock; it never goes below zero.
 */
export const lowStockThreshold = 5;

export type StockState = "in-stock" | "low" | "made-to-order";
export type StockLevel = { productId: string; onHand: number; updatedBy: string; updatedAt: string };

function db() {
  return ensureSchema("stock", async (database) => {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id TEXT PRIMARY KEY,
        on_hand INTEGER NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  });
}

type Row = { product_id: string; on_hand: number; updated_by: string; updated_at: string };
const toLevel = (row: Row): StockLevel => ({ productId: row.product_id, onHand: row.on_hand, updatedBy: row.updated_by, updatedAt: row.updated_at });

export async function listStock(): Promise<StockLevel[]> {
  return ((await (await db()).all("SELECT * FROM product_stock")) as Row[]).map(toLevel);
}

export function stockState(onHand: number): StockState {
  return onHand <= 0 ? "made-to-order" : onHand <= lowStockThreshold ? "low" : "in-stock";
}

/** Public view: state only, plus the count when it's low (so "Only 3 left" can show). */
export async function publicStock(ids: string[]) {
  const wanted = ids.filter((id) => getProductById(id)).slice(0, 60);
  if (wanted.length === 0) return {};
  const rows = (await (await db()).all(`SELECT * FROM product_stock WHERE product_id IN (${wanted.map(() => "?").join(",")})`, ...wanted)) as Row[];
  return Object.fromEntries(
    rows.map((row) => {
      const state = stockState(row.on_hand);
      return [row.product_id, { state, ...(state === "low" ? { onHand: row.on_hand } : {}) }];
    }),
  );
}

export async function setStock(productId: string, onHand: number | null, staffEmail: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!getProductById(productId)) return { ok: false, message: "That product isn't in the catalogue." };
  if (onHand === null) {
    (await (await db()).run("DELETE FROM product_stock WHERE product_id = ?", productId));
    return { ok: true };
  }
  if (!Number.isInteger(onHand) || onHand < 0 || onHand > 100000) return { ok: false, message: "Enter a whole number from 0 to 100,000." };
  (await (await db()).run(`INSERT INTO product_stock (product_id, on_hand, updated_by, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET on_hand = excluded.on_hand, updated_by = excluded.updated_by, updated_at = excluded.updated_at`, productId, onHand, staffEmail, new Date().toISOString()));
  return { ok: true };
}

/** Called once per paid order. Untracked products are skipped. */
export async function deductStock(items: { productId: string; quantity: number }[], orderId: string) {
  const database = await db();
  const now = new Date().toISOString();
  for (const item of items) {
    await database.run(
      `UPDATE product_stock SET on_hand = ${greatest0("on_hand - ?")}, updated_by = ?, updated_at = ? WHERE product_id = ?`,
      item.quantity,
      `order ${orderId}`,
      now,
      item.productId,
    );
  }
}
