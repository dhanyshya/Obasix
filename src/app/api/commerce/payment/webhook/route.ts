import { markOrderPaid } from "@/lib/commerce/order-store";
import { afterOrderPaid } from "@/lib/commerce/paid";
import { verifyWebhookSignature } from "@/lib/commerce/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook (set it up for the payment.captured and order.paid events).
 * This is the safety net: it confirms payment even if the customer closes the
 * tab before the checkout callback reaches us.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  const payment = event.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id && payment.id) {
    const paid = await markOrderPaid(payment.order_id, payment.id);
    if (paid?.newlyPaid) await afterOrderPaid(paid);
  }
  // Acknowledge every signed event, including ones we don't act on, so Razorpay doesn't retry them.
  return Response.json({ ok: true });
}
