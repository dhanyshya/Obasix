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

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Box
        sx={{
          maxWidth: 700,
          mx: "auto",
          px: { xs: 2.5, sm: 4 },
          py: { xs: 5, sm: 6, md: 9 },
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            textAlign: "center",
            fontSize: { xs: "1.85rem", sm: "2.1rem", md: "2.4rem" },
            letterSpacing: "-0.02em",
            color: brandTokens.charcoal,
          }}
        >
          {title}
        </Typography>
        <Paper
          component="section"
          elevation={0}
          sx={{
            mt: { xs: 3, md: 4 },
            p: { xs: 3, sm: 4, md: 5 },
            bgcolor: "#FFFFFF",
            border: `1px solid ${brandTokens.line}`,
            borderRadius: 0,
            boxShadow: "0 18px 48px rgba(37, 42, 38, 0.06)",
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

export const authSubmitButtonSx = {
  height: 62,
  mt: 0.5,
  fontSize: "0.78rem",
  letterSpacing: "0.14em",
  fontWeight: 600,
  borderRadius: 0,
  boxShadow: "0 10px 24px rgba(22, 78, 59, 0.18)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 14px 30px rgba(22, 78, 59, 0.24)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: "0 6px 16px rgba(22, 78, 59, 0.2)",
  },
} as const;

export const authBackLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  color: brandTokens.forest,
  fontWeight: 600,
  fontSize: "0.82rem",
  letterSpacing: "0.04em",
  textDecoration: "none",
  borderBottom: "1px solid transparent",
  pb: "2px",
  transition: "color 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    color: brandTokens.forestDark,
    borderBottomColor: brandTokens.forestDark,
  },
} as const;

export function submitAuth(event: FormEvent) {
  event.preventDefault();
}
