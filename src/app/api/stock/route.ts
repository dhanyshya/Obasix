import { publicStock } from "@/lib/stock/store";

export const runtime = "nodejs";

/** Availability for up to 60 products: /api/stock?ids=a,b,c. Untracked products are left out. */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return Response.json({ stock: await publicStock(ids) }, { headers: { "cache-control": "no-store" } });
}
