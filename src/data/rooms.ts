import type { RoomSpace } from "@/lib/types";

export const rooms: RoomSpace[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    description: "Moisture-ready boards, clean finishes and durable work surfaces.",
    image:
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-aqua-shield", "obx-acrylic-glow", "obx-premium-board"],
    suggestedColours: ["pure-white", "ivory", "ash-grey", "sage"],
    suggestedFinishes: ["matte", "gloss", "laminate"],
    accessories: ["edge-band-premium", "sink-support", "hinge-set"],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    description: "Warm wood tones and soft finishes for restful spaces.",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-woodline", "obx-premium-board", "obx-laminate-pro"],
    suggestedColours: ["light-oak", "walnut", "warm-sand", "ivory"],
    suggestedFinishes: ["wood-finish", "matte", "veneer"],
    accessories: ["edge-band-wood", "handle-kit", "shelf-support"],
  },
  {
    id: "living",
    name: "Living Room",
    description: "Feature walls, media units and refined furniture planes.",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-wallform", "obx-woodline", "obx-acrylic-glow"],
    suggestedColours: ["walnut", "charcoal", "light-oak", "slate"],
    suggestedFinishes: ["wood-finish", "matte", "textured"],
    accessories: ["wall-clip", "edge-band-wood"],
  },
  {
    id: "office",
    name: "Office",
    description: "Durable, professional boards for desks and commercial systems.",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-structura", "obx-laminate-pro", "obx-premium-board"],
    suggestedColours: ["ash-grey", "charcoal", "pure-white", "slate"],
    suggestedFinishes: ["matte", "laminate", "textured"],
    accessories: ["hardware-kit", "partition-clip"],
  },
  {
    id: "wardrobe",
    name: "Wardrobe",
    description: "Smooth interiors and expressive shutters for organised storage.",
    image:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-woodline", "obx-premium-board", "obx-laminate-pro"],
    suggestedColours: ["light-oak", "ivory", "walnut", "ash-grey"],
    suggestedFinishes: ["wood-finish", "matte", "laminate"],
    accessories: ["hinge-set", "handle-kit", "shelf-support", "edge-band-premium"],
  },
  {
    id: "commercial",
    name: "Commercial Space",
    description: "Scalable board solutions for retail, hospitality and workplaces.",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    recommendedProductIds: ["obx-structura", "obx-wallform", "obx-acrylic-glow"],
    suggestedColours: ["charcoal", "slate", "pure-white", "forest-mist"],
    suggestedFinishes: ["matte", "gloss", "laminate", "textured"],
    accessories: ["partition-clip", "hardware-kit", "wall-clip"],
  },
];

export function getRoomById(id: string): RoomSpace | undefined {
  return rooms.find((r) => r.id === id);
}
