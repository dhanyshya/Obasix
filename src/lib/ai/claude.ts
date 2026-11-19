import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Claude for design help (frame-colour suggestions, sign layouts).
 * Switches on when ANTHROPIC_API_KEY is set; every route that uses it says
 * plainly when it isn't, and the rest of the site works without it.
 */
export const designModel = "claude-opus-5-5";

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
export function claude() {
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return client;
}

/** Server-side fallback: if a request is declined, the API retries it on a fallback model. */
export const fallbackOptions = () => ({
  betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[],
  fallbacks: "default" as const,
});

/** Maps SDK errors to a short message for the customer; details go to the server log. */
export function claudeErrorMessage(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) return "Lots of people are asking right now. Try again in a minute.";
  if (error instanceof Anthropic.AuthenticationError) {
    console.error("Claude authentication failed: check ANTHROPIC_API_KEY.");
    return "Design suggestions are unavailable right now.";
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Claude API error ${error.status}: ${error.message}`);
    return "We couldn't get suggestions this time. Try again.";
  }
  console.error("Claude request failed:", error instanceof Error ? error.message : error);
  return "We couldn't get suggestions this time. Try again.";
}
