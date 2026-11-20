import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay Standard Checkout. https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 *
 * The server creates a Razorpay order for the amount it priced, the browser
 * opens Razorpay's checkout, and the order is marked paid only after a
 * signature check: either the checkout callback (signed with the key secret)
 * or the webhook (signed with the webhook secret), whichever arrives first.
 */
export const razorpayEnv = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] as const;

export function razorpayConfigured() {
  return razorpayEnv.every((name) => Boolean(process.env[name]));
}

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";
/** Overridable only so tests can point at a local stand-in; never set in production. */
const apiBase = () => process.env.RAZORPAY_API_BASE || "https://api.razorpay.com";

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };

export async function createRazorpayOrder(input: { amountPaise: number; receipt: string; notes: Record<string, string> }) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`${apiBase()}/v1/orders`, {
    method: "POST",
    headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: input.notes }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return (await response.json()) as RazorpayOrder;
}

function safeEqualHex(expected: string, given: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(given ?? ""), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout callback: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
