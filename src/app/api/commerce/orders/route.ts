import { readSession, sameOrigin } from "@/lib/auth/session";
import { commerceMode } from "@/lib/commerce/mode";
import { createDemoOrder, findDemoOrderById, listDemoOrdersForUser } from "@/lib/commerce/order-store";
import { commerceUnavailable } from "@/lib/commerce/server";
import type { DemoPaymentMethod } from "@/lib/commerce/demo-orders";

export const runtime = "nodejs";

const methods: DemoPaymentMethod[] = ["upi", "card", "cod"];

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

export async function POST(request: Request) {
  const key = clean(request.headers.get("idempotency-key"), 80);
  if (key.length < 8) return invalid("An order needs an idempotency key so a retry cannot create a second order.");

  const mode = commerceMode();
  if (mode === "unconfigured") {
    return Response.json(
      commerceUnavailable(
        "provider_not_configured",
        "An order was not created. The server has no order API to validate the cart and customer details.",
      ),
      { status: 503 },
    );
  }
  if (mode === "real") {
    return Response.json(
      commerceUnavailable(
        "provider_not_implemented",
        "An order was not created. Credentials are present, but no order API call is implemented.",
      ),
      { status: 501 },
    );
  }

  // Demo mode: the order is stored on this server, priced from the catalogue. No payment is taken.
  if (!sameOrigin(request)) return invalid("The order request was rejected.", 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return invalid("The order could not be read.");

  const method = clean(body.method, 8) as DemoPaymentMethod;
  if (!methods.includes(method)) return invalid("Choose UPI, Card, or Cash on Delivery.");
  const details = (body.details ?? {}) as Record<string, unknown>;
  const shipping = (details.shipping ?? {}) as Record<string, unknown>;
  const name = clean(details.name, 80);
  const email = clean(details.email, 120).toLowerCase();
  const phone = clean(details.phone, 20);
  if (name.length < 2) return invalid("Enter the customer name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalid("Enter a valid email address.");
  if (phone.replace(/\D/g, "").length < 8) return invalid("Enter a valid phone number.");
  const address = {
    line: clean(shipping.line, 160),
    city: clean(shipping.city, 60),
    state: clean(shipping.state, 60),
    postal: clean(shipping.postal, 12),
    country: clean(shipping.country, 60) || "India",
  };
  if (address.line.length < 4 || address.city.length < 2 || address.postal.length < 4) {
    return invalid("Enter a complete shipping address.");
  }

  const session = await readSession();
  const result = createDemoOrder({
    idempotencyKey: key,
    userId: session?.user.id ?? null,
    method,
    name,
    email,
    phone,
    shipping: address,
    lines: body.lines,
  });
  if (!result.ok) return invalid(result.message, 422);
  return Response.json({ ok: true, mode: "demo", charged: false, orderCreated: true, order: result.order });
}

/** Look up a demo order. Requires the order number plus the checkout email or phone, or the owning signed-in account. */
export async function GET(request: Request) {
  if (commerceMode() !== "demo") {
    return Response.json(commerceUnavailable("tracking_unavailable", "No order service is connected."), { status: 503 });
  }
  const url = new URL(request.url);
  const id = clean(url.searchParams.get("id"), 40).toUpperCase();
  const order = id ? findDemoOrderById(id) : null;
  const session = await readSession();
  const owned = Boolean(order && session && listDemoOrdersForUser(session.user.id).some((o) => o.id === id));
  if (!order || !owned) {
    return Response.json({ ok: false, message: "No order matches that reference." }, { status: 404 });
  }
  return Response.json({ ok: true, mode: "demo", order });
}
