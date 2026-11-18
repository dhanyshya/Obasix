import "server-only";

import { randomBytes } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { authDatabase } from "@/lib/auth/db";
import {
  financialQuarter,
  minimumTradeOrder,
  tierById,
  type BusinessType,
  type DistributorTierId,
} from "@/lib/distributors/program";

/**
 * Distributor store. A distributor is a customer account with an approved
 * distributor profile. Trade orders are kept apart from retail orders: they
 * are priced at the distributor's tier discount and never earn associate
 * commission, so one sale can't be paid out through two channels.
 */

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS distributors (
        user_id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL,
        gstin TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        territory_request TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        tier TEXT NOT NULL DEFAULT 'silver',
        territory TEXT NOT NULL DEFAULT '',
        credit_limit INTEGER NOT NULL DEFAULT 0,
        quarterly_target INTEGER NOT NULL DEFAULT 0,
        review_date TEXT NOT NULL DEFAULT '',
        decided_at TEXT,
        decided_by TEXT NOT NULL DEFAULT '',
        decision_note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS distributor_orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        items TEXT NOT NULL,
        list_subtotal INTEGER NOT NULL,
        discount_rate REAL NOT NULL,
        net_total INTEGER NOT NULL,
        payment_terms TEXT NOT NULL,
        status TEXT NOT NULL,
        reference TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        paid_at TEXT,
        payment_ref TEXT NOT NULL DEFAULT '',
        updated_by TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS distributor_orders_user ON distributor_orders(user_id);
    `);
    ready = true;
  }
  return database;
}

export type DistributorStatus = "pending" | "approved" | "rejected" | "suspended";

export type Distributor = {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  gstin: string;
  city: string;
  state: string;
  territoryRequest: string;
  notes: string;
  status: DistributorStatus;
  tier: DistributorTierId;
  territory: string;
  creditLimit: number;
  quarterlyTarget: number;
  reviewDate: string;
  decidedAt: string | null;
  decidedBy: string;
  decisionNote: string;
  createdAt: string;
};

type DistributorRow = {
  user_id: string;
  business_name: string;
  business_type: string;
  gstin: string;
  city: string;
  state: string;
  territory_request: string;
  notes: string;
  status: string;
  tier: string;
  territory: string;
  credit_limit: number;
  quarterly_target: number;
  review_date: string;
  decided_at: string | null;
  decided_by: string;
  decision_note: string;
  created_at: string;
};

function toDistributor(row: DistributorRow): Distributor {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    businessType: row.business_type as BusinessType,
    gstin: row.gstin,
    city: row.city,
    state: row.state,
    territoryRequest: row.territory_request,
    notes: row.notes,
    status: row.status as DistributorStatus,
    tier: tierById(row.tier).id,
    territory: row.territory,
    creditLimit: row.credit_limit,
    quarterlyTarget: row.quarterly_target,
    reviewDate: row.review_date,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    decisionNote: row.decision_note,
    createdAt: row.created_at,
  };
}

export function findDistributor(userId: string): Distributor | null {
  const row = db().prepare("SELECT * FROM distributors WHERE user_id = ?").get(userId) as DistributorRow | undefined;
  return row ? toDistributor(row) : null;
}

export function applyAsDistributor(input: {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  gstin: string;
  city: string;
  state: string;
  territoryRequest: string;
  notes: string;
}): Distributor {
  const existing = findDistributor(input.userId);
  if (existing && existing.status !== "rejected") return existing;
  db()
    .prepare(
      `INSERT OR REPLACE INTO distributors
        (user_id, business_name, business_type, gstin, city, state, territory_request, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .run(
      input.userId,
      input.businessName,
      input.businessType,
      input.gstin,
      input.city,
      input.state,
      input.territoryRequest,
      input.notes,
      new Date().toISOString(),
    );
  return findDistributor(input.userId)!;
}

/* ------------------------------------------------------------------ */
/* Trade orders                                                        */
/* ------------------------------------------------------------------ */

export type TradeOrderStatus = "Awaiting payment" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";
export type PaymentTerms = "credit" | "advance";

export type TradeOrderItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  listPrice: number;
  tradePrice: number;
  lineTotal: number;
};

export type TradeOrder = {
  id: string;
  userId: string;
  items: TradeOrderItem[];
  listSubtotal: number;
  discountRate: number;
  netTotal: number;
  paymentTerms: PaymentTerms;
  status: TradeOrderStatus;
  reference: string;
  createdAt: string;
  paidAt: string | null;
  paymentRef: string;
  updatedBy: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  items: string;
  list_subtotal: number;
  discount_rate: number;
  net_total: number;
  payment_terms: string;
  status: string;
  reference: string;
  created_at: string;
  paid_at: string | null;
  payment_ref: string;
  updated_by: string;
};

