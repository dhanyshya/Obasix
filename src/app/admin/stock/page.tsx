import type { Metadata } from "next";
import { StockAdmin } from "@/components/admin/StockAdmin";
import { getAllProducts } from "@/data/catalogue";
import { requireAdmin } from "@/lib/admin/auth";
import { listStock } from "@/lib/stock/store";

export const metadata: Metadata = { title: "Stock · Staff" };

export default async function AdminStockPage() {
  await requireAdmin(); // Before loading data: see requireAdmin.
  const levels = new Map(listStock().map((level) => [level.productId, level]));
  const rows = getAllProducts().map((p) => ({
    id: p.id,
    name: p.shortName,
    sku: p.sku,
    onHand: levels.get(p.id)?.onHand ?? null,
    updatedBy: levels.get(p.id)?.updatedBy ?? null,
  }));
  return <StockAdmin rows={rows} />;
}
