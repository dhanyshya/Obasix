import { products } from "@/data/catalogue";
import type {
  CombinationLayout,
  CombinationMaterialId,
  Product,
  SplitOrientation,
  SurfaceType,
} from "@/lib/types";

export type { CombinationLayout, CombinationMaterialId, SplitOrientation };

export type CombinationMaterial = {
  id: CombinationMaterialId;
  label: string;
  shortLabel: string;
  description: string;
  /** CSS background for preview swatches */
  preview: string;
  surface: SurfaceType;
};

const FT_TO_MM = 304.8;
const MIN_SECTION_PERCENT = 10;
const MAX_SECTIONS = 3;

const MATERIAL_DEFS: CombinationMaterial[] = [
  {
    id: "magnetic-whiteboard",
    label: "Magnetic whiteboard",
    shortLabel: "Magnetic WB",
    description: "Resin-coated magnetic dry-erase surface from the OBASIX catalogue.",
    preview: "linear-gradient(180deg,#FBFBFB 0%,#F0F0EE 100%)",
    surface: "resin-coated",
  },
  {
    id: "non-magnetic-whiteboard",
    label: "Non-magnetic whiteboard",
    shortLabel: "Non-magnetic WB",
    description: "Melamine HPL writing surface listed for non-magnetic boards.",
    preview: "linear-gradient(180deg,#FFFFFF 0%,#F5F5F3 100%)",
    surface: "melamine-hpl",
  },
  {
    id: "ceramic-steel",
    label: "Ceramic steel whiteboard",
    shortLabel: "Ceramic steel",
    description: "Ceramic-coated steel surface from the OBASIX ceramic range.",
    preview: "linear-gradient(180deg,#FFFFFF 0%,#EEF2F4 100%)",
    surface: "ceramic-steel",
  },
  {
    id: "fabric-softboard",
    label: "Fabric notice / pinboard",
    shortLabel: "Notice / pinboard",
    description: "High-density fabric softboard used on OBASIX notice and pin-up boards.",
    preview: "repeating-linear-gradient(135deg,#8A8F93 0 2px,#9AA0A4 2px 4px)",
    surface: "fabric-softboard",
  },
  {
    id: "chalkboard",
    label: "Chalkboard",
    shortLabel: "Chalkboard",
    description: "Chalk writing surface listed on OBASIX chalk and dual boards.",
    preview: "linear-gradient(180deg,#2F4A3A 0%,#24382C 100%)",
    surface: "chalkboard",
  },
];

function catalogueHasMaterial(id: CombinationMaterialId) {
  return products.some((product) => {
    if (id === "magnetic-whiteboard") {
      return product.magnetic && (product.surface === "resin-coated" || product.category === "magnetic-whiteboard");
    }
    if (id === "non-magnetic-whiteboard") {
      return !product.magnetic && product.surface === "melamine-hpl";
    }
    if (id === "ceramic-steel") return product.surface === "ceramic-steel";
    if (id === "fabric-softboard") {
      return (
        product.surface === "fabric-softboard" ||
        product.category === "notice-board" ||
        product.category === "pin-up-board"
      );
    }
    if (id === "chalkboard") {
      return product.surface === "chalkboard" || product.category === "chalk-board";
    }
    return false;
  });
}

export function availableCombinationMaterials(): CombinationMaterial[] {
  return MATERIAL_DEFS.filter((material) => catalogueHasMaterial(material.id));
}

export function getCombinationMaterial(id: CombinationMaterialId) {
  return availableCombinationMaterials().find((material) => material.id === id) ?? availableCombinationMaterials()[0];
}

/** Boards that can open the combination designer (customizable writing surfaces). */
export function supportsCombinationDesigner(product: Product) {
  if (!product.customizable || product.sizes.length === 0) return false;
  return [
    "magnetic-whiteboard",
    "non-magnetic-whiteboard",
    "notice-board",
    "pin-up-board",
    "combination-board",
    "chalk-board",
    "wooden-product",
  ].includes(product.category);
}

