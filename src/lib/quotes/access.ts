import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authDb } from "@/lib/auth/db";
import type { readSession } from "@/lib/auth/session";
import type { StoredQuote } from "@/lib/quotes/demo-store";

/**
 * Who may read a saved quote: the account that sent it (or whose email it carries), or the
 * browser that submitted it. The browser proof is a cookie of signed references, so knowing a
 * reference (from a shared URL, a screenshot or a log) isn't enough to read the quote.
 */
const cookieName = "obasix_quotes";
const maxRefs = 10;

// AUTH_SECRET is required in production; development falls back to a per-process secret.
const globalForQuotes = globalThis as unknown as { obasixQuoteSecret?: string };
function secret() {
  return process.env.AUTH_SECRET || (globalForQuotes.obasixQuoteSecret ??= randomBytes(32).toString("hex"));
}

const sign = (reference: string) => createHmac("sha256", secret()).update(`quote:${reference}`).digest("base64url");

function verified(token: string) {
  const [reference, signature] = token.split(".");
  if (!reference || !signature) return null;
  const expected = Buffer.from(sign(reference));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? reference : null;
}

async function cookieRefs() {
  const raw = (await cookies()).get(cookieName)?.value ?? "";
  return raw.split(",").map(verified).filter((r): r is string => Boolean(r));
}

/** Call after saving a quote: this browser may view it on the confirmation page. */
export async function grantQuoteAccess(reference: string) {
  const existing = (await cookies()).get(cookieName)?.value ?? "";
  const tokens = [`${reference}.${sign(reference)}`, ...existing.split(",").filter(Boolean)].slice(0, maxRefs);
  (await cookies()).set(cookieName, tokens.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function canViewQuote(quote: StoredQuote, session: Awaited<ReturnType<typeof readSession>>) {
  if ((await cookieRefs()).includes(quote.reference)) return true;
  if (!session) return false;
  if (quote.email.trim().toLowerCase() === session.user.email.trim().toLowerCase()) return true;
  const linked = await (await authDb()).get("SELECT 1 AS ok FROM customer_quotes WHERE reference = ? AND user_id = ?", quote.reference, session.user.id);
  return Boolean(linked);
}
