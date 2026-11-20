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
import { isValidGstin } from "@/lib/distributors/program";
import { minimumProjectValue, partnerTypes, projectProtectionDays, projectSectors } from "@/lib/partners/program";
import { formatPrice } from "@/lib/format";

function useSubmit() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (payload: Record<string, unknown>, onDone?: () => void) => {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.message ?? "That didn't go through. Try again.");
        return;
      }
      onDone?.();
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, submit };
}

export function PartnerApplyForm() {
  const { error, busy, submit } = useSubmit();
  const [form, setForm] = useState({ companyName: "", partnerType: "", gstin: "", city: "", state: "", notes: "" });
  const [sectors, setSectors] = useState<string[]>([]);
  const [accept, setAccept] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const gstin = form.gstin.toUpperCase().replace(/\s/g, "");
  const gstinError = gstin.length === 15 && !isValidGstin(gstin);
  const toggleSector = (sector: string) =>
    setSectors((prev) => (prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]));

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit({ action: "apply", ...form, gstin, sectors, accept });
      }}
      sx={{ display: "grid", gap: 2, maxWidth: 640 }}
    >
      <TextField required label="Registered company name" value={form.companyName} onChange={set("companyName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <TextField select required label="Type of business" value={form.partnerType} onChange={set("partnerType")}>
        {partnerTypes.map((type) => (
          <MenuItem key={type} value={type}>{type}</MenuItem>
        ))}
      </TextField>
      <TextField
        required
        label="GSTIN"
        value={form.gstin}
        onChange={set("gstin")}
        error={gstinError}
        helperText={gstinError ? "This GSTIN doesn't look right. Check the 15 characters." : "Partner margin is paid against this GSTIN."}
        slotProps={{ htmlInput: { maxLength: 15, style: { textTransform: "uppercase" }, autoCapitalize: "characters" } }}
      />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <TextField required label="City" value={form.city} onChange={set("city")} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <TextField required label="State" value={form.state} onChange={set("state")} slotProps={{ htmlInput: { maxLength: 60 } }} />
      </Box>
      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
        <Typography component="legend" sx={{ fontWeight: 600, mb: 0.5 }}>Sectors you deliver projects in</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {projectSectors.map((sector) => (
            <FormControlLabel key={sector} control={<Checkbox checked={sectors.includes(sector)} onChange={() => toggleSector(sector)} />} label={sector} />
          ))}
        </Box>
      </Box>
      <TextField
        label="Recent projects (optional)"
        placeholder="Clients, sites and the size of projects you've delivered"
        multiline
        minRows={3}
        value={form.notes}
        onChange={set("notes")}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
      />
      <FormControlLabel
        control={<Checkbox checked={accept} onChange={(e) => setAccept(e.target.checked)} />}
        label={<Typography variant="body2">I accept the <Link href="/partners#terms">partner terms</Link>.</Typography>}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box>
        <Button type="submit" variant="contained" size="large" disabled={busy}>
          {busy ? "Sending…" : "Apply to partner"}
        </Button>
      </Box>
    </Box>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export function ProjectRegisterForm() {
  const { error, busy, submit } = useSubmit();
  const blank = { clientName: "", city: "", sector: "", scope: "", expectedValue: "", expectedDate: "" };
  const [form, setForm] = useState(blank);
  const [sent, setSent] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSent(false);
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };
  const value = Number(form.expectedValue);
  const belowMinimum = form.expectedValue !== "" && value > 0 && value < minimumProjectValue;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit({ action: "register-project", ...form, expectedValue: value }, () => {
          setForm(blank);
          setSent(true);
        });
      }}
      sx={{ display: "grid", gap: 2 }}
    >
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <TextField required label="Client" placeholder="e.g. Greenfield Public School" value={form.clientName} onChange={set("clientName")} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField required label="Project city" value={form.city} onChange={set("city")} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <TextField select required label="Sector" value={form.sector} onChange={set("sector")}>
          {projectSectors.map((sector) => (
            <MenuItem key={sector} value={sector}>{sector}</MenuItem>
          ))}
        </TextField>
        <TextField
          required
          type="number"
          label="Expected value (₹)"
          value={form.expectedValue}
          onChange={set("expectedValue")}
          error={belowMinimum}
          helperText={belowMinimum ? `Projects start at ${formatPrice(minimumProjectValue)}.` : "Before GST, freight and installation."}
          slotProps={{ htmlInput: { min: minimumProjectValue, step: 1000, inputMode: "numeric" } }}
        />
      </Box>
      <TextField
        required
        label="Scope"
        placeholder="e.g. 40 classrooms: 3×4 magnetic board and pin-up board each; door signs; 12 wayfinding signs; admin block reception sign"
        multiline
        minRows={3}
        value={form.scope}
        onChange={set("scope")}
        slotProps={{ htmlInput: { maxLength: 1500 } }}
      />
      <TextField
        required
        type="date"
        label="Expected order date"
        value={form.expectedDate}
        onChange={set("expectedDate")}
        sx={{ maxWidth: 260 }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today() } }}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {sent ? (
        <Alert severity="success" role="status">
          Project registered. It&apos;s reserved for you for {projectProtectionDays} days while our team prepares the quote.
        </Alert>
      ) : null}
      <Box>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Registering…" : "Register project"}
        </Button>
      </Box>
    </Box>
  );
}
