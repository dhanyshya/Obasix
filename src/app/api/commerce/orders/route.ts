import { commerceConfigured, commerceUnavailable } from "@/lib/commerce/server";

export async function POST(request: Request) {
  const key = request.headers.get("idempotency-key");
  if (!key) {
    return Response.json(
      commerceUnavailable("invalid_request", "An order needs an idempotency key so a retry cannot create a second order."),
      { status: 400 },
    );
  }

  if (!commerceConfigured()) {
    return Response.json(
      commerceUnavailable(
        "provider_not_configured",
        "An order was not created. The server has no order API to validate the cart and customer details.",
      ),
      { status: 503 },
    );
  }

  return Response.json(
    commerceUnavailable(
      "provider_not_implemented",
      "An order was not created. Credentials are present, but no order API call is implemented.",
    ),
    { status: 501 },
  );
}
