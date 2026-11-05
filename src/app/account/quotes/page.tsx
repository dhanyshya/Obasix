import type { Metadata } from "next";
import { QuotesPanel } from "@/components/account/QuotesPanel";

export const metadata: Metadata = { title: "Quotes" };

export default function AccountQuotesPage() {
  return <QuotesPanel />;
}
