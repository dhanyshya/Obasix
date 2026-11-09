"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { brandTokens } from "@/theme/brandTokens";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    bgcolor: "#FFFFFF",
    fontSize: 15,
    color: brandTokens.charcoal,
    transition: "box-shadow 0.2s ease",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: brandTokens.line,
      transition: "border-color 0.2s ease",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: brandTokens.muted,
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(22, 78, 59, 0.10)",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: brandTokens.forest,
        borderWidth: 1,
      },
    },
  },
  "& .MuiInputBase-input": {
    padding: "0 14px",
    height: "100%",
    boxSizing: "border-box",
  },
} as const;

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
};

export function AuthPasswordField({ id, label, value, onChange, error, autoComplete }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      fullWidth
      sx={fieldSx}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible((current) => !current)}
              >
                {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function AuthTextField({ id, label, value, onChange, error, type = "text", autoComplete }: FieldProps & { type?: string }) {
  return (
    <TextField
      id={id}
      label={label}
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      fullWidth
      sx={fieldSx}
    />
  );
}

const accountPerks = [
  "Track your OBASIX orders",
  "Keep quote requests in one place",
  "Save board configurations from Customize",
  "Keep a wishlist across visits",
];

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  const display = "var(--font-display), Helvetica Neue, sans-serif";
  return (
    <Box sx={{ bgcolor: brandTokens.ivory }}>
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 0, sm: 4 },
          py: { xs: 0, sm: 6, md: 9 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 0.9fr) minmax(0, 1fr)" },
        }}
      >
        <Box
          sx={{
            bgcolor: brandTokens.forestDeep,
            color: brandTokens.white,
            px: { xs: 2.5, sm: 4, md: 5 },
            py: { xs: 4, md: 6 },
            display: "flex",
            flexDirection: "column",
            borderTop: `6px solid ${brandTokens.signal}`,
          }}
        >
          <Typography sx={{ fontFamily: display, fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", color: "#FFC59E" }}>
            OBASIX ACCOUNT
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              fontFamily: display,
              fontWeight: 800,
              fontVariationSettings: '"wdth" 90',
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              fontSize: { xs: "2.25rem", md: "3.1rem" },
              color: brandTokens.white,
            }}
          >
            {title}
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: { xs: 3, md: "auto" }, pt: { md: 6 }, display: { xs: "none", sm: "block" } }}>
            {accountPerks.map((perk) => (
              <Box
                component="li"
                key={perk}
                sx={{ display: "flex", gap: 1.5, alignItems: "center", py: 1.25, borderTop: "1px solid rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.86)", fontSize: 15 }}
              >
                <Box component="svg" viewBox="0 0 24 24" aria-hidden sx={{ width: 18, height: 18, flexShrink: 0 }}>
                  <path d="M3.5 12.5l5.5 5.5L21 4.5" stroke={brandTokens.signal} strokeWidth="3" strokeLinecap="square" fill="none" />
                </Box>
                {perk}
              </Box>
            ))}
          </Box>
        </Box>
        <Paper
          component="section"
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4, md: 6 },
            bgcolor: "#FFFFFF",
            borderRadius: 0,
            boxShadow: { sm: "0 30px 60px -30px rgba(11,46,34,0.25)" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

export const authSubmitButtonSx = {
  height: 54,
  mt: 0.5,
} as const;

export const authBackLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  color: brandTokens.forest,
  fontWeight: 600,
  fontSize: "0.92rem",
  textDecoration: "underline",
  textUnderlineOffset: 4,
  transition: "color 180ms ease",
  "&:hover": { color: brandTokens.charcoal },
} as const;

export function submitAuth(event: FormEvent) {
  event.preventDefault();
}
