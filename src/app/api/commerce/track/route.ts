import { commerceMode } from "@/lib/commerce/mode";
import { advanceDemoOrderStatus, contactMatchesOrder, findDemoOrderById } from "@/lib/commerce/order-store";
import { commerceUnavailable } from "@/lib/commerce/server";
import { allowAuthAttempt, clientAddress } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => null)) ?? {}) as { orderNumber?: string; contact?: string; advance?: boolean };
  const orderNumber = String(body.orderNumber ?? "").trim().toUpperCase().slice(0, 40);
  const contact = String(body.contact ?? "").trim().slice(0, 120);
  if (orderNumber.length < 4 || contact.length < 5) {
    return Response.json(
      commerceUnavailable("invalid_request", "Enter an order number and the email or phone used at checkout."),
      { status: 400 },
    );
  }

  const mode = commerceMode();
  if (mode === "unconfigured") {
    return Response.json(
      commerceUnavailable("tracking_unavailable", "Tracking is not available. No order service is connected."),
      { status: 503 },
    );
  }
  if (mode === "real") {
    return Response.json(
      commerceUnavailable("provider_not_implemented", "Tracking credentials are present, but no order lookup is implemented."),
      { status: 501 },
    );
  }

  if (!allowAuthAttempt(`${clientAddress(request)}:track`, 30)) {
    return Response.json({ ok: false, message: "Too many lookups. Wait a few minutes and try again." }, { status: 429 });
  }
  const order = findDemoOrderById(orderNumber);
  // Same response for "no such order" and "wrong contact" so order numbers cannot be probed.
  if (!order || !contactMatchesOrder(order, contact)) {
    return Response.json({ ok: false, found: false, message: "No order matches that order number and contact." }, { status: 404 });
  }
  const current = body.advance === true ? advanceDemoOrderStatus(order.id)! : order;
  return Response.json({ ok: true, found: true, mode: "demo", order: current });
}
