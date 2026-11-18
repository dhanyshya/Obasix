import {
  getSignMaterial,
  layoutText,
  lineRatios,
  signFonts,
  type SignDesign,
  type SignType,
} from "@/data/signage";

const U = 10; // SVG units per centimetre

/**
 * A to-scale drawing of a sign. Pure SVG with no hooks, so it renders on the
 * server for catalogue thumbnails and live in the studio.
 */
export function SignPreview({
  type,
  design,
  idPrefix,
  title,
}: {
  type: SignType;
  design: SignDesign;
  /** Unique per instance on a page, for gradient ids. */
  idPrefix: string;
  title?: string;
}) {
  const material = getSignMaterial(design.materialId);
  const font = signFonts.find((f) => f.id === design.fontId) ?? signFonts[0];
  const w = Math.max(design.widthCm, 1) * U;
  const h = Math.max(design.heightCm, 1) * U;
  const isDesk = type.layout === "desk";
  const baseH = isDesk ? h * 0.35 : 0;
  const margin = Math.max(w, h) * 0.06;
  const vbW = w + margin * 2;
  const vbH = h + baseH + margin * 2;
  const radius = Math.min(w, h) * (type.layout === "number" ? 0.08 : 0.04);
  const lines = design.lines.map((l) => l.trim()).filter(Boolean);
  const { sizes } = layoutText(type, design);
  const ratios = lineRatios(type.layout, lines.length);
  const gid = `${idPrefix}-face`;
  const engraved = design.letteringId === "laser-engraved";
  const raised = design.letteringId === "raised-acrylic" || design.letteringId === "raised-metal";
  const ink = engraved ? shade(material.face, -0.35) : material.ink;

  // Vertical placement: block centred, line heights scaled by LINE_GAP.
  const lineHeights = sizes.map((s) => s * U * 1.3);
  const block = lineHeights.reduce((a, b) => a + b, 0);
  const left = type.layout === "directory" || type.layout === "wayfinding";
  const textX = left ? margin + w * 0.12 : margin + w / 2;
  const top = margin + (h - block) / 2;
  const baselines = lineHeights.map((lh, i) => top + lineHeights.slice(0, i).reduce((a, b) => a + b, 0) + lh * 0.78);

  const standoffs =
    design.mountingId === "standoff"
      ? [
          [margin + w * 0.06, margin + h * 0.1],
          [margin + w * 0.94, margin + h * 0.1],
          [margin + w * 0.06, margin + h * 0.9],
          [margin + w * 0.94, margin + h * 0.9],
        ]
      : [];
  const capR = Math.min(w, h) * 0.025;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-label={title ?? `${type.name} preview: ${lines.join(", ")}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={material.sheen ?? material.face} />
          <stop offset="0.45" stopColor={material.face} />
          <stop offset="1" stopColor={shade(material.face, -0.12)} />
        </linearGradient>
      </defs>

      {/* Wall shadow */}
      <rect
        x={margin + w * 0.015}
        y={margin + h * 0.03}
        width={w}
        height={h}
        rx={radius}
        fill="#000"
        opacity={design.mountingId === "standoff" ? 0.14 : 0.08}
      />
      <rect x={margin} y={margin} width={w} height={h} rx={radius} fill={`url(#${gid})`} />
      <rect
        x={margin}
        y={margin}
        width={w}
        height={h}
        rx={radius}
        fill="none"
        stroke={shade(material.face, -0.25)}
        strokeOpacity={0.5}
        strokeWidth={Math.max(w, h) * 0.003}
      />

      {isDesk ? (
        <path
          d={`M ${margin + w * 0.08} ${margin + h} L ${margin + w * 0.92} ${margin + h} L ${margin + w * 0.98} ${margin + h + baseH} L ${margin + w * 0.02} ${margin + h + baseH} Z`}
          fill="#2A2D2B"
        />
      ) : null}

      {type.layout === "directory" && lines.length > 1 ? (
        <line
          x1={margin + w * 0.12}
          x2={margin + w * 0.88}
          y1={margin + (h - block) / 2 + lineHeights[0] * 1.02}
          y2={margin + (h - block) / 2 + lineHeights[0] * 1.02}
          stroke={ink}
          strokeOpacity={0.45}
          strokeWidth={Math.max(h * 0.002, 1)}
        />
      ) : null}

      {lines.map((line, i) => {
        const size = sizes[i] * U;
        const y = baselines[i];
        const weight =
          type.layout === "directory" && i > 0
            ? 400
            : ratios[i] < 1 && type.layout !== "wayfinding"
              ? Math.max(font.weight - 100, 400)
              : font.weight;
        return (
          <text
            key={`${i}-${line}`}
            x={textX}
            y={y}
            textAnchor={left ? "start" : "middle"}
            fontFamily={font.stack}
            fontWeight={weight}
            fontSize={size}
            fill={ink}
            letterSpacing={type.layout === "number" ? size * -0.02 : 0}
            style={raised ? { filter: "drop-shadow(0 0.6px 0.6px rgba(0,0,0,0.35))" } : undefined}
          >
            {line}
          </text>
        );
      })}

      {standoffs.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={capR} fill="#D9DCDC" />
          <circle cx={cx - capR * 0.25} cy={cy - capR * 0.25} r={capR * 0.45} fill="#F5F6F6" />
        </g>
      ))}
    </svg>
  );
}

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(Math.min(255, Math.max(0, amount < 0 ? c * (1 + amount) : c + (255 - c) * amount))),
  );
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
