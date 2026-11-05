import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/AccountOverview";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return <AccountOverview />;
}
