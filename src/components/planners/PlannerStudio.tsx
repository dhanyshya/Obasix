"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import {
  checkPlanner,
  decodePlanner,
  defaultPlanner,
  describePlanner,
  encodePlanner,
  getPlannerTemplate,
  plannerGeometry,
  plannerInks,
  plannerSizes,
  plannerTemplates,
  type PlannerDesign,
  type PlannerSizeId,
  type PlannerTemplate,
} from "@/data/planners";
import { brandTokens as brand } from "@/theme/brandTokens";

const font = "var(--font-display), Helvetica Neue, sans-serif";

/** Scale drawing of the printed board, in cm units. */
function PlannerPreview({ template, design }: { template: PlannerTemplate; design: PlannerDesign }) {
  const g = plannerGeometry(template, design);
  const ink = plannerInks.find((i) => i.id === design.inkId)!.hex;
  const { widthCm: W, heightCm: H } = g.size;
  const frame = Math.max(1.2, W * 0.008);
  const left = g.margin + g.labelW;
  const colHeadTop = g.bodyTop;
  const gridTop = colHeadTop + g.colHeadH;
  const label = (n: number) => Math.min(n, 3.2);
  const headSize = label(g.colHeadH * 0.5);
  const rowSize = label(Math.min(g.cellH * 0.45, g.labelW * 0.14 || 99));
  const titleSize = Math.min(g.headerH * 0.5, W * 0.035);
  const rows = template.layout === "columns" ? [""] : design.rows;

  return (
    <Box
      component="svg"
      viewBox={`${-frame} ${-frame} ${W + frame * 2} ${H + frame * 2}`}
      role="img"
      aria-label={`Preview: ${describePlanner(template, design)}`}
      sx={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.14))" }}
    >
      <rect x={-frame} y={-frame} width={W + frame * 2} height={H + frame * 2} rx={frame} fill="#b9bec4" />
      <rect x={0} y={0} width={W} height={H} fill="#fbfbfa" />

      {/* Header */}
      <rect x={g.margin} y={g.margin} width={g.innerW} height={g.headerH} fill={ink} />
      <text x={g.margin + 2} y={g.margin + g.headerH / 2 + titleSize * 0.35} fill="#fff" fontFamily={font} fontWeight={700} fontSize={titleSize}>
        {design.title || " "}
      </text>
      {design.logo ? (
        <g>
          <rect x={g.margin + g.innerW - g.headerH * 2 - 2} y={g.margin + g.headerH * 0.2} width={g.headerH * 2} height={g.headerH * 0.6} fill="none" stroke="#fff" strokeDasharray="1 1" strokeWidth={0.3} />
          <text x={g.margin + g.innerW - g.headerH - 2} y={g.margin + g.headerH / 2 + 0.8} fill="#fff" fontFamily={font} fontSize={2.2} textAnchor="middle">LOGO</text>
        </g>
      ) : null}

      {/* KPI tiles */}
      {template.layout === "dashboard" && design.tiles.length > 0
        ? design.tiles.map((tile, i) => {
            const gap = 1.5;
            const tw = (g.innerW - gap * (design.tiles.length - 1)) / design.tiles.length;
            const x = g.margin + i * (tw + gap);
            const y = g.margin + g.headerH + 1;
            return (
              <g key={i}>
                <rect x={x} y={y} width={tw} height={g.tilesH} fill="none" stroke={ink} strokeWidth={0.35} />
                <rect x={x} y={y} width={tw} height={Math.min(5, g.tilesH * 0.3)} fill={ink} opacity={0.12} />
                <text x={x + tw / 2} y={y + Math.min(5, g.tilesH * 0.3) * 0.7} fill={ink} fontFamily={font} fontWeight={600} fontSize={label(Math.min(5, g.tilesH * 0.3) * 0.6)} textAnchor="middle">{tile}</text>
              </g>
            );
          })
        : null}

      {/* Column heads */}
      {design.columns.map((col, i) => {
        const x = left + i * g.cellW;
        return (
          <g key={`c${i}`}>
            <rect x={x} y={colHeadTop} width={g.cellW} height={g.colHeadH} fill={ink} opacity={0.12} />
            <text x={x + g.cellW / 2} y={colHeadTop + g.colHeadH / 2 + headSize * 0.35} fill={ink} fontFamily={font} fontWeight={600} fontSize={headSize} textAnchor="middle">
              {col}
            </text>
          </g>
        );
      })}

      {/* Row labels and grid */}
      {rows.map((row, r) => {
        const y = gridTop + r * g.cellH;
        return (
          <g key={`r${r}`}>
            {g.labelW > 0 ? (
              <>
                <rect x={g.margin} y={y} width={g.labelW} height={g.cellH} fill={ink} opacity={r % 2 ? 0.04 : 0.08} />
                <text x={g.margin + 1.2} y={y + g.cellH / 2 + rowSize * 0.35} fill={ink} fontFamily={font} fontWeight={600} fontSize={rowSize}>{row}</text>
              </>
            ) : null}
            {design.columns.map((_, c) => (
              <rect key={c} x={left + c * g.cellW} y={y} width={g.cellW} height={g.cellH} fill="none" stroke={ink} strokeWidth={0.25} />
            ))}
          </g>
        );
      })}
      <rect x={g.margin} y={colHeadTop} width={g.innerW} height={g.colHeadH + g.cellH * rows.length} fill="none" stroke={ink} strokeWidth={0.45} />
    </Box>
  );
}

