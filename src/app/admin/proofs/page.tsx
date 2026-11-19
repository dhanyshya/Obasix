import type { Metadata } from "next";
import { ProofsAdmin } from "@/components/admin/ProofsAdmin";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllProofs } from "@/lib/proofs/store";

export const metadata: Metadata = { title: "Proofs · Staff" };

export default async function AdminProofsPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  await requireAdmin(); // Before loading data: see requireAdmin.
  const ref = String((await searchParams).ref ?? "").slice(0, 40);
  return <ProofsAdmin proofs={listAllProofs()} initialReference={ref} />;
}
