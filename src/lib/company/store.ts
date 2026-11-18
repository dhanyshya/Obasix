import "server-only";

import { randomBytes } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { authDatabase } from "@/lib/auth/db";
import { normalizeCartLines, type SavedCartLine } from "@/lib/auth/cart";
import { findDemoOrderById } from "@/lib/commerce/order-store";

/**
 * Company reorder accounts. A company groups colleagues by email so that
 * branches and departments can share standard reorder lists. Membership is
 * keyed on email, so a colleague added before they register joins as soon as
 * they sign up with that address. Each email belongs to one company.
 */

export type CompanyRole = "owner" | "buyer";

export const maxListsPerCompany = 30;
export const maxMembersPerCompany = 50;

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gstin TEXT NOT NULL DEFAULT '',
        billing_address TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS company_members (
        email TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id),
        role TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS company_members_company ON company_members(company_id);
      CREATE TABLE IF NOT EXISTS reorder_lists (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id),
        name TEXT NOT NULL,
        lines TEXT NOT NULL,
        source TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS reorder_lists_company ON reorder_lists(company_id);
    `);
    ready = true;
  }
  return database;
}

const normEmail = (email: string) => email.trim().toLowerCase();

export type Company = { id: string; name: string; gstin: string; billingAddress: string; createdAt: string };
export type CompanyMember = { email: string; role: CompanyRole; addedBy: string; addedAt: string };
export type ReorderLine = SavedCartLine & { name: string; sku: string; unitPrice: number };
export type ReorderList = {
  id: string;
  name: string;
  lines: ReorderLine[];
  /** Lines whose product has left the catalogue since the list was saved. */
  droppedLines: number;
  total: number;
  source: string;
  createdBy: string;
  createdAt: string;
};
export type CompanyMembership = { company: Company; role: CompanyRole };

type CompanyRow = { id: string; name: string; gstin: string; billing_address: string; created_at: string };
const toCompany = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  gstin: row.gstin,
  billingAddress: row.billing_address,
  createdAt: row.created_at,
});

export function findMembership(email: string): CompanyMembership | null {
  const row = db()
    .prepare(
      `SELECT companies.*, company_members.role FROM company_members
       JOIN companies ON companies.id = company_members.company_id WHERE company_members.email = ?`,
    )
    .get(normEmail(email)) as (CompanyRow & { role: CompanyRole }) | undefined;
  return row ? { company: toCompany(row), role: row.role } : null;
}

export function createCompany(input: { ownerEmail: string; name: string; gstin: string; billingAddress: string }) {
  const email = normEmail(input.ownerEmail);
  const existing = findMembership(email);
  if (existing) return { ok: false as const, message: `You're already part of ${existing.company.name}.` };
  const id = `CO-${randomBytes(4).toString("hex").toUpperCase()}`;
  const now = new Date().toISOString();
  const database = db();
  database.exec("BEGIN");
  try {
    database
      .prepare("INSERT INTO companies (id, name, gstin, billing_address, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, input.name, input.gstin, input.billingAddress, email, now);
    database
      .prepare("INSERT INTO company_members (email, company_id, role, added_by, added_at) VALUES (?, ?, 'owner', ?, ?)")
      .run(email, id, email, now);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return { ok: true as const, membership: findMembership(email)! };
}

export function listMembers(companyId: string): CompanyMember[] {
  const rows = db()
    .prepare("SELECT email, role, added_by, added_at FROM company_members WHERE company_id = ? ORDER BY role DESC, added_at")
    .all(companyId) as { email: string; role: CompanyRole; added_by: string; added_at: string }[];
  return rows.map((r) => ({ email: r.email, role: r.role, addedBy: r.added_by, addedAt: r.added_at }));
}

export function addMember(companyId: string, email: string, role: CompanyRole, addedBy: string) {
  const target = normEmail(email);
  const existing = findMembership(target);
  if (existing) {
    return existing.company.id === companyId
      ? { ok: false as const, message: `${target} is already in your company.` }
      : { ok: false as const, message: `${target} already belongs to another company account.` };
  }
  if (listMembers(companyId).length >= maxMembersPerCompany) {
    return { ok: false as const, message: `A company can have up to ${maxMembersPerCompany} people.` };
  }
  db()
    .prepare("INSERT INTO company_members (email, company_id, role, added_by, added_at) VALUES (?, ?, ?, ?, ?)")
    .run(target, companyId, role, normEmail(addedBy), new Date().toISOString());
  return { ok: true as const };
}

export function removeMember(companyId: string, email: string) {
  const target = normEmail(email);
  const members = listMembers(companyId);
  const member = members.find((m) => m.email === target);
  if (!member) return { ok: false as const, message: "That person isn't in your company." };
  if (member.role === "owner" && members.filter((m) => m.role === "owner").length === 1) {
    return { ok: false as const, message: "A company needs at least one owner. Make someone else an owner first." };
  }
  db().prepare("DELETE FROM company_members WHERE email = ? AND company_id = ?").run(target, companyId);
  return { ok: true as const };
}

export function setMemberRole(companyId: string, email: string, role: CompanyRole) {
  const target = normEmail(email);
  const members = listMembers(companyId);
  const member = members.find((m) => m.email === target);
  if (!member) return { ok: false as const, message: "That person isn't in your company." };
  if (member.role === "owner" && role !== "owner" && members.filter((m) => m.role === "owner").length === 1) {
    return { ok: false as const, message: "A company needs at least one owner." };
  }
  db().prepare("UPDATE company_members SET role = ? WHERE email = ? AND company_id = ?").run(role, target, companyId);
  return { ok: true as const };
}

type ListRow = { id: string; name: string; lines: string; source: string; created_by: string; created_at: string };

function toList(row: ListRow): ReorderList {
  const raw = JSON.parse(row.lines) as unknown[];
  // Re-validate against today's catalogue: prices are always current and retired products drop out.
  const lines = normalizeCartLines(raw).map((line) => {
    const product = getProductById(line.productId)!;
    return { ...line, name: product.shortName, sku: product.sku, unitPrice: product.price };
  });
  return {
    id: row.id,
    name: row.name,
    lines,
    droppedLines: raw.length - lines.length,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    source: row.source,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function listReorderLists(companyId: string): ReorderList[] {
  const rows = db().prepare("SELECT * FROM reorder_lists WHERE company_id = ? ORDER BY created_at DESC").all(companyId) as ListRow[];
  return rows.map(toList);
}

export function saveReorderList(input: { companyId: string; name: string; lines: unknown; source: string; createdBy: string }) {
  const lines = normalizeCartLines(input.lines);
  if (lines.length === 0) return { ok: false as const, message: "There's nothing to save: the list has no catalogue products." };
  const count = (db().prepare("SELECT COUNT(*) AS n FROM reorder_lists WHERE company_id = ?").get(input.companyId) as { n: number }).n;
  if (count >= maxListsPerCompany) return { ok: false as const, message: `A company can keep up to ${maxListsPerCompany} lists. Delete one first.` };
  const id = `RL-${randomBytes(4).toString("hex").toUpperCase()}`;
  db()
    .prepare("INSERT INTO reorder_lists (id, company_id, name, lines, source, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, input.companyId, input.name, JSON.stringify(lines), input.source, normEmail(input.createdBy), new Date().toISOString());
  return { ok: true as const, id };
}

/** Lines from one of the user's own orders, ready to save as a list. Null if the order isn't theirs. */
export function linesFromOrder(orderId: string, userId: string) {
  const order = findDemoOrderById(orderId);
  if (!order) return null;
  // Only orders placed while signed in to this account: guest orders can't be claimed by email.
  const owner = db().prepare("SELECT user_id FROM demo_orders WHERE id = ?").get(orderId) as { user_id: string | null } | undefined;
  if (!owner?.user_id || owner.user_id !== userId) return null;
  return order.items.map((item) => ({ productId: item.productId, quantity: Math.min(item.quantity, 99), configuration: item.configuration }));
}

export function deleteReorderList(companyId: string, listId: string) {
  const result = db().prepare("DELETE FROM reorder_lists WHERE id = ? AND company_id = ?").run(listId, companyId);
  return Number(result.changes) > 0;
}
