"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import type { MaterialRange } from "@/data/materials";
import { brandTokens as brand } from "@/theme/brandTokens";

const maxColours = 3;

/** Flat preview of the board: surface colour(s), with a cue for glass, felt or fabric. */
function Preview({ range, width, height, colours, option }: { range: MaterialRange; width: number; height: number; colours: string[]; option: string }) {
  const hexes = colours.map((id) => range.colours.find((c) => c.id === id)?.hex ?? "#ddd");
  const ratio = Math.max(0.35, Math.min(3, width / height || 1.5));
  const framed = (range.slug === "fabric") || (range.slug === "felt" && option === "trim");
  const texture =
    range.surface === "glass"
      ? "linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.18) 100%)"
      : range.surface === "felt"
        ? "repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 4px)"
        : "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px)";
  return (
    <Box sx={{ bgcolor: "#EEE9E1", borderRadius: `${brand.radius}px`, p: { xs: 3, md: 5 }, display: "grid", placeItems: "center", minHeight: 300 }}>
      <Box
        role="img"
        aria-label={`Preview: ${width} × ${height} ft ${range.name.toLowerCase()} in ${colours.map((id) => range.colours.find((c) => c.id === id)?.name).join(", ")}`}
        sx={{
          position: "relative",
          width: ratio >= 1 ? "100%" : `${ratio * 100}%`,
          maxWidth: 520,
          aspectRatio: `${width} / ${height}`,
          display: "flex",
          border: framed ? `6px solid ${option === "heavy" ? "#7d8288" : "#b7bcc1"}` : "none",
          borderRadius: range.surface === "glass" ? "10px" : "2px",
          boxShadow: range.surface === "glass" ? "0 14px 30px rgba(0,0,0,0.18)" : "0 8px 20px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        {hexes.map((hex, i) => (
          <Box key={i} sx={{ flex: 1, bgcolor: hex, backgroundImage: texture }} />
        ))}
        {range.surface === "glass"
          ? [
              { top: 10, left: 10 },
              { top: 10, right: 10 },
              { bottom: 10, left: 10 },
              { bottom: 10, right: 10 },
            ].map((pos, i) => (
              <Box key={i} sx={{ position: "absolute", ...pos, width: 12, height: 12, borderRadius: "50%", bgcolor: "#c7ccd1", border: "2px solid #9aa0a6" }} />
            ))
          : null}
      </Box>
    </Box>
  );
}

