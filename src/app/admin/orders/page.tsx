import type { Metadata } from "next";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { requireAdmin } from "@/lib/admin/auth";
import { commerceMode } from "@/lib/commerce/mode";
import { listAllOrders } from "@/lib/commerce/order-store";

export const metadata: Metadata = { title: "Orders · Staff" };

export default async function AdminOrdersPage() {
  await requireAdmin(); // Before loading data: see requireAdmin.
  return <OrdersAdmin orders={await listAllOrders()} live={commerceMode() === "real"} />;
}
