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
    // Columns added for live payments. Older rows are demo orders, which count as paid.
    const columns = new Set((database.prepare("PRAGMA table_info(demo_orders)").all() as { name: string }[]).map((c) => c.name));
    const add = (name: string, type: string) => {
      if (!columns.has(name)) database.exec(`ALTER TABLE demo_orders ADD COLUMN ${name} ${type}`);
    };
    add("payment_status", "TEXT NOT NULL DEFAULT 'paid'");
    add("provider_order_id", "TEXT");
    add("provider_payment_id", "TEXT");
    add("referral_code", "TEXT");
    add("paid_at", "TEXT");
    add("courier", "TEXT");
    add("tracking_number", "TEXT");
    add("staff_note", "TEXT");
    add("updated_by", "TEXT");
    add("updated_at", "TEXT");
    database.exec("CREATE UNIQUE INDEX IF NOT EXISTS demo_orders_provider_order ON demo_orders(provider_order_id) WHERE provider_order_id IS NOT NULL");
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
  payment_status: string;
  provider_order_id: string | null;
  referral_code: string | null;
  user_id: string | null;
  courier: string | null;
  tracking_number: string | null;
  staff_note: string | null;
  updated_by: string | null;
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
    paymentStatus: row.payment_status === "pending" ? "pending" : "paid",
    courier: row.courier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
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
  /** Live payments: saved unpaid, then marked paid after Razorpay confirms. */
  pendingPayment?: boolean;
  /** Associate referral code, kept so commission is recorded when payment lands. */
  referralCode?: string | null;
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
      // Kept so the order can be reordered with the same size, frame and colour.
      configuration: line.configuration,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const id = `${input.pendingPayment ? "OBX" : "OBX-DEMO"}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const createdAt = new Date().toISOString();

  db()
    .prepare(
      `INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items, subtotal, status, shipping, created_at, payment_status, referral_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      input.pendingPayment ? "Pending Payment" : "Payment Confirmed",
      JSON.stringify(input.shipping),
      createdAt,
      input.pendingPayment ? "pending" : "paid",
      input.referralCode ?? null,
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

/** Row details the payment routes need but the customer-facing order shape leaves out. */
export function orderPaymentRecord(id: string) {
  const row = db().prepare("SELECT * FROM demo_orders WHERE id = ?").get(id) as Row | undefined;
  return row
    ? { order: toOrder(row), providerOrderId: row.provider_order_id, referralCode: row.referral_code, userId: row.user_id }
    : null;
}

export function attachProviderOrder(id: string, providerOrderId: string) {
  db().prepare("UPDATE demo_orders SET provider_order_id = ? WHERE id = ? AND provider_order_id IS NULL").run(providerOrderId, id);
}

/**
 * Marks an order paid exactly once. Returns newlyPaid=false when it was already
 * paid, so commission and emails run once even if the callback and webhook both arrive.
 */
export function markOrderPaid(providerOrderId: string, providerPaymentId: string) {
  const row = db().prepare("SELECT * FROM demo_orders WHERE provider_order_id = ?").get(providerOrderId) as Row | undefined;
  if (!row) return null;
  const update = db()
    .prepare(
      "UPDATE demo_orders SET payment_status = 'paid', status = 'Payment Confirmed', provider_payment_id = ?, paid_at = ? WHERE id = ? AND payment_status = 'pending'",
    )
    .run(providerPaymentId, new Date().toISOString(), row.id);
  const order = findDemoOrderById(row.id)!;
  return { order, newlyPaid: Number(update.changes) === 1, referralCode: row.referral_code, userId: row.user_id };
}

export type StaffOrder = DemoOrder & { staffNote: string; updatedBy: string | null; providerPaymentId: string | null };

/** Every order, newest first, for the staff screen. */
export function listAllOrders(limit = 200): StaffOrder[] {
  const rows = db().prepare("SELECT * FROM demo_orders ORDER BY created_at DESC LIMIT ?").all(limit) as (Row & { provider_payment_id: string | null })[];
  return rows.map((row) => ({ ...toOrder(row), staffNote: row.staff_note ?? "", updatedBy: row.updated_by, providerPaymentId: row.provider_payment_id }));
}

const staffFlow: Partial<Record<string, string>> = {
  "Payment Confirmed": "Processing",
  Processing: "Dispatched",
  Dispatched: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

export function nextStaffStatus(status: string) {
  return staffFlow[status] ?? null;
}

type StaffResult = { ok: true } | { ok: false; message: string };

/** Moves a paid order one step towards delivery. Dispatch needs the courier and tracking number. */
export function staffAdvanceOrder(id: string, input: { courier?: string; trackingNumber?: string }, staffEmail: string): StaffResult {
  const order = findDemoOrderById(id);
  if (!order) return { ok: false, message: "No order matches that number." };
  if (order.paymentStatus === "pending") return { ok: false, message: "This order hasn't been paid yet." };
  const next = nextStaffStatus(order.status);
  if (!next) return { ok: false, message: `A ${order.status.toLowerCase()} order can't move forward.` };
  if (next === "Dispatched" && (!input.courier || !input.trackingNumber)) {
    return { ok: false, message: "Enter the courier and tracking number to mark the order dispatched." };
  }
  const now = new Date().toISOString();
  const update =
    next === "Dispatched"
      ? db()
          .prepare("UPDATE demo_orders SET status = ?, courier = ?, tracking_number = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status = ?")
          .run(next, input.courier!, input.trackingNumber!, staffEmail, now, id, order.status)
      : db()
          .prepare("UPDATE demo_orders SET status = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status = ?")
          .run(next, staffEmail, now, id, order.status);
  return Number(update.changes) === 1 ? { ok: true } : { ok: false, message: "The order changed meanwhile. Reload and try again." };
}

/** Cancels an order before it's dispatched. A paid order's refund is issued in the Razorpay dashboard. */
export function staffCancelOrder(id: string, note: string, staffEmail: string): StaffResult {
  const order = findDemoOrderById(id);
  if (!order) return { ok: false, message: "No order matches that number." };
  if (!["Pending Payment", "Order Placed", "Payment Confirmed", "Processing"].includes(order.status)) {
    return { ok: false, message: "Orders can be cancelled only before dispatch." };
  }
  if (note.length < 5) return { ok: false, message: "Add a note explaining the cancellation." };
  db()
    .prepare("UPDATE demo_orders SET status = 'Cancelled', staff_note = ?, updated_by = ?, updated_at = ? WHERE id = ?")
    .run(note, staffEmail, new Date().toISOString(), id);
  return { ok: true };
}
