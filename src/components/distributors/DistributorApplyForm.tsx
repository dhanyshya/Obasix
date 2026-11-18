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
import { businessTypes, isValidGstin } from "@/lib/distributors/program";

export function DistributorApplyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    gstin: "",
    city: "",
    state: "",
    territoryRequest: "",
    notes: "",
  });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const gstin = form.gstin.toUpperCase().replace(/\s/g, "");
  const gstinError = gstin.length === 15 && !isValidGstin(gstin);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/distributors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, gstin, accept }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.message ?? "We couldn't send your application. Try again.");
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
    <Box component="form" onSubmit={submit} noValidate sx={{ display: "grid", gap: 2, maxWidth: 640 }}>
      <TextField required label="Registered business name" value={form.businessName} onChange={set("businessName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <TextField select required label="Type of business" value={form.businessType} onChange={set("businessType")}>
        {businessTypes.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        required
        label="GSTIN"
        value={form.gstin}
        onChange={set("gstin")}
        error={gstinError}
        helperText={gstinError ? "This GSTIN doesn't look right. Check the 15 characters." : "Trade invoices are issued against this GSTIN."}
        slotProps={{ htmlInput: { maxLength: 15, style: { textTransform: "uppercase" }, autoCapitalize: "characters" } }}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <TextField required label="City" value={form.city} onChange={set("city")} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <TextField required label="State" value={form.state} onChange={set("state")} slotProps={{ htmlInput: { maxLength: 60 } }} />
      </Box>
      <TextField
        required
        label="Area you want to cover"
        placeholder="e.g. Pune city and Pimpri-Chinchwad"
        value={form.territoryRequest}
        onChange={set("territoryRequest")}
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
      <TextField
        label="Tell us about your business (optional)"
        placeholder="Years trading, warehouse, institutional customers, brands you carry"
        multiline
        minRows={3}
        value={form.notes}
        onChange={set("notes")}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
      />
      <FormControlLabel
        control={<Checkbox checked={accept} onChange={(e) => setAccept(e.target.checked)} />}
        label={
          <Typography variant="body2">
            I accept the <Link href="/distributors#terms">distributor terms</Link>.
          </Typography>
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box>
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? "Sending…" : "Apply to distribute"}
        </Button>
      </Box>
    </Box>
  );
}
