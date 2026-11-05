"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { AuthCard, AuthPasswordField, authBackLinkSx, authSubmitButtonSx } from "@/components/auth/AuthFields";
import NextLink from "@/components/Link";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth?action=reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const result = (await response.json()) as { message?: string; errors?: { password?: string } };
    setPending(false);
    if (!response.ok) {
      setError(result.errors?.password || result.message || "The password was not changed.");
      return;
    }
    router.push("/login");
  };

  return (
    <AuthCard title="Choose a new password">
      <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
        {!token ? <Alert severity="warning">This reset link is missing or expired.</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        <AuthPasswordField id="reset-password" label="New password" autoComplete="new-password" value={password} onChange={setPassword} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={pending || !token} sx={authSubmitButtonSx}>
          {pending ? "Saving password..." : "Save password"}
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
