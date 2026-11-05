import type { Metadata } from "next";
import { ProfilePanel } from "@/components/account/ProfilePanel";

export const metadata: Metadata = { title: "Profile" };

export default function AccountProfilePage() {
  return <ProfilePanel />;
}
