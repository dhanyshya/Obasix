import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminIndex() {
  await requireAdmin();
  // Orders is the first staff screen in the navigation and the one staff check most.
  redirect("/admin/orders");
}
