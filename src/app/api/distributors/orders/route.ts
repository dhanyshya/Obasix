import { readSession, sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { placeTradeOrder } from "@/lib/distributors/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Place a trade order, priced on the server at the distributor's tier discount. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readSession();
  if (!session) return fail("Sign in to place a trade order.", 401);

  const key = cleanText(request.headers.get("idempotency-key"), 80);
  if (key.length < 8) return fail("A trade order needs an idempotency key so a retry can't create a second order.");

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const terms = body?.paymentTerms === "credit" ? "credit" : body?.paymentTerms === "advance" ? "advance" : null;
  if (!terms) return fail("Choose credit or advance payment.");

  const result = placeTradeOrder({
    userId: session.user.id,
    idempotencyKey: `${session.user.id}:${key}`,
    lines: body?.lines,
    paymentTerms: terms,
    reference: cleanText(body?.reference, 60),
  });
  if (!result.ok) return fail(result.message, 422);
  return Response.json({ ok: true, order: result.order });
}
