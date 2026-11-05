import { getProductById } from "@/data/catalogue";
import type { CartConfiguration, CartItem, CombinationLayout, CombinationMaterialId } from "@/lib/types";

const MATERIAL_IDS = new Set<CombinationMaterialId>([
  "magnetic-whiteboard",
  "non-magnetic-whiteboard",
  "ceramic-steel",
  "fabric-softboard",
  "chalkboard",
]);

function sanitizeLayout(value: unknown): CombinationLayout | undefined {
  if (!value || typeof value !== "object") return undefined;
  const layout = value as Partial<CombinationLayout>;
  if (layout.mode !== "single" && layout.mode !== "combination") return undefined;
  if (!Array.isArray(layout.sections) || layout.sections.length === 0) return undefined;
  const sections = layout.sections.slice(0, 3).map((section, index) => ({
    id: String(section?.id ?? `section-${index + 1}`),
    materialId: MATERIAL_IDS.has(section?.materialId as CombinationMaterialId)
      ? (section.materialId as CombinationMaterialId)
      : ("magnetic-whiteboard" as CombinationMaterialId),
    percent: Math.max(1, Math.min(100, Number(section?.percent) || 1)),
  }));
  return {
    mode: layout.mode,
    orientation: layout.orientation === "horizontal" ? "horizontal" : "vertical",
    sections,
  };
}

export function cartLineId(productId: string, configuration: CartConfiguration) {
  const layout = configuration.combinationLayout;
  const layoutKey = layout
    ? `${layout.mode}:${layout.orientation}:${layout.sections.map((s) => `${s.materialId}:${s.percent}`).join("+")}`
    : "";
  return [
    productId,
    configuration.sizeId,
    configuration.frameId ?? "",
    configuration.colourId ?? "",
    (configuration.features ?? []).join("+"),
    configuration.branding ? "branded" : "",
    layoutKey,
  ].join("-");
}

export type SavedCartLine = {
  productId: string;
  quantity: number;
  configuration: CartConfiguration;
};

export function normalizeCartLines(input: unknown): SavedCartLine[] {
  if (!Array.isArray(input)) return [];
  const lines: SavedCartLine[] = [];
  for (const entry of input.slice(0, 40)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { productId?: unknown; quantity?: unknown; configuration?: CartConfiguration };
    const productId = String(record.productId ?? "");
    const product = getProductById(productId);
    const quantity = Number(record.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) continue;
    const configuration = (record.configuration ?? {}) as Partial<CartConfiguration>;
    lines.push({
      productId,
      quantity,
      configuration: {
        sizeId: String(configuration.sizeId ?? product.sizes[0]?.id ?? "standard"),
        frameId: configuration.frameId ?? product.frame,
        colourId: configuration.colourId ?? product.colours[0],
        features: Array.isArray(configuration.features) ? configuration.features.map(String).slice(0, 12) : [],
        customWidthFt: numberOrUndefined(configuration.customWidthFt),
        customHeightFt: numberOrUndefined(configuration.customHeightFt),
        branding: Boolean(configuration.branding),
        application: configuration.application,
        combinationLayout: sanitizeLayout(configuration.combinationLayout),
      },
    });
  }
  return lines;
}

export function mergeCartLines(saved: SavedCartLine[], guest: SavedCartLine[]) {
  const merged = new Map<string, SavedCartLine>();
  for (const line of [...saved, ...guest]) {
    const id = cartLineId(line.productId, line.configuration);
    const existing = merged.get(id);
    if (existing) existing.quantity = Math.min(99, existing.quantity + line.quantity);
    else merged.set(id, { ...line, configuration: { ...line.configuration } });
  }
  return [...merged.values()];
}

export function toCartItems(lines: SavedCartLine[]): CartItem[] {
  return lines.flatMap((line) => {
    const product = getProductById(line.productId);
    if (!product) return [];
    return [
      {
        id: cartLineId(line.productId, line.configuration),
        productId: line.productId,
        quantity: line.quantity,
        configuration: line.configuration,
        unitPrice: product.price,
      },
    ];
  });
}

function numberOrUndefined(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
