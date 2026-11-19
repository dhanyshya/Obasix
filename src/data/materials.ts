/**
 * Glass, felt and multicolour fabric boards — made to order and priced on quote.
 *
 * These are not catalogue products: there are no verified SKUs or list prices
 * for them yet (see docs/feature-gap-analysis.md, "Catalogue accuracy"). The
 * build details below describe what we offer to quote and must be confirmed
 * with the factory before launch. When verified SKUs exist, move them into
 * catalogue.ts so they can be bought from the cart.
 */
export type MaterialColour = { id: string; name: string; hex: string };
export type MaterialOption = { id: string; name: string; description: string };

export type MaterialRange = {
  slug: "glass" | "felt" | "fabric" | "cork";
  name: string;
  /** Matches an entry in quoteBoardTypes so the quote form accepts it. */
  quoteBoardType: string;
  tagline: string;
  summary: string;
  surface: "glass" | "felt" | "fabric" | "cork";
  build: string[];
  goodFor: string[];
  care: string;
  sizes: { id: string; label: string; widthFt: number; heightFt: number }[];
  colours: MaterialColour[];
  options: { label: string; choices: MaterialOption[] };
  /** Largest side we'll take as a standard quote; anything bigger is engineer-to-order. */
  maxSideFt: number;
};

const size = (w: number, h: number) => ({ id: `${w}x${h}`, label: `${w} × ${h} ft`, widthFt: w, heightFt: h });

