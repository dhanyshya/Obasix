"use client";

import { usePathname } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import NextLink from "@/components/Link";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/quotes", label: "Quotes" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <Stack component="nav" aria-label="Account" direction={{ xs: "row", md: "column" }} spacing={1} sx={{ overflowX: "auto", pb: { xs: 1, md: 0 } }}>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Button
            key={link.href}
            component={NextLink}
            href={link.href}
            aria-current={active ? "page" : undefined}
            variant={active ? "contained" : "outlined"}
            color={active ? "primary" : "inherit"}
            sx={{ whiteSpace: "nowrap", justifyContent: { md: "flex-start" }, flexShrink: 0, py: 1 }}
          >
            {link.label}
          </Button>
        );
      })}
    </Stack>
  );
}