/** Edit a list of short labels: change, add, remove. */
function LabelList({
  legend,
  values,
  max,
  placeholder,
  onChange,
}: {
  legend: string;
  values: string[];
  max: number;
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
      <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>
        {legend} <Box component="span" sx={{ fontWeight: 400, color: brand.muted, fontSize: 14 }}>({values.length} of up to {max})</Box>
      </Typography>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {values.map((value, i) => (
          <Box key={i} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <TextField
              size="small"
              fullWidth
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
              slotProps={{ htmlInput: { maxLength: 24, "aria-label": `${legend} ${i + 1}` } }}
            />
            {values.length > 1 ? (
              <IconButton size="small" aria-label={`Remove ${legend.toLowerCase()} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}>
                <CloseIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
        ))}
      </Box>
      {values.length < max ? (
        <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => onChange([...values, ""])}>
          Add
        </Button>
      ) : null}
    </Box>
  );
}

export function PlannerStudio() {
  const searchParams = useSearchParams();
  const [design, setDesign] = useState<PlannerDesign>(
    () => decodePlanner(new URLSearchParams(searchParams.toString())) ?? defaultPlanner(plannerTemplates[0]),
  );
  const [copied, setCopied] = useState(false);
  const template = getPlannerTemplate(design.templateId) ?? plannerTemplates[0];
  const check = checkPlanner(template, design);
  const update = (patch: Partial<PlannerDesign>) => {
    setCopied(false);
    setDesign((prev) => ({ ...prev, ...patch }));
  };
  const size = plannerSizes.find((s) => s.id === design.sizeId)!;

  const quoteHref = `/quote?${new URLSearchParams({
    boardType: "Planning Board",
    product: template.name,
    customSize: size.label,
    quantity: String(design.quantity),
    colour: plannerInks.find((i) => i.id === design.inkId)!.name,
    branding: design.logo ? "Logo in header" : "",
    config: describePlanner(template, design),
    custom: "1",
  }).toString()}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/planning?${encodePlanner(design)}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1.25fr 1fr" }, alignItems: "start" }}>
      <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, display: "grid", gap: 1.5 }}>
        <Box sx={{ bgcolor: "#EEE9E1", borderRadius: `${brand.radius}px`, p: { xs: 2, md: 4 } }}>
          <PlannerPreview template={template} design={design} />
        </Box>
        <Typography sx={{ fontSize: 13, color: brand.muted }}>
          To scale: {size.label} ({size.widthCm} × {size.heightCm} cm). Printed grid on our magnetic whiteboard; you write over it with dry-wipe markers.
        </Typography>
        <Box sx={{ display: "grid", gap: 1 }} aria-live="polite">
          {check.results.map((r, i) => (
            <Alert key={i} severity={r.level === "error" ? "error" : r.level === "warning" ? "warning" : "info"}>{r.message}</Alert>
          ))}
          {check.results.length === 0 ? <Alert severity="success">This board can be printed as shown.</Alert> : null}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 3 }}>
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>Template</Typography>
          <Box sx={{ display: "grid", gap: 1 }}>
            {plannerTemplates.map((t) => {
              const on = t.id === template.id;
              return (
                <Box
                  key={t.id}
                  component="button"
                  type="button"
                  aria-pressed={on}
                  onClick={() => !on && setDesign(defaultPlanner(t))}
                  sx={{
                    textAlign: "left", p: 1.5, cursor: "pointer", font: "inherit", color: "inherit", bgcolor: brand.white,
                    border: `1px solid ${on ? brand.charcoal : brand.line}`, boxShadow: on ? `inset 0 0 0 1px ${brand.charcoal}` : "none",
                    borderRadius: `${brand.radius}px`,
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{t.name} <Box component="span" sx={{ ...signType.code, fontSize: 11, color: brand.signalInk, ml: 1 }}>{t.audience}</Box></Typography>
                  <Typography sx={{ fontSize: 14, color: brand.body }}>{t.summary}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>Board size</Typography>
          <ToggleButtonGroup exclusive value={design.sizeId} onChange={(_, v: PlannerSizeId | null) => v && update({ sizeId: v })} sx={{ flexWrap: "wrap" }}>
            {plannerSizes.map((s) => <ToggleButton key={s.id} value={s.id}>{s.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>

        <TextField label="Header title" value={design.title} onChange={(e) => update({ title: e.target.value })} slotProps={{ htmlInput: { maxLength: 40 } }} />

        {template.layout === "dashboard" ? (
          <LabelList legend="KPI tiles" values={design.tiles} max={6} placeholder="e.g. Output" onChange={(tiles) => update({ tiles })} />
        ) : null}
        <LabelList legend="Columns" values={design.columns} max={template.maxColumns} placeholder="e.g. Mon" onChange={(columns) => update({ columns })} />
        {template.layout !== "columns" ? (
          <LabelList legend="Rows" values={design.rows} max={template.maxRows} placeholder="Leave blank for a plain row" onChange={(rows) => update({ rows })} />
        ) : null}

        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, mb: 1 }}>Print colour</Typography>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {plannerInks.map((i) => (
              <Box
                key={i.id}
                component="button"
                type="button"
                aria-pressed={i.id === design.inkId}
                aria-label={i.name}
                title={i.name}
                onClick={() => update({ inkId: i.id })}
                sx={{
                  width: 40, height: 40, borderRadius: "50%", cursor: "pointer", bgcolor: i.hex, border: `1px solid ${brand.line}`,
                  outline: i.id === design.inkId ? `3px solid ${brand.charcoal}` : "none", outlineOffset: 2,
                  "&:focus-visible": { outline: `3px solid ${brand.forest}` },
                }}
              />
            ))}
          </Box>
        </Box>

        <FormControlLabel control={<Checkbox checked={design.logo} onChange={(e) => update({ logo: e.target.checked })} />} label="Print our logo in the header" />

        <TextField
          label="Quantity"
          type="number"
          value={design.quantity}
          onChange={(e) => update({ quantity: Math.floor(Number(e.target.value)) })}
          slotProps={{ htmlInput: { min: 1, max: 999, inputMode: "numeric" } }}
          sx={{ maxWidth: 160 }}
        />

        <Typography sx={{ fontSize: 14, color: brand.body }}>
          Goes well with: {template.suggestedAccessories.join(", ")}. Mention them in the quote, or see <Link href="/products?category=accessory">accessories</Link>.
        </Typography>

        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Priced on quote</Typography>
          <Typography sx={{ color: brand.body, fontSize: 15, mb: 2 }}>
            Made to order. We reply with a price and lead time, then send a print proof for you to approve.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {check.ok ? (
              <Button component={Link} href={quoteHref} variant="contained" size="large">Request a quote</Button>
            ) : (
              <Button variant="contained" size="large" disabled>Fix the issues above to request a quote</Button>
            )}
            <Button variant="outlined" size="large" onClick={copyLink}>{copied ? "Link copied" : "Copy link to this design"}</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
