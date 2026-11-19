import type { Metadata } from "next";
import { ProofsAdmin } from "@/components/admin/ProofsAdmin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllProofs } from "@/lib/proofs/store";

export const metadata: Metadata = { title: "Proofs · Staff" };

export default async function AdminProofsPage() {
  await requireAdmin(); // Before loading data: see requireAdmin.
  return <ProofsAdmin proofs={listAllProofs()} />;
}
