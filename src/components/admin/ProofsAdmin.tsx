"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Proof } from "@/lib/proofs/store";
import { brandTokens as brand } from "@/theme/brandTokens";

const statusText: Record<Proof["status"], string> = {
  pending: "Waiting for customer",
  approved: "Approved — release to production",
  changes: "Changes requested",
  superseded: "Superseded",
};

function UploadForm({ initialReference }: { initialReference: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState(initialReference);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setSent("");
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose the proof file.");
    const form = new FormData();
    form.set("quoteReference", reference);
    form.set("note", note);
    form.set("file", file);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/proofs", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) return setError(data.message ?? "Upload failed.");
      setSent(`Version ${data.version} sent to the customer for ${reference.toUpperCase()}.`);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" component="form" noValidate onSubmit={(e) => { e.preventDefault(); void submit(); }} sx={{ p: 3, display: "grid", gap: 2, maxWidth: 640 }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: 20 }}>Send a proof</Typography>
      <TextField required label="Quote reference" placeholder="OBX-QUOTE-DEMO-…" value={reference} onChange={(e) => setReference(e.target.value)} slotProps={{ htmlInput: { maxLength: 40 } }} />
      <Box>
        <Typography component="label" htmlFor="proof-file" sx={{ display: "block", fontWeight: 600, mb: 0.5 }}>Proof file (PNG, JPEG, WebP or PDF, up to 5 MB)</Typography>
        <input id="proof-file" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
      </Box>
      <TextField label="Note to the customer (optional)" placeholder="e.g. Updated the name spelling and moved the logo up" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: 600 } }} />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {sent ? <Alert severity="success" role="status">{sent}</Alert> : null}
      <Box><Button type="submit" variant="contained" disabled={busy}>{busy ? "Uploading…" : "Send proof"}</Button></Box>
    </Paper>
  );
}

export function ProofsAdmin({ proofs, initialReference = "" }: { proofs: Proof[]; initialReference?: string }) {
  // Latest version per quote, newest first.
  const latest = new Map<string, Proof>();
  for (const proof of proofs) {
    const current = latest.get(proof.quoteReference);
    if (!current || proof.version > current.version) latest.set(proof.quoteReference, proof);
  }
  const rows = [...latest.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const waiting = rows.filter((p) => p.status === "changes").length;

  return (
    <Box sx={{ display: "grid", gap: 4 }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Design proofs</Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          Nothing custom goes into production until the customer approves a proof. {waiting > 0 ? `${waiting} ${waiting === 1 ? "quote needs" : "quotes need"} a revised proof.` : ""}
        </Typography>
      </Box>
      <UploadForm initialReference={initialReference} />
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { textAlign: "left", p: 1.25, borderBottom: `1px solid ${brand.line}`, verticalAlign: "top", fontSize: 14 } }}>
          <thead>
            <tr><th>Quote</th><th>Version</th><th>Status</th><th>Customer comment</th><th>Sent by</th><th>File</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}>No proofs sent yet.</td></tr>
            ) : rows.map((p) => (
              <Box component="tr" key={p.id} sx={p.status === "changes" ? { bgcolor: "rgba(200,120,0,0.08)" } : undefined}>
                <td>{p.quoteReference}</td>
                <td>{p.version}</td>
                <Box component="td" sx={{ fontWeight: 600, color: p.status === "approved" ? brand.forest : brand.signalInk }}>{statusText[p.status]}</Box>
                <td>{p.customerComment || "—"}</td>
                <td>{p.uploadedBy}</td>
                <td><a href={`/api/proofs/${p.id}/file`} target="_blank" rel="noopener">Open</a></td>
              </Box>
            ))}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
