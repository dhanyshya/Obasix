import { sameOrigin } from "@/lib/auth/session";
import { commerceMode } from "@/lib/commerce/mode";
import { markOrderPaid, orderPaymentRecord } from "@/lib/commerce/order-store";
import { afterOrderPaid } from "@/lib/commerce/paid";
import { verifyPaymentSignature } from "@/lib/commerce/razorpay";
import { commerceUnavailable } from "@/lib/commerce/server";

export const runtime = "nodejs";

/**
 * Razorpay checkout callback. The browser sends the IDs and signature Razorpay
 * gave it; the order is marked paid only if the signature checks out with our
 * key secret and belongs to this order.
 */
export async function POST(request: Request) {
  if (commerceMode() !== "real") {
    return Response.json(commerceUnavailable("provider_not_configured", "Online payment isn't set up on the server."), { status: 503 });
  }
  if (!sameOrigin(request)) {
    return Response.json(commerceUnavailable("invalid_request", "The payment confirmation was rejected."), { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = String(body?.orderId ?? "").slice(0, 40);
  const providerOrderId = String(body?.razorpay_order_id ?? "").slice(0, 60);
  const paymentId = String(body?.razorpay_payment_id ?? "").slice(0, 60);
  const signature = String(body?.razorpay_signature ?? "").slice(0, 200);

  const record = await orderPaymentRecord(orderId);
  if (!record || !record.providerOrderId || record.providerOrderId !== providerOrderId) {
    return Response.json(commerceUnavailable("invalid_request", "That payment doesn't match an order."), { status: 404 });
  }
  if (!verifyPaymentSignature(providerOrderId, paymentId, signature)) {
    return Response.json(
      commerceUnavailable("payment_failed", "We couldn't verify this payment. If money left your account, contact us with your order number."),
      { status: 400 },
    );
  }
  const paid = (await markOrderPaid(providerOrderId, paymentId))!;
  if (paid.newlyPaid) await afterOrderPaid(paid);
  return Response.json({ ok: true, order: paid.order });
}
