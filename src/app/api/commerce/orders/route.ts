import { cookies } from "next/headers";
import { readSession, sameOrigin } from "@/lib/auth/session";
import { referralCookieName } from "@/lib/associates/program";
import { commerceMode } from "@/lib/commerce/mode";
import {
  attachProviderOrder,
  createDemoOrder,
  findDemoOrderById,
  listDemoOrdersForUser,
  orderPaymentRecord,
} from "@/lib/commerce/order-store";
import { afterOrderPaid } from "@/lib/commerce/paid";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/commerce/razorpay";
import { commerceUnavailable } from "@/lib/commerce/server";
import type { DemoPaymentMethod } from "@/lib/commerce/demo-orders";

export const runtime = "nodejs";

const demoMethods: DemoPaymentMethod[] = ["upi", "card", "cod"];

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function invalid(message: string, status = 400) {
  return Response.json(commerceUnavailable("invalid_request", message), { status });
}

/** Customer and address checks shared by demo and live checkout. */
function readCustomer(body: Record<string, unknown>) {
  const details = (body.details ?? {}) as Record<string, unknown>;
  const shipping = (details.shipping ?? {}) as Record<string, unknown>;
  const name = clean(details.name, 80);
  const email = clean(details.email, 120).toLowerCase();
  const phone = clean(details.phone, 20);
  if (name.length < 2) return { error: "Enter the customer name." } as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." } as const;
  if (phone.replace(/\D/g, "").length < 8) return { error: "Enter a valid phone number." } as const;
  const address = {
    line: clean(shipping.line, 160),
    city: clean(shipping.city, 60),
    state: clean(shipping.state, 60),
    postal: clean(shipping.postal, 12),
    country: clean(shipping.country, 60) || "India",
  };
  if (address.line.length < 4 || address.city.length < 2 || address.postal.length < 4) {
    return { error: "Enter a complete shipping address." } as const;
  }
  return { name, email, phone, address } as const;
}

export async function POST(request: Request) {
  const key = clean(request.headers.get("idempotency-key"), 80);
  if (key.length < 8) return invalid("An order needs an idempotency key so a retry cannot create a second order.");

  const mode = commerceMode();
  if (mode === "unconfigured") {
    return Response.json(
      commerceUnavailable(
        "provider_not_configured",
        "An order was not created. Online payment isn't set up on the server yet.",
      ),
      { status: 503 },
    );
  }

  if (!sameOrigin(request)) return invalid("The order request was rejected.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return invalid("The order could not be read.");
  const customer = readCustomer(body);
  if ("error" in customer) return invalid(customer.error ?? "Check the checkout details.");
  const session = await readSession();
  const referralCode = (await cookies()).get(referralCookieName)?.value ?? null;

  if (mode === "real") {
    // Live: save the order unpaid, priced on the server, then open a matching Razorpay order.
    const result = await createDemoOrder({
      idempotencyKey: key,
      userId: session?.user.id ?? null,
      method: "online", // The customer picks UPI, card or netbanking inside Razorpay's checkout.
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      shipping: customer.address,
      lines: body.lines,
      pendingPayment: true,
      referralCode,
    });
    if (!result.ok) return invalid(result.message, 422);
    const record = (await orderPaymentRecord(result.order.id))!;
    if (record.order.paymentStatus === "paid") {
      return Response.json({ ok: true, mode: "real", alreadyPaid: true, order: record.order });
    }
    let providerOrderId = record.providerOrderId;
    if (!providerOrderId) {
      try {
        const razorpayOrder = await createRazorpayOrder({
          amountPaise: Math.round(result.order.subtotal * 100),
          receipt: result.order.id,
          notes: { obasix_order: result.order.id },
        });
        await attachProviderOrder(result.order.id, razorpayOrder.id);
        providerOrderId = (await orderPaymentRecord(result.order.id))!.providerOrderId;
      } catch {
        return Response.json(
          commerceUnavailable("payment_failed", "We couldn't start the payment. Nothing was charged. Try again in a moment."),
          { status: 502 },
        );
      }
    }
    return Response.json({
      ok: true,
      mode: "real",
      order: record.order,
      razorpay: {
        keyId: razorpayKeyId(),
        orderId: providerOrderId,
        amount: Math.round(result.order.subtotal * 100),
        currency: "INR",
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      },
    });
  }

  // Demo mode: the order is stored on this server, priced from the catalogue. No payment is taken.
  const method = clean(body.method, 8) as DemoPaymentMethod;
  if (!demoMethods.includes(method)) return invalid("Choose UPI, Card, or Cash on Delivery.");
  const result = await createDemoOrder({
    idempotencyKey: key,
    userId: session?.user.id ?? null,
    method,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    shipping: customer.address,
    lines: body.lines,
  });
  if (!result.ok) return invalid(result.message, 422);
  await afterOrderPaid({ order: result.order, referralCode, userId: session?.user.id ?? null });
  return Response.json({ ok: true, mode: "demo", charged: false, orderCreated: true, order: result.order });
}

/** Look up an order placed by the signed-in account. Guests use the tracking form instead. */
export async function GET(request: Request) {
  if (commerceMode() === "unconfigured") {
    return Response.json(commerceUnavailable("tracking_unavailable", "No order service is connected."), { status: 503 });
  }
  const url = new URL(request.url);
  const id = clean(url.searchParams.get("id"), 40).toUpperCase();
  const order = id ? await findDemoOrderById(id) : null;
  const session = await readSession();
  const owned = Boolean(order && session && (await listDemoOrdersForUser(session.user.id)).some((o) => o.id === id));
  if (!order || !owned) {
    return Response.json({ ok: false, message: "No order matches that reference." }, { status: 404 });
  }
  return Response.json({ ok: true, mode: commerceMode(), order });
}
