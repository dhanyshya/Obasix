import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { AssociatesAdmin } from "@/components/admin/AssociatesAdmin";
import { listAdminCommissions, listAssociateSummaries } from "@/lib/associates/store";
import { commerceMode } from "@/lib/commerce/mode";

export const metadata: Metadata = { title: "Associates · Staff" };

export default async function AdminAssociatesPage() {
  await requireAdmin();
  return (
    <AssociatesAdmin
      associates={await listAssociateSummaries()}
      commissions={await listAdminCommissions()}
      demoOrders={commerceMode() === "demo"}
    />
  );
}
