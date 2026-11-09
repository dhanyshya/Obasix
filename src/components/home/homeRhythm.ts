import { brandTokens as brand } from "@/theme/brandTokens";
import { buttonSx } from "@/theme/buttonStyles";

/** Shared homepage rhythm — warm ivory, white and forest green. */
export const home = {
  ivory: brand.ivory,
  beige: brand.beige,
  oak: brand.oak,
  white: brand.white,
  charcoal: brand.charcoal,
  forest: brand.forest,
  forestDark: brand.forestDark,
  forestDeep: brand.forestDeep,
  green: brand.forest,
  greenDark: brand.forestDark,
  greenDeep: brand.forestDeep,
  pale: brand.paleGreen,
  muted: brand.muted,
  body: brand.body,
  surface: brand.ivory,
  line: brand.line,

  sectionPy: { xs: 7, sm: 9, md: 12 } as const,
  sectionPyTight: { xs: 6, md: 9 } as const,

  shell: {
    width: "100%",
    maxWidth: 1440,
    mx: "auto",
    px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
  } as const,

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 1.1,
    fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
    fontSize: { xs: 10, md: 10.5 },
    fontWeight: 700,
    letterSpacing: "0.24em",
    textTransform: "uppercase" as const,
    color: "inherit",
  },

  eyebrowRule: {
    display: "inline-block",
    width: { xs: 22, md: 34 },
    height: "1px",
    bgcolor: "currentColor",
    opacity: 0.6,
    flexShrink: 0,
  } as const,

  display: {
    fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
    fontWeight: 500,
    letterSpacing: "-0.026em",
    lineHeight: 0.98,
    color: brand.charcoal,
  } as const,

  h2: {
    fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
    fontWeight: 500,
    fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4.15rem", lg: "4.75rem" },
    letterSpacing: "-0.03em",
    lineHeight: 0.98,
    color: brand.charcoal,
  } as const,

  h3: {
    fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
    fontWeight: 500,
    fontSize: { xs: "1.75rem", md: "2.35rem" },
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
    color: brand.charcoal,
  } as const,

  lede: {
    maxWidth: 460,
    color: brand.body,
    fontSize: { xs: 15.5, md: 16.5 },
    lineHeight: 1.8,
  } as const,

  small: {
    fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    color: brand.muted,
  } as const,

  heading: {
    fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
    fontSize: { xs: "1.6rem", md: "2.05rem" },
    letterSpacing: "-0.028em",
    lineHeight: 1.15,
    fontWeight: 500,
    maxWidth: "20ch",
    color: brand.charcoal,
  } as const,

  pageTitle: {
    fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
    fontSize: { xs: "1.85rem", md: "2.35rem" },
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    fontWeight: 500,
    color: brand.charcoal,
  } as const,

  titleAccent: {
    width: 40,
    height: 1,
    bgcolor: brand.oak,
    mt: 2,
  } as const,

  titleAccentGreen: {
    width: 40,
    height: 1,
    bgcolor: brand.forest,
    mt: 2,
  } as const,

  softLabel: {
    display: "inline-flex",
    alignItems: "center",
    px: 1.1,
    py: 0.45,
    borderRadius: 0,
    bgcolor: "rgba(23, 77, 56, 0.08)",
    color: brand.forest,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
  },

  linkBtn: {
    px: 0,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: brand.forest,
    minHeight: 44,
    transition: "color 0.2s ease",
    "&:hover": { bgcolor: "transparent", color: brand.forestDark },
    "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
  },

  primaryBtn: buttonSx.primary,

  secondaryBtn: buttonSx.secondary,

  ivoryBtn: buttonSx.secondary,

  ghostBtn: buttonSx.secondary,
} as const;
