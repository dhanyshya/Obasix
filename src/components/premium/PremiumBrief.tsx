"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";

type Field = { id: string; label: string; options?: string[]; placeholder?: string; type?: "number" };

export type BriefKind = {
  id: string;
  quoteBoardType: string;
  name: string;
  fields: Field[];
};

/**
 * A short structured brief for products we quote after a consultation.
 * The answers go into the quote form, so the request arrives ready to price.
 */
export function PremiumBrief({ kind }: { kind: BriefKind }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState("1");
  const [site, setSite] = useState("");
  const set = (id: string, value: string) => setValues((prev) => ({ ...prev, [id]: value }));

  const answered = kind.fields.filter((f) => values[f.id]?.trim());
  const qty = Number(quantity);
  const ready = answered.length === kind.fields.length && Number.isInteger(qty) && qty >= 1 && qty <= 999 && site.trim().length >= 2;
  const summary = [kind.name, ...answered.map((f) => `${f.label}: ${values[f.id].trim()}`), `Site: ${site.trim()}`, "Needs site survey"].join(" · ");
  const href = `/quote?${new URLSearchParams({
    boardType: kind.quoteBoardType,
    product: kind.name,
    quantity: String(qty || 1),
    // The quote form needs a size for custom work: use whichever size answer this brief has.
    customSize: values.width ? `${values.width} cm wide` : values.wall ? `${values.wall} m wall` : (values.size ?? ""),
    notes: `Site: ${site.trim()}. Please arrange a site survey.`,
    config: summary,
    custom: "1",
  }).toString()}`;

  return (
    <Box component="form" noValidate onSubmit={(e) => e.preventDefault()} sx={{ display: "grid", gap: 2 }} aria-label={`${kind.name} brief`}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {kind.fields.map((field) =>
          field.options ? (
            <TextField key={field.id} select size="small" label={field.label} value={values[field.id] ?? ""} onChange={(e) => set(field.id, e.target.value)}>
              {field.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          ) : (
            <TextField
              key={field.id}
              size="small"
              type={field.type ?? "text"}
              label={field.label}
              placeholder={field.placeholder}
              value={values[field.id] ?? ""}
              onChange={(e) => set(field.id, e.target.value)}
              slotProps={{ htmlInput: { maxLength: 80 } }}
            />
          ),
        )}
        <TextField size="small" label="Site city" value={site} onChange={(e) => setSite(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
        <TextField size="small" type="number" label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} slotProps={{ htmlInput: { min: 1, max: 999, inputMode: "numeric" } }} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {ready ? (
          <Button component={Link} href={href} variant="contained">Request a consultation</Button>
        ) : (
          <Button variant="contained" disabled>Answer each question to continue</Button>
        )}
        <Typography sx={{ fontSize: 13, color: brand.muted }}>No payment now. We reply with options, a price and a site-survey date.</Typography>
      </Box>
    </Box>
  );
}
