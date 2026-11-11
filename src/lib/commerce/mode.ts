import "server-only";

import { commerceConfigured } from "@/lib/commerce/server";

export type CommerceMode = "real" | "demo" | "unconfigured";

/**
 * - Credentials present → "real" (demo can never bypass a configured provider).
 * - OBASIX_COMMERCE_MODE=live → "unconfigured" until real credentials exist.
 * - OBASIX_COMMERCE_MODE=demo, or `next dev` with no flag → "demo".
 * - Otherwise (production with nothing configured) → "unconfigured".
 */
export function commerceMode(): CommerceMode {
  if (commerceConfigured()) return "real";
  const flag = process.env.OBASIX_COMMERCE_MODE;
  if (flag === "live") return "unconfigured";
  if (flag === "demo" || process.env.NODE_ENV === "development") return "demo";
  return "unconfigured";
}
