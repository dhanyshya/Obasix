import type { Metadata } from "next";
import { DistributorsAdmin } from "@/components/admin/DistributorsAdmin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllTradeOrders, listDistributorSummaries } from "@/lib/distributors/store";

export const metadata: Metadata = { title: "Distributors · Staff" };

export default async function AdminDistributorsPage() {
  await requireAdmin(); // Before loading data: see requireAdmin.
  return <DistributorsAdmin distributors={listDistributorSummaries()} orders={listAllTradeOrders()} />;
}
