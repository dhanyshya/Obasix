import { claudeConfigured } from "@/lib/ai/claude";

export const runtime = "nodejs";

/** Lets the page hide AI design buttons until Claude is configured. */
export function GET() {
  return Response.json({ design: claudeConfigured() }, { headers: { "cache-control": "no-store" } });
}
