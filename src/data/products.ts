import type { Accessory, Product, Project } from "@/lib/types";

const boardImg =
  "https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=1200&q=80";
const kitchenImg =
  "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1200&q=80";
const wardrobeImg =
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80";
const officeImg =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
const woodClose =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80";
const livingImg =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80";
const partitionImg =
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80";
const commercialImg =
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80";

const standardSizes = [
  { id: "8x4", label: "8 × 4 ft", widthFt: 8, heightFt: 4 },
  { id: "7x4", label: "7 × 4 ft", widthFt: 7, heightFt: 4 },
  { id: "6x3", label: "6 × 3 ft", widthFt: 6, heightFt: 3 },
];

export const products: Product[] = [
  {
    id: "obx-premium-board",
    slug: "premium-board",
    name: "OBASIX Premium Board",
    shortDescription: "High-density board engineered for furniture and interiors.",
    description:
      "OBASIX Premium Board delivers consistent density, clean edges and a refined surface ready for modern kitchens, wardrobes and commercial interiors. Designed for precision cutting and premium finishes.",
    category: "Boards",
    material: "mdf",
    finishes: ["matte", "gloss", "wood-finish", "textured", "laminate"],
    colours: ["light-oak", "walnut", "teak", "ivory", "charcoal", "ash-grey"],
    thicknesses: [12, 16, 18, 25],
    sizes: standardSizes,
    applications: ["kitchen", "bedroom", "wardrobe", "furniture", "office"],
    startingPrice: 2850,
    currency: "INR",
    images: [boardImg, woodClose, kitchenImg],
    features: [
      "Uniform core density",
      "Smooth calibration for laminates",
      "Low warpage profile",
      "Suitable for CNC machining",
    ],
    specifications: {
      Core: "High-density engineered board",
      Density: "720–780 kg/m³",
      "Moisture resistance": "Standard interior grade",
      "Surface readiness": "Primed for finish application",
      Tolerance: "±0.2 mm thickness",
    },
    accessories: ["edge-band-premium", "hinge-set", "handle-kit"],
    featured: true,
    tag: "Best Seller",
  },
  {
    id: "obx-aqua-shield",
    slug: "aqua-shield",
    name: "OBASIX Aqua Shield",
    shortDescription: "Moisture-resistant board for kitchens and wet zones.",
    description:
      "Built for kitchens, vanity units and humid environments. Aqua Shield combines dimensional stability with a moisture-resistant core for long-lasting cabinetry.",
    category: "Boards",
    material: "hdf",
    finishes: ["matte", "laminate", "gloss"],
    colours: ["pure-white", "ivory", "slate", "sage", "ash-grey"],
    thicknesses: [16, 18, 25],
    sizes: standardSizes,
    applications: ["kitchen", "commercial", "furniture"],
    startingPrice: 3420,
    currency: "INR",
    images: [kitchenImg, boardImg, woodClose],
    features: [
      "Enhanced moisture barrier",
      "Stable in humid conditions",
      "Ideal for kitchen carcasses",
      "Clean machining edges",
    ],
    specifications: {
      Core: "Moisture-resistant HDF",
      Density: "780–820 kg/m³",
      "Moisture resistance": "Elevated MR grade",
      Application: "Kitchens & wet-adjacent interiors",
    },
    accessories: ["edge-band-premium", "sink-support", "hardware-kit"],
    featured: true,
    tag: "Kitchen Ready",
  },
  {
    id: "obx-woodline",
    slug: "woodline",
    name: "OBASIX Woodline",
    shortDescription: "Natural wood-character boards for warm living spaces.",
    description:
      "Woodline brings authentic grain expression to bedrooms, wardrobes and living rooms. A refined wood-finish surface with the performance of engineered board.",
    category: "Decorative Boards",
    material: "mdf",
    finishes: ["wood-finish", "veneer", "matte", "textured"],
    colours: ["light-oak", "walnut", "teak", "warm-sand", "espresso"],
    thicknesses: [12, 18, 25],
    sizes: standardSizes,
    applications: ["bedroom", "wardrobe", "living", "furniture", "wall"],
    startingPrice: 3980,
    currency: "INR",
    images: [wardrobeImg, woodClose, livingImg],
    features: [
      "Expressive wood grain",
      "Warm interior aesthetic",
      "Furniture-grade surface",
      "Compatible with edge banding",
    ],
    specifications: {
      Surface: "Wood-character decorative layer",
      Core: "Calibrated MDF",
      Finish: "Matte / textured wood options",
    },
    accessories: ["edge-band-wood", "handle-kit", "shelf-support"],
    featured: true,
    tag: "Designer Pick",
  },
  {
    id: "obx-structura",
    slug: "structura",
    name: "OBASIX Structura",
    shortDescription: "Structural panel for partitions and commercial builds.",
    description:
      "Structura is engineered for partitions, office systems and commercial fit-outs where strength, flatness and reliable sizing matter.",
    category: "Structural",
    material: "particle",
    finishes: ["matte", "laminate", "textured"],
    colours: ["ash-grey", "charcoal", "pure-white", "slate"],
    thicknesses: [18, 25],
    sizes: standardSizes,
    applications: ["partition", "office", "commercial", "wall"],
    startingPrice: 2450,
    currency: "INR",
    images: [partitionImg, officeImg, commercialImg],
    features: [
      "High rigidity",
      "Commercial-grade stability",
      "Partition ready",
      "Cost-efficient large runs",
    ],
    specifications: {
      Core: "Engineered particle board",
      Use: "Partitions & commercial systems",
      "Sheet size": "Standard & project-cut options",
    },
    accessories: ["partition-clip", "hardware-kit"],
    featured: false,
  },
  {
    id: "obx-acrylic-glow",
    slug: "acrylic-glow",
    name: "OBASIX Acrylic Glow",
    shortDescription: "High-gloss acrylic surface boards for statement interiors.",
    description:
      "Acrylic Glow delivers a mirror-like gloss finish for premium kitchen shutters, retail counters and modern furniture fronts.",
    category: "Decorative Boards",
    material: "acrylic",
    finishes: ["gloss"],
    colours: ["pure-white", "ivory", "charcoal", "slate", "forest-mist"],
    thicknesses: [18],
    sizes: standardSizes,
    applications: ["kitchen", "furniture", "commercial"],
    startingPrice: 6200,
    currency: "INR",
    images: [kitchenImg, livingImg, boardImg],
    features: [
      "Deep gloss clarity",
      "Scratch-resistant coating",
      "Statement kitchen fronts",
      "Uniform colour panels",
    ],
    specifications: {
      Surface: "High-gloss acrylic",
      Core: "Premium substrate",
      Sheen: "Mirror gloss",
    },
    accessories: ["edge-band-premium", "handle-kit"],
    featured: true,
    tag: "Premium",
  },
  {
    id: "obx-laminate-pro",
    slug: "laminate-pro",
    name: "OBASIX Laminate Pro",
    shortDescription: "Durable laminate boards for everyday high-use spaces.",
    description:
      "Laminate Pro balances durability and design for wardrobes, offices and commercial furniture that see daily use.",
    category: "Boards",
    material: "laminate-board",
    finishes: ["laminate", "matte", "textured"],
    colours: ["light-oak", "ash-grey", "pure-white", "walnut", "sage"],
    thicknesses: [16, 18],
    sizes: standardSizes,
    applications: ["wardrobe", "office", "furniture", "commercial"],
    startingPrice: 2680,
    currency: "INR",
    images: [officeImg, wardrobeImg, boardImg],
    features: [
      "Abrasion-resistant laminate",
      "Easy maintenance",
      "Wide colour range",
      "Value performance",
    ],
    specifications: {
      Surface: "High-pressure laminate",
      Wear: "Commercial traffic ready",
    },
    accessories: ["edge-band-premium", "hinge-set"],
    featured: false,
  },
  {
    id: "obx-plycore",
    slug: "plycore",
    name: "OBASIX PlyCore",
    shortDescription: "Multi-ply strength for furniture frameworks and shelves.",
    description:
      "PlyCore offers layered strength for shelving, frames and load-bearing furniture components that demand screw-holding power.",
    category: "Structural",
    material: "plywood",
    finishes: ["matte", "veneer", "wood-finish"],
    colours: ["teak", "walnut", "warm-sand", "ivory"],
    thicknesses: [12, 18, 25],
    sizes: standardSizes,
    applications: ["furniture", "wardrobe", "office", "commercial"],
    startingPrice: 4550,
    currency: "INR",
    images: [woodClose, wardrobeImg, officeImg],
    features: [
      "Strong screw holding",
      "Layered structural core",
      "Shelf & frame ready",
      "Stable across seasons",
    ],
    specifications: {
      Construction: "Cross-banded plywood",
      Grade: "Interior furniture",
    },
    accessories: ["shelf-support", "hardware-kit"],
    featured: false,
  },
  {
    id: "obx-wallform",
    slug: "wallform",
    name: "OBASIX WallForm",
    shortDescription: "Panel system for feature walls and architectural cladding.",
    description:
      "WallForm is designed for feature walls, reception cladding and architectural surfaces with clean joints and expressive finishes.",
    category: "Wall Systems",
    material: "mdf",
    finishes: ["wood-finish", "matte", "textured", "veneer"],
    colours: ["walnut", "charcoal", "light-oak", "slate", "espresso"],
    thicknesses: [12, 16],
    sizes: [
      { id: "8x4", label: "8 × 4 ft", widthFt: 8, heightFt: 4 },
      { id: "custom", label: "Custom cut", widthFt: 0, heightFt: 0 },
    ],
    applications: ["wall", "commercial", "living", "office"],
    startingPrice: 3750,
    currency: "INR",
    images: [livingImg, partitionImg, woodClose],
    features: [
      "Feature-wall ready",
      "Architectural jointing",
      "Custom cut options",
      "Expressive finishes",
    ],
    specifications: {
      System: "Wall cladding panels",
      Install: "Batten / adhesive compatible",
    },
    accessories: ["wall-clip", "edge-band-wood"],
    featured: true,
    tag: "Architectural",
  },
];

