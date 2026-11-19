/**
 * Nameplates and signage: the second growth pillar of the Reimagination Program.
 *
 * Unlike boards, signage is quoted rather than sold at a list price. Prices and
 * lead times are not yet verified, so the studio collects a structured
 * specification and hands it to the quote flow. The rules below are the
 * "rules-based configurator" the program recommends launching first: they keep
 * customers inside what can be made, and flag anything that needs an
 * engineer's review.
 */

import { dominantScript, getTypesetLanguage, graphemeCount, scriptFontStack, scriptsIn, unsupportedCharacters } from "@/data/scripts";

export type SignFamilyId = "home" | "office" | "building";

export type SignMaterialId =
  | "acrylic-gloss"
  | "acrylic-frosted"
  | "ss-brushed"
  | "ss-gold-mirror"
  | "brass"
  | "aluminium-composite"
  | "wood-look";

export type LetteringId = "uv-print" | "laser-engraved" | "raised-acrylic" | "raised-metal";

export type MountingId = "standoff" | "screw" | "adhesive" | "desk-stand" | "door-slot";

export type SignLayout = "plate" | "number" | "desk" | "directory" | "wayfinding";

export type SignFontId = "modern" | "classic" | "bold";

export interface SignFamily {
  id: SignFamilyId;
  name: string;
  code: string;
  description: string;
}

export interface SignMaterial {
  id: SignMaterialId;
  name: string;
  description: string;
  /** Plate face colour and a second tone for the metallic sheen. */
  face: string;
  sheen?: string;
  /** Default lettering colour on this face. */
  ink: string;
  outdoor: boolean;
  /** Largest single panel we can cut from this sheet, in cm. */
  maxWidthCm: number;
  maxHeightCm: number;
  lettering: LetteringId[];
}

export interface SignSizePreset {
  widthCm: number;
  heightCm: number;
}

export interface SignType {
  id: string;
  family: SignFamilyId;
  name: string;
  description: string;
  layout: SignLayout;
  presets: SignSizePreset[];
  minWidthCm: number;
  maxWidthCm: number;
  minHeightCm: number;
  maxHeightCm: number;
  materials: SignMaterialId[];
  mountings: MountingId[];
  /** Placeholder lines shown in a fresh design. */
  sampleLines: string[];
  maxLines: number;
  /** Line labels for the text fields. */
  lineLabels: string[];
  /** Smallest cap height that reads at the usual viewing distance, in cm. */
  minLetterCm: number;
  outdoorByDefault: boolean;
  /** Typical order quantity: drives the "project order" hint. */
  typicalQuantity: number;
}

export const signFamilies: SignFamily[] = [
  {
    id: "home",
    name: "Home & villa nameplates",
    code: "Home",
    description: "Entrance nameplates, flat plates and house numbers in acrylic, steel, brass and wood-look finishes.",
  },
  {
    id: "office",
    name: "Office nameplates",
    code: "Office",
    description: "Desk plates, cabin door signs and reception logo signs that follow your company identity.",
  },
  {
    id: "building",
    name: "Building identification",
    code: "Building",
    description: "Tower directories, floor directories, flat numbers and wayfinding for societies and commercial buildings.",
  },
];

