"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthCard, AuthPasswordField, AuthTextField } from "@/components/auth/AuthFields";
import { safeNext } from "@/components/auth/LoginForm";
import NextLink from "@/components/Link";
import { useAuth } from "@/context/AuthContext";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setErrors({});
    const result = await register(name, email, password);
    setPending(false);
    if (!result.ok) {
      setErrors(result.errors ?? { form: result.message || "The account could not be created." });
      return;
    }
    router.push(next);
  };

  return (
    <AuthCard title="Create account">
      <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
        {errors.form ? <Alert severity="error">{errors.form}</Alert> : null}
        <AuthTextField id="register-name" label="Name" autoComplete="name" value={name} onChange={setName} error={errors.name} />
        <AuthTextField id="register-email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
        <AuthPasswordField id="register-password" label="Password" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ mt: 3 }}>
        Already have an account?{" "}
        <MuiLink component={NextLink} href={`/login?next=${encodeURIComponent(next)}`} underline="always">
          Sign in
        </MuiLink>
      </Typography>
    </AuthCard>
  );
}
