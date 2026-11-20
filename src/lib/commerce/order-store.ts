import "server-only";

import { randomBytes } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { ensureSchema } from "@/lib/db";
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

function db() {
  return ensureSchema("orders", async (database) => {
    await database.exec(`
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
    await database.addColumn("demo_orders", "payment_status", "TEXT NOT NULL DEFAULT 'paid'");
    await database.addColumn("demo_orders", "provider_order_id", "TEXT");
    await database.addColumn("demo_orders", "provider_payment_id", "TEXT");
    await database.addColumn("demo_orders", "referral_code", "TEXT");
    await database.addColumn("demo_orders", "paid_at", "TEXT");
    await database.addColumn("demo_orders", "courier", "TEXT");
    await database.addColumn("demo_orders", "tracking_number", "TEXT");
    await database.addColumn("demo_orders", "staff_note", "TEXT");
    await database.addColumn("demo_orders", "updated_by", "TEXT");
    await database.addColumn("demo_orders", "updated_at", "TEXT");
    await database.exec("CREATE UNIQUE INDEX IF NOT EXISTS demo_orders_provider_order ON demo_orders(provider_order_id) WHERE provider_order_id IS NOT NULL");
  });
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
export async function createDemoOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const existing = (await (await db()).get("SELECT * FROM demo_orders WHERE idempotency_key = ?", input.idempotencyKey)) as Row | undefined;
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

  (await (await db()).run(`INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items, subtotal, status, shipping, created_at, payment_status, referral_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, id,
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
      input.referralCode ?? null,));
  return { ok: true, order: (await findDemoOrderById(id))! };
}

export async function findDemoOrderById(id: string) {
  const row = (await (await db()).get("SELECT * FROM demo_orders WHERE id = ?", id)) as Row | undefined;
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

export async function listDemoOrdersForUser(userId: string) {
  const rows = (await (await db()).all("SELECT * FROM demo_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", userId)) as Row[];
  return rows.map(toOrder);
}

export async function advanceDemoOrderStatus(id: string) {
  const order = await findDemoOrderById(id);
  if (!order) return null;
  const index = orderStatusFlow.indexOf(order.status);
  const next = orderStatusFlow[Math.min(index + 1, orderStatusFlow.length - 1)];
  (await (await db()).run("UPDATE demo_orders SET status = ? WHERE id = ?", next, id));
  return { ...order, status: next };
}

/** Row details the payment routes need but the customer-facing order shape leaves out. */
export async function orderPaymentRecord(id: string) {
  const row = (await (await db()).get("SELECT * FROM demo_orders WHERE id = ?", id)) as Row | undefined;
  return row
    ? { order: toOrder(row), providerOrderId: row.provider_order_id, referralCode: row.referral_code, userId: row.user_id }
    : null;
}

export async function attachProviderOrder(id: string, providerOrderId: string) {
  (await (await db()).run("UPDATE demo_orders SET provider_order_id = ? WHERE id = ? AND provider_order_id IS NULL", providerOrderId, id));
}

/**
 * Marks an order paid exactly once. Returns newlyPaid=false when it was already
 * paid, so commission and emails run once even if the callback and webhook both arrive.
 */
export async function markOrderPaid(providerOrderId: string, providerPaymentId: string) {
  const row = (await (await db()).get("SELECT * FROM demo_orders WHERE provider_order_id = ?", providerOrderId)) as Row | undefined;
  if (!row) return null;
  const update = (await (await db()).run("UPDATE demo_orders SET payment_status = 'paid', status = 'Payment Confirmed', provider_payment_id = ?, paid_at = ? WHERE id = ? AND payment_status = 'pending'", providerPaymentId, new Date().toISOString(), row.id));
  const order = (await findDemoOrderById(row.id))!;
  return { order, newlyPaid: Number(update.changes) === 1, referralCode: row.referral_code, userId: row.user_id };
}

export type StaffOrder = DemoOrder & { staffNote: string; updatedBy: string | null; providerPaymentId: string | null };

/** Every order, newest first, for the staff screen. */
export async function listAllOrders(limit = 200): Promise<StaffOrder[]> {
  const rows = (await (await db()).all("SELECT * FROM demo_orders ORDER BY created_at DESC LIMIT ?", limit)) as (Row & { provider_payment_id: string | null })[];
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
export async function staffAdvanceOrder(id: string, input: { courier?: string; trackingNumber?: string }, staffEmail: string): Promise<StaffResult> {
  const order = await findDemoOrderById(id);
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
      ? (await (await db()).run("UPDATE demo_orders SET status = ?, courier = ?, tracking_number = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status = ?", next, input.courier!, input.trackingNumber!, staffEmail, now, id, order.status))
      : (await (await db()).run("UPDATE demo_orders SET status = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status = ?", next, staffEmail, now, id, order.status));
  return Number(update.changes) === 1 ? { ok: true } : { ok: false, message: "The order changed meanwhile. Reload and try again." };
}

/** Cancels an order before it's dispatched. A paid order's refund is issued in the Razorpay dashboard. */
export async function staffCancelOrder(id: string, note: string, staffEmail: string): Promise<StaffResult> {
  const order = await findDemoOrderById(id);
  if (!order) return { ok: false, message: "No order matches that number." };
  if (!["Pending Payment", "Order Placed", "Payment Confirmed", "Processing"].includes(order.status)) {
    return { ok: false, message: "Orders can be cancelled only before dispatch." };
  }
  if (note.length < 5) return { ok: false, message: "Add a note explaining the cancellation." };
  (await (await db()).run("UPDATE demo_orders SET status = 'Cancelled', staff_note = ?, updated_by = ?, updated_at = ? WHERE id = ?", note, staffEmail, new Date().toISOString(), id));
  return { ok: true };
}
