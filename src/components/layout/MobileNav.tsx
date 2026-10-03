"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MessageCircle, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useAIChat } from "@/context/AIChatContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/format";

export function MobileNav() {
  const pathname = usePathname();
  const { openChat } = useAIChat();
  const { itemCount } = useCart();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Products", icon: LayoutGrid },
    { href: "/customize", label: "Customize", icon: SlidersHorizontal },
    { label: "AI", icon: MessageCircle, action: openChat },
    { href: "/cart", label: "Cart", icon: ShoppingBag, badge: itemCount },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--obx-line)] bg-white/95 backdrop-blur-md md:hidden">
      <ul className="mx-auto grid h-[var(--mobile-nav-h)] max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.href ? pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) : false;
          const Icon = item.icon;
          const className = cn(
            "relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
            active ? "text-[var(--obx-green)]" : "text-[var(--obx-muted)]",
          );

          if (item.action) {
            return (
              <li key={item.label}>
                <button type="button" onClick={item.action} className={className}>
                  <Icon size={20} />
                  {item.label}
                </button>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <Link href={item.href!} className={className}>
                <span className="relative">
                  <Icon size={20} />
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--obx-red)] px-1 text-[9px] text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