export const signMaterials: SignMaterial[] = [
  {
    id: "acrylic-gloss",
    name: "Gloss acrylic",
    description: "Clear-cast acrylic with a polished edge. Printed from behind for a glassy finish.",
    face: "#141816",
    sheen: "#2B312E",
    ink: "#F4F1EA",
    outdoor: true,
    maxWidthCm: 240,
    maxHeightCm: 120,
    lettering: ["uv-print", "laser-engraved", "raised-acrylic", "raised-metal"],
  },
  {
    id: "acrylic-frosted",
    name: "Frosted acrylic",
    description: "Soft matte acrylic, good for cabin doors and interiors.",
    face: "#E9ECEA",
    sheen: "#F7F8F7",
    ink: "#1B1D1C",
    outdoor: false,
    maxWidthCm: 240,
    maxHeightCm: 120,
    lettering: ["uv-print", "laser-engraved", "raised-acrylic"],
  },
  {
    id: "ss-brushed",
    name: "Brushed stainless steel",
    description: "Grade 304 steel with a fine brushed grain. Weather-resistant.",
    face: "#B9BDBE",
    sheen: "#E3E6E6",
    ink: "#1B1D1C",
    outdoor: true,
    maxWidthCm: 240,
    maxHeightCm: 120,
    lettering: ["laser-engraved", "raised-metal", "uv-print"],
  },
  {
    id: "ss-gold-mirror",
    name: "Gold mirror steel",
    description: "PVD gold-coated stainless steel with a mirror finish.",
    face: "#C9A24E",
    sheen: "#F1DC9C",
    ink: "#1B1D1C",
    outdoor: true,
    maxWidthCm: 120,
    maxHeightCm: 60,
    lettering: ["laser-engraved", "raised-metal"],
  },
  {
    id: "brass",
    name: "Solid brass",
    description: "Heavy brass plate that ages to a warm patina.",
    face: "#B58A3C",
    sheen: "#DDB86A",
    ink: "#1B1D1C",
    outdoor: true,
    maxWidthCm: 60,
    maxHeightCm: 45,
    lettering: ["laser-engraved", "raised-metal"],
  },
  {
    id: "aluminium-composite",
    name: "Aluminium composite (ACP)",
    description: "Rigid, light panels for large directories and wayfinding.",
    face: "#164E3B",
    sheen: "#1F6149",
    ink: "#FFFFFF",
    outdoor: true,
    maxWidthCm: 300,
    maxHeightCm: 150,
    lettering: ["uv-print", "raised-acrylic", "raised-metal"],
  },
  {
    id: "wood-look",
    name: "Wood-look laminate",
    description: "Teak-finish laminate on a moisture-resistant core. Indoor and covered entrances.",
    face: "#8A5A32",
    sheen: "#A87443",
    ink: "#F4EBDD",
    outdoor: false,
    maxWidthCm: 120,
    maxHeightCm: 60,
    lettering: ["laser-engraved", "uv-print", "raised-metal"],
  },
];

export const letteringOptions: { id: LetteringId; name: string; description: string }[] = [
  { id: "uv-print", name: "UV print", description: "Full-colour print. Best for logos and fine detail." },
  { id: "laser-engraved", name: "Laser engraved", description: "Cut into the surface. Permanent and understated." },
  { id: "raised-acrylic", name: "Raised acrylic letters", description: "Cut acrylic letters fixed to the face for depth." },
  { id: "raised-metal", name: "Raised metal letters", description: "Steel or brass letters standing off the plate." },
];

export const mountingOptions: { id: MountingId; name: string; description: string }[] = [
  { id: "standoff", name: "Steel standoffs", description: "Plate floats off the wall on four steel caps." },
  { id: "screw", name: "Concealed screws", description: "Flush fixing to wall or door." },
  { id: "adhesive", name: "VHB tape", description: "No drilling. For smooth, clean surfaces." },
  { id: "desk-stand", name: "Desk stand", description: "Free-standing on a weighted base." },
  { id: "door-slot", name: "Slot holder", description: "Changeable insert for cabins that change hands." },
];

export const signFonts: { id: SignFontId; name: string; stack: string; weight: number }[] = [
  {
    id: "modern",
    name: "Modern",
    stack: `var(--font-display), ${scriptFontStack}, Helvetica Neue, sans-serif`,
    weight: 500,
  },
  {
    id: "classic",
    name: "Classic serif",
    stack: `Georgia, 'Times New Roman', ${scriptFontStack}, serif`,
    weight: 400,
  },
  {
    id: "bold",
    name: "Bold",
    stack: `var(--font-display), ${scriptFontStack}, Helvetica Neue, sans-serif`,
    weight: 700,
  },
];

const allMaterials = signMaterials.map((m) => m.id);

