import { commerceConfigured } from "@/lib/commerce/server";

/**
 * Local demo: set OBASIX_COMMERCE_MODE=demo.
 * `next dev` uses demo when that flag is unset and no order/payment credentials exist.
 * Production stays unconfigured unless the flag is explicitly demo.
 * OBASIX_COMMERCE_MODE=live keeps the real-payment gate even in development.
 * Credentials always select real mode, so demo cannot bypass a configured provider.
 */
export function GET() {
  if (commerceConfigured()) {
    return Response.json({ mode: "real" as const });
  }
  const flag = process.env.OBASIX_COMMERCE_MODE;
  if (flag === "live") {
    return Response.json({ mode: "unconfigured" as const });
  }
  if (flag === "demo" || process.env.NODE_ENV === "development") {
    return Response.json({ mode: "demo" as const });
  }
  return Response.json({ mode: "unconfigured" as const });
}
