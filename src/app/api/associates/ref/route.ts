import { cookies } from "next/headers";
import { sameOrigin } from "@/lib/auth/session";
import { referralCookieName, referralWindowDays } from "@/lib/associates/program";
import { findAssociateByCode, normalizeCode } from "@/lib/associates/store";

export const runtime = "nodejs";

/**
 * Remember a referral code from a shared link.
 * First valid referral wins for the whole window, so a later link cannot take
 * over a customer another associate introduced.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = normalizeCode(body?.code);
  const associate = await findAssociateByCode(code);
  if (!associate || associate.status !== "active") return Response.json({ ok: false }, { status: 404 });

  const jar = await cookies();
  const current = jar.get(referralCookieName)?.value;
  if (current && await findAssociateByCode(current)) {
    return Response.json({ ok: true, kept: true });
  }
  jar.set(referralCookieName, associate.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: referralWindowDays * 24 * 60 * 60,
  });
  return Response.json({ ok: true, kept: false });
}
