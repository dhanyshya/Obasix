import type { Metadata } from "next";
import { PaymentExperience } from "@/components/checkout/PaymentExperience";

export const metadata: Metadata = {
  title: "Payment",
};

export default function PaymentPage() {
  return <PaymentExperience />;
}