export const signTypes: SignType[] = [
  // Home and villa
  {
    id: "villa-nameplate",
    family: "home",
    name: "Villa nameplate",
    description: "A family name and house name for the gate or main entrance.",
    layout: "plate",
    presets: [
      { widthCm: 45, heightCm: 30 },
      { widthCm: 60, heightCm: 30 },
      { widthCm: 60, heightCm: 40 },
    ],
    minWidthCm: 30,
    maxWidthCm: 120,
    minHeightCm: 15,
    maxHeightCm: 60,
    materials: ["acrylic-gloss", "ss-brushed", "ss-gold-mirror", "brass", "wood-look"],
    mountings: ["standoff", "screw"],
    sampleLines: ["The Sharmas", "Tulsi Villa", "B-12, Sector 21"],
    maxLines: 3,
    lineLabels: ["Name", "House name", "Address"],
    minLetterCm: 1.5,
    outdoorByDefault: true,
    typicalQuantity: 1,
  },
  {
    id: "flat-nameplate",
    family: "home",
    name: "Flat nameplate",
    description: "Compact door plate with a flat number and family name.",
    layout: "plate",
    presets: [
      { widthCm: 25, heightCm: 10 },
      { widthCm: 30, heightCm: 12 },
      { widthCm: 30, heightCm: 15 },
    ],
    minWidthCm: 15,
    maxWidthCm: 45,
    minHeightCm: 8,
    maxHeightCm: 25,
    materials: allMaterials.filter((m) => m !== "aluminium-composite"),
    mountings: ["standoff", "screw", "adhesive"],
    sampleLines: ["1204", "Iyer"],
    maxLines: 3,
    lineLabels: ["Flat number", "Family name", "Second line"],
    minLetterCm: 1,
    outdoorByDefault: false,
    typicalQuantity: 1,
  },
  {
    id: "house-number",
    family: "home",
    name: "House number",
    description: "A single bold number for gates, pillars and villa walls.",
    layout: "number",
    presets: [
      { widthCm: 20, heightCm: 20 },
      { widthCm: 30, heightCm: 20 },
      { widthCm: 30, heightCm: 30 },
    ],
    minWidthCm: 10,
    maxWidthCm: 60,
    minHeightCm: 10,
    maxHeightCm: 60,
    materials: ["acrylic-gloss", "ss-brushed", "ss-gold-mirror", "brass", "aluminium-composite"],
    mountings: ["standoff", "screw"],
    sampleLines: ["27"],
    maxLines: 1,
    lineLabels: ["Number"],
    minLetterCm: 5,
    outdoorByDefault: true,
    typicalQuantity: 1,
  },
  // Office
  {
    id: "desk-nameplate",
    family: "office",
    name: "Desk nameplate",
    description: "Name and designation on a free-standing desk plate.",
    layout: "desk",
    presets: [
      { widthCm: 20, heightCm: 6 },
      { widthCm: 25, heightCm: 7 },
      { widthCm: 30, heightCm: 8 },
    ],
    minWidthCm: 15,
    maxWidthCm: 40,
    minHeightCm: 5,
    maxHeightCm: 12,
    materials: ["acrylic-gloss", "acrylic-frosted", "ss-brushed", "ss-gold-mirror", "brass", "wood-look"],
    mountings: ["desk-stand"],
    sampleLines: ["Ananya Rao", "Head of Design"],
    maxLines: 2,
    lineLabels: ["Name", "Designation"],
    minLetterCm: 0.6,
    outdoorByDefault: false,
    typicalQuantity: 10,
  },
  {
    id: "cabin-door-sign",
    family: "office",
    name: "Cabin door sign",
    description: "Name, role or room name for cabins and meeting rooms.",
    layout: "plate",
    presets: [
      { widthCm: 25, heightCm: 8 },
      { widthCm: 30, heightCm: 10 },
      { widthCm: 30, heightCm: 15 },
    ],
    minWidthCm: 15,
    maxWidthCm: 45,
    minHeightCm: 6,
    maxHeightCm: 25,
    materials: ["acrylic-gloss", "acrylic-frosted", "ss-brushed", "ss-gold-mirror", "wood-look"],
    mountings: ["adhesive", "screw", "door-slot", "standoff"],
    sampleLines: ["Conference Room 2", "Seats 8"],
    maxLines: 2,
    lineLabels: ["Name or room", "Second line"],
    minLetterCm: 0.8,
    outdoorByDefault: false,
    typicalQuantity: 12,
  },
  {
    id: "reception-sign",
    family: "office",
    name: "Reception logo sign",
    description: "Company name or logo behind the reception desk.",
    layout: "plate",
    presets: [
      { widthCm: 90, heightCm: 30 },
      { widthCm: 120, heightCm: 40 },
      { widthCm: 180, heightCm: 60 },
    ],
    minWidthCm: 60,
    maxWidthCm: 300,
    minHeightCm: 20,
    maxHeightCm: 120,
    materials: ["acrylic-gloss", "acrylic-frosted", "ss-brushed", "ss-gold-mirror", "aluminium-composite", "wood-look"],
    mountings: ["standoff", "screw"],
    sampleLines: ["Northwind Studio", "Architecture & Interiors"],
    maxLines: 2,
    lineLabels: ["Company name", "Tagline"],
    minLetterCm: 3,
    outdoorByDefault: false,
    typicalQuantity: 1,
  },
  // Building identification
  {
    id: "tower-directory",
    family: "building",
    name: "Tower directory",
    description: "Lobby directory listing flats or tenants by floor.",
    layout: "directory",
    presets: [
      { widthCm: 60, heightCm: 90 },
      { widthCm: 75, heightCm: 120 },
      { widthCm: 90, heightCm: 150 },
    ],
    minWidthCm: 45,
    maxWidthCm: 150,
    minHeightCm: 60,
    maxHeightCm: 200,
    materials: ["acrylic-gloss", "ss-brushed", "aluminium-composite"],
    mountings: ["standoff", "screw"],
    sampleLines: ["Tower B", "12  ·  1201 – 1204", "11  ·  1101 – 1104", "10  ·  1001 – 1004", "9  ·  901 – 904", "8  ·  801 – 804"],
    maxLines: 16,
    lineLabels: ["Heading"],
    minLetterCm: 1.5,
    outdoorByDefault: false,
    typicalQuantity: 4,
  },
  {
    id: "floor-directory",
    family: "building",
    name: "Floor directory",
    description: "Lift-lobby plate showing the flats or offices on a floor.",
    layout: "directory",
    presets: [
      { widthCm: 40, heightCm: 30 },
      { widthCm: 45, heightCm: 45 },
      { widthCm: 60, heightCm: 45 },
    ],
    minWidthCm: 30,
    maxWidthCm: 90,
    minHeightCm: 25,
    maxHeightCm: 90,
    materials: ["acrylic-gloss", "acrylic-frosted", "ss-brushed", "aluminium-composite"],
    mountings: ["standoff", "screw", "adhesive"],
    sampleLines: ["Floor 7", "701  →", "702  →", "703  ←", "704  ←"],
    maxLines: 10,
    lineLabels: ["Heading"],
    minLetterCm: 1.2,
    outdoorByDefault: false,
    typicalQuantity: 12,
  },
  {
    id: "flat-number-plate",
    family: "building",
    name: "Flat number plate",
    description: "Uniform flat numbers for every door in a tower.",
    layout: "number",
    presets: [
      { widthCm: 15, heightCm: 10 },
      { widthCm: 20, heightCm: 12 },
    ],
    minWidthCm: 10,
    maxWidthCm: 30,
    minHeightCm: 8,
    maxHeightCm: 20,
    materials: ["acrylic-gloss", "acrylic-frosted", "ss-brushed", "ss-gold-mirror", "brass"],
    mountings: ["adhesive", "screw", "standoff"],
    sampleLines: ["A-1204"],
    maxLines: 1,
    lineLabels: ["Flat number"],
    minLetterCm: 2.5,
    outdoorByDefault: false,
    typicalQuantity: 48,
  },
  {
    id: "wayfinding-sign",
    family: "building",
    name: "Wayfinding sign",
    description: "Directional signs for parking, amenities, exits and towers.",
    layout: "wayfinding",
    presets: [
      { widthCm: 60, heightCm: 20 },
      { widthCm: 90, heightCm: 30 },
      { widthCm: 120, heightCm: 30 },
    ],
    minWidthCm: 30,
    maxWidthCm: 240,
    minHeightCm: 15,
    maxHeightCm: 90,
    materials: ["aluminium-composite", "acrylic-gloss", "ss-brushed"],
    mountings: ["standoff", "screw"],
    sampleLines: ["Clubhouse  →", "Towers A – D  ←"],
    maxLines: 4,
    lineLabels: ["First direction", "Second direction", "Third direction", "Fourth direction"],
    minLetterCm: 2.5,
    outdoorByDefault: true,
    typicalQuantity: 8,
  },
];

