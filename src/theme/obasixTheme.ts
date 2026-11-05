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
      main: brand.oak,
      contrastText: brand.charcoal,
    },
    warning: {
      main: brand.oak,
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
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      letterSpacing: "-0.025em",
      lineHeight: 0.98,
      color: brand.charcoal,
    },
    h2: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      letterSpacing: "-0.022em",
      lineHeight: 1.02,
      color: brand.charcoal,
    },
    h3: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      letterSpacing: "-0.018em",
      lineHeight: 1.1,
      color: brand.charcoal,
    },
    h4: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
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
      textTransform: "uppercase",
      fontWeight: 600,
      letterSpacing: "0.09em",
      fontSize: "0.76rem",
    },
    overline: {
      letterSpacing: "0.2em",
      fontWeight: 600,
      fontSize: "0.66rem",
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
        },
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
        },
      },
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
          fontWeight: 500,
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
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          color: brand.charcoal,
          borderBottom: `1px solid ${brand.line}`,
          backdropFilter: "blur(14px)",
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
