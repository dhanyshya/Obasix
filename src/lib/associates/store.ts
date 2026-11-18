import "server-only";

import { randomBytes } from "node:crypto";
import { authDatabase } from "@/lib/auth/db";
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

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
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
    ready = true;
  }
  return database;
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

export function findAssociateByUser(userId: string): Associate | null {
  const row = db().prepare("SELECT * FROM associates WHERE user_id = ?").get(userId) as AssociateRow | undefined;
  return row ? toAssociate(row) : null;
}

export function findAssociateByCode(code: string): Associate | null {
  const clean = normalizeCode(code);
  if (clean.length < 6) return null;
  const row = db().prepare("SELECT * FROM associates WHERE code = ?").get(clean) as AssociateRow | undefined;
  return row ? toAssociate(row) : null;
}

/** A readable code: up to four letters of the name, then four random characters. */
function generateCode(name: string): string {
  const stem = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4).padEnd(4, "X");
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = randomBytes(4);
    const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const code = `${stem}${tail}`;
    if (!db().prepare("SELECT 1 FROM associates WHERE code = ?").get(code)) return code;
  }
  throw new Error("Could not allocate a referral code.");
}

export function registerAssociate(input: {
  userId: string;
  name: string;
  profession: AssociateProfession;
  city: string;
  firm: string;
}): Associate {
  const existing = findAssociateByUser(input.userId);
  if (existing) return existing;
  const code = generateCode(input.name);
  db()
    .prepare(
      "INSERT INTO associates (user_id, code, profession, city, firm, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)",
    )
    .run(input.userId, code, input.profession, input.city, input.firm, new Date().toISOString());
  return findAssociateByUser(input.userId)!;
}

/* ------------------------------------------------------------------ */
/* Attribution                                                         */
/* ------------------------------------------------------------------ */

/**
 * Resolve the referral code to credit, or null. Self-referral is refused: an
 * associate buying for themselves (same account or same email) earns nothing.
 */
function creditableAssociate(code: string | null | undefined, buyer: { userId: string | null; email: string }) {
  if (!code) return null;
  const associate = findAssociateByCode(code);
  if (!associate || associate.status !== "active") return null;
  if (buyer.userId && buyer.userId === associate.userId) return null;
  const owner = authDatabase().prepare("SELECT email FROM users WHERE id = ?").get(associate.userId) as
    | { email: string }
    | undefined;
  if (owner && owner.email.trim().toLowerCase() === buyer.email.trim().toLowerCase()) return null;
  return associate;
}

/** Record the commission for a new order. Safe to call twice: the second call is ignored. */
export function recordOrderCommission(input: {
  orderId: string;
  subtotal: number;
  code: string | null | undefined;
  buyerUserId: string | null;
  buyerEmail: string;
}) {
  const associate = creditableAssociate(input.code, { userId: input.buyerUserId, email: input.buyerEmail });
  if (!associate || input.subtotal <= 0) return null;
  const amount = Math.round(input.subtotal * associateCommissionRate);
  db()
    .prepare(
      `INSERT OR IGNORE INTO associate_commissions (id, code, source_type, source_id, base_amount, rate, amount, status, created_at)
       VALUES (?, ?, 'order', ?, ?, ?, ?, 'pending', ?)`,
    )
    .run(
      `COM-${randomBytes(5).toString("hex").toUpperCase()}`,
      associate.code,
      input.orderId,
      input.subtotal,
      associateCommissionRate,
      amount,
      new Date().toISOString(),
    );
  return associate.code;
}

/** Link a quote to the associate who prepared or referred it. */
export function recordQuoteAttribution(input: {
  reference: string;
  code: string | null | undefined;
  buyerUserId: string | null;
  buyerEmail: string;
  customer: string;
  summary: string;
}) {
  const associate = creditableAssociate(input.code, { userId: null, email: input.buyerEmail });
  // A signed-in associate may prepare a quote for a customer from their own account,
  // so only the email check applies to quotes.
  void input.buyerUserId;
  if (!associate) return null;
  db()
    .prepare("INSERT OR IGNORE INTO associate_quotes (reference, code, customer, summary, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(input.reference, associate.code, input.customer, input.summary, new Date().toISOString());
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
export function listCommissions(code: string): CommissionEntry[] {
  const rows = db()
    .prepare("SELECT * FROM associate_commissions WHERE code = ? ORDER BY created_at DESC LIMIT 200")
    .all(code) as {
    id: string;
    source_id: string;
    base_amount: number;
    rate: number;
    amount: number;
    status: string;
    created_at: string;
  }[];
  return rows.map((row) => {
    const order = findDemoOrderById(row.source_id);
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
  });
}

export function listAttributedQuotes(code: string): AttributedQuote[] {
  const rows = db()
    .prepare("SELECT * FROM associate_quotes WHERE code = ? ORDER BY created_at DESC LIMIT 100")
    .all(code) as { reference: string; customer: string; summary: string; created_at: string }[];
  return rows.map((row) => ({ reference: row.reference, customer: row.customer, summary: row.summary, createdAt: row.created_at }));
}
