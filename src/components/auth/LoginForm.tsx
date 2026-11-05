"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthCard, AuthPasswordField, AuthTextField } from "@/components/auth/AuthFields";
import NextLink from "@/components/Link";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await signIn(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message || "Email or password is incorrect.");
      return;
    }
    router.push(next);
  };

  return (
    <AuthCard title="Sign in">
      <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <AuthTextField id="login-email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <AuthPasswordField id="login-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </Stack>
      <Stack spacing={1} sx={{ mt: 3 }}>
        <Typography variant="body2">
          <MuiLink component={NextLink} href="/forgot-password" underline="always">
            Forgot password
          </MuiLink>
        </Typography>
        <Typography variant="body2">
          New to OBASIX?{" "}
          <MuiLink component={NextLink} href={`/register?next=${encodeURIComponent(next)}`} underline="always">
            Create account
          </MuiLink>
        </Typography>
      </Stack>
    </AuthCard>
  );
}

export function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}