export const accessories: Accessory[] = [
  {
    id: "edge-band-premium",
    name: "Premium Edge Band",
    description: "Colour-matched edge banding for clean finished edges.",
    price: 420,
    image: woodClose,
    category: "Finishing",
  },
  {
    id: "edge-band-wood",
    name: "Woodgrain Edge Band",
    description: "Grain-matched banding for Woodline and veneer boards.",
    price: 480,
    image: woodClose,
    category: "Finishing",
  },
  {
    id: "hinge-set",
    name: "Soft-Close Hinge Set",
    description: "Reliable soft-close hinges for wardrobe and kitchen doors.",
    price: 890,
    image: kitchenImg,
    category: "Hardware",
  },
  {
    id: "handle-kit",
    name: "Minimal Handle Kit",
    description: "Contemporary handles for shutters and drawers.",
    price: 650,
    image: livingImg,
    category: "Hardware",
  },
  {
    id: "hardware-kit",
    name: "Installation Hardware Kit",
    description: "Screws, connectors and fittings for standard installs.",
    price: 540,
    image: officeImg,
    category: "Installation",
  },
  {
    id: "shelf-support",
    name: "Shelf Support System",
    description: "Adjustable shelf pins and supports for wardrobes.",
    price: 320,
    image: wardrobeImg,
    category: "Hardware",
  },
  {
    id: "sink-support",
    name: "Sink Support Rails",
    description: "Reinforcement rails for kitchen sink carcasses.",
    price: 780,
    image: kitchenImg,
    category: "Installation",
  },
  {
    id: "partition-clip",
    name: "Partition Clip System",
    description: "Modular clips for Structura partition assemblies.",
    price: 560,
    image: partitionImg,
    category: "Installation",
  },
  {
    id: "wall-clip",
    name: "Wall Panel Clips",
    description: "Concealed clips for WallForm cladding installs.",
    price: 490,
    image: livingImg,
    category: "Installation",
  },
];

export const projects: Project[] = [
  {
    id: "proj-1",
    title: "Modern Kitchen Suite",
    location: "Residential Interior",
    application: "kitchen",
    image: kitchenImg,
    summary: "Aqua Shield boards with matte ivory finish for a clean, durable kitchen.",
  },
  {
    id: "proj-2",
    title: "Walk-in Wardrobe",
    location: "Bedroom Suite",
    application: "wardrobe",
    image: wardrobeImg,
    summary: "Woodline in light oak creating a calm, organised storage environment.",
  },
  {
    id: "proj-3",
    title: "Corporate Workspaces",
    location: "Commercial Fit-out",
    application: "office",
    image: officeImg,
    summary: "Structura panels defining open-plan zones with refined charcoal finishes.",
  },
  {
    id: "proj-4",
    title: "Feature Living Wall",
    location: "Apartment Interior",
    application: "living",
    image: livingImg,
    summary: "WallForm walnut cladding as a warm focal plane in the living room.",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id || p.slug === id);
}

export function getAccessoryById(id: string): Accessory | undefined {
  return accessories.find((a) => a.id === id);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category ||
          p.applications.some((a) => product.applications.includes(a))),
    )
    .slice(0, limit);
}
