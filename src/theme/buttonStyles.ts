import { brandTokens as brand } from "./brandTokens";

export const buttonTokens = {
  radius: 0,
  primaryBg: brand.action,
  primaryHoverBg: brand.actionDark,
  primaryActiveBg: "#86181C",
  primaryText: brand.white,
  secondaryBg: brand.white,
  secondaryText: brand.charcoal,
  secondaryBorder: brand.charcoal,
  secondaryHoverBg: brand.charcoal,
  secondaryHoverText: brand.white,
  secondaryActiveBg: "#000000",
  disabledBg: "#E8E6E0",
  disabledBorder: "#D8D6D0",
  disabledText: "#6F756D",
  focusOffset: 3,
  transition:
    "background-color 250ms ease, color 250ms ease, border-color 250ms ease, box-shadow 250ms ease",
} as const;

export const buttonBaseSx = {
  minHeight: 48,
  minWidth: 0,
  maxWidth: "100%",
  px: 3,
  py: 1.5,
  borderRadius: `${buttonTokens.radius}px`,
  fontFamily: "var(--font-display), var(--font-body), sans-serif",
  fontWeight: 700,
  fontSize: "0.95rem",
  fontVariationSettings: '"wdth" 100',
  lineHeight: 1.3,
  letterSpacing: "-0.005em",
  textTransform: "none" as const,
  textAlign: "center" as const,
  whiteSpace: "normal" as const,
  boxSizing: "border-box" as const,
  transition: buttonTokens.transition,
  "&:focus-visible": {
    outline: `3px solid ${brand.signal}`,
    outlineOffset: buttonTokens.focusOffset,
  },
} as const;

export const buttonPrimarySx = {
  bgcolor: buttonTokens.primaryBg,
  color: buttonTokens.primaryText,
  border: `1px solid ${buttonTokens.primaryBg}`,
  boxShadow: "none",
  "&:hover": {
    bgcolor: buttonTokens.primaryHoverBg,
    borderColor: buttonTokens.primaryHoverBg,
    color: buttonTokens.primaryText,
  },
  "&:active": {
    bgcolor: buttonTokens.primaryActiveBg,
    borderColor: buttonTokens.primaryActiveBg,
    color: buttonTokens.primaryText,
  },
  "&.Mui-disabled": {
    bgcolor: buttonTokens.disabledBg,
    borderColor: buttonTokens.disabledBorder,
    color: buttonTokens.disabledText,
  },
} as const;

export const buttonSecondarySx = {
  bgcolor: buttonTokens.secondaryBg,
  color: buttonTokens.secondaryText,
  border: `1px solid ${buttonTokens.secondaryBorder}`,
  "&:hover": {
    bgcolor: buttonTokens.secondaryHoverBg,
    borderColor: buttonTokens.secondaryHoverBg,
    color: buttonTokens.secondaryHoverText,
  },
  "&:active": {
    bgcolor: buttonTokens.secondaryActiveBg,
    borderColor: buttonTokens.secondaryActiveBg,
    color: buttonTokens.secondaryHoverText,
  },
  "&.Mui-disabled": {
    bgcolor: buttonTokens.secondaryBg,
    borderColor: buttonTokens.disabledBorder,
    color: buttonTokens.disabledText,
  },
} as const;

export const buttonTextSx = {
  minHeight: 44,
  px: 1,
  color: buttonTokens.secondaryText,
  "&:hover": {
    bgcolor: "rgba(20, 25, 23, 0.06)",
    color: buttonTokens.primaryHoverBg,
  },
  "&.Mui-disabled": {
    color: buttonTokens.disabledText,
  },
} as const;

export const buttonSx = {
  primary: {
    ...buttonBaseSx,
    ...buttonPrimarySx,
  },
  secondary: {
    ...buttonBaseSx,
    ...buttonSecondarySx,
  },
  text: {
    ...buttonBaseSx,
    ...buttonTextSx,
    border: 0,
    py: 0.5,
    textTransform: "none" as const,
    fontSize: "0.875rem",
    letterSpacing: "0.01em",
  },
} as const;

export const buttonThemeStyleOverrides = {
  root: buttonBaseSx,
  contained: {
    ...buttonPrimarySx,
    "&.MuiButton-colorPrimary": {
      bgcolor: buttonTokens.primaryBg,
      color: buttonTokens.primaryText,
      borderColor: buttonTokens.primaryBg,
      "&:hover": {
        bgcolor: buttonTokens.primaryHoverBg,
        borderColor: buttonTokens.primaryHoverBg,
        color: buttonTokens.primaryText,
      },
    },
  },
  outlined: {
    ...buttonSecondarySx,
    "&.MuiButton-colorInherit, &.MuiButton-colorPrimary": {
      bgcolor: buttonTokens.secondaryBg,
      color: buttonTokens.secondaryText,
      borderColor: buttonTokens.secondaryBorder,
      "&:hover": {
        bgcolor: buttonTokens.secondaryHoverBg,
        borderColor: buttonTokens.secondaryHoverBg,
        color: buttonTokens.secondaryHoverText,
      },
    },
  },
  text: buttonTextSx,
  sizeSmall: {
    minHeight: 40,
    px: 2,
    py: 1,
    fontSize: "0.85rem",
    lineHeight: 1.4,
  },
  sizeLarge: {
    minHeight: 56,
    px: 4,
    py: 1.75,
    fontSize: "1.05rem",
  },
} as const;
