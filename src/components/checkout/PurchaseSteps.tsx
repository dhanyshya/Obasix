"use client";

import Box from "@mui/material/Box";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

const steps = [
  { href: "/checkout", label: "Checkout" },
  { href: "/checkout/payment", label: "Payment" },
  { href: "/checkout/confirmation", label: "Confirmation" },
  { href: "/orders/track", label: "Track Order" },
];

/** Purchase route as a wayfinding strip: done steps carry the tick, the current one the orange plate. */
export function PurchaseSteps({ current, tone = "light" }: { current: number; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Box component="nav" aria-label="Purchase steps" sx={{ mt: 3, maxWidth: 760 }}>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {steps.map((step, index) => {
          const done = index < current;
          const on = index === current;
          const lineColor = done || on ? brand.signal : dark ? "rgba(255,255,255,0.22)" : brand.line;
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
                  pt: 1.25,
                  pr: 1,
                  borderTop: `4px solid ${lineColor}`,
                  color: on ? (dark ? brand.white : brand.charcoal) : dark ? "rgba(255,255,255,0.72)" : brand.body,
                  transition: "color 180ms",
                  "&:hover": { color: dark ? brand.white : brand.charcoal },
                  "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: 2 },
                }}
              >
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, ...signType.code, fontSize: 12, color: done ? (dark ? "#FFC59E" : brand.signalInk) : "inherit" }}>
                  {done ? (
                    <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 14, height: 14 }}>
                      <path d="M3.5 12.5l5.5 5.5L21 4.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" fill="none" />
                    </Box>
                  ) : null}
                  {String(index + 1).padStart(2, "0")}
                  {done ? <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}> completed</Box> : null}
                </Box>
                <Box component="span" sx={{ ...signType.plate, fontSize: { xs: 13.5, sm: 16 }, fontWeight: on ? 800 : 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: { xs: "normal", sm: "nowrap" } }}>
                  {step.label}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
