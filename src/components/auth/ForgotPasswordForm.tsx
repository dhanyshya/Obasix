"use client";

import { FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { AuthCard, AuthTextField, authBackLinkSx, authSubmitButtonSx } from "@/components/auth/AuthFields";
import NextLink from "@/components/Link";
import { brandTokens } from "@/theme/brandTokens";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetPath, setResetPath] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    setResetPath("");
    const response = await fetch("/api/auth?action=forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json()) as { message?: string; errors?: { email?: string }; resetPath?: string };
    setPending(false);
    if (!response.ok) {
      setError(result.errors?.email || result.message || "The reset request could not be sent.");
      return;
    }
    setMessage(result.message || "No email service is configured, so a reset link was not sent.");
    setResetPath(result.resetPath || "");
  };

  return (
    <AuthCard title="Reset password">
      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        <Box
          component="aside"
          role="note"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            px: 1.75,
            py: 1.5,
            bgcolor: brandTokens.paleGreen,
            border: `1px solid ${brandTokens.line}`,
            borderLeft: `3px solid ${brandTokens.forest}`,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, mt: "2px", color: brandTokens.forest, flexShrink: 0 }} />
          <Typography
            sx={{
              fontSize: 13.5,
              lineHeight: 1.65,
              color: brandTokens.body,
            }}
          >
            No email service is configured. A production reset needs an email provider before a customer can receive a link.
          </Typography>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="info">{message}</Alert> : null}
        {resetPath ? (
          <Typography variant="body2">
            <MuiLink component={NextLink} href={resetPath} underline="always">
              Open the local reset link
            </MuiLink>
          </Typography>
        ) : null}
        <AuthTextField id="forgot-email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={pending} sx={authSubmitButtonSx}>
          {pending ? "Requesting reset..." : "Request reset link"}
        </Button>
      </Stack>
      <Box sx={{ mt: 3.5 }}>
        <MuiLink component={NextLink} href="/login" underline="none" sx={authBackLinkSx}>
          <ArrowBackIcon sx={{ fontSize: 16 }} aria-hidden />
          Back to sign in
        </MuiLink>
      </Box>
    </AuthCard>
  );
}
