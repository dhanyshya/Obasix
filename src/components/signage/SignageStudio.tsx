"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import Link from "@/components/Link";
import { pageMax, pagePad, signType as signTypeStyle } from "@/components/home/directory/sign";
import { SignPreview } from "@/components/signage/SignPreview";
import { typesetLanguages } from "@/data/scripts";
import {
  checkDesign,
  decodeDesign,
  defaultDesign,
  describeDesign,
  encodeDesign,
  getSignMaterial,
  getSignType,
  letteringOptions,
  mountingOptions,
  signFamilies,
  signFonts,
  signMaterials,
  signTypes,
  signTypesByFamily,
  type SignDesign,
  type SignMaterialId,
} from "@/data/signage";
import { brandTokens as brand } from "@/theme/brandTokens";

export function SignageStudio() {
  const searchParams = useSearchParams();
  const [design, setDesign] = useState<SignDesign>(
    () => decodeDesign(new URLSearchParams(searchParams.toString())) ?? defaultDesign(signTypes[0]),
  );
  const [copied, setCopied] = useState(false);

  const type = getSignType(design.typeId) ?? signTypes[0];
  const material = getSignMaterial(design.materialId);
  const check = checkDesign(type, design);
  const update = (patch: Partial<SignDesign>) => setDesign((prev) => ({ ...prev, ...patch }));

  const chooseType = (id: string) => {
    const next = getSignType(id);
    if (next) setDesign(defaultDesign(next));
  };

  const chooseMaterial = (id: SignMaterialId) => {
    const next = getSignMaterial(id);
    update({
      materialId: id,
      letteringId: next.lettering.includes(design.letteringId) ? design.letteringId : next.lettering[0],
    });
  };

  const setLine = (index: number, value: string) =>
    update({ lines: design.lines.map((line, i) => (i === index ? value : line)) });

  const quoteHref = (() => {
    const params = new URLSearchParams({
      boardType: "Nameplate / Signage",
      product: type.name,
      customSize: `${design.widthCm} × ${design.heightCm} cm`,
      quantity: String(design.quantity),
      config: `${describeDesign(type, design)} · Route: ${check.route === "engineer-to-order" ? "engineer-to-order (technical approval)" : "configure-to-order"}`,
      notes: design.notes,
    });
    return `/quote?${params.toString()}`;
  })();

  const copyLink = async () => {
    const url = `${window.location.origin}/signage/design?${encodeDesign(design)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const isDirectory = type.layout === "directory";
  const labelFor = (i: number) => type.lineLabels[i] ?? (isDirectory ? `Row ${i}` : `Line ${i + 1}`);

  return (
    <Box
      sx={{
        ...pageMax,
        ...pagePad,
        py: { xs: 3, md: 5 },
        display: "grid",
        gap: { xs: 3, lg: 5 },
        gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) minmax(0, 1.05fr)" },
        alignItems: "start",
      }}
    >
      {/* Controls */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, order: { xs: 2, lg: 1 } }}>
        <Panel title="1. Sign">
          {signFamilies.map((family) => (
            <Box key={family.id} sx={{ mb: 1.5, "&:last-of-type": { mb: 0 } }}>
              <Typography sx={{ fontSize: 13, color: brand.muted, mb: 0.75 }}>{family.name}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label={family.name}>
                {signTypesByFamily(family.id).map((option) => (
                  <Choice key={option.id} selected={option.id === type.id} onClick={() => chooseType(option.id)}>
                    {option.name}
                  </Choice>
                ))}
              </Box>
            </Box>
          ))}
        </Panel>

        <Panel title="2. Size">
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label="Standard sizes">
            {[...type.presets].sort((a, b) => a.widthCm * a.heightCm - b.widthCm * b.heightCm).map((preset) => (
              <Choice
                key={`${preset.widthCm}x${preset.heightCm}`}
                selected={preset.widthCm === design.widthCm && preset.heightCm === design.heightCm}
                onClick={() => update({ widthCm: preset.widthCm, heightCm: preset.heightCm })}
              >
                {preset.widthCm} × {preset.heightCm} cm
              </Choice>
            ))}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2 }}>
            <TextField
              label="Width (cm)"
              type="number"
              size="small"
              value={Number.isFinite(design.widthCm) ? design.widthCm : ""}
              onChange={(e) => update({ widthCm: Number(e.target.value) })}
              slotProps={{ htmlInput: { min: type.minWidthCm, max: type.maxWidthCm, inputMode: "decimal" } }}
              helperText={`${type.minWidthCm}–${type.maxWidthCm} cm`}
            />
            <TextField
              label="Height (cm)"
              type="number"
              size="small"
              value={Number.isFinite(design.heightCm) ? design.heightCm : ""}
              onChange={(e) => update({ heightCm: Number(e.target.value) })}
              slotProps={{ htmlInput: { min: type.minHeightCm, max: type.maxHeightCm, inputMode: "decimal" } }}
              helperText={`${type.minHeightCm}–${type.maxHeightCm} cm`}
            />
          </Box>
        </Panel>

        <Panel title="3. Material">
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }} role="radiogroup" aria-label="Material">
            {type.materials.map((id) => {
              const option = signMaterials.find((m) => m.id === id)!;
              const selected = option.id === design.materialId;
              return (
                <ButtonBase
                  key={id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseMaterial(id)}
                  sx={{
                    justifyContent: "flex-start",
                    gap: 1.25,
                    p: 1.25,
                    textAlign: "left",
                    borderRadius: "12px",
                    border: `1.5px solid ${selected ? brand.forest : brand.line}`,
                    bgcolor: selected ? brand.paleGreen : brand.white,
                    "&.Mui-focusVisible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: "6px",
                      background: `linear-gradient(135deg, ${option.sheen ?? option.face}, ${option.face})`,
                      border: `1px solid ${brand.line}`,
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: brand.charcoal }}>{option.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: brand.body }}>{option.outdoor ? "Indoor and outdoor" : "Indoor only"}</Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
          <Typography sx={{ fontSize: 13, color: brand.body, mt: 1.25 }}>{material.description}</Typography>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Checkbox checked={design.outdoor} onChange={(e) => update({ outdoor: e.target.checked })} />}
            label="This sign will be outdoors or exposed to rain"
          />
        </Panel>

        <Panel title="4. Text">
          <Typography sx={{ fontSize: 13, color: brand.body, mb: 1.5 }}>
            Type in English, Hindi or any of nine Indian scripts, for example <span lang="hi">शर्मा निवास</span> or{" "}
            <span lang="ta">சர்மா இல்லம்</span>. For a bilingual sign, put each language on its own line.
            {isDirectory ? " The first line is the heading; each further line is one row." : ""}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {design.lines.map((line, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  fullWidth
                  size="small"
                  label={labelFor(i)}
                  value={line}
                  onChange={(e) => setLine(i, e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                />
                {design.lines.length > 1 ? (
                  <IconButton
                    aria-label={`Remove ${labelFor(i).toLowerCase()}`}
                    onClick={() => update({ lines: design.lines.filter((_, j) => j !== i) })}
                    size="small"
                    sx={{ mt: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Box>
            ))}
          </Box>
          {design.lines.length < type.maxLines ? (
            <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => update({ lines: [...design.lines, ""] })}>
              {isDirectory ? "Add row" : "Add line"}
            </Button>
          ) : null}

          <TextField
            select
            size="small"
            label="Can't type it? We'll add a line in"
            value={design.typesetLanguage}
            onChange={(e) => update({ typesetLanguage: e.target.value })}
            helperText={design.typesetLanguage ? `We'll write your first line in ${design.typesetLanguage} and show it on the proof.` : " "}
            sx={{ mt: 2, minWidth: 260 }}
          >
            <MenuItem value="">No added line</MenuItem>
            {typesetLanguages.map(({ language, script }) => (
              <MenuItem key={language} value={language}>
                {language} <Box component="span" lang={script.lang} sx={{ color: brand.muted, ml: 1, fontFamily: `var(${script.fontVar})` }}>{script.sample}</Box>
              </MenuItem>
            ))}
          </TextField>

          <Typography sx={{ fontSize: 13, color: brand.muted, mt: 2, mb: 0.75 }}>Typeface</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label="Typeface">
            {signFonts.map((font) => (
              <Choice key={font.id} selected={font.id === design.fontId} onClick={() => update({ fontId: font.id })}>
                <span style={{ fontFamily: font.stack, fontWeight: font.weight }}>{font.name}</span>
              </Choice>
            ))}
          </Box>

          <Typography sx={{ fontSize: 13, color: brand.muted, mt: 2, mb: 0.75 }}>Lettering</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label="Lettering">
            {letteringOptions
              .filter((option) => material.lettering.includes(option.id))
              .map((option) => (
                <Choice key={option.id} selected={option.id === design.letteringId} onClick={() => update({ letteringId: option.id })}>
                  {option.name}
                </Choice>
              ))}
          </Box>
          <Typography sx={{ fontSize: 13, color: brand.body, mt: 1 }}>
            {letteringOptions.find((o) => o.id === design.letteringId)?.description}
          </Typography>
        </Panel>

        <Panel title="5. Mounting and quantity">
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} role="radiogroup" aria-label="Mounting">
            {mountingOptions
              .filter((option) => type.mountings.includes(option.id))
              .map((option) => (
                <Choice key={option.id} selected={option.id === design.mountingId} onClick={() => update({ mountingId: option.id })}>
                  {option.name}
                </Choice>
              ))}
          </Box>
          <Typography sx={{ fontSize: 13, color: brand.body, mt: 1 }}>
            {mountingOptions.find((o) => o.id === design.mountingId)?.description}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" }, gap: 1.5, mt: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              size="small"
              value={design.quantity}
              onChange={(e) => update({ quantity: Math.floor(Number(e.target.value)) })}
              slotProps={{ htmlInput: { min: 1, inputMode: "numeric" } }}
            />
            <TextField
              label="Anything else? (logo, colours, lighting, site details)"
              size="small"
              multiline
              minRows={2}
              value={design.notes}
              onChange={(e) => update({ notes: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
          </Box>
        </Panel>
      </Box>

      {/* Preview and checks */}
      <Box sx={{ position: { lg: "sticky" }, top: { lg: 96 }, order: { xs: 1, lg: 2 }, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            bgcolor: "#DCDDD8",
            backgroundImage: "linear-gradient(180deg, #E4E5E0 0%, #D3D4CE 100%)",
            borderRadius: `${brand.radius}px`,
            p: { xs: 3, md: 5 },
            aspectRatio: { xs: "4 / 3", md: "5 / 4" },
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            <SignPreview type={type} design={design} idPrefix="studio" />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
          <Typography component="h2" sx={{ ...signTypeStyle.plate, fontSize: "1.25rem" }}>
            {type.name} · {design.widthCm} × {design.heightCm} cm
          </Typography>
          <Typography sx={{ ...signTypeStyle.code, fontSize: 13, color: check.route === "engineer-to-order" ? brand.signalInk : brand.forest }}>
            {check.route === "engineer-to-order" ? "Needs technical approval" : "Made to order"}
          </Typography>
        </Box>

        <Box aria-live="polite" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {check.results.length === 0 ? (
            <Alert severity="success" variant="outlined">
              This design can be made as specified.
            </Alert>
          ) : (
            check.results.map((result) => (
              <Alert key={result.message} severity={result.level} variant="outlined">
                {result.message}
              </Alert>
            ))
          )}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {check.ok ? (
            <Button component={Link} href={quoteHref} variant="contained" size="large" sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
              Request a quotation
            </Button>
          ) : (
            <Button variant="contained" size="large" disabled sx={{ flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
              Fix the issues above to request a quote
            </Button>
          )}
          <Button variant="outlined" color="inherit" size="large" startIcon={<LinkIcon />} onClick={copyLink}>
            {copied ? "Link copied" : "Copy design link"}
          </Button>
        </Box>
        <Typography sx={{ fontSize: 13, color: brand.muted, lineHeight: 1.6 }}>
          The preview is a to-scale guide. Before production we send a design proof with exact lettering and fixings for
          your approval. Price and delivery time are confirmed on the quotation.
        </Typography>
      </Box>
    </Box>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: { xs: 2, md: 2.5 } }}
    >
      <Typography component="h2" sx={{ ...signTypeStyle.plate, fontSize: "1.05rem", mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 0.85,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: selected ? 600 : 500,
        color: selected ? brand.white : brand.charcoal,
        bgcolor: selected ? brand.forest : brand.white,
        border: `1px solid ${selected ? brand.forest : brand.line}`,
        transition: "background-color 120ms ease, border-color 120ms ease",
        "&:hover": { borderColor: brand.forest },
        "&.Mui-focusVisible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
      }}
    >
      {children}
    </ButtonBase>
  );
}