export function MaterialBuilder({ range }: { range: MaterialRange }) {
  const multi = range.slug === "fabric";
  const [sizeId, setSizeId] = useState(range.sizes[1]?.id ?? range.sizes[0].id);
  const [custom, setCustom] = useState({ w: "", h: "" });
  const [colours, setColours] = useState<string[]>([range.colours[0].id]);
  const [option, setOption] = useState(range.options.choices[0].id);
  const [quantity, setQuantity] = useState("1");

  const isCustom = sizeId === "custom";
  const preset = range.sizes.find((s) => s.id === sizeId);
  // Standard sizes hang landscape; custom sizes keep the width and height as entered.
  const w = isCustom ? Number(custom.w) : Math.max(preset!.widthFt, preset!.heightFt);
  const h = isCustom ? Number(custom.h) : Math.min(preset!.widthFt, preset!.heightFt);
  const sizeValid = Number.isFinite(w) && Number.isFinite(h) && w >= 1 && h >= 1;
  const oversize = sizeValid && Math.max(w, h) > range.maxSideFt;
  const qty = Number(quantity);
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= 999;

  const toggleColour = (id: string) => {
    if (!multi) return setColours([id]);
    setColours((prev) => {
      if (prev.includes(id)) return prev.length > 1 ? prev.filter((c) => c !== id) : prev;
      return prev.length >= maxColours ? prev : [...prev, id];
    });
  };

  const colourNames = colours.map((id) => range.colours.find((c) => c.id === id)!.name);
  const optionName = range.options.choices.find((c) => c.id === option)!.name;
  const sizeText = sizeValid ? `${w} × ${h} ft` : "";
  const quoteHref = `/quote?${new URLSearchParams({
    boardType: range.quoteBoardType,
    product: range.name,
    customSize: sizeText,
    quantity: qtyValid ? String(qty) : "1",
    colour: colourNames.join(" + "),
    config: `${range.name} · ${sizeText} · ${colourNames.join(" + ")} · ${range.options.label}: ${optionName}${oversize ? " · Oversize: engineer-to-order" : ""}`,
    custom: "1",
  }).toString()}`;

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, alignItems: "start" }}>
      <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
        <Preview range={range} width={sizeValid ? w : 4} height={sizeValid ? h : 3} colours={colours} option={option} />
        <Typography sx={{ fontSize: 13, color: brand.muted, mt: 1 }}>Illustration to show proportions and colour. Final colours are matched on the proof.</Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 3 }}>
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>Size</Typography>
          <ToggleButtonGroup exclusive value={sizeId} onChange={(_, v) => v && setSizeId(v)} sx={{ flexWrap: "wrap" }}>
            {range.sizes.map((s) => <ToggleButton key={s.id} value={s.id}>{s.label}</ToggleButton>)}
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
          {isCustom ? (
            <Box sx={{ display: "flex", gap: 1.5, mt: 1.5 }}>
              <TextField label="Width (ft)" type="number" value={custom.w} onChange={(e) => setCustom((c) => ({ ...c, w: e.target.value }))} slotProps={{ htmlInput: { min: 1, step: 0.5, inputMode: "decimal" } }} sx={{ maxWidth: 140 }} />
              <TextField label="Height (ft)" type="number" value={custom.h} onChange={(e) => setCustom((c) => ({ ...c, h: e.target.value }))} slotProps={{ htmlInput: { min: 1, step: 0.5, inputMode: "decimal" } }} sx={{ maxWidth: 140 }} />
            </Box>
          ) : null}
          {oversize ? (
            <Typography role="status" sx={{ mt: 1, fontSize: 14, color: brand.signalInk }}>
              Over {range.maxSideFt} ft on a side is made in panels or as a special build. We&apos;ll confirm it with a site check.
            </Typography>
          ) : null}
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>
            Colour{multi ? ` (up to ${maxColours}, shown side by side)` : ""}: {colourNames.join(" + ")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {range.colours.map((c) => {
              const on = colours.includes(c.id);
              return (
                <Box
                  key={c.id}
                  component="button"
                  type="button"
                  aria-pressed={on}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => toggleColour(c.id)}
                  sx={{
                    width: 40, height: 40, borderRadius: "50%", cursor: "pointer", bgcolor: c.hex,
                    border: `1px solid ${brand.line}`,
                    outline: on ? `3px solid ${brand.charcoal}` : "none", outlineOffset: 2,
                    "&:focus-visible": { outline: `3px solid ${brand.forest}` },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>{range.options.label}</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {range.options.choices.map((choice) => (
              <Box
                key={choice.id}
                component="button"
                type="button"
                aria-pressed={option === choice.id}
                onClick={() => setOption(choice.id)}
                sx={{
                  textAlign: "left", p: 1.5, cursor: "pointer", font: "inherit", color: "inherit", bgcolor: brand.white,
                  border: `1px solid ${option === choice.id ? brand.charcoal : brand.line}`,
                  boxShadow: option === choice.id ? `inset 0 0 0 1px ${brand.charcoal}` : "none",
                  borderRadius: `${brand.radius}px`,
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{choice.name}</Typography>
                <Typography sx={{ fontSize: 14, color: brand.body }}>{choice.description}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <TextField
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={!qtyValid}
          helperText={qtyValid ? " " : "Enter 1 to 999."}
          slotProps={{ htmlInput: { min: 1, max: 999, inputMode: "numeric" } }}
          sx={{ maxWidth: 160 }}
        />

        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Priced on quote</Typography>
          <Typography sx={{ color: brand.body, fontSize: 15, mb: 2 }}>
            Made to order. We reply with a price and lead time, then send a design proof before anything is made.
          </Typography>
          {sizeValid && qtyValid ? (
            <Button component={Link} href={quoteHref} variant="contained" size="large">Request a quote</Button>
          ) : (
            <Button variant="contained" size="large" disabled>Enter a size and quantity to request a quote</Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
