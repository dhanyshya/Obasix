import { commerceConfigured, commerceUnavailable } from "@/lib/commerce/server";

export async function POST(request: Request) {
  let body: { orderNumber?: string; contact?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const orderNumber = body.orderNumber?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";
  if (orderNumber.length < 4 || contact.length < 5) {
    return Response.json(
      commerceUnavailable(
        "invalid_request",
        "Enter an order number and the email or phone used at checkout.",
      ),
      { status: 400 },
    );
  }

  if (!commerceConfigured()) {
    return Response.json(
      commerceUnavailable(
        "tracking_unavailable",
        "Tracking is not available. An order number alone is not looked up, and no order service is connected.",
      ),
      { status: 503 },
    );
  }

  return Response.json(
    commerceUnavailable(
      "provider_not_implemented",
      "Tracking credentials are present, but no order lookup is implemented.",
    ),
    { status: 501 },
  );
}