export function getSignType(id: string | null | undefined): SignType | undefined {
  return signTypes.find((t) => t.id === id);
}

export function getSignMaterial(id: string): SignMaterial {
  return signMaterials.find((m) => m.id === id) ?? signMaterials[0];
}

export function signTypesByFamily(family: SignFamilyId): SignType[] {
  return signTypes.filter((t) => t.family === family);
}

/* ------------------------------------------------------------------ */
/* Design state and rules                                              */
/* ------------------------------------------------------------------ */

export interface SignDesign {
  typeId: string;
  widthCm: number;
  heightCm: number;
  materialId: SignMaterialId;
  letteringId: LetteringId;
  mountingId: MountingId;
  fontId: SignFontId;
  lines: string[];
  outdoor: boolean;
  quantity: number;
  notes: string;
  /** Ask our typesetter to add a line in this language (e.g. "Hindi"); empty for none. */
  typesetLanguage: string;
}

export function defaultDesign(type: SignType): SignDesign {
  const material = getSignMaterial(type.materials[0]);
  return {
    typeId: type.id,
    widthCm: type.presets[0].widthCm,
    heightCm: type.presets[0].heightCm,
    materialId: material.id,
    letteringId: material.lettering[0],
    mountingId: type.mountings[0],
    fontId: "modern",
    lines: [...type.sampleLines],
    outdoor: type.outdoorByDefault && material.outdoor,
    quantity: type.typicalQuantity,
    notes: "",
    typesetLanguage: "",
  };
}


