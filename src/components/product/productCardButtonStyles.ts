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
