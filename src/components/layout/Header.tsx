"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAIChat } from "@/context/AIChatContext";
import { cn } from "@/lib/format";

const nav = [
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/customize", label: "Customize" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function Header() {
  const { itemCount } = useCart();
  const { openChat } = useAIChat();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
          : "bg-white/80 backdrop-blur-sm",
      )}
    >
      <div className="container-obx flex h-[var(--header-h)] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--obx-line)] text-[var(--obx-ink)] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/" className="relative block h-10 w-[148px] shrink-0 sm:h-11 sm:w-[168px]">
            <Image
              src="/obasix-logo.png"
              alt="OBASIX"
              fill
              priority
              className="object-contain object-left"
              sizes="168px"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--obx-charcoal)] transition-colors hover:text-[var(--obx-green)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--obx-charcoal)] transition-colors hover:bg-[var(--obx-green-soft)] hover:text-[var(--obx-green)]"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={openChat}
            className="hidden items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--obx-green)] transition-colors hover:bg-[var(--obx-green-soft)] md:inline-flex"
          >
            <Sparkles size={16} className="text-[var(--obx-orange)]" />
            AI Assistant
          </button>

          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--obx-charcoal)] transition-colors hover:bg-[var(--obx-green-soft)] hover:text-[var(--obx-green)]"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--obx-red)] px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <Link href="/quote" className="btn btn-primary hidden sm:inline-flex !px-4 !py-2.5 text-sm">
            Get a Quote
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[var(--obx-line)] bg-white">
          <form action="/products" className="container-obx py-3">
            <input
              name="q"
              autoFocus
              placeholder="Search boards, finishes, applications..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-[var(--obx-mist)] px-4 py-3 outline-none transition focus:border-[var(--obx-green)] focus:bg-white"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-[var(--obx-line)] bg-white lg:hidden">
          <nav className="container-obx flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-[var(--obx-charcoal)] hover:bg-[var(--obx-green-soft)] hover:text-[var(--obx-green)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/quote"
              onClick={() => setMobileOpen(false)}
              className="btn btn-primary mt-2"
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
