"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { associateProfessions } from "@/lib/associates/program";

export function AssociateApplyForm() {
  const router = useRouter();
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [firm, setFirm] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/associates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profession, city, firm, accept }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.message ?? "We couldn't register you. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{ display: "grid", gap: 2, maxWidth: 560 }}>
      <TextField
        select
        required
        label="What work do you do?"
        value={profession}
        onChange={(e) => setProfession(e.target.value)}
      >
        {associateProfessions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <TextField required label="City you work in" value={city} onChange={(e) => setCity(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
      <TextField label="Firm or company (optional)" value={firm} onChange={(e) => setFirm(e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
      <FormControlLabel
        control={<Checkbox checked={accept} onChange={(e) => setAccept(e.target.checked)} />}
        label={
          <Typography variant="body2">
            I accept the <Link href="/associates#terms">associate programme terms</Link>.
          </Typography>
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box>
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? "Registering…" : "Get my referral code"}
        </Button>
      </Box>
    </Box>
  );
}
