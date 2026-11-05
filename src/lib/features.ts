import { featureOptions } from "@/data/catalogue";
import type { Product } from "@/lib/types";

export const customizeFeatureIds = [
  "magnetic-surface",
  "marker-tray",
  "calendar-section",
  "custom-layout",
  "special-mounting",
] as const;

export function featureName(id: string) {
  return featureOptions.find((feature) => feature.id === id)?.name ?? id;
}

export function featureOption(id: string) {
  return featureOptions.find((feature) => feature.id === id);
}

function boardTypeOf(product: Product) {
  return product.boardType ?? "whiteboard";
}

export function featureCanToggle(product: Product, id: string) {
  if (id === "magnetic-surface") return false;
  const feature = featureOption(id);
  if (!feature) return false;
  return feature.boardTypes.includes(boardTypeOf(product));
}

export function featureNote(product: Product, id: string) {
  if (id === "magnetic-surface") {
    return product.magnetic
      ? "Included. This board is magnetic in the catalogue."
      : "Not available. This board is not magnetic in the catalogue.";
  }
  if (!featureCanToggle(product, id)) return "Not listed for this board.";
  return undefined;
}

export function defaultFeatureIds(product: Product) {
  const ids: string[] = [];
  if (product.magnetic) ids.push("magnetic-surface");
  if (featureCanToggle(product, "marker-tray")) ids.push("marker-tray");
  return ids;
}

export function normalizeFeatureIds(product: Product, ids: string[]) {
  const next = new Set<string>();
  if (product.magnetic) next.add("magnetic-surface");
  ids.forEach((id) => {
    if (id === "logo-branding" || featureCanToggle(product, id)) next.add(id);
  });
  return Array.from(next);
}
