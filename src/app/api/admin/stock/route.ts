import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { setStock } from "@/lib/stock/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Staff set a product's on-hand count, or stop tracking it (onHand: null). */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readAdminSession();
  if (!session) return fail("Not found.", 404);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const raw = body?.onHand;
  const onHand = raw === null ? null : Number(raw);
  const result = setStock(cleanText(body?.productId, 60), onHand, session.user.email);
  return result.ok ? Response.json({ ok: true }) : fail(result.message);
}
