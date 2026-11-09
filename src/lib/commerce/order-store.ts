import "server-only";

import { randomBytes } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { authDatabase } from "@/lib/auth/db";
import { normalizeCartLines } from "@/lib/auth/cart";
import type { DemoOrder, DemoOrderAddress, DemoPaymentMethod } from "@/lib/commerce/demo-orders";
import type { OrderStatus } from "@/lib/commerce/types";

export const orderStatusFlow: OrderStatus[] = [
  "Order Placed",
  "Payment Confirmed",
  "Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS demo_orders (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        user_id TEXT,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        method TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        status TEXT NOT NULL,
        shipping TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS demo_orders_user ON demo_orders(user_id);
    `);
    ready = true;
  }
  return database;
}

type Row = {
  id: string;
  idempotency_key: string;
  email: string;
  phone: string;
  customer_name: string;
  method: string;
  items: string;
  subtotal: number;
  status: string;
  shipping: string;
  created_at: string;
};

function toOrder(row: Row): DemoOrder {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    method: row.method as DemoPaymentMethod,
    email: row.email,
    phone: row.phone,
    customerName: row.customer_name,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    status: row.status as OrderStatus,
    shippingAddress: JSON.parse(row.shipping),
    createdAt: row.created_at,
    paymentStatus: "paid",
  };
}

export type CreateOrderInput = {
  idempotencyKey: string;
  userId: string | null;
  method: DemoPaymentMethod;
  name: string;
  email: string;
  phone: string;
  shipping: DemoOrderAddress;
  lines: unknown;
};

export type CreateOrderResult = { ok: true; order: DemoOrder } | { ok: false; message: string };

/** Prices every line from the server catalogue; custom-size lines are quote-only and rejected. */
export function createDemoOrder(input: CreateOrderInput): CreateOrderResult {
  const existing = db().prepare("SELECT * FROM demo_orders WHERE idempotency_key = ?").get(input.idempotencyKey) as Row | undefined;
  if (existing) return { ok: true, order: toOrder(existing) };

  const lines = normalizeCartLines(input.lines);
  if (lines.length === 0) return { ok: false, message: "The cart is empty or contains products that are no longer in the catalogue." };
  if (lines.some((line) => line.configuration.customWidthFt != null && line.configuration.customHeightFt != null)) {
    return { ok: false, message: "Custom-size boards need a quote. Remove them from the cart or request a quote." };
  }

  const items = lines.map((line) => {
    const product = getProductById(line.productId)!;
    return {
      productId: product.id,
      name: product.shortName,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal: product.price * line.quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const id = `OBX-DEMO-${randomBytes(4).toString("hex").toUpperCase()}`;
  const createdAt = new Date().toISOString();

  db()
    .prepare(
      `INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items, subtotal, status, shipping, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.idempotencyKey,
      input.userId,
      input.email,
      input.phone,
      input.name,
      input.method,
      JSON.stringify(items),
      subtotal,
      "Payment Confirmed",
      JSON.stringify(input.shipping),
      createdAt,
    );
  return { ok: true, order: findDemoOrderById(id)! };
}

export function findDemoOrderById(id: string) {
  const row = db().prepare("SELECT * FROM demo_orders WHERE id = ?").get(id) as Row | undefined;
  return row ? toOrder(row) : null;
}

export function contactMatchesOrder(order: DemoOrder, contact: string) {
  const value = contact.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  if (value && value === order.email.trim().toLowerCase()) return true;
  const stored = order.phone.replace(/\D/g, "");
  if (digits.length < 8 || stored.length < 8) return false;
  // Compare the national number so "+91 98765 43210" matches "9876543210".
  return digits.slice(-10) === stored.slice(-10);
}

export function listDemoOrdersForUser(userId: string) {
  const rows = db().prepare("SELECT * FROM demo_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId) as Row[];
  return rows.map(toOrder);
}

export function advanceDemoOrderStatus(id: string) {
  const order = findDemoOrderById(id);
  if (!order) return null;
  const index = orderStatusFlow.indexOf(order.status);
  const next = orderStatusFlow[Math.min(index + 1, orderStatusFlow.length - 1)];
  db().prepare("UPDATE demo_orders SET status = ? WHERE id = ?").run(next, id);
  return { ...order, status: next };
}