export function materialIdForProduct(product: Product): CombinationMaterialId {
  if (product.surface === "ceramic-steel") return "ceramic-steel";
  if (product.surface === "fabric-softboard") return "fabric-softboard";
  if (product.surface === "chalkboard") return "chalkboard";
  if (product.surface === "melamine-hpl" || (!product.magnetic && product.category === "non-magnetic-whiteboard")) {
    return "non-magnetic-whiteboard";
  }
  if (product.surface === "dual-side") {
    return product.magnetic ? "magnetic-whiteboard" : "non-magnetic-whiteboard";
  }
  return product.magnetic ? "magnetic-whiteboard" : "non-magnetic-whiteboard";
}

export function defaultCombinationLayout(product: Product): CombinationLayout {
  const materialId = materialIdForProduct(product);
  return {
    mode: "single",
    orientation: "vertical",
    sections: [{ id: "section-a", materialId, percent: 100 }],
  };
}

export function defaultCombinationSplit(product: Product): CombinationLayout {
  const materials = availableCombinationMaterials();
  const primary = materialIdForProduct(product);
  const secondary =
    materials.find((material) => material.id === "fabric-softboard" && material.id !== primary)?.id ??
    materials.find((material) => material.id !== primary)?.id ??
    primary;
  return {
    mode: "combination",
    orientation: "vertical",
    sections: [
      { id: "section-a", materialId: primary, percent: 50 },
      { id: "section-b", materialId: secondary, percent: 50 },
    ],
  };
}

export function normalizeLayout(
  layout: CombinationLayout | null | undefined,
  product: Product,
): CombinationLayout {
  if (!layout || !layout.mode) {
    return defaultCombinationLayout(product);
  }
  const materials = availableCombinationMaterials();
  const fallback = materialIdForProduct(product);
  if (layout.mode === "single") {
    return {
      mode: "single",
      orientation: layout.orientation,
      sections: [{ id: "section-a", materialId: fallback, percent: 100 }],
    };
  }

  let sections = layout.sections.slice(0, MAX_SECTIONS).map((section, index) => ({
    id: section.id || `section-${index + 1}`,
    materialId: materials.some((material) => material.id === section.materialId) ? section.materialId : fallback,
    percent: Math.max(MIN_SECTION_PERCENT, Math.round(section.percent)),
  }));

  if (sections.length < 2) {
    return defaultCombinationSplit(product);
  }

  const total = sections.reduce((sum, section) => sum + section.percent, 0);
  if (total !== 100) {
    const scale = 100 / total;
    sections = sections.map((section) => ({
      ...section,
      percent: Math.max(MIN_SECTION_PERCENT, Math.round(section.percent * scale)),
    }));
    const adjusted = sections.reduce((sum, section) => sum + section.percent, 0);
    sections[sections.length - 1] = {
      ...sections[sections.length - 1],
      percent: Math.max(MIN_SECTION_PERCENT, sections[sections.length - 1].percent + (100 - adjusted)),
    };
  }

  return {
    mode: "combination",
    orientation: layout.orientation === "horizontal" ? "horizontal" : "vertical",
    sections,
  };
}

/** Custom multi-surface layouts are not priced SKUs — quote only. */
export function combinationRequiresQuote(layout: CombinationLayout) {
  return layout.mode === "combination";
}

export function sectionDimensionLabel(
  widthFt: number,
  heightFt: number,
  orientation: SplitOrientation,
  percent: number,
) {
  const widthMm = Math.round(widthFt * FT_TO_MM);
  const heightMm = Math.round(heightFt * FT_TO_MM);
  if (orientation === "vertical") {
    const sectionWidth = Math.round((widthMm * percent) / 100);
    return `≈ ${sectionWidth} × ${heightMm} mm`;
  }
  const sectionHeight = Math.round((heightMm * percent) / 100);
  return `≈ ${widthMm} × ${sectionHeight} mm`;
}

