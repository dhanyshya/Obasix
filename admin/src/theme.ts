import { createTheme } from "@mui/material/styles";

// OBASIX brand colours (src/theme/brandTokens.ts on the site), checked for AA contrast on white.
export const theme = createTheme({
  palette: {
    primary: { main: "#164E3B" },
    secondary: { main: "#1F2421" },
    background: { default: "#F4F2EC", paper: "#FFFFFF" },
    text: { primary: "#1F2421", secondary: "#4F5552" },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: "Helvetica, Arial, sans-serif", button: { textTransform: "none", fontWeight: 600 } },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: false } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700 } } },
  },
});
