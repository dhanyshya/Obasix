"use client";

import Box from "@mui/material/Box";
import Link from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";

const steps = [
  { href: "/checkout", label: "Checkout" },
  { href: "/checkout/payment", label: "Payment" },
  { href: "/checkout/confirmation", label: "Confirmation" },
  { href: "/orders/track", label: "Track Order" },
];

/** Purchase progress: a quiet segmented rail. Done steps in brand green, current in ink. */
export function PurchaseSteps({ current }: { current: number; tone?: "light" | "dark" }) {
  return (
    <Box component="nav" aria-label="Purchase steps" sx={{ mt: 3, maxWidth: 760 }}>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1 }}>
        {steps.map((step, index) => {
          const done = index < current;
          const on = index === current;
          return (
            <Box component="li" key={step.label} sx={{ minWidth: 0 }}>
              <Box
                component={Link}
                href={step.href}
                aria-current={on ? "step" : undefined}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  color: on ? brand.charcoal : brand.muted,
                  transition: "color 160ms",
                  "&:hover": { color: brand.charcoal },
                  "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 4, borderRadius: 1 },
                }}
              >
                <Box aria-hidden sx={{ height: 3, borderRadius: 99, bgcolor: on ? brand.charcoal : done ? brand.forest : brand.line }} />
                <Box component="span" sx={{ fontSize: { xs: 12.5, sm: 14 }, fontWeight: on ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { xs: "normal", sm: "nowrap" } }}>
                  {done ? "✓ " : ""}
                  {step.label}
                  {done ? <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", whiteSpace: "nowrap", clip: "rect(0 0 0 0)" }}> completed</Box> : null}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
