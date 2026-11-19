import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { authDatabase } from "@/lib/auth/db";
import { fileExtensions } from "@/lib/files";
import { findDemoQuote } from "@/lib/quotes/demo-store";

/**
 * Design proofs for custom work (signage, branded and custom boards).
 * Staff upload numbered versions against a quote; the customer approves one
 * or asks for changes. Production may only start from an approved version,
 * and once a version is approved the proof thread is closed.
 */
export type ProofStatus = "pending" | "approved" | "changes" | "superseded";

export type Proof = {
  id: string;
  quoteReference: string;
  version: number;
  fileName: string;
  mimeType: string;
  size: number;
  staffNote: string;
  uploadedBy: string;
  createdAt: string;
  status: ProofStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  customerComment: string;
};

export const proofMaxBytes = 5 * 1024 * 1024;
const fileDir = () => path.join(process.cwd(), ".data", "proof-files");

let ready = false;
function db() {
  const database = authDatabase();
  if (!ready) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS design_proofs (
        id TEXT PRIMARY KEY,
        quote_reference TEXT NOT NULL,
        version INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        stored_as TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        staff_note TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        decided_at TEXT,
        decided_by TEXT,
        customer_comment TEXT NOT NULL DEFAULT '',
        UNIQUE (quote_reference, version)
      );
      CREATE INDEX IF NOT EXISTS design_proofs_quote ON design_proofs(quote_reference);
    `);
    ready = true;
  }
  return database;
}

type Row = {
  id: string;
  quote_reference: string;
  version: number;
  file_name: string;
  stored_as: string;
  mime_type: string;
  size: number;
  staff_note: string;
  uploaded_by: string;
  created_at: string;
  status: string;
  decided_at: string | null;
  decided_by: string | null;
  customer_comment: string;
};

const toProof = (row: Row): Proof => ({
  id: row.id,
  quoteReference: row.quote_reference,
  version: row.version,
  fileName: row.file_name,
  mimeType: row.mime_type,
  size: row.size,
  staffNote: row.staff_note,
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at,
  status: row.status as ProofStatus,
  decidedAt: row.decided_at,
  decidedBy: row.decided_by,
  customerComment: row.customer_comment,
});

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

export function listProofsForQuote(reference: string) {
  const rows = db().prepare("SELECT * FROM design_proofs WHERE quote_reference = ? ORDER BY version DESC").all(reference) as Row[];
  return rows.map(toProof);
}

export function listAllProofs(limit = 200) {
  const rows = db().prepare("SELECT * FROM design_proofs ORDER BY created_at DESC LIMIT ?").all(limit) as Row[];
  return rows.map(toProof);
}

/** Quote references this customer may see proofs for: quotes saved to their account, or sent from their email. */
export async function quoteReferencesForCustomer(userId: string, email: string) {
  const linked = (db().prepare("SELECT reference FROM customer_quotes WHERE user_id = ?").all(userId) as { reference: string }[]).map((r) => r.reference);
  const withProofs = (db().prepare("SELECT DISTINCT quote_reference AS reference FROM design_proofs").all() as { reference: string }[]).map((r) => r.reference);
  const allowed = new Set(linked);
  const me = email.trim().toLowerCase();
  for (const reference of withProofs) {
    if (allowed.has(reference)) continue;
    const quote = await findDemoQuote(reference);
    if (quote && quote.email.trim().toLowerCase() === me) allowed.add(reference);
  }
  return allowed;
}

export async function customerCanSeeQuote(reference: string, userId: string, email: string) {
  return (await quoteReferencesForCustomer(userId, email)).has(reference);
}

export async function uploadProof(input: {
  quoteReference: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  staffNote: string;
  staffEmail: string;
}): Promise<Result<{ id: string; version: number }>> {
  const quote = await findDemoQuote(input.quoteReference);
  if (!quote) return { ok: false, message: "No quote matches that reference." };
  const existing = listProofsForQuote(input.quoteReference);
  if (existing.some((proof) => proof.status === "approved")) {
    return { ok: false, message: "The customer has already approved a proof for this quote. Production uses that version." };
  }
  const version = (existing[0]?.version ?? 0) + 1;
  const id = `PRF-${randomBytes(4).toString("hex").toUpperCase()}`;
  const storedAs = `${id}.${fileExtensions[input.mimeType]}`;
  await mkdir(fileDir(), { recursive: true });
  await writeFile(path.join(fileDir(), storedAs), input.bytes);

  const database = db();
  database.exec("BEGIN");
  try {
    // A new version replaces any version still waiting for the customer.
    database.prepare("UPDATE design_proofs SET status = 'superseded' WHERE quote_reference = ? AND status = 'pending'").run(input.quoteReference);
    database
      .prepare(
        `INSERT INTO design_proofs (id, quote_reference, version, file_name, stored_as, mime_type, size, staff_note, uploaded_by, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .run(id, input.quoteReference, version, input.fileName, storedAs, input.mimeType, input.bytes.length, input.staffNote, input.staffEmail, new Date().toISOString());
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return { ok: true, id, version };
}

/** The customer's decision on the latest version. Only a pending version can be decided, and only once. */
export function decideProof(input: {
  proofId: string;
  decision: "approved" | "changes";
  comment: string;
  customerEmail: string;
}): Result {
  const row = db().prepare("SELECT * FROM design_proofs WHERE id = ?").get(input.proofId) as Row | undefined;
  if (!row) return { ok: false, message: "That proof wasn't found." };
  if (row.status !== "pending") return { ok: false, message: "This version has already been decided or replaced by a newer one." };
  if (input.decision === "changes" && input.comment.length < 5) return { ok: false, message: "Tell us what to change." };
  const update = db()
    .prepare("UPDATE design_proofs SET status = ?, decided_at = ?, decided_by = ?, customer_comment = ? WHERE id = ? AND status = 'pending'")
    .run(input.decision, new Date().toISOString(), input.customerEmail, input.comment, input.proofId);
  return Number(update.changes) === 1 ? { ok: true } : { ok: false, message: "This version has already been decided." };
}

export function findProof(id: string) {
  const row = db().prepare("SELECT * FROM design_proofs WHERE id = ?").get(id) as Row | undefined;
  return row ? { proof: toProof(row), storedAs: row.stored_as } : null;
}

export async function readProofFile(storedAs: string) {
  // storedAs is generated by uploadProof, never taken from a request.
  return readFile(path.join(fileDir(), path.basename(storedAs)));
}
