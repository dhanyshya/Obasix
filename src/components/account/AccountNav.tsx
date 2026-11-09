"use client";

import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import NextLink from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";
import { signType } from "@/components/home/directory/sign";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/quotes", label: "Quotes" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
];

/** Account sections as a directory strip: the current section carries the orange bar. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <Box
      component="nav"
      aria-label="Account"
      sx={{
        display: "flex",
        gap: { xs: 0.5, md: 1 },
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        mx: { xs: -2, sm: 0 },
        px: { xs: 2, sm: 0 },
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Box
            key={link.href}
            component={NextLink}
            href={link.href}
            aria-current={active ? "page" : undefined}
            sx={{
              ...signType.plate,
              flexShrink: 0,
              fontSize: { xs: 15, md: 16.5 },
              px: { xs: 1.5, md: 2 },
              py: 1.75,
              whiteSpace: "nowrap",
              color: active ? brand.white : "rgba(255,255,255,0.72)",
              boxShadow: active ? `inset 0 -4px 0 ${brand.signal}` : "inset 0 -4px 0 transparent",
              transition: "color 180ms, box-shadow 220ms cubic-bezier(0.16,1,0.3,1)",
              "&:hover": { color: brand.white, boxShadow: active ? `inset 0 -4px 0 ${brand.signal}` : "inset 0 -4px 0 rgba(255,255,255,0.3)" },
              "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: -3 },
            }}
          >
            {link.label}
          </Box>
        );
      })}
    </Box>
  );
}
