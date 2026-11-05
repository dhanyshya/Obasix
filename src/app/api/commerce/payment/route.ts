import { commerceConfigured, commerceUnavailable } from "@/lib/commerce/server";

export async function POST(request: Request) {
  const key = request.headers.get("idempotency-key");
  if (!key) {
    return Response.json(
      commerceUnavailable("invalid_request", "A payment attempt needs an idempotency key from checkout."),
      { status: 400 },
    );
  }

  if (!commerceConfigured()) {
    return Response.json(
      commerceUnavailable(
        "provider_not_configured",
        "Payment cannot start. No payment provider or order API is configured on the server.",
      ),
      { status: 503 },
    );
  }

  return Response.json(
    commerceUnavailable(
      "provider_not_implemented",
      "Server credentials are present, but this storefront does not call a payment provider yet.",
    ),
    { status: 501 },
  );
}