function toOrder(row: OrderRow): TradeOrder {
  return {
    id: row.id,
    userId: row.user_id,
    items: JSON.parse(row.items),
    listSubtotal: row.list_subtotal,
    discountRate: row.discount_rate,
    netTotal: row.net_total,
    paymentTerms: row.payment_terms as PaymentTerms,
    status: row.status as TradeOrderStatus,
    reference: row.reference,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    paymentRef: row.payment_ref,
    updatedBy: row.updated_by,
  };
}

export function tradePrice(listPrice: number, discount: number) {
  return Math.round(listPrice * (1 - discount));
}

export function listTradeOrders(userId: string): TradeOrder[] {
  return (
    db().prepare("SELECT * FROM distributor_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(userId) as OrderRow[]
  ).map(toOrder);
}

/** Credit in use: unpaid credit orders that haven't been cancelled. */
export function creditUsed(userId: string) {
  return listTradeOrders(userId)
    .filter((o) => o.paymentTerms === "credit" && !o.paidAt && o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.netTotal, 0);
}

/** Net purchases this financial quarter, for the target. */
export function quarterPurchases(userId: string, now = new Date()) {
  const { start, end } = financialQuarter(now);
  return listTradeOrders(userId)
    .filter((o) => o.status !== "Cancelled")
    .filter((o) => {
      const at = new Date(o.createdAt);
      return at >= start && at < end;
    })
    .reduce((sum, o) => sum + o.netTotal, 0);
}

export type PlaceTradeOrderResult = { ok: true; order: TradeOrder } | { ok: false; message: string };

export function placeTradeOrder(input: {
  userId: string;
  idempotencyKey: string;
  lines: unknown;
  paymentTerms: PaymentTerms;
  reference: string;
}): PlaceTradeOrderResult {
  const replay = db().prepare("SELECT * FROM distributor_orders WHERE idempotency_key = ?").get(input.idempotencyKey) as
    | OrderRow
    | undefined;
  if (replay) {
    return replay.user_id === input.userId ? { ok: true, order: toOrder(replay) } : { ok: false, message: "Duplicate request." };
  }

  const distributor = findDistributor(input.userId);
  if (!distributor || distributor.status !== "approved") {
    return { ok: false, message: "Trade ordering opens once your distributor account is approved." };
  }

  const discount = tierById(distributor.tier).discount;
  const merged = new Map<string, number>();
  for (const raw of Array.isArray(input.lines) ? input.lines.slice(0, 60) : []) {
    const line = raw as { productId?: unknown; quantity?: unknown };
    const product = getProductById(String(line.productId ?? ""));
    const quantity = Number(line.quantity);
    if (!product || product.price <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 5000) continue;
    merged.set(product.id, (merged.get(product.id) ?? 0) + quantity);
  }
  if (merged.size === 0) return { ok: false, message: "Add at least one catalogue product with a quantity." };

  const items: TradeOrderItem[] = Array.from(merged, ([productId, quantity]) => {
    const product = getProductById(productId)!;
    const unit = tradePrice(product.price, discount);
    return {
      productId,
      name: product.shortName,
      sku: product.sku,
      quantity,
      listPrice: product.price,
      tradePrice: unit,
      lineTotal: unit * quantity,
    };
  });
  const listSubtotal = items.reduce((sum, i) => sum + i.listPrice * i.quantity, 0);
  const netTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  if (netTotal < minimumTradeOrder) {
    return { ok: false, message: `The minimum trade order is ₹${minimumTradeOrder.toLocaleString("en-IN")} at trade price.` };
  }
  if (input.paymentTerms === "credit") {
    const available = distributor.creditLimit - creditUsed(input.userId);
    if (netTotal > available) {
      return {
        ok: false,
        message: `This order is more than your available credit of ₹${Math.max(available, 0).toLocaleString("en-IN")}. Choose advance payment or reduce the order.`,
      };
    }
  }

  const id = `OBX-TRADE-${randomBytes(4).toString("hex").toUpperCase()}`;
  db()
    .prepare(
      `INSERT INTO distributor_orders
        (id, user_id, idempotency_key, items, list_subtotal, discount_rate, net_total, payment_terms, status, reference, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.userId,
      input.idempotencyKey,
      JSON.stringify(items),
      listSubtotal,
      discount,
      netTotal,
      input.paymentTerms,
      input.paymentTerms === "credit" ? "Confirmed" : "Awaiting payment",
      input.reference,
      new Date().toISOString(),
    );
  const row = db().prepare("SELECT * FROM distributor_orders WHERE id = ?").get(id) as OrderRow;
  return { ok: true, order: toOrder(row) };
}

/* ------------------------------------------------------------------ */
/* Staff administration                                                */
/* ------------------------------------------------------------------ */

export type DistributorSummary = Distributor & {
  name: string;
  email: string;
  phone: string;
  creditUsed: number;
  quarterPurchases: number;
  orderCount: number;
};

export function listDistributorSummaries(): DistributorSummary[] {
  const rows = db()
    .prepare(
      `SELECT d.*, u.name, u.email, u.phone FROM distributors d JOIN users u ON u.id = d.user_id
       ORDER BY CASE d.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'suspended' THEN 2 ELSE 3 END, d.created_at DESC`,
    )
    .all() as (DistributorRow & { name: string; email: string; phone: string })[];
  return rows.map((row) => ({
    ...toDistributor(row),
    name: row.name,
    email: row.email,
    phone: row.phone,
    creditUsed: creditUsed(row.user_id),
    quarterPurchases: quarterPurchases(row.user_id),
    orderCount: listTradeOrders(row.user_id).length,
  }));
}

export function decideDistributor(input: {
  userId: string;
  status: "approved" | "rejected" | "suspended";
  tier: DistributorTierId;
  territory: string;
  creditLimit: number;
  quarterlyTarget: number;
  reviewDate: string;
  note: string;
  staffEmail: string;
}) {
  const result = db()
    .prepare(
      `UPDATE distributors SET status = ?, tier = ?, territory = ?, credit_limit = ?, quarterly_target = ?,
         review_date = ?, decision_note = ?, decided_at = ?, decided_by = ?
       WHERE user_id = ?`,
    )
    .run(
      input.status,
      input.tier,
      input.territory,
      input.creditLimit,
      input.quarterlyTarget,
      input.reviewDate,
      input.note,
      new Date().toISOString(),
      input.staffEmail,
      input.userId,
    );
  return Number(result.changes) > 0;
}

export type AdminTradeOrder = TradeOrder & { businessName: string };

export function listAllTradeOrders(): AdminTradeOrder[] {
  const rows = db()
    .prepare(
      `SELECT o.*, d.business_name FROM distributor_orders o LEFT JOIN distributors d ON d.user_id = o.user_id
       ORDER BY o.created_at DESC LIMIT 300`,
    )
    .all() as (OrderRow & { business_name: string | null })[];
  return rows.map((row) => ({ ...toOrder(row), businessName: row.business_name ?? "Unknown" }));
}

const nextStatus: Partial<Record<TradeOrderStatus, TradeOrderStatus>> = {
  Confirmed: "Dispatched",
  Dispatched: "Delivered",
};

export function updateTradeOrder(input: {
  id: string;
  action: "record-payment" | "advance" | "cancel";
  paymentRef?: string;
  staffEmail: string;
}): { ok: true; order: TradeOrder } | { ok: false; message: string } {
  const row = db().prepare("SELECT * FROM distributor_orders WHERE id = ?").get(input.id) as OrderRow | undefined;
  if (!row) return { ok: false, message: "No trade order has that reference." };
  const order = toOrder(row);
  const now = new Date().toISOString();

  if (input.action === "record-payment") {
    if (order.paidAt) return { ok: false, message: "Payment is already recorded for this order." };
    if (order.status === "Cancelled") return { ok: false, message: "This order is cancelled." };
    const status = order.status === "Awaiting payment" ? "Confirmed" : order.status;
    db()
      .prepare("UPDATE distributor_orders SET paid_at = ?, payment_ref = ?, status = ?, updated_by = ? WHERE id = ?")
      .run(now, input.paymentRef ?? "", status, input.staffEmail, order.id);
  } else if (input.action === "advance") {
    const next = nextStatus[order.status];
    if (!next) {
      return {
        ok: false,
        message: order.status === "Awaiting payment" ? "Record the advance payment before dispatch." : "This order can't move forward.",
      };
    }
    db().prepare("UPDATE distributor_orders SET status = ?, updated_by = ? WHERE id = ?").run(next, input.staffEmail, order.id);
  } else {
    if (order.status === "Dispatched" || order.status === "Delivered") {
      return { ok: false, message: "Dispatched orders can't be cancelled here. Raise a return instead." };
    }
    if (order.status === "Cancelled") return { ok: false, message: "This order is already cancelled." };
    db().prepare("UPDATE distributor_orders SET status = 'Cancelled', updated_by = ? WHERE id = ?").run(input.staffEmail, order.id);
  }
  const updated = db().prepare("SELECT * FROM distributor_orders WHERE id = ?").get(order.id) as OrderRow;
  return { ok: true, order: toOrder(updated) };
}
