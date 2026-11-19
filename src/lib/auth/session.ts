import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { authDb } from "@/lib/auth/db";
import { allowAttempt, clientAddress } from "@/lib/rateLimit";

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
  const row = (await (await authDb()).get(`SELECT users.id, users.email, users.name, users.phone, users.company, users.role, sessions.expires_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`, hashToken(token))) as
    | { id: string; email: string; name: string; phone: string; company: string; role: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now() || row.role !== "customer") {
    if (row) (await (await authDb()).run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token)));
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
  (await (await authDb()).run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", hashToken(token), userId, Date.now() + sessionMs));
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
  if (token) (await (await authDb()).run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token)));
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

/** Sign-in, sign-up and lookup limits: shared across server instances. */
export function allowAuthAttempt(key: string, limit = 8) {
  return allowAttempt(`auth:${key}`, limit, 10 * 60 * 1000);
}

export { clientAddress };
