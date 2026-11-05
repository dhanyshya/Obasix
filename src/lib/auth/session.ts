import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { authDatabase } from "@/lib/auth/db";

const cookieName = "obasix_session";
const sessionMs = 14 * 24 * 60 * 60 * 1000;

export type AccountUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  role: "customer";
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function readSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const row = authDatabase()
    .prepare(
      `SELECT users.id, users.email, users.name, users.phone, users.company, users.role, sessions.expires_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | { id: string; email: string; name: string; phone: string; company: string; role: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now() || row.role !== "customer") {
    if (row) authDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  const user: AccountUser = {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    company: row.company,
    role: "customer",
  };
  return { token, user };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  authDatabase()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, Date.now() + sessionMs);
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(sessionMs / 1000),
  });
}

export async function destroySession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (token) authDatabase().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  (await cookies()).set(cookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const hits = new Map<string, number[]>();

export function allowAuthAttempt(key: string, limit = 8) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
