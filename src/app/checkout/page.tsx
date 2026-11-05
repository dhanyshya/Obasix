import type { Metadata } from "next";
import { CheckoutExperience } from "@/components/checkout/CheckoutExperience";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return <CheckoutExperience />;
}
