"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { useDesignAi } from "@/components/ai/useDesignAi";
import { brandTokens as brand } from "@/theme/brandTokens";

type Suggestion = { frameId: string; frameName: string; colourId: string; colourName: string; colourHex: string; reason: string };

/** Shrinks the photo before upload: smaller, faster, and enough detail to judge colours. */
async function downscale(src: string): Promise<Blob> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85));
}

/** Suggests frame and surface colours from the customer's wall photo, with links into the customizer. */
export function FrameColourAdvisor({ wallSrc, productId }: { wallSrc: string; productId: string | null }) {
  const enabled = useDesignAi();
  const [room, setRoom] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!enabled) return null;

  const ask = async () => {
    setBusy(true);
    setError("");
    setSuggestions([]);
    try {
      const form = new FormData();
      form.set("photo", await downscale(wallSrc), "wall.jpg");
      if (productId) form.set("productId", productId);
      const response = await fetch("/api/ai/frame-colours", { method: "POST", body: form });
      const data = (await response.json()) as { ok: boolean; room?: string; suggestions?: Suggestion[]; message?: string };
      if (!response.ok || !data.ok || !data.suggestions) return setError(data.message ?? "No suggestions this time.");
      setRoom(data.room ?? "");
      setSuggestions(data.suggestions);
    } catch {
      setError("We couldn't read that photo. Try another one.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white }}>
      <Typography sx={{ fontWeight: 600 }}>Not sure which frame and colour?</Typography>
      <Typography sx={{ fontSize: 14, color: brand.body, mt: 0.5 }}>We&apos;ll look at your wall photo and suggest combinations that suit the room.</Typography>
      <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.5 }}>
        This sends a smaller copy of the photo to our server and our AI provider, Anthropic, to make the suggestions. We don&apos;t keep it.
      </Typography>
      <Button sx={{ mt: 1.5 }} variant="outlined" onClick={() => void ask()} disabled={busy} startIcon={busy ? <CircularProgress size={14} /> : undefined}>
        {busy ? "Looking at your room…" : "Suggest a frame and colour"}
      </Button>
      <Box aria-live="polite">
        {error ? <Alert severity="info" sx={{ mt: 1.5 }}>{error}</Alert> : null}
        {room ? <Typography sx={{ fontSize: 14, color: brand.body, mt: 1.5 }}>{room}</Typography> : null}
        {suggestions.length > 0 ? (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1, display: "grid", gap: 1.25 }}>
            {suggestions.map((s, i) => (
              <Box component="li" key={i} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box aria-hidden sx={{ width: 28, height: 28, flexShrink: 0, borderRadius: "6px", bgcolor: s.colourHex, border: `1px solid ${brand.line}` }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{s.frameName} frame · {s.colourName}</Typography>
                  <Typography sx={{ fontSize: 13, color: brand.body }}>{s.reason}</Typography>
                  {productId ? (
                    <Box component={Link} href={`/customize?productId=${encodeURIComponent(productId)}&frameId=${s.frameId}&colourId=${s.colourId}`} sx={{ fontSize: 13, fontWeight: 600 }}>
                      Customise with this
                    </Box>
                  ) : null}
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
        {suggestions.length > 0 ? <Typography sx={{ fontSize: 12, color: brand.muted, mt: 1 }}>Suggested by AI from your photo. Colours on screen vary; we match them on the proof.</Typography> : null}
      </Box>
    </Box>
  );
}
