export type BoardCategory =
  | "magnetic-whiteboard"
  | "non-magnetic-whiteboard"
  | "notice-board"
  | "pin-up-board"
  | "chalk-board"
  | "combination-board"
  | "wooden-product"
  | "accessory"
  | "stand"
  | "desk-accessory";

export type BoardType =
  | "whiteboard"
  | "magnetic-whiteboard"
  | "notice-board"
  | "pin-up-board"
  | "combination-board"
  | "chalk-board";

export type FrameType =
  | "aluminium-light"
  | "aluminium-heavy-black"
  | "aluminium-heavy-white"
  | "aluminium-natural"
  | "pine-wood"
  | "powder-coated-black";

export type SurfaceType =
  | "resin-coated"
  | "melamine-hpl"
  | "ceramic-steel"
  | "fabric-softboard"
  | "chalkboard"
  | "dual-side";

export type ApplicationType =
  | "office"
  | "classroom"
  | "meeting-room"
  | "home"
  | "studio"
  | "reception"
  | "retail"
  | "commercial";

export interface ProductSize {
  id: string;
  label: string;
  widthFt: number;
  heightFt: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortName: string;
  shortDescription: string;
  description: string;
  category: BoardCategory;
  series?: "classic" | "superior" | "essential" | "ceramic" | "accessories" | "stands";
  boardType?: BoardType;
  magnetic: boolean;
  images: string[];
  price: number;
  compareAtPrice?: number;
  currency: "INR";
  sizes: ProductSize[];
  frame: FrameType;
  surface: SurfaceType;
  colours: string[];
  features: string[];
  applications: ApplicationType[];
  customizable: boolean;
  accessories: string[];
  specifications: Record<string, string>;
  whatsIncluded: string[];
  featured?: boolean;
  tag?: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
  category: BoardCategory;
}

export interface FrameOption {
  id: FrameType;
  name: string;
  description: string;
  swatch: string;
}

export interface ColourOption {
  id: string;
  name: string;
  hex: string;
}

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
  boardTypes: BoardType[];
}

export interface SpaceSetup {
  id: ApplicationType;
  name: string;
  description: string;
  image: string;
  recommendedProductIds: string[];
  setupProductIds: string[];
}

export type BoardLayoutMode = "single" | "combination";
export type SplitOrientation = "vertical" | "horizontal";

export type CombinationMaterialId =
  | "magnetic-whiteboard"
  | "non-magnetic-whiteboard"
  | "ceramic-steel"
  | "fabric-softboard"
  | "chalkboard";

export interface BoardSection {
  id: string;
  materialId: CombinationMaterialId;
  percent: number;
}

export interface CombinationLayout {
  mode: BoardLayoutMode;
  orientation: SplitOrientation;
  sections: BoardSection[];
}

export interface CartConfiguration {
  sizeId: string;
  frameId?: FrameType;
  colourId?: string;
  features?: string[];
  customWidthFt?: number;
  customHeightFt?: number;
  branding?: boolean;
  logoDataUrl?: string;
  application?: ApplicationType;
  /** Custom multi-surface layout — quote-only when mode is combination. */
  combinationLayout?: CombinationLayout;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  configuration: CartConfiguration;
  unitPrice: number;
}

export interface CustomizerState {
  boardType: BoardType;
  productId: string;
  sizeId: string;
  customWidthFt: number;
  customHeightFt: number;
  useCustomSize: boolean;
  frameId: FrameType;
  colourId: string;
  features: string[];
  branding: boolean;
  logoDataUrl?: string;
  quantity: number;
  /** Multi-surface layout; defaults to single catalogue surface when omitted. */
  combinationLayout?: CombinationLayout;
}

export interface QuoteRequest {
  name: string;
  company: string;
  phone: string;
  email: string;
  boardType: string;
  customSize: string;
  quantity: string;
  colour: string;
  features: string;
  branding: string;
  requirements: string;
  configurationSummary?: string;
}

export interface ProductFilters {
  search: string;
  categories: BoardCategory[];
  boardTypes: BoardType[];
  sizes: string[];
  frames: FrameType[];
  surfaces: SurfaceType[];
  colours: string[];
  applications: ApplicationType[];
  priceMin: number;
  priceMax: number;
  sort: "featured" | "price-asc" | "price-desc" | "name";
}

export interface AIRecommendation {
  productId: string;
  reason: string;
  customizerPrefill?: Partial<CustomizerState>;
}

/** Relative placement region on a wall scene (0–1 fractions of the preview) */
export interface WallArea {
  left: number;
  top: number;
  width: number;
  height: number;
  maxWidthFt: number;
  maxHeightFt: number;
}

export interface WallModel {
  id: string;
  name: string;
  description: string;
  image: string;
  wallArea: WallArea;
  recommendedBoards: string[];
  application?: ApplicationType;
}

export type VisualizeBoardKind =
  | "magnetic-whiteboard"
  | "non-magnetic-whiteboard"
  | "ceramic-glass"
  | "notice-board"
  | "pin-up-board"
  | "combination-board"
  | "chalk-board";

export interface VisualizeState {
  wallId: string;
  boardKind: VisualizeBoardKind;
  productId: string;
  widthFt: number;
  heightFt: number;
  useCustomSize: boolean;
  sizeId: string;
  frameId: FrameType;
  colourId: string;
  features: string[];
  logoDataUrl?: string;
  logoScale: number;
  logoX: number;
  logoY: number;
  accessoryIds: string[];
  boardOffsetX: number;
  boardOffsetY: number;
  quantity: number;
}
