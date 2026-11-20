"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useDesignAi } from "@/components/ai/useDesignAi";
import { SignPreview } from "@/components/signage/SignPreview";
import { decodeDesign, encodeDesign, getSignType, type SignDesign } from "@/data/signage";
import { brandTokens as brand } from "@/theme/brandTokens";

type Idea = { name: string; reason: string; design: string };

/** Asks Claude for alternative arrangements of the current sign; each one already passes the rules. */
export function LayoutIdeas({ design, onUse }: { design: SignDesign; onUse: (next: SignDesign) => void }) {
  const enabled = useDesignAi();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!enabled) return null;

  const ask = async () => {
    setBusy(true);
    setError("");
    setIdeas([]);
    try {
      const response = await fetch("/api/ai/sign-layouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ design: encodeDesign(design) }),
      });
      const data = (await response.json()) as { ok: boolean; alternatives?: Idea[]; message?: string };
      if (!response.ok || !data.ok || !data.alternatives) return setError(data.message ?? "No suggestions this time.");
      setIdeas(data.alternatives);
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button variant="outlined" onClick={() => void ask()} disabled={busy} startIcon={busy ? <CircularProgress size={14} /> : undefined}>
        {busy ? "Thinking about layouts…" : "Suggest other layouts"}
      </Button>
      <Box aria-live="polite">
        {error ? <Alert severity="info" sx={{ mt: 1.5 }}>{error}</Alert> : null}
        {ideas.length > 0 ? (
          <Box sx={{ display: "grid", gap: 2, mt: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(220px, 1fr))" } }}>
            {ideas.map((idea, i) => {
              const next = decodeDesign(new URLSearchParams(idea.design));
              const type = next ? getSignType(next.typeId) : undefined;
              if (!next || !type) return null;
              return (
                <Box key={i} sx={{ border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 1.5, bgcolor: brand.white, display: "grid", gap: 1 }}>
                  <SignPreview type={type} design={next} idPrefix={`idea-${i}`} title={`Layout idea: ${idea.name}`} />
                  <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{idea.name}</Typography>
                  <Typography sx={{ fontSize: 13, color: brand.body }}>{idea.reason}</Typography>
                  <Button size="small" variant="contained" onClick={() => { onUse(next); setIdeas([]); }}>Use this layout</Button>
                </Box>
              );
            })}
          </Box>
        ) : null}
        {ideas.length > 0 ? (
          <Typography sx={{ fontSize: 12, color: brand.muted, mt: 1 }}>Suggested by AI from your own text. Check every word before you request a quote.</Typography>
        ) : null}
      </Box>
    </Box>
  );
}
