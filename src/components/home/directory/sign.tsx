import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { brandTokens as brand } from "@/theme/brandTokens";

/** Display lettering in the sign system: heavy, slightly condensed grotesk. */
export const signFont = "var(--font-display), Helvetica Neue, sans-serif";

export const signType = {
  mega: {
    fontFamily: signFont,
    fontWeight: 800,
    fontVariationSettings: '"wdth" 88',
    letterSpacing: "-0.04em",
    lineHeight: 0.9,
    fontSize: { xs: "3rem", sm: "4.25rem", md: "5.25rem", lg: "6rem" },
  },
  title: {
    fontFamily: signFont,
    fontWeight: 800,
    fontVariationSettings: '"wdth" 90',
    letterSpacing: "-0.035em",
    lineHeight: 0.98,
    fontSize: { xs: "2.25rem", sm: "2.9rem", md: "3.6rem" },
  },
  plate: {
    fontFamily: signFont,
    fontWeight: 700,
    fontVariationSettings: '"wdth" 94',
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
  },
  code: {
    fontFamily: signFont,
    fontWeight: 600,
    fontVariationSettings: '"wdth" 100',
    letterSpacing: "0.04em",
    fontVariantNumeric: "tabular-nums",
  },
} as const;

/**
 * The OBASIX arrow: drawn from the logo's check-mark stroke, angled into a wayfinding arrow.
 * One stroke weight across the system.
 */
export function SignArrow({ size = 24, color = "currentColor", sx }: { size?: number; color?: string; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      sx={{ width: size, height: size, flexShrink: 0, display: "block", ...sx }}
    >
      <path d="M3 12.5h15.5" stroke={color} strokeWidth="2.6" strokeLinecap="square" fill="none" />
      <path d="M12.5 5.5l7 7-7 7" stroke={color} strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </Box>
  );
}

/** The logo tick, used to mark a confirmed or current state. */
export function SignTick({ size = 20, color = brand.action }: { size?: number; color?: string }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden focusable="false" sx={{ width: size, height: size, flexShrink: 0, display: "block" }}>
      <path d="M3.5 12.5l5.5 5.5L21 4.5" stroke={color} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </Box>
  );
}

/** Three-colour stripe spine taken from the logo: green field, orange "O", red lettering. */
export function StripeSpine({ height = 6 }: { height?: number }) {
  return (
    <Box aria-hidden sx={{ display: "grid", gridTemplateColumns: "6fr 1fr 2fr", height }}>
      <Box sx={{ bgcolor: brand.forest }} />
      <Box sx={{ bgcolor: brand.signal }} />
      <Box sx={{ bgcolor: brand.action }} />
    </Box>
  );
}

/** Numbered roundel, as on lobby directory boards. */
export function Roundel({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: { xs: 34, md: 40 },
        height: { xs: 34, md: 40 },
        borderRadius: "50%",
        display: "inline-grid",
        placeItems: "center",
        flexShrink: 0,
        border: `2px solid ${active ? brand.signal : "rgba(255,255,255,0.4)"}`,
        bgcolor: active ? brand.signal : "transparent",
        color: active ? brand.charcoal : brand.white,
        ...signType.code,
        fontSize: { xs: 13, md: 14 },
        letterSpacing: 0,
        transition: "background-color 220ms cubic-bezier(0.16,1,0.3,1), border-color 220ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </Box>
  );
}

export const pagePad = { px: { xs: 2, sm: 4, md: 6, lg: 8 } } as const;
export const pageMax = { maxWidth: 1440, mx: "auto" } as const;
