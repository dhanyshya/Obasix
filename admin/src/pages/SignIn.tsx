import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { describeError } from "../components/Notifications";

export function SignIn({ notice }: { notice?: string }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter your staff email address.");
    if (!password) return setError("Enter your password.");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      setError(describeError(caught));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", px: 2 }}>
      <Paper component="form" onSubmit={submit} noValidate sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 420 }} variant="outlined">
        <Stack spacing={2.5}>
          <Box>
            <Typography component="p" sx={{ fontWeight: 800, letterSpacing: "0.06em", color: "primary.main" }}>
              OBASIX ADMIN
            </Typography>
            <Typography component="h1" variant="h5" sx={{ mt: 1 }}>
              Staff sign-in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Use the account you sign in with on the OBASIX site.
            </Typography>
          </Box>
          {notice && !error ? <Alert severity="info">{notice}</Alert> : null}
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}
          <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
