import { readSession, sameOrigin } from "@/lib/auth/session";
import { isAssociateProfession } from "@/lib/associates/program";
import { findAssociateByUser, registerAssociate } from "@/lib/associates/store";

export const runtime = "nodejs";

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Join the associate programme with the signed-in account. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, message: "The request was rejected." }, { status: 403 });
  const session = await readSession();
  if (!session) return Response.json({ ok: false, message: "Sign in to join the associate programme." }, { status: 401 });

  const existing = findAssociateByUser(session.user.id);
  if (existing) return Response.json({ ok: true, associate: existing });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const profession = body?.profession;
  const city = clean(body?.city, 60);
  const firm = clean(body?.firm, 80);
  if (!isAssociateProfession(profession)) {
    return Response.json({ ok: false, message: "Choose the work you do." }, { status: 400 });
  }
  if (city.length < 2) return Response.json({ ok: false, message: "Enter the city you work in." }, { status: 400 });
  if (body?.accept !== true) {
    return Response.json({ ok: false, message: "Accept the programme terms to continue." }, { status: 400 });
  }

  const associate = registerAssociate({ userId: session.user.id, name: session.user.name, profession, city, firm });
  return Response.json({ ok: true, associate });
}
