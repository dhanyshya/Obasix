import { getProductById } from "@/data/catalogue";
import { images } from "@/data/images";
import { defaultDesign, encodeDesign, getSignType } from "@/data/signage";

/**
 * Solution kits from the Reimagination Program: one package per space, scaled by a unit
 * (a meeting room, a classroom, a home). Catalogue boards are priced and go straight to the cart;
 * signage is made to order, so it's quoted and designed in the sign studio.
 */

export type KitScope = "unit" | "kit";

export interface KitProductLine {
  productId: string;
  /** "unit" lines multiply by the number of rooms or homes; "kit" lines are bought once. */
  per: KitScope;
  quantity: number;
  role: string;
  optional?: boolean;
}

export interface KitSignLine {
  typeId: string;
  per: KitScope;
  quantity: number;
  role: string;
  lines?: string[];
  optional?: boolean;
}

export interface Kit {
  id: string;
  name: string;
  audience: string;
  headline: string;
  summary: string;
  image: string;
  unit: { singular: string; plural: string };
  defaultUnits: number;
  maxUnits: number;
  /** At or above this many units, the order is a project: we suggest a quote for project pricing. */
  projectThreshold: number;
  products: KitProductLine[];
  signs: KitSignLine[];
}

export const kits: Kit[] = [
  {
    id: "workplace",
    name: "Workplace Kit",
    audience: "Offices, co-working and corporate fit-outs",
    headline: "Every meeting room planned, labelled and ready",
    summary:
      "A magnetic board, accessories and a door sign for each meeting room, plus a reception sign and a mobile board for the floor.",
    image: images.wallModernOffice,
    unit: { singular: "meeting room", plural: "meeting rooms" },
    defaultUnits: 4,
    maxUnits: 200,
    projectThreshold: 10,
    products: [
      { productId: "smwbpcb90120", per: "unit", quantity: 1, role: "Wall board for each room" },
      { productId: "marker-holder-black", per: "unit", quantity: 1, role: "Marker and duster holder" },
      { productId: "magnets-40mm", per: "unit", quantity: 1, role: "Magnets for printouts and plans" },
      { productId: "mobile-3x4", per: "kit", quantity: 1, role: "Mobile board for open-floor sessions", optional: true },
    ],
    signs: [
      { typeId: "cabin-door-sign", per: "unit", quantity: 1, role: "Room name on each door", lines: ["Meeting Room", "Seats 8"] },
      { typeId: "reception-sign", per: "kit", quantity: 1, role: "Company name at reception", optional: true },
    ],
  },
  {
    id: "education",
    name: "Education Kit",
    audience: "Schools, colleges and coaching institutes",
    headline: "Classrooms fitted out in one order",
    summary:
      "A large writing board, a pin-up board for notices and student work, and accessories for each classroom, with door signs and wayfinding for the building.",
    image: images.wallClassroom,
    unit: { singular: "classroom", plural: "classrooms" },
    defaultUnits: 6,
    maxUnits: 300,
    projectThreshold: 10,
    products: [
      { productId: "cmwb90120", per: "unit", quantity: 1, role: "Teaching board" },
      { productId: "spbpcbg6090", per: "unit", quantity: 1, role: "Pin-up board for notices and work" },
      { productId: "marker-holder-white", per: "unit", quantity: 1, role: "Marker and duster holder" },
      { productId: "magnets-40mm", per: "unit", quantity: 1, role: "Magnets for charts" },
      { productId: "mobile-3x4", per: "kit", quantity: 1, role: "Mobile board for labs and halls", optional: true },
    ],
    signs: [
      { typeId: "cabin-door-sign", per: "unit", quantity: 1, role: "Classroom name or number", lines: ["Class 6A", "Room 104"] },
      { typeId: "wayfinding-sign", per: "kit", quantity: 2, role: "Wayfinding to office, labs and exits", optional: true },
    ],
  },
  {
    id: "residential",
    name: "Residential Identity Kit",
    audience: "Homeowners, builders and housing societies",
    headline: "A home's name, number and study wall",
    summary:
      "A nameplate and house number at the entrance, with a compact board and pin-up for the study. Builders can scale it across every unit in a project.",
    image: images.wallHomeOffice,
    unit: { singular: "home", plural: "homes" },
    defaultUnits: 1,
    maxUnits: 500,
    projectThreshold: 10,
    products: [
      { productId: "cmwb4560", per: "unit", quantity: 1, role: "Study board" },
      { productId: "cpbb3060", per: "unit", quantity: 1, role: "Pin-up for notes and schedules", optional: true },
    ],
    signs: [
      { typeId: "flat-nameplate", per: "unit", quantity: 1, role: "Family nameplate at the door" },
      { typeId: "house-number", per: "unit", quantity: 1, role: "House or flat number" },
    ],
  },
];

export function getKit(id: string) {
  return kits.find((kit) => kit.id === id);
}

export function lineQuantity(line: { per: KitScope; quantity: number }, units: number) {
  return line.per === "unit" ? line.quantity * units : line.quantity;
}

/** A sign studio link pre-filled with the kit's suggested text and quantity. */
export function signStudioHref(line: KitSignLine, units: number) {
  const type = getSignType(line.typeId);
  if (!type) return "/signage/design";
  const design = { ...defaultDesign(type), quantity: lineQuantity(line, units) };
  if (line.lines) design.lines = line.lines.slice(0, type.maxLines);
  return `/signage/design?${encodeDesign(design)}`;
}

/** Fails loudly at build time if a kit points at a product or sign type that no longer exists. */
for (const kit of kits) {
  for (const line of kit.products) {
    if (!getProductById(line.productId)) throw new Error(`Kit ${kit.id}: unknown product ${line.productId}`);
  }
  for (const line of kit.signs) {
    if (!getSignType(line.typeId)) throw new Error(`Kit ${kit.id}: unknown sign type ${line.typeId}`);
  }
}
