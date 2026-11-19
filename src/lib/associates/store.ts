import "server-only";

import { randomBytes } from "node:crypto";
import { authDb } from "@/lib/auth/db";
import { ensureSchema } from "@/lib/db";
import { findDemoOrderById } from "@/lib/commerce/order-store";
import { associateCommissionRate, type AssociateProfession } from "@/lib/associates/program";

/**
 * Associate programme store.
 *
 * An associate is an ordinary customer account with an associate profile and a
 * referral code. Orders and quotes are attributed to at most one associate:
 * `associate_commissions.source_id` is unique, so the same order can never
 * earn two commissions, whichever channel it came through.
 */

function db() {
  return ensureSchema("associates", async (database) => {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS associates (
        user_id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        profession TEXT NOT NULL,
        city TEXT NOT NULL,
        firm TEXT NOT NULL DEFAULT '',
        pan_last4 TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS associate_commissions (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL UNIQUE,
        base_amount INTEGER NOT NULL,
        rate REAL NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS associate_commissions_code ON associate_commissions(code);
      CREATE TABLE IF NOT EXISTS associate_quotes (
        reference TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        customer TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS associate_quotes_code ON associate_quotes(code);
    `);
  });
}

export type Associate = {
  userId: string;
  code: string;
  profession: AssociateProfession;
  city: string;
  firm: string;
  status: "active" | "paused";
  createdAt: string;
};

type AssociateRow = {
  user_id: string;
  code: string;
  profession: string;
  city: string;
  firm: string;
  status: string;
  created_at: string;
};

function toAssociate(row: AssociateRow): Associate {
  return {
    userId: row.user_id,
    code: row.code,
    profession: row.profession as AssociateProfession,
    city: row.city,
    firm: row.firm,
    status: row.status === "paused" ? "paused" : "active",
    createdAt: row.created_at,
  };
}

export function normalizeCode(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export async function findAssociateByUser(userId: string): Promise<Associate | null> {
  const row = (await (await db()).get("SELECT * FROM associates WHERE user_id = ?", userId)) as AssociateRow | undefined;
  return row ? toAssociate(row) : null;
}

export async function findAssociateByCode(code: string): Promise<Associate | null> {
  const clean = normalizeCode(code);
  if (clean.length < 6) return null;
  const row = (await (await db()).get("SELECT * FROM associates WHERE code = ?", clean)) as AssociateRow | undefined;
  return row ? toAssociate(row) : null;
}

/** A readable code: up to four letters of the name, then four random characters. */
async function generateCode(name: string): Promise<string> {
  const stem = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(4, "X");
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = randomBytes(4);
    const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const code = `${stem}${tail}`;
    if (!(await (await db()).get("SELECT 1 FROM associates WHERE code = ?", code))) return code;
  }
  throw new Error("Could not allocate a referral code.");
}

export async function registerAssociate(input: {
  userId: string;
  name: string;
  profession: AssociateProfession;
  city: string;
  firm: string;
}): Promise<Associate> {
  const existing = await findAssociateByUser(input.userId);
  if (existing) return existing;
  const code = await generateCode(input.name);
  (await (await db()).run("INSERT INTO associates (user_id, code, profession, city, firm, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)", input.userId, code, input.profession, input.city, input.firm, new Date().toISOString()));
  return (await findAssociateByUser(input.userId))!;
}

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

/**
 * Resolve the referral code to credit, or null. Self-referral is refused: an
 * associate buying for themselves (same account or same email) earns nothing.
 */
async function creditableAssociate(code: string | null | undefined, buyer: { userId: string | null; email: string }) {
  if (!code) return null;
  const associate = await findAssociateByCode(code);
  if (!associate || associate.status !== "active") return null;
  if (buyer.userId && buyer.userId === associate.userId) return null;
  const owner = (await (await authDb()).get("SELECT email FROM users WHERE id = ?", associate.userId)) as
    | { email: string }
    | undefined;
  if (owner && owner.email.trim().toLowerCase() === buyer.email.trim().toLowerCase()) return null;
  return associate;
}

/** Record the commission for a new order. Safe to call twice: the second call is ignored. */
export async function recordOrderCommission(input: {
  orderId: string;
  subtotal: number;
  code: string | null | undefined;
  buyerUserId: string | null;
  buyerEmail: string;
}) {
  const associate = await creditableAssociate(input.code, { userId: input.buyerUserId, email: input.buyerEmail });
  if (!associate || input.subtotal <= 0) return null;
  const amount = Math.round(input.subtotal * associateCommissionRate);
  (await (await db()).run(`INSERT INTO associate_commissions (id, code, source_type, source_id, base_amount, rate, amount, status, created_at)
       VALUES (?, ?, 'order', ?, ?, ?, ?, 'pending', ?) ON CONFLICT DO NOTHING`, `COM-${randomBytes(5).toString("hex").toUpperCase()}`,
      associate.code,
      input.orderId,
      input.subtotal,
      associateCommissionRate,
      amount,
      new Date().toISOString(),));
  return associate.code;
}

/** Link a quote to the associate who prepared or referred it. */
export async function recordQuoteAttribution(input: {
  reference: string;
  code: string | null | undefined;
  buyerUserId: string | null;
  buyerEmail: string;
  customer: string;
  summary: string;
}) {
  const associate = await creditableAssociate(input.code, { userId: null, email: input.buyerEmail });
  // A signed-in associate may prepare a quote for a customer from their own account,
  // so only the email check applies to quotes.
  void input.buyerUserId;
  if (!associate) return null;
  (await (await db()).run("INSERT INTO associate_quotes (reference, code, customer, summary, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING", input.reference, associate.code, input.customer, input.summary, new Date().toISOString()));
  return associate.code;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export type CommissionState = "Awaiting delivery" | "Payable" | "Paid" | "Void";

export type CommissionEntry = {
  id: string;
  orderId: string;
  baseAmount: number;
  amount: number;
  rate: number;
  state: CommissionState;
  orderStatus: string;
  createdAt: string;
};

export type AttributedQuote = {
  reference: string;
  customer: string;
  summary: string;
  createdAt: string;
};

/**
 * Commission becomes payable only once the order is delivered, so returns and
 * cancellations never need clawing back.
 */
export async function listCommissions(code: string): Promise<CommissionEntry[]> {
  const rows = (await (await db()).all("SELECT * FROM associate_commissions WHERE code = ? ORDER BY created_at DESC LIMIT 200", code)) as {
    id: string;
    source_id: string;
    base_amount: number;
    rate: number;
    amount: number;
    status: string;
    created_at: string;
  }[];
  return await Promise.all(rows.map(async (row) => {
    const order = await findDemoOrderById(row.source_id);
    const orderStatus = order?.status ?? "Unknown";
    const state: CommissionState =
      row.status === "paid"
        ? "Paid"
        : row.status === "void" || orderStatus === "Cancelled" || !order
          ? "Void"
          : orderStatus === "Delivered"
            ? "Payable"
            : "Awaiting delivery";
    return {
      id: row.id,
      orderId: row.source_id,
      baseAmount: row.base_amount,
      amount: row.amount,
      rate: row.rate,
      state,
      orderStatus,
      createdAt: row.created_at,
    };
  }));
}

export async function listAttributedQuotes(code: string): Promise<AttributedQuote[]> {
  const rows = (await (await db()).all("SELECT * FROM associate_quotes WHERE code = ? ORDER BY created_at DESC LIMIT 100", code)) as { reference: string; customer: string; summary: string; created_at: string }[];
  return rows.map((row) => ({ reference: row.reference, customer: row.customer, summary: row.summary, createdAt: row.created_at }));
}

/* ------------------------------------------------------------------ */
/* Staff administration                                                */
/* ------------------------------------------------------------------ */

/** The commission table plus the payout columns added for the staff view. */
function adminDb() {
  return ensureSchema("associates-payouts", async () => {
    const database = await db();
    await database.addColumn("associate_commissions", "paid_at", "TEXT");
    await database.addColumn("associate_commissions", "payout_ref", "TEXT NOT NULL DEFAULT ''");
    await database.addColumn("associate_commissions", "void_reason", "TEXT NOT NULL DEFAULT ''");
  });
}

export type AssociateSummary = Associate & {
  name: string;
  email: string;
  phone: string;
  orders: number;
  referredSales: number;
  awaiting: number;
  payable: number;
  paid: number;
  quotes: number;
};

export type AdminCommission = CommissionEntry & {
  code: string;
  associateName: string;
  paidAt: string | null;
  payoutRef: string;
  voidReason: string;
};

export async function listAdminCommissions(): Promise<AdminCommission[]> {
  const rows = (await (await adminDb()).all(`SELECT c.*, u.name AS associate_name
       FROM associate_commissions c
       LEFT JOIN associates a ON a.code = c.code
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY c.created_at DESC LIMIT 500`)) as { id: string; code: string; associate_name: string | null; paid_at: string | null; payout_ref: string; void_reason: string }[];
  const byCode = new Map<string, CommissionEntry[]>();
  return await Promise.all(rows.map(async (row) => {
    if (!byCode.has(row.code)) byCode.set(row.code, await listCommissions(row.code));
    const entry = byCode.get(row.code)!.find((c) => c.id === row.id)!;
    return {
      ...entry,
      code: row.code,
      associateName: row.associate_name ?? "Unknown",
      paidAt: row.paid_at,
      payoutRef: row.payout_ref,
      voidReason: row.void_reason,
    };
  }));
}

export async function listAssociateSummaries(): Promise<AssociateSummary[]> {
  const rows = (await (await adminDb()).all(`SELECT a.*, u.name, u.email, u.phone FROM associates a JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC`)) as (AssociateRow & { name: string; email: string; phone: string })[];
  return await Promise.all(rows.map(async (row) => {
    const commissions = await listCommissions(row.code);
    const total = (state: CommissionState) => commissions.filter((c) => c.state === state).reduce((s, c) => s + c.amount, 0);
    const live = commissions.filter((c) => c.state !== "Void");
    return {
      ...toAssociate(row),
      name: row.name,
      email: row.email,
      phone: row.phone,
      orders: live.length,
      referredSales: live.reduce((s, c) => s + c.baseAmount, 0),
      awaiting: total("Awaiting delivery"),
      payable: total("Payable"),
      paid: total("Paid"),
      quotes: (await listAttributedQuotes(row.code)).length,
    };
  }));
}

export async function setAssociateStatus(code: string, status: "active" | "paused") {
  return Number((await (await adminDb()).run("UPDATE associates SET status = ? WHERE code = ?", status, normalizeCode(code))).changes) > 0;
}

/**
 * Mark commissions paid. Only entries that are currently payable (order
 * delivered, not void, not already paid) change; the rest are reported back.
 */
export async function markCommissionsPaid(ids: string[], payoutRef: string) {
  const payable = new Set((await listAdminCommissions()).filter((c) => c.state === "Payable").map((c) => c.id));
  const paidAt = new Date().toISOString();
  const database = await adminDb();
  const paid: string[] = [];
  const skipped: string[] = [];
  for (const id of ids) {
    const update = payable.has(id)
      ? await database.run("UPDATE associate_commissions SET status = 'paid', paid_at = ?, payout_ref = ? WHERE id = ? AND status = 'pending'", paidAt, payoutRef, id)
      : { changes: 0 };
    if (update.changes > 0) paid.push(id);
    else skipped.push(id);
  }
  return { paid, skipped };
}

export async function voidCommission(id: string, reason: string) {
  const result = (await (await adminDb()).run("UPDATE associate_commissions SET status = 'void', void_reason = ? WHERE id = ? AND status = 'pending'", reason, id));
  return Number(result.changes) > 0;
}