export interface SignTextLayout {
  /** Font size for each line, in cm. Roughly cap height ×1.4. */
  sizes: number[];
  /** Smallest cap height on the plate, in cm. */
  smallestCapCm: number;
  /** Line height of each line as a multiple of its font size (taller for Indian scripts). */
  lineGaps: number[];
}

/** Relative size of each line: the first line leads, the rest follow. */
export function lineRatios(layout: SignLayout, count: number): number[] {
  if (layout === "directory") return Array.from({ length: count }, (_, i) => (i === 0 ? 1.4 : 1));
  if (layout === "wayfinding") return Array.from({ length: count }, () => 1);
  return Array.from({ length: count }, (_, i) => (i === 0 ? 1 : 0.5));
}

/** Fit the lines inside the plate's safe area. Shared by the preview and the rules. */
export function layoutText(type: SignType, design: SignDesign): SignTextLayout {
  const lines = design.lines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { sizes: [], smallestCapCm: 0, lineGaps: [] };
  const scripts = lines.map(dominantScript);
  const lineGaps = scripts.map((script) => script.lineGap);
  const ratios = lineRatios(type.layout, lines.length);
  const pad = type.layout === "directory" ? 0.12 : 0.1;
  const availW = design.widthCm * (1 - pad * 2);
  const plateH = design.heightCm;
  const availH = plateH * (1 - pad * 2) * (type.layout === "directory" ? 0.92 : 1);

  const byHeight = availH / ratios.reduce((sum, r, i) => sum + r * lineGaps[i], 0);
  const byWidth = Math.min(
    ...lines.map((line, i) => availW / (Math.max(graphemeCount(line), 1) * scripts[i].glyphWidth * ratios[i])),
  );
  const cap = type.layout === "number" ? 0.75 : 0.6;
  const base = Math.min(byHeight, byWidth, plateH * cap);
  const sizes = ratios.map((r) => base * r);
  return { sizes, smallestCapCm: Math.min(...sizes) * 0.7, lineGaps };
}

export type RuleLevel = "error" | "warning" | "info";

export interface RuleResult {
  level: RuleLevel;
  message: string;
}

export type ProductionRoute = "configure-to-order" | "engineer-to-order";

