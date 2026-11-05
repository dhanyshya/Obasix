const focusSx = {
  "&.Mui-focusVisible": {
    outline: "2px solid #174D38",
    outlineOffset: 2,
  },
  "&:focus-visible": {
    outline: "2px solid #174D38",
    outlineOffset: 2,
  },
} as const;

const baseSx = {
  width: "100%",
  minWidth: 0,
  borderRadius: "2px",
  fontWeight: "600 !important",
  lineHeight: "1.15 !important",
  whiteSpace: "nowrap",
  textTransform: "uppercase" as const,
  opacity: 1,
  visibility: "visible" as const,
  transition:
    "background-color 200ms ease, color 200ms ease, border-color 200ms ease, outline-color 200ms ease",
  ...focusSx,
} as const;

const outlineStateSx = {
  bgcolor: "#F1F6F3 !important",
  color: "#174D38 !important",
  border: "1px solid",
  borderColor: "#174D38 !important",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#174D38 !important",
    color: "#FFFFFF !important",
    borderColor: "#174D38 !important",
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
  bgcolor: "#174D38 !important",
  color: "#FFFFFF !important",
  border: "1px solid",
  borderColor: "#174D38 !important",
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

const actionSx = {
  ...baseSx,
  minHeight: { xs: 32, md: 34 },
  px: { xs: 0.5, sm: 0.65 },
  py: 0.5,
  fontSize: {
    xs: "0.55rem !important",
    sm: "0.56rem !important",
    lg: "0.54rem !important",
    xl: "0.55rem !important",
  },
  letterSpacing: "0.03em !important",
  "& .MuiButton-startIcon": { ml: 0, mr: 0.35 },
} as const;

export const productCardDetailsButtonSx = {
  ...baseSx,
  ...outlineStateSx,
  minHeight: { xs: 34, md: 36 },
  px: { xs: 0.75, sm: 1 },
  py: 0.6,
  fontSize: { xs: "0.62rem !important", sm: "0.66rem !important" },
  letterSpacing: "0.04em !important",
} as const;

export const productCardActionOutlineSx = {
  ...actionSx,
  ...outlineStateSx,
} as const;

export const productCardActionContainedSx = {
  ...actionSx,
  ...containedStateSx,
} as const;
