import type { Metadata } from "next";
import { WishlistPanel } from "@/components/account/WishlistPanel";

export const metadata: Metadata = { title: "Wishlist" };

export default function AccountWishlistPage() {
  return <WishlistPanel />;
}
