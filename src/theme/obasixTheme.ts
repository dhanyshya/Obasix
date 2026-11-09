"use client";

import { createTheme } from "@mui/material/styles";
import { brandTokens as brand } from "./brandTokens";
import { buttonThemeStyleOverrides } from "./buttonStyles";

export const obasixTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: brand.forest,
      dark: brand.forestDark,
      light: brand.paleGreen,
      contrastText: brand.white,
    },
    secondary: {
      main: brand.signalInk,
      light: brand.signal,
      contrastText: brand.white,
    },
    warning: {
      main: brand.signal,
      contrastText: brand.charcoal,
    },
    error: {
      main: brand.actionDark,
    },
    background: {
      default: brand.ivory,
      paper: brand.paper,
    },
    text: {
      primary: brand.charcoal,
      secondary: brand.body,
    },
    divider: brand.line,
    success: {
      main: brand.forest,
    },
    info: {
      main: brand.muted,
    },
  },
  typography: {
    fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 0.95,
      color: brand.charcoal,
    },
    h2: {
      fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      color: brand.charcoal,
    },
    h3: {
      fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.018em",
      lineHeight: 1.1,
      color: brand.charcoal,
    },
    h4: {
      fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
      fontWeight: 800,
      letterSpacing: "-0.015em",
      lineHeight: 1.15,
      color: brand.charcoal,
    },
    h5: {
      fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
      fontWeight: 600,
      letterSpacing: "-0.01em",
      color: brand.charcoal,
    },
    h6: {
      fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
      fontWeight: 600,
      letterSpacing: "-0.005em",
      color: brand.charcoal,
    },
    body1: {
      lineHeight: 1.75,
      color: brand.body,
    },
    body2: {
      lineHeight: 1.7,
      color: brand.body,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "-0.005em",
      fontSize: "0.95rem",
    },
    overline: {
      fontFamily: 'var(--font-display), sans-serif',
      letterSpacing: "0.06em",
      fontWeight: 700,
      fontSize: "0.72rem",
      color: brand.forest,
    },
    subtitle1: {
      color: brand.charcoal,
    },
    subtitle2: {
      color: brand.charcoal,
    },
    caption: {
      color: brand.muted,
    },
  },
  shape: {
    borderRadius: 0,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(37, 42, 38, 0.04)",
    "0 2px 8px rgba(37, 42, 38, 0.05)",
    "0 8px 24px rgba(37, 42, 38, 0.06)",
    "0 12px 32px rgba(37, 42, 38, 0.07)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
    "0 20px 48px rgba(37, 42, 38, 0.08)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.white,
          color: brand.body,
          fontFeatureSettings: '"ss01", "cv11"',
        },
        "::selection": { backgroundColor: brand.signal, color: brand.white },
        ":focus-visible": { outlineColor: brand.signal },
        "html": { scrollbarColor: `${brand.forest} ${brand.ivory}`, accentColor: brand.forest, caretColor: brand.action },
        "a:not(.MuiButton-root):not(.MuiIconButton-root):not(.MuiToggleButton-root):not(.MuiButtonBase-root)":
          {
            color: "inherit",
            textDecoration: "none",
          },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: buttonThemeStyleOverrides,
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: brand.white,
          borderRadius: 0,
          transition: "box-shadow 160ms cubic-bezier(0.16,1,0.3,1)",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#B9BFB9" },
          "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: brand.charcoal },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.forest, borderWidth: 2 },
          "&.Mui-focused": { boxShadow: `0 0 0 3px rgba(238,106,31,0.22)` },
        },
        input: { "&::placeholder": { color: brand.muted, opacity: 1 } },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: brand.body,
          fontWeight: 500,
          "&.Mui-focused": { color: brand.forest },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 0, fontSize: 12.5 } },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
          fontWeight: 700,
          color: brand.charcoal,
          "&.Mui-focused": { color: brand.charcoal },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: { root: { color: "#8A928C", "&.Mui-checked": { color: brand.forest } } },
    },
    MuiRadio: {
      styleOverrides: { root: { color: "#8A928C", "&.Mui-checked": { color: brand.forest } } },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { "&.Mui-checked": { color: brand.white, "& + .MuiSwitch-track": { backgroundColor: brand.forest, opacity: 1 } } },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          borderLeft: "4px solid currentColor",
          alignItems: "flex-start",
          "& .MuiAlert-message": { color: brand.charcoal, lineHeight: 1.6 },
        },
      },
      variants: [
        { props: { variant: "standard", severity: "success" }, style: { backgroundColor: brand.paleGreen, color: brand.forest } },
        { props: { variant: "standard", severity: "info" }, style: { backgroundColor: brand.ivory, color: brand.charcoal } },
        { props: { variant: "standard", severity: "warning" }, style: { backgroundColor: "#FDF0E7", color: "#9A3F0B" } },
        { props: { variant: "standard", severity: "error" }, style: { backgroundColor: "#FBECEC", color: brand.actionDark } },
      ],
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0, borderTop: `6px solid ${brand.forest}`, boxShadow: "0 40px 80px -30px rgba(11,46,34,0.45)" },
      },
    },
    MuiBackdrop: {
      styleOverrides: { root: { "&:not(.MuiBackdrop-invisible)": { backgroundColor: "rgba(11,46,34,0.55)" } } },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: 'var(--font-display), Helvetica Neue, sans-serif', fontWeight: 800, letterSpacing: "-0.02em", fontSize: "1.5rem" },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: 0 } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 0, border: `1px solid ${brand.line}`, boxShadow: "0 18px 40px -18px rgba(20,25,23,0.35)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { minHeight: 44, "&.Mui-selected": { backgroundColor: brand.paleGreen, boxShadow: `inset 3px 0 0 ${brand.signal}` } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 0, backgroundColor: brand.charcoal, fontSize: 12.5, fontWeight: 500, padding: "6px 10px" },
        arrow: { color: brand.charcoal },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, backgroundColor: brand.signal },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.01em",
          minHeight: 52,
          color: brand.body,
          "&.Mui-selected": { color: brand.charcoal },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 0, height: 4, backgroundColor: brand.line },
        bar: { borderRadius: 0, backgroundColor: brand.forest },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: brand.forest } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { borderRadius: 0, backgroundColor: "rgba(20,25,23,0.07)" } },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: brand.line,
          "&.Mui-active": { color: brand.signal },
          "&.Mui-completed": { color: brand.forest },
          "& .MuiStepIcon-text": { fontFamily: 'var(--font-display), sans-serif', fontWeight: 700 },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
          fontWeight: 600,
          "&.Mui-active, &.Mui-completed": { fontWeight: 800, color: brand.charcoal },
        },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 0, borderTop: `1px solid ${brand.line}`, "&:before": { display: "none" }, backgroundColor: "transparent" },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        content: { fontFamily: 'var(--font-display), Helvetica Neue, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: brand.charcoal },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: brand.line } },
    },
    MuiBadge: {
      styleOverrides: { badge: { borderRadius: 0, fontWeight: 700, fontFamily: 'var(--font-display), sans-serif' } },
    },
    MuiSnackbarContent: {
      styleOverrides: { root: { borderRadius: 0, backgroundColor: brand.charcoal, borderLeft: `4px solid ${brand.signal}` } },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${brand.line}`,
          borderRadius: 0,
          backgroundImage: "none",
          backgroundColor: brand.paper,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: brand.line,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 600,
          fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
          letterSpacing: "0",
        },
      },
      variants: [
        {
          props: { color: "primary", variant: "filled" },
          style: {
            backgroundColor: brand.paleGreen,
            color: brand.forest,
          },
        },
        {
          props: { color: "primary", variant: "outlined" },
          style: {
            borderColor: brand.forest,
            color: brand.forest,
            backgroundColor: brand.paleGreen,
          },
        },
      ],
    },
    MuiAppBar: {
      defaultProps: {
        color: "inherit",
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: brand.white,
          color: brand.charcoal,
          borderBottom: `1px solid ${brand.line}`,
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "lg",
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          "&.Mui-selected": {
            backgroundColor: brand.paleGreen,
            color: brand.forest,
            borderColor: brand.forest,
            "&:hover": {
              backgroundColor: brand.paleGreen,
            },
          },
        },
      },
    },
  },
});
