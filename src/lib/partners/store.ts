import "server-only";

import { randomBytes } from "node:crypto";
import { authDatabase } from "@/lib/auth/db";
import { findDemoOrderById } from "@/lib/commerce/order-store";
import {
  clientKey,
  maxMarginRate,
  minimumProjectValue,
  nextProjectStatus,
  projectProtectionDays,
  type PartnerType,
  type ProjectSector,
  type ProjectStatus,
} from "@/lib/partners/program";

/**
 * Partner store. A partner is a customer account with an approved partner
 * profile. Partners register client projects; staff quote each one with a
 * negotiated margin. The margin is earned on the final project value and
 * becomes payable once the project is delivered.
 *
 * One order, one payout: a project can be linked to a website order only if
 * no associate commission is live on that order, and each order can belong
 * to one project only.
 */

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS partners (
        user_id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        partner_type TEXT NOT NULL,
        gstin TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        sectors TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        decision_note TEXT NOT NULL DEFAULT '',
        decided_by TEXT NOT NULL DEFAULT '',
        decided_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS partner_projects (
        id TEXT PRIMARY KEY,
        partner_user_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_key TEXT NOT NULL,
        city TEXT NOT NULL,
        sector TEXT NOT NULL,
        scope TEXT NOT NULL,
        expected_value INTEGER NOT NULL,
        expected_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Submitted',
        quoted_value INTEGER NOT NULL DEFAULT 0,
        margin_rate REAL NOT NULL DEFAULT 0,
        linked_order_id TEXT UNIQUE,
        conflict_with TEXT NOT NULL DEFAULT '',
        staff_note TEXT NOT NULL DEFAULT '',
        payout_ref TEXT NOT NULL DEFAULT '',
        protected_until TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS partner_projects_partner ON partner_projects(partner_user_id);
      CREATE INDEX IF NOT EXISTS partner_projects_client ON partner_projects(client_key);
    `);
    ready = true;
  }
  return database;
}

export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";

export type Partner = {
  userId: string;
  companyName: string;
  partnerType: PartnerType;
  gstin: string;
  city: string;
  state: string;
  sectors: ProjectSector[];
  notes: string;
  status: PartnerStatus;
  decisionNote: string;
  decidedBy: string;
  createdAt: string;
};

export type Project = {
  id: string;
  partnerUserId: string;
  clientName: string;
  city: string;
  sector: ProjectSector;
  scope: string;
  expectedValue: number;
  expectedDate: string;
  status: ProjectStatus;
  quotedValue: number;
  marginRate: number;
  /** Margin earned on the quoted value; zero until quoted. */
  earning: number;
  linkedOrderId: string | null;
  conflictWith: string;
  staffNote: string;
  payoutRef: string;
  protectedUntil: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

type PartnerRow = {
  user_id: string;
  company_name: string;
  partner_type: string;
  gstin: string;
  city: string;
  state: string;
  sectors: string;
  notes: string;
  status: string;
  decision_note: string;
  decided_by: string;
  created_at: string;
};

const toPartner = (row: PartnerRow): Partner => ({
  userId: row.user_id,
  companyName: row.company_name,
  partnerType: row.partner_type as PartnerType,
  gstin: row.gstin,
  city: row.city,
  state: row.state,
  sectors: JSON.parse(row.sectors),
  notes: row.notes,
  status: row.status as PartnerStatus,
  decisionNote: row.decision_note,
  decidedBy: row.decided_by,
  createdAt: row.created_at,
});

type ProjectRow = {
  id: string;
  partner_user_id: string;
  client_name: string;
  city: string;
  sector: string;
  scope: string;
  expected_value: number;
  expected_date: string;
  status: string;
  quoted_value: number;
  margin_rate: number;
  linked_order_id: string | null;
  conflict_with: string;
  staff_note: string;
  payout_ref: string;
  protected_until: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
};

const toProject = (row: ProjectRow): Project => ({
  id: row.id,
  partnerUserId: row.partner_user_id,
  clientName: row.client_name,
  city: row.city,
  sector: row.sector as ProjectSector,
  scope: row.scope,
  expectedValue: row.expected_value,
  expectedDate: row.expected_date,
  status: row.status as ProjectStatus,
  quotedValue: row.quoted_value,
  marginRate: row.margin_rate,
  earning: Math.round(row.quoted_value * row.margin_rate),
  linkedOrderId: row.linked_order_id,
  conflictWith: row.conflict_with,
  staffNote: row.staff_note,
  payoutRef: row.payout_ref,
  protectedUntil: row.protected_until,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
});

export function findPartner(userId: string): Partner | null {
  const row = db().prepare("SELECT * FROM partners WHERE user_id = ?").get(userId) as PartnerRow | undefined;
  return row ? toPartner(row) : null;
}

export function applyAsPartner(input: {
  userId: string;
  companyName: string;
  partnerType: PartnerType;
  gstin: string;
  city: string;
  state: string;
  sectors: ProjectSector[];
  notes: string;
}) {
  // A rejected applicant may apply again; the new application replaces the old one.
  db()
    .prepare(
      `INSERT INTO partners (user_id, company_name, partner_type, gstin, city, state, sectors, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
       ON CONFLICT(user_id) DO UPDATE SET company_name = excluded.company_name, partner_type = excluded.partner_type,
         gstin = excluded.gstin, city = excluded.city, state = excluded.state, sectors = excluded.sectors,
         notes = excluded.notes, status = 'pending', decision_note = '', decided_by = '', decided_at = NULL,
         created_at = excluded.created_at
       WHERE partners.status = 'rejected'`,
    )
    .run(input.userId, input.companyName, input.partnerType, input.gstin, input.city, input.state, JSON.stringify(input.sectors), input.notes, new Date().toISOString());
  return findPartner(input.userId)!;
}

export type RegisterResult = { ok: true; project: Project } | { ok: false; message: string };

export function registerProject(input: {
  partnerUserId: string;
  clientName: string;
  city: string;
  sector: ProjectSector;
  scope: string;
  expectedValue: number;
  expectedDate: string;
}): RegisterResult {
  if (input.expectedValue < minimumProjectValue) {
    return { ok: false, message: `Projects start at ₹${minimumProjectValue.toLocaleString("en-IN")}. Smaller orders can go through the website or the associate programme.` };
  }
  const key = clientKey(input.clientName, input.city);
  const now = new Date();
  const open = db()
    .prepare(
      `SELECT id, partner_user_id FROM partner_projects
       WHERE client_key = ? AND status NOT IN ('Lost', 'Paid') AND protected_until > ? ORDER BY created_at LIMIT 1`,
    )
    .get(key, now.toISOString()) as { id: string; partner_user_id: string } | undefined;
  if (open?.partner_user_id === input.partnerUserId) {
    return { ok: false, message: `You already registered this client (${open.id}).` };
  }

  const id = `PRJ-${randomBytes(3).toString("hex").toUpperCase()}`;
  const protectedUntil = new Date(now.getTime() + projectProtectionDays * 86400000).toISOString();
  db()
    .prepare(
      `INSERT INTO partner_projects (id, partner_user_id, client_name, client_key, city, sector, scope, expected_value, expected_date,
         conflict_with, protected_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.partnerUserId,
      input.clientName,
      key,
      input.city,
      input.sector,
      input.scope,
      input.expectedValue,
      input.expectedDate,
      // Registered by another partner first: kept, but flagged for staff. The earlier registration stands.
      open?.id ?? "",
      protectedUntil,
      now.toISOString(),
      now.toISOString(),
    );
  return { ok: true, project: findProject(id)! };
}

export function findProject(id: string) {
  const row = db().prepare("SELECT * FROM partner_projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? toProject(row) : null;
}

export function listPartnerProjects(partnerUserId: string): Project[] {
  const rows = db().prepare("SELECT * FROM partner_projects WHERE partner_user_id = ? ORDER BY created_at DESC").all(partnerUserId) as ProjectRow[];
  return rows.map(toProject);
}

/* ---------- Staff ---------- */

export type PartnerSummary = Partner & { name: string; email: string; phone: string; projects: number; wonValue: number; earned: number };

export function listPartnerSummaries(): PartnerSummary[] {
  const rows = db()
    .prepare(
      `SELECT partners.*, users.name AS user_name, users.email AS user_email, users.phone AS user_phone
       FROM partners LEFT JOIN users ON users.id = partners.user_id
       ORDER BY CASE partners.status WHEN 'pending' THEN 0 ELSE 1 END, partners.created_at DESC`,
    )
    .all() as (PartnerRow & { user_name: string | null; user_email: string | null; user_phone: string | null })[];
  return rows.map((row) => {
    const projects = listPartnerProjects(row.user_id);
    const won = projects.filter((p) => ["Won", "In production", "Delivered", "Paid"].includes(p.status));
    return {
      ...toPartner(row),
      name: row.user_name ?? "",
      email: row.user_email ?? "",
      phone: row.user_phone ?? "",
      projects: projects.length,
      wonValue: won.reduce((s, p) => s + p.quotedValue, 0),
      earned: projects.filter((p) => p.status === "Paid").reduce((s, p) => s + p.earning, 0),
    };
  });
}

export type ProjectWithPartner = Project & { partnerCompany: string; partnerEmail: string };

export function listAllProjects(): ProjectWithPartner[] {
  const rows = db()
    .prepare(
      `SELECT partner_projects.*, partners.company_name AS partner_company, users.email AS partner_email
       FROM partner_projects
       LEFT JOIN partners ON partners.user_id = partner_projects.partner_user_id
       LEFT JOIN users ON users.id = partner_projects.partner_user_id
       ORDER BY CASE partner_projects.status WHEN 'Submitted' THEN 0 WHEN 'Delivered' THEN 1 ELSE 2 END, partner_projects.created_at DESC`,
    )
    .all() as (ProjectRow & { partner_company: string | null; partner_email: string | null })[];
  return rows.map((row) => ({ ...toProject(row), partnerCompany: row.partner_company ?? "Unknown", partnerEmail: row.partner_email ?? "" }));
}

export function decidePartner(input: { userId: string; status: Exclude<PartnerStatus, "pending">; note: string; staffEmail: string }) {
  const result = db()
    .prepare("UPDATE partners SET status = ?, decision_note = ?, decided_by = ?, decided_at = ? WHERE user_id = ?")
    .run(input.status, input.note, input.staffEmail, new Date().toISOString(), input.userId);
  return Number(result.changes) > 0;
}

/** True when a live associate commission already sits on this order. */
function orderHasAssociateCommission(orderId: string) {
  try {
    const row = db().prepare("SELECT status FROM associate_commissions WHERE source_id = ?").get(orderId) as { status: string } | undefined;
    return Boolean(row && row.status !== "void");
  } catch {
    return false; // The associate tables don't exist yet, so there can't be a commission.
  }
}

export type ProjectAction =
  | { action: "quote"; quotedValue: number; marginRate: number; note: string }
  | { action: "advance"; linkedOrderId?: string; note: string }
  | { action: "lose"; note: string }
  | { action: "pay"; payoutRef: string };

export function updateProject(id: string, change: ProjectAction, staffEmail: string): RegisterResult {
  const project = findProject(id);
  if (!project) return { ok: false, message: "Project not found." };
  const now = new Date().toISOString();
  const set = (fields: Record<string, string | number | null>) => {
    const keys = Object.keys(fields);
    db()
      .prepare(`UPDATE partner_projects SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = ?, updated_by = ? WHERE id = ?`)
      .run(...keys.map((k) => fields[k]), now, staffEmail, id);
    return { ok: true as const, project: findProject(id)! };
  };

  switch (change.action) {
    case "quote": {
      if (!["Submitted", "Quoted"].includes(project.status)) return { ok: false, message: `A ${project.status.toLowerCase()} project can't be re-quoted.` };
      if (project.conflictWith) return { ok: false, message: `This client was registered first in ${project.conflictWith}. Resolve that before quoting.` };
      if (change.quotedValue < 1) return { ok: false, message: "Enter the quoted project value." };
      if (!(change.marginRate >= 0 && change.marginRate <= maxMarginRate)) {
        return { ok: false, message: `Set a margin between 0 and ${maxMarginRate * 100}%.` };
      }
      return set({ status: "Quoted", quoted_value: change.quotedValue, margin_rate: change.marginRate, staff_note: change.note });
    }
    case "advance": {
      const next = nextProjectStatus[project.status];
      if (!next) return { ok: false, message: `A ${project.status.toLowerCase()} project can't move forward from here.` };
      const fields: Record<string, string | number | null> = { status: next, staff_note: change.note || project.staffNote };
      if (next === "Won" && change.linkedOrderId) {
        const orderId = change.linkedOrderId;
        if (!findDemoOrderById(orderId)) return { ok: false, message: `No website order ${orderId} was found.` };
        if (orderHasAssociateCommission(orderId)) {
          return { ok: false, message: `Order ${orderId} already earns an associate commission. Void it first: one order earns one payout.` };
        }
        const taken = db().prepare("SELECT id FROM partner_projects WHERE linked_order_id = ? AND id != ?").get(orderId, id) as { id: string } | undefined;
        if (taken) return { ok: false, message: `Order ${orderId} already belongs to ${taken.id}.` };
        fields.linked_order_id = orderId;
      }
      return set(fields);
    }
    case "lose": {
      if (["Delivered", "Paid", "Lost"].includes(project.status)) return { ok: false, message: `A ${project.status.toLowerCase()} project can't be marked lost.` };
      if (change.note.length < 3) return { ok: false, message: "Add a note explaining why the project was lost." };
      return set({ status: "Lost", staff_note: change.note });
    }
    case "pay": {
      if (project.status !== "Delivered") return { ok: false, message: "Partner margin is paid only after the project is delivered." };
      if (change.payoutRef.length < 3) return { ok: false, message: "Enter the payment or UTR reference." };
      return set({ status: "Paid", payout_ref: change.payoutRef });
    }
  }
}
