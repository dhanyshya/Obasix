import { commerceMode } from "@/lib/commerce/mode";

export const runtime = "nodejs";

export function GET() {
  return Response.json({ mode: commerceMode() });
}
