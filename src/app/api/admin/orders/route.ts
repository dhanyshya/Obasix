import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { isDemoOrder } from "@/lib/commerce/demo-orders";
import { findDemoOrderById, staffAdvanceOrder, staffCancelOrder } from "@/lib/commerce/order-store";
import { sendEmail } from "@/lib/email/send";
import { orderDispatchedEmail } from "@/lib/email/templates";

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
    result = await staffAdvanceOrder(orderId, { courier: cleanText(body?.courier, 60), trackingNumber: cleanText(body?.trackingNumber, 60) }, staff);
    const order = result.ok ? await findDemoOrderById(orderId) : null;
    if (order && order.status === "Dispatched" && !isDemoOrder(order)) {
      await sendEmail({ to: order.email, ...orderDispatchedEmail(order) });
    }
  } else if (body?.action === "cancel") {
    result = await staffCancelOrder(orderId, cleanText(body?.note, 300), staff);
  } else {
    return fail("Unknown action.");
  }
  return result.ok ? Response.json({ ok: true }) : fail(result.message, 409);
}
