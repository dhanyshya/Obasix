"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";

/** Approve the proof for production, or describe the changes needed. */
export function ProofDecision({ proofId, version }: { proofId: string; version: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "changes">("idle");
  const [confirm, setConfirm] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (decision: "approved" | "changes") => {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/proofs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proofId, decision, confirm, comment }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setError(data.message ?? "That didn't go through. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "idle") {
    return (
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={() => setMode("approve")}>Approve version {version}</Button>
        <Button variant="outlined" onClick={() => setMode("changes")}>Request changes</Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void send(mode === "approve" ? "approved" : "changes");
      }}
      sx={{ display: "grid", gap: 1.5, maxWidth: 560 }}
    >
      {mode === "approve" ? (
        <FormControlLabel
          control={<Checkbox checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />}
          label="I've checked the wording, spelling, sizes and colours. Make it exactly as shown in this proof."
        />
      ) : (
        <TextField
          required
          autoFocus
          label="What should we change?"
          placeholder="e.g. Change 'Dr. A Sharma' to 'Dr. Anita Sharma'; make the room number larger"
          multiline
          minRows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
      )}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button type="submit" variant="contained" disabled={busy || (mode === "approve" ? !confirm : comment.trim().length < 5)}>
          {busy ? "Sending…" : mode === "approve" ? "Approve for production" : "Send changes"}
        </Button>
        <Button variant="text" disabled={busy} onClick={() => { setMode("idle"); setError(""); }}>Cancel</Button>
      </Box>
    </Box>
  );
}
