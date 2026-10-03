import type { ColourSwatch } from "@/lib/types";

export const colours: ColourSwatch[] = [
  { id: "light-oak", name: "Light Oak", hex: "#D4B896", family: "wood" },
  { id: "walnut", name: "Walnut", hex: "#5C3A21", family: "wood" },
  { id: "teak", name: "Teak", hex: "#B8860B", family: "wood" },
  { id: "ash-grey", name: "Ash Grey", hex: "#A8A29E", family: "neutral" },
  { id: "ivory", name: "Ivory", hex: "#F5F0E6", family: "neutral" },
  { id: "pure-white", name: "Pure White", hex: "#F8F8F6", family: "neutral" },
  { id: "charcoal", name: "Charcoal", hex: "#2F2F2F", family: "neutral" },
  { id: "slate", name: "Slate", hex: "#5B6770", family: "cool" },
  { id: "sage", name: "Sage", hex: "#8A9A7B", family: "cool" },
  { id: "forest-mist", name: "Forest Mist", hex: "#2D5A3D", family: "cool" },
  { id: "warm-sand", name: "Warm Sand", hex: "#C4A574", family: "wood" },
  { id: "espresso", name: "Espresso", hex: "#3B2416", family: "wood" },
];

export function getColourById(id: string): ColourSwatch | undefined {
  return colours.find((c) => c.id === id);
}
