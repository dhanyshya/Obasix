import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { brandTokens as brand } from "@/theme/brandTokens";

/** Display lettering: Inter Tight, medium weight, tight tracking — calm and modern. */
export const signFont = "var(--font-display), Helvetica Neue, sans-serif";

export const signType = {
  mega: {
    fontFamily: signFont,
    fontWeight: 600,
    letterSpacing: "-0.045em",
    lineHeight: 1.0,
    fontSize: { xs: "2.75rem", sm: "4rem", md: "5rem", lg: "5.75rem" },
  },
  title: {
    fontFamily: signFont,
    fontWeight: 600,
    letterSpacing: "-0.035em",
    lineHeight: 1.05,
    fontSize: { xs: "2rem", sm: "2.6rem", md: "3.25rem" },
  },
  plate: {
    fontFamily: signFont,
    fontWeight: 600,
    letterSpacing: "-0.015em",
    lineHeight: 1.2,
  },
  code: {
    fontFamily: "var(--font-body), sans-serif",
    fontWeight: 500,
    letterSpacing: "0.01em",
    fontVariantNumeric: "tabular-nums",
  },
} as const;

/** Fine arrow used for links and navigation. */
export function SignArrow({ size = 24, color = "currentColor", sx }: { size?: number; color?: string; sx?: SxProps<Theme> }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden focusable="false" sx={{ width: size, height: size, flexShrink: 0, display: "block", ...sx }}>
      <path d="M4 12h15M13 6l6 6-6 6" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Box>
  );
}

/** Tick used to mark a confirmed or current state. */
export function SignTick({ size = 20, color = brand.forest }: { size?: number; color?: string }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden focusable="false" sx={{ width: size, height: size, flexShrink: 0, display: "block" }}>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Box>
  );
}

/** Retired heavy stripe: now a hairline divider so existing placements stay quiet. */
export function StripeSpine({ height = 1 }: { height?: number }) {
  void height;
  return <Box aria-hidden sx={{ height: "1px", bgcolor: "rgba(127,127,120,0.18)" }} />;
}

/** Small numbered circle. */
export function Roundel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: { xs: 30, md: 34 },
        height: { xs: 30, md: 34 },
        borderRadius: "50%",
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        border: "1px solid",
        borderColor: active ? "currentColor" : "rgba(127,127,120,0.4)",
        bgcolor: active ? "currentColor" : "transparent",
        "& > span": { color: active ? "var(--roundel-on, #fff)" : "inherit" },
        fontFamily: "var(--font-body), sans-serif",
        fontWeight: 500,
        fontSize: 12.5,
        fontVariantNumeric: "tabular-nums",
        transition: "background-color 220ms ease, border-color 220ms ease",
      }}
    >
      <span>{children}</span>
    </Box>
  );
}

export const pagePad = { px: { xs: 2.5, sm: 4, md: 6, lg: 8 } } as const;
export const pageMax = { maxWidth: 1440, mx: "auto" } as const;