export interface SignCheck {
  results: RuleResult[];
  route: ProductionRoute;
  /** True when nothing blocks a quote request. */
  ok: boolean;
}

export function checkDesign(type: SignType, design: SignDesign): SignCheck {
  const results: RuleResult[] = [];
  const material = getSignMaterial(design.materialId);
  const { widthCm: w, heightCm: h } = design;
  let engineered = false;

  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    results.push({ level: "error", message: "Enter a width and height in centimetres." });
  } else {
    if (w < type.minWidthCm || w > type.maxWidthCm || h < type.minHeightCm || h > type.maxHeightCm) {
      results.push({
        level: "error",
        message: `A ${type.name.toLowerCase()} can be ${type.minWidthCm}–${type.maxWidthCm} cm wide and ${type.minHeightCm}–${type.maxHeightCm} cm high.`,
      });
    }
    const fitsSheet =
      (w <= material.maxWidthCm && h <= material.maxHeightCm) ||
      (h <= material.maxWidthCm && w <= material.maxHeightCm);
    if (!fitsSheet) {
      results.push({
        level: "warning",
        message: `${material.name} comes in panels up to ${material.maxWidthCm} × ${material.maxHeightCm} cm. Larger signs are made in joined sections, which needs an engineer's review.`,
      });
      engineered = true;
    }
    if ((w * h) / 10000 > 1.5) {
      results.push({
        level: "info",
        message: "Signs over 1.5 m² need a site survey for fixings and wall load.",
      });
      engineered = true;
    }
  }

  if (!type.materials.includes(design.materialId)) {
    results.push({ level: "error", message: `${material.name} isn't offered for this sign.` });
  }
  if (!material.lettering.includes(design.letteringId)) {
    results.push({ level: "error", message: `${material.name} can't take this lettering. Pick another lettering style.` });
  }
  if (!type.mountings.includes(design.mountingId)) {
    results.push({ level: "error", message: "Choose a mounting offered for this sign." });
  }

  if (design.outdoor && !material.outdoor) {
    results.push({
      level: "error",
      message: `${material.name} isn't rated for outdoor use. Choose acrylic, steel, brass or ACP for an exposed wall.`,
    });
  }
  if (design.outdoor && design.mountingId === "adhesive") {
    results.push({ level: "warning", message: "Tape fixing is not reliable outdoors. Standoffs or screws are recommended." });
  }

  const lines = design.lines.map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    results.push({ level: "error", message: "Add the text for your sign." });
  } else {
    const bad = [...new Set(lines.flatMap(unsupportedCharacters))];
    if (bad.length > 0) {
      results.push({
        level: "error",
        message: `We can't letter ${bad.slice(0, 5).map((c) => `“${c}”`).join(" ")}. Use English or an Indian script; put logos and symbols in the notes.`,
      });
    }
    if (lines.some((line) => scriptsIn(line).length > 1)) {
      results.push({ level: "warning", message: "One line mixes two scripts. Bilingual signs read better with each language on its own line." });
    }
    const { smallestCapCm } = layoutText(type, design);
    if (smallestCapCm < type.minLetterCm) {
      results.push({
        level: "warning",
        message: `At this size the smallest letters are about ${smallestCapCm.toFixed(1)} cm tall, below the ${type.minLetterCm} cm we recommend. Shorten the text or enlarge the sign.`,
      });
    }
    if (design.letteringId === "raised-metal" || design.letteringId === "raised-acrylic") {
      const fussiest = lines.map(dominantScript).reduce((a, b) => (b.minRaisedCm > a.minRaisedCm ? b : a));
      if (smallestCapCm < fussiest.minRaisedCm) {
        results.push({
          level: "warning",
          message:
            fussiest.id === "latin"
              ? "Raised letters under 1.5 cm are fragile. Engraving or UV print suits small text better."
              : `Raised ${fussiest.name} letters under ${fussiest.minRaisedCm} cm lose their vowel signs and joins. Engraving or UV print suits this size better.`,
        });
      }
    }
  }

  const indian = [...new Set(lines.flatMap(scriptsIn))].filter((script) => script.id !== "latin");
  if (indian.length > 0 || design.typesetLanguage) {
    results.push({
      level: "info",
      message: design.typesetLanguage
        ? `Our typesetter will add the ${design.typesetLanguage} line and a native reader checks it. You approve it on the proof before we make the sign.`
        : `A native ${indian.map((s) => s.name).join(" and ")} reader checks the spelling and letter forms. You approve them on the proof.`,
    });
  }
  if (design.typesetLanguage && !getTypesetLanguage(design.typesetLanguage)) {
    results.push({ level: "error", message: "Choose a language from the list for the added line." });
  }

  if (!Number.isInteger(design.quantity) || design.quantity < 1) {
    results.push({ level: "error", message: "Quantity must be at least 1." });
  } else if (design.quantity >= 25) {
    results.push({
      level: "info",
      message: "This is a project order. We'll send one approval proof, then make every unit to that standard.",
    });
  }

  if (design.notes.trim().length > 0) {
    engineered = engineered || /illuminat|led|backlit|outdoor structure|pylon|totem/i.test(design.notes);
  }

  return {
    results,
    route: engineered ? "engineer-to-order" : "configure-to-order",
    ok: !results.some((r) => r.level === "error"),
  };
}

