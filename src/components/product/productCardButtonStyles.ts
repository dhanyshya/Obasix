const focusSx = {
  "&.Mui-focusVisible": {
    outline: "2px solid #164E3B",
    outlineOffset: 2,
  },
  "&:focus-visible": {
    outline: "2px solid #164E3B",
    outlineOffset: 2,
  },
} as const;

const baseSx = {
  width: "100%",
  minWidth: 0,
  borderRadius: "999px",
  fontWeight: "600 !important",
  lineHeight: "1.15 !important",
  whiteSpace: "nowrap",
  textTransform: "none" as const,
  opacity: 1,
  visibility: "visible" as const,
  transition:
    "background-color 200ms ease, color 200ms ease, border-color 200ms ease, outline-color 200ms ease",
  ...focusSx,
} as const;

const outlineStateSx = {
  bgcolor: "transparent !important",
  color: "#164E3B !important",
  border: "1px solid",
  borderColor: "#164E3B !important",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#164E3B !important",
    color: "#FFFFFF !important",
    borderColor: "#164E3B !important",
  },
  "&:active": {
    bgcolor: "#0F3A29 !important",
    color: "#FFFFFF !important",
    borderColor: "#0F3A29 !important",
  },
  "&.Mui-disabled": {
    bgcolor: "#E7EFEA !important",
    color: "#2F4F3F !important",
    borderColor: "#7F9F8E !important",
    opacity: 1,
    cursor: "not-allowed",
  },
} as const;

const containedStateSx = {
  bgcolor: "#164E3B !important",
  color: "#FFFFFF !important",
  border: "1px solid",
  borderColor: "#164E3B !important",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#103B2B !important",
    color: "#FFFFFF !important",
    borderColor: "#103B2B !important",
  },
  "&:active": {
    bgcolor: "#0C2F22 !important",
    color: "#FFFFFF !important",
    borderColor: "#0C2F22 !important",
  },
  "&.Mui-disabled": {
    bgcolor: "#DCE7E1 !important",
    color: "#2F4F3F !important",
    borderColor: "#8FA99C !important",
    opacity: 1,
    cursor: "not-allowed",
  },
} as const;

const signFont = "var(--font-display), Helvetica Neue, sans-serif";

/** Card actions in the sign system: one red primary action, quiet text links for the tools. */
export const productCardActionContainedSx = {
  width: "100%",
  minHeight: 44,
  borderRadius: "999px",
  fontFamily: "var(--font-body), sans-serif",
  fontWeight: "600 !important",
  fontSize: "0.95rem !important",
  letterSpacing: "-0.005em !important",
  textTransform: "none" as const,
  bgcolor: "#1B1D1C !important",
  color: "#FFFFFF !important",
  border: "0 !important",
  boxShadow: "none",
  transition: "background-color 200ms cubic-bezier(0.16,1,0.3,1)",
  "&:hover": { bgcolor: "#000000 !important" },
  "&.Mui-disabled": { bgcolor: "#164E3B !important", color: "#FFFFFF !important", opacity: 1 },
  "&:focus-visible, &.Mui-focusVisible": { outline: "2px solid #164E3B", outlineOffset: 2 },
} as const;

export const productCardActionOutlineSx = {
  minHeight: 40,
  minWidth: 0,
  px: 0,
  borderRadius: 0,
  fontFamily: signFont,
  fontWeight: "700 !important",
  fontSize: "0.88rem !important",
  letterSpacing: "0 !important",
  textTransform: "none" as const,
  justifyContent: "flex-start",
  bgcolor: "transparent !important",
  color: "#141917 !important",
  border: "0 !important",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  textDecorationThickness: "1px",
  "&:hover": { color: "#164E3B !important", textDecorationThickness: "2px", bgcolor: "transparent !important" },
  "&.Mui-disabled": { color: "#5F6862 !important", textDecoration: "none" },
  "&:focus-visible, &.Mui-focusVisible": { outline: "2px solid #164E3B", outlineOffset: 2 },
} as const;

export const productCardDetailsButtonSx = {
  ...productCardActionOutlineSx,
} as const;
