import { commerceRequirements, type CommerceResponse } from "@/lib/commerce/types";

export function commerceConfigured() {
  return commerceRequirements.every((name) => Boolean(process.env[name]));
}

export function commerceUnavailable(code: CommerceResponse["code"], message: string): CommerceResponse {
  return {
    ok: false,
    code,
    charged: false,
    orderCreated: false,
    message,
    // Only worth telling the browser when payment isn't set up at all.
    ...(code === "provider_not_configured" ? { required: [...commerceRequirements] } : {}),
  };
}
