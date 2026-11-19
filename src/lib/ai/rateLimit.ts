import "server-only";

import { allowAttempt } from "@/lib/rateLimit";

/** AI requests: 20 a minute per visitor, shared across server instances. */
export function allowAiAttempt(key: string) {
  return allowAttempt(`ai:${key}`, 20, 60_000);
}