export const materialRanges: MaterialRange[] = [
  {
    slug: "glass",
    name: "Glass writing boards",
    quoteBoardType: "Glass Board",
    tagline: "Writes clean, wipes clean, never ghosts.",
    summary:
      "Toughened glass with a back-painted colour, fixed on stainless standoffs. Markers wipe off without the shadowing that builds up on painted boards.",
    surface: "glass",
    build: [
      "Toughened safety glass with polished edges and rounded corners",
      "Colour painted on the back face, so the writing surface stays smooth glass",
      "Magnetic option: a steel backing sheet behind the glass (use strong neodymium magnets)",
      "Stainless steel standoffs, or a frameless rail for larger boards",
    ],
    goodFor: ["Boardrooms and meeting rooms", "Reception and leadership cabins", "Studios and design rooms"],
    care: "Wipe with a dry duster; clean weekly with a glass cleaner. Don't use abrasive pads.",
    sizes: [size(2, 3), size(3, 4), size(4, 6), size(4, 8)],
    colours: [
      { id: "white", name: "Pure white", hex: "#F7F7F5" },
      { id: "black", name: "Black", hex: "#1E1F21" },
      { id: "frosted", name: "Frosted", hex: "#E3E8E8" },
      { id: "grey", name: "Graphite grey", hex: "#5B6066" },
      { id: "brand", name: "Your brand colour", hex: "#C9A227" },
    ],
    options: {
      label: "Back",
      choices: [
        { id: "non-magnetic", name: "Non-magnetic", description: "Glass only. Lighter, for writing." },
        { id: "magnetic", name: "Magnetic", description: "Steel backing for pinning papers with strong magnets." },
      ],
    },
    maxSideFt: 8,
  },
  {
    slug: "felt",
    name: "Felt pin-up boards",
    quoteBoardType: "Felt Pin-up Board",
    tagline: "Soft to pin, quiet in the room.",
    summary:
      "Dense felt panels that take push pins and hold them, and soften echo in open offices and classrooms. Frameless or with a slim edge trim.",
    surface: "felt",
    build: [
      "Dense felt pinning surface over a rigid backing board",
      "Frameless with a clean cut edge, or with a slim aluminium trim",
      "Can be cut into shapes or panels to make a wall feature",
      "Your logo can be cut in or printed (we send a proof first)",
    ],
    goodFor: ["Open offices and co-working", "Classrooms and staff rooms", "Kids' rooms and play areas"],
    care: "Lint roller or a soft brush. Spot-clean with a damp cloth; don't soak.",
    sizes: [size(2, 3), size(3, 4), size(4, 6)],
    colours: [
      { id: "charcoal", name: "Charcoal", hex: "#3A3B3D" },
      { id: "light-grey", name: "Light grey", hex: "#B9BCBF" },
      { id: "sage", name: "Sage", hex: "#8FA58A" },
      { id: "navy", name: "Navy", hex: "#273A5C" },
      { id: "mustard", name: "Mustard", hex: "#D1A13A" },
      { id: "terracotta", name: "Terracotta", hex: "#B9643F" },
    ],
    options: {
      label: "Edge",
      choices: [
        { id: "frameless", name: "Frameless", description: "Clean cut edge, fixed flat to the wall." },
        { id: "trim", name: "Aluminium trim", description: "Slim edge trim for heavy-use areas." },
      ],
    },
    maxSideFt: 6,
  },
  {
    slug: "fabric",
    name: "Multicolour fabric pin-up boards",
    quoteBoardType: "Fabric Pin-up Board",
    tagline: "Our fabric boards, in the colour you need.",
    summary:
      "The fabric softboard used in our Classic and Superior pin-up boards, made to your size in a wider range of fabric colours — or in several colours side by side.",
    surface: "fabric",
    build: [
      "Fabric stretched over a soft pinning board",
      "Classic aluminium or heavy aluminium frame",
      "Two or three colours in one board for house or department notices",
      "Push pins included",
    ],
    goodFor: ["School corridors and house boards", "Staff and department notices", "Hospital and hotel back-of-house"],
    care: "Brush off dust. Spot-clean with a damp cloth.",
    sizes: [size(2, 3), size(3, 4), size(4, 6), size(4, 8)],
    colours: [
      { id: "green", name: "Green", hex: "#3E7D4F" },
      { id: "blue", name: "Blue", hex: "#2C5A8C" },
      { id: "maroon", name: "Maroon", hex: "#7A2A33" },
      { id: "grey", name: "Grey", hex: "#8A8E93" },
      { id: "beige", name: "Beige", hex: "#D8C8A8" },
      { id: "black", name: "Black", hex: "#2A2A2A" },
    ],
    options: {
      label: "Frame",
      choices: [
        { id: "classic", name: "Classic aluminium", description: "Light frame for offices and homes." },
        { id: "heavy", name: "Heavy aluminium", description: "For corridors and high-traffic areas." },
      ],
    },
    maxSideFt: 8,
  },
  {
    slug: "cork",
    name: "Cork pin-up boards",
    quoteBoardType: "Cork Pin-up Board",
    tagline: "The classic pin board, made to size.",
    summary:
      "Natural cork that takes pins easily and closes up behind them. Framed for classrooms and offices, or frameless tiles to cover a wall.",
    surface: "cork",
    build: [
      "Natural cork pinning surface over a rigid backing board",
      "Pine wood or aluminium frame, or frameless",
      "Can be combined with a whiteboard section (see combination boards)",
      "Push pins included",
    ],
    goodFor: ["Classrooms and staff rooms", "Home offices and kids' rooms", "Cafés and community notice walls"],
    care: "Dust with a soft brush. Keep away from direct sun and damp, which dry out or swell cork.",
    sizes: [size(2, 3), size(3, 4), size(4, 6)],
    colours: [
      { id: "natural", name: "Natural cork", hex: "#C69C6D" },
      { id: "dark", name: "Dark cork", hex: "#8A6544" },
    ],
    options: {
      label: "Frame",
      choices: [
        { id: "pine", name: "Pine wood", description: "Warm, natural edge for homes and classrooms." },
        { id: "aluminium", name: "Aluminium", description: "Clean edge for offices." },
        { id: "frameless", name: "Frameless", description: "Flat panels fixed edge to edge." },
      ],
    },
    maxSideFt: 6,
  },
];

export const getMaterialRange = (slug: string) => materialRanges.find((range) => range.slug === slug);
