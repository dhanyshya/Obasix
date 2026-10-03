export type FinishType =
  | "matte"
  | "gloss"
  | "wood"
  | "textured"
  | "laminate"
  | "veneer";

export type ApplicationType =
  | "kitchen"
  | "bedroom"
  | "wardrobe"
  | "office"
  | "wall"
  | "furniture"
  | "partition"
  | "commercial"
  | "living";

export type MaterialType =
  | "mdf"
  | "hdf"
  | "particle"
  | "plywood"
  | "acrylic"
  | "laminate-board";

export interface ColourSwatch {
  id: string;
  name: string;
  hex: string;
  family: "wood" | "neutral" | "bold" | "cool";
}

export interface FinishOption {
  id: string;
  name: string;
  type: FinishType;
  description: string;
}

export interface ProductSize {
  id: string;
  label: string;
  widthFt: number;
  heightFt: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  material: MaterialType;
  finishes: string[];
  colours: string[];
  thicknesses: number[];
  sizes: ProductSize[];
  applications: ApplicationType[];
  startingPrice: number;
  currency: "INR";
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  accessories: string[];
  featured?: boolean;
  tag?: string;
}

export interface Accessory {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface RoomSpace {
  id: string;
  name: string;
  description: string;
  image: string;
  recommendedProductIds: string[];
  suggestedColours: string[];
  suggestedFinishes: string[];
  accessories: string[];
}

export interface Project {
  id: string;
  title: string;
  location: string;
  application: ApplicationType;
  image: string;
  summary: string;
}

export interface CartConfiguration {
  colourId: string;
  finishId: string;
  thickness: number;
  sizeId: string;
  width?: number;
  height?: number;
  customWidthMm?: number;
  customHeightMm?: number;
  application?: ApplicationType;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  configuration: CartConfiguration;
  unitPrice: number;
}

export interface QuoteRequest {
  name: string;
  company: string;
  phone: string;
  email: string;
  projectType: string;
  product: string;
  dimensions: string;
  quantity: string;
  requirements: string;
  configurationSummary?: string;
}

export interface ProductFilters {
  search: string;
  categories: string[];
  materials: MaterialType[];
  thicknesses: number[];
  finishes: string[];
  colours: string[];
  applications: ApplicationType[];
  priceMin: number;
  priceMax: number;
  sort: "featured" | "price-asc" | "price-desc" | "name";
}

export interface CustomizerState {
  productId: string;
  material: MaterialType;
  thickness: number;
  sizeId: string;
  colourId: string;
  finishId: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  application: ApplicationType;
}
