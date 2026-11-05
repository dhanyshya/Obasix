import type { Metadata } from "next";
import { OrdersPanel } from "@/components/account/OrdersPanel";

export const metadata: Metadata = { title: "Orders" };

export default function AccountOrdersPage() {
  return <OrdersPanel />;
}
