import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { staffAdvanceOrder, staffCancelOrder } from "@/lib/commerce/order-store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Staff order management: move an order towards delivery, or cancel it before dispatch. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readAdminSession();
  if (!session) return fail("Not found.", 404);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = cleanText(body?.orderId, 40).toUpperCase();
  const staff = session.user.email;
  let result;
  if (body?.action === "advance") {
    result = staffAdvanceOrder(orderId, { courier: cleanText(body?.courier, 60), trackingNumber: cleanText(body?.trackingNumber, 60) }, staff);
  } else if (body?.action === "cancel") {
    result = staffCancelOrder(orderId, cleanText(body?.note, 300), staff);
  } else {
    return fail("Unknown action.");
  }
  return result.ok ? Response.json({ ok: true }) : fail(result.message, 409);
}
