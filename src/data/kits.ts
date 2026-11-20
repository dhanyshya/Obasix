import { getProductById } from "@/data/catalogue";
import { images } from "@/data/images";
import { defaultPlanner, encodePlanner, getPlannerTemplate } from "@/data/planners";
import { defaultDesign, encodeDesign, getSignType } from "@/data/signage";

/**
 * Solution kits from the Reimagination Program: one package per space, scaled by a unit
 * (a meeting room, a classroom, a home). Catalogue boards are priced and go straight to the cart;
 * signage and printed planning boards are made to order, so they're quoted and designed in the
 * sign studio or the planner designer.
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

export interface KitPlannerLine {
  templateId: string;
  per: KitScope;
  quantity: number;
  role: string;
  /** Header title suggested for this kit. */
  title?: string;
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
  planners: KitPlannerLine[];
}

export const kits: Kit[] = [
  {
    id: "workplace",
    name: "Workplace Kit",
    audience: "Offices, co-working and corporate fit-outs",
    headline: "Every meeting room planned, labelled and ready",
    summary:
      "A magnetic board, accessories and a door sign for each meeting room, plus reception branding, a floor directory, desk plates and a team planning board.",
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
      { typeId: "office-directory", per: "kit", quantity: 1, role: "Floor directory by the lifts or entrance", optional: true },
      { typeId: "desk-nameplate", per: "kit", quantity: 10, role: "Desk plates for the team (change the number in the studio)", optional: true },
    ],
    planners: [
      { templateId: "task", per: "kit", quantity: 1, role: "Team planning board", title: "Team tasks", optional: true },
    ],
  },
  {
    id: "education",
    name: "Education Kit",
    audience: "Schools, colleges and coaching institutes",
    headline: "Classrooms fitted out in one order",
    summary:
      "A large writing board, a pin-up board, a timetable display and accessories for each classroom, with door signs, wayfinding and administration signage for the building.",
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
      { typeId: "office-directory", per: "kit", quantity: 1, role: "Administration block directory", lines: ["Administration", "Principal  ·  101", "Office & Fees  ·  102", "Staff Room  ·  103"], optional: true },
    ],
    planners: [
      { templateId: "timetable", per: "unit", quantity: 1, role: "Timetable display in each classroom", title: "Class timetable" },
    ],
  },
  {
    id: "residential",
    name: "Residential Identity Kit",
    audience: "Homeowners, builders and housing societies",
    headline: "A home's name, number and study wall",
    summary:
      "A nameplate and house number for each home, with a study board and pin-up. Builders and societies can add the tower directory, lift lobby signs, entrance board and a society notice board.",
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
      { typeId: "tower-directory", per: "kit", quantity: 1, role: "Tower directory in the lobby", optional: true },
      { typeId: "lift-lobby-sign", per: "kit", quantity: 1, role: "Lift lobby sign (one per tower; change the number in the studio)", optional: true },
      { typeId: "society-entrance-board", per: "kit", quantity: 1, role: "Society name at the entrance gate", optional: true },
    ],
    planners: [
      { templateId: "society", per: "kit", quantity: 1, role: "Society notice board for the lobby or clubhouse", optional: true },
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

/** A planner designer link pre-filled with the kit's template, title and quantity. */
export function plannerHref(line: KitPlannerLine, units: number) {
  const template = getPlannerTemplate(line.templateId);
  if (!template) return "/planning";
  const design = { ...defaultPlanner(template), quantity: Math.min(999, lineQuantity(line, units)) };
  if (line.title) design.title = line.title;
  return `/planning?${encodePlanner(design)}`;
}

/** Fails loudly at build time if a kit points at a product, sign type or planner that no longer exists. */
for (const kit of kits) {
  for (const line of kit.products) {
    if (!getProductById(line.productId)) throw new Error(`Kit ${kit.id}: unknown product ${line.productId}`);
  }
  for (const line of kit.signs) {
    if (!getSignType(line.typeId)) throw new Error(`Kit ${kit.id}: unknown sign type ${line.typeId}`);
  }
  for (const line of kit.planners) {
    if (!getPlannerTemplate(line.templateId)) throw new Error(`Kit ${kit.id}: unknown planner ${line.templateId}`);
  }
}
