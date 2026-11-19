import "server-only";

import { getProductById } from "@/data/catalogue";
import { authDatabase } from "@/lib/auth/db";

/**
 * Stock levels for catalogue products, entered by staff. A product with no
 * row isn't tracked: the site then says nothing about availability rather
 * than guess. Live paid orders reduce stock; it never goes below zero.
 */
export const lowStockThreshold = 5;

export type StockState = "in-stock" | "low" | "made-to-order";
export type StockLevel = { productId: string; onHand: number; updatedBy: string; updatedAt: string };

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS product_stock (
        product_id TEXT PRIMARY KEY,
        on_hand INTEGER NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    ready = true;
  }
  return database;
}

type Row = { product_id: string; on_hand: number; updated_by: string; updated_at: string };
const toLevel = (row: Row): StockLevel => ({ productId: row.product_id, onHand: row.on_hand, updatedBy: row.updated_by, updatedAt: row.updated_at });

export function listStock(): StockLevel[] {
  return (db().prepare("SELECT * FROM product_stock").all() as Row[]).map(toLevel);
}

export function stockState(onHand: number): StockState {
  return onHand <= 0 ? "made-to-order" : onHand <= lowStockThreshold ? "low" : "in-stock";
}

/** Public view: state only, plus the count when it's low (so "Only 3 left" can show). */
export function publicStock(ids: string[]) {
  const wanted = ids.filter((id) => getProductById(id)).slice(0, 60);
  if (wanted.length === 0) return {};
  const rows = db()
    .prepare(`SELECT * FROM product_stock WHERE product_id IN (${wanted.map(() => "?").join(",")})`)
    .all(...wanted) as Row[];
  return Object.fromEntries(
    rows.map((row) => {
      const state = stockState(row.on_hand);
      return [row.product_id, { state, ...(state === "low" ? { onHand: row.on_hand } : {}) }];
    }),
  );
}

export function setStock(productId: string, onHand: number | null, staffEmail: string): { ok: true } | { ok: false; message: string } {
  if (!getProductById(productId)) return { ok: false, message: "That product isn't in the catalogue." };
  if (onHand === null) {
    db().prepare("DELETE FROM product_stock WHERE product_id = ?").run(productId);
    return { ok: true };
  }
  if (!Number.isInteger(onHand) || onHand < 0 || onHand > 100000) return { ok: false, message: "Enter a whole number from 0 to 100,000." };
  db()
    .prepare(
      `INSERT INTO product_stock (product_id, on_hand, updated_by, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET on_hand = excluded.on_hand, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .run(productId, onHand, staffEmail, new Date().toISOString());
  return { ok: true };
}

/** Called once per paid order. Untracked products are skipped. */
export function deductStock(items: { productId: string; quantity: number }[], orderId: string) {
  const update = db().prepare(
    "UPDATE product_stock SET on_hand = MAX(on_hand - ?, 0), updated_by = ?, updated_at = ? WHERE product_id = ?",
  );
  const now = new Date().toISOString();
  for (const item of items) update.run(item.quantity, `order ${orderId}`, now, item.productId);
}
