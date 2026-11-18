import type { Metadata } from "next";
import { PartnersAdmin } from "@/components/admin/PartnersAdmin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllProjects, listPartnerSummaries } from "@/lib/partners/store";

export const metadata: Metadata = { title: "Partners · Staff" };

export default async function AdminPartnersPage() {
  await requireAdmin(); // Before loading data: see requireAdmin.
  return <PartnersAdmin partners={listPartnerSummaries()} projects={listAllProjects()} />;
}
