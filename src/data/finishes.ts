import type { FinishOption } from "@/lib/types";

export const finishes: FinishOption[] = [
  {
    id: "matte",
    name: "Matte",
    type: "matte",
    description: "Soft, low-sheen surface ideal for modern interiors.",
  },
  {
    id: "gloss",
    name: "Gloss",
    type: "gloss",
    description: "High-shine finish that enhances colour depth and light.",
  },
  {
    id: "wood-finish",
    name: "Wood Finish",
    type: "wood",
    description: "Natural wood grain character with premium tactile feel.",
  },
  {
    id: "textured",
    name: "Textured",
    type: "textured",
    description: "Subtle surface texture for depth and fingerprint resistance.",
  },
  {
    id: "laminate",
    name: "Laminate",
    type: "laminate",
    description: "Durable, easy-clean surface for high-use spaces.",
  },
  {
    id: "veneer",
    name: "Veneer",
    type: "veneer",
    description: "Real wood veneer for elevated furniture applications.",
  },
];

export function getFinishById(id: string): FinishOption | undefined {
  return finishes.find((f) => f.id === id);
}