export function describeDesign(type: SignType, design: SignDesign): string {
  const material = getSignMaterial(design.materialId);
  const lettering = letteringOptions.find((l) => l.id === design.letteringId)?.name ?? design.letteringId;
  const mounting = mountingOptions.find((m) => m.id === design.mountingId)?.name ?? design.mountingId;
  const font = signFonts.find((f) => f.id === design.fontId)?.name ?? design.fontId;
  const text = design.lines.map((l) => l.trim()).filter(Boolean).join(" / ");
  return [
    type.name,
    `${design.widthCm} × ${design.heightCm} cm`,
    material.name,
    lettering,
    `${font} lettering`,
    mounting,
    design.outdoor ? "Outdoor" : "Indoor",
    `Text: ${text}`,
    ...(design.typesetLanguage ? [`Add a ${design.typesetLanguage} line (typeset by OBASIX)`] : []),
  ].join(" · ");
}

/* URL round-trip, so a design can be shared or reopened. */

export function encodeDesign(design: SignDesign): string {
  const params = new URLSearchParams({
    type: design.typeId,
    w: String(design.widthCm),
    h: String(design.heightCm),
    m: design.materialId,
    l: design.letteringId,
    mt: design.mountingId,
    f: design.fontId,
    o: design.outdoor ? "1" : "0",
    q: String(design.quantity),
  });
  if (design.typesetLanguage) params.set("tl", design.typesetLanguage);
  design.lines.forEach((line) => params.append("t", line));
  return params.toString();
}

export function decodeDesign(params: URLSearchParams): SignDesign | null {
  const type = getSignType(params.get("type"));
  if (!type) return null;
  const base = defaultDesign(type);
  const num = (key: string, fallback: number) => {
    const value = Number(params.get(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const materialId = params.get("m") as SignMaterialId | null;
  const material = materialId && type.materials.includes(materialId) ? getSignMaterial(materialId) : getSignMaterial(base.materialId);
  const letteringId = params.get("l") as LetteringId | null;
  const mountingId = params.get("mt") as MountingId | null;
  const fontId = params.get("f") as SignFontId | null;
  const lines = params.getAll("t").slice(0, type.maxLines).map((l) => l.slice(0, 60));
  return {
    ...base,
    widthCm: num("w", base.widthCm),
    heightCm: num("h", base.heightCm),
    materialId: material.id,
    letteringId: letteringId && material.lettering.includes(letteringId) ? letteringId : material.lettering[0],
    mountingId: mountingId && type.mountings.includes(mountingId) ? mountingId : base.mountingId,
    fontId: fontId && signFonts.some((f) => f.id === fontId) ? fontId : base.fontId,
    outdoor: params.has("o") ? params.get("o") === "1" : base.outdoor,
    quantity: Math.max(1, Math.round(num("q", base.quantity))),
    lines: lines.length > 0 ? lines : base.lines,
    typesetLanguage: getTypesetLanguage(params.get("tl") ?? "")?.language ?? "",
  };
}