export function layoutSummary(layout: CombinationLayout) {
  if (layout.mode === "single") {
    const material = getCombinationMaterial(layout.sections[0]?.materialId ?? "magnetic-whiteboard");
    return `Single surface · ${material.label}`;
  }
  const parts = layout.sections.map((section) => {
    const material = getCombinationMaterial(section.materialId);
    return `${section.percent}% ${material.shortLabel}`;
  });
  return `${layout.orientation} split · ${parts.join(" + ")}`;
}

export function encodeLayout(layout: CombinationLayout) {
  const body = layout.sections.map((section) => `${section.materialId}:${section.percent}`).join(",");
  return `${layout.mode}|${layout.orientation}|${body}`;
}

export function decodeLayout(raw: string | null | undefined, product: Product): CombinationLayout | null {
  if (!raw) return null;
  const [mode, orientation, body] = raw.split("|");
  if (mode !== "single" && mode !== "combination") return null;
  if (!body) return defaultCombinationLayout(product);
  const sections = body.split(",").map((part, index) => {
    const [materialId, percentRaw] = part.split(":");
    return {
      id: `section-${index + 1}`,
      materialId: materialId as CombinationMaterialId,
      percent: Number(percentRaw) || MIN_SECTION_PERCENT,
    };
  });
  return normalizeLayout(
    {
      mode,
      orientation: orientation === "horizontal" ? "horizontal" : "vertical",
      sections,
    },
    product,
  );
}

export function setSectionPercent(layout: CombinationLayout, sectionId: string, percent: number): CombinationLayout {
  if (layout.mode !== "combination" || layout.sections.length < 2) return layout;
  const index = layout.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return layout;

  const others = layout.sections.filter((_, i) => i !== index);
  const minOthers = others.length * MIN_SECTION_PERCENT;
  const nextPercent = Math.min(100 - minOthers, Math.max(MIN_SECTION_PERCENT, Math.round(percent)));
  const remaining = 100 - nextPercent;
  const otherTotal = others.reduce((sum, section) => sum + section.percent, 0) || others.length;
  const nextOthers = others.map((section) => ({
    ...section,
    percent: Math.max(MIN_SECTION_PERCENT, Math.round((section.percent / otherTotal) * remaining)),
  }));
  const drift = remaining - nextOthers.reduce((sum, section) => sum + section.percent, 0);
  if (nextOthers.length) {
    nextOthers[nextOthers.length - 1] = {
      ...nextOthers[nextOthers.length - 1],
      percent: nextOthers[nextOthers.length - 1].percent + drift,
    };
  }

  const sections = layout.sections.map((section) => {
    if (section.id === sectionId) return { ...section, percent: nextPercent };
    return nextOthers.find((item) => item.id === section.id) ?? section;
  });

  return { ...layout, sections };
}

export function addSection(layout: CombinationLayout, product: Product): CombinationLayout {
  if (layout.sections.length >= MAX_SECTIONS) return layout;
  const materials = availableCombinationMaterials();
  const used = new Set(layout.sections.map((section) => section.materialId));
  const nextMaterial =
    materials.find((material) => !used.has(material.id))?.id ?? materialIdForProduct(product);
  const share = Math.floor(100 / (layout.sections.length + 1));
  const sections = [
    ...layout.sections.map((section) => ({ ...section, percent: share })),
    {
      id: `section-${layout.sections.length + 1}`,
      materialId: nextMaterial,
      percent: 100 - share * layout.sections.length,
    },
  ];
  return normalizeLayout({ ...layout, mode: "combination", sections }, product);
}

export function removeSection(layout: CombinationLayout, sectionId: string, product: Product): CombinationLayout {
  if (layout.sections.length <= 2) return layout;
  const sections = layout.sections.filter((section) => section.id !== sectionId);
  return normalizeLayout({ ...layout, sections }, product);
}

export { MIN_SECTION_PERCENT, MAX_SECTIONS };
