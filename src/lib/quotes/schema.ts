import { getProductById, colours, frames } from "@/data/catalogue";
import { layoutSummary } from "@/lib/combination";
import { featureName } from "@/lib/features";
import type { CombinationLayout } from "@/lib/types";

export const quoteBoardTypes = [
  "Magnetic Whiteboard",
  "Non-Magnetic Whiteboard",
  "Notice Board",
  "Pin-up Board",
  "Combination Board",
  "Chalk Board",
  "Custom Board",
] as const;

export const quoteAttachmentTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;
export const quoteAttachmentMaxBytes = 2 * 1024 * 1024;

export type QuoteLineInput = {
  productId: string;
  quantity: number;
  detail: string;
};

export type QuotePayload = {
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  boardType: string;
  dimensions: string;
  dimensionsRequired: boolean;
  quantity: number;
  product: string;
  productId: string;
  frame: string;
  colour: string;
  surface: string;
  features: string;
  accessories: string;
  branding: string;
  notes: string;
  configurationSummary: string;
  lines: QuoteLineInput[];
};

export type QuoteFieldErrors = Partial<
  Record<"name" | "phone" | "email" | "location" | "boardType" | "dimensions" | "quantity" | "file" | "lines", string>
>;

export const quoteSurfaceLabels: Record<string, string> = {
  "resin-coated": "Resin Coated",
  "melamine-hpl": "Melamine HPL",
  "ceramic-steel": "Ceramic Steel",
  "fabric-softboard": "Fabric Softboard",
  chalkboard: "Chalkboard",
  "dual-side": "Dual Side",
};

export function quoteSurfaceLabel(value?: string | null) {
  if (!value) return "";
  return quoteSurfaceLabels[value] ?? value.replace(/-/g, " ");
}

export function quoteBoardLabel(product: { boardType?: string | null; category?: string }) {
  switch (product.boardType) {
    case "magnetic-whiteboard":
      return "Magnetic Whiteboard";
    case "whiteboard":
      return "Non-Magnetic Whiteboard";
    case "notice-board":
      return "Notice Board";
    case "pin-up-board":
      return "Pin-up Board";
    case "combination-board":
      return "Combination Board";
    case "chalk-board":
      return "Chalk Board";
    default:
      if (product.category === "magnetic-whiteboard") return "Magnetic Whiteboard";
      if (product.category === "non-magnetic-whiteboard") return "Non-Magnetic Whiteboard";
      return "Custom Board";
  }
}

export function cleanText(value: string, max: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function parseQuantity(value: string) {
  if (!/^[1-9]\d{0,2}$/.test(value.trim())) return null;
  return Number(value);
}

export function validateQuoteFields(input: {
  name: string;
  phone: string;
  email: string;
  location: string;
  boardType: string;
  dimensions: string;
  dimensionsRequired: boolean;
  quantity: string;
  file?: { type: string; size: number } | null;
}): QuoteFieldErrors {
  const errors: QuoteFieldErrors = {};
  if (cleanText(input.name, 80).length < 2) errors.name = "Enter your name.";
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) errors.phone = "Enter a phone number with 8 to 15 digits.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.trim().length > 120) {
    errors.email = "Enter a valid email address.";
  }
  if (cleanText(input.location, 80).length < 2) errors.location = "Enter your city or location.";
  if (!quoteBoardTypes.includes(input.boardType as (typeof quoteBoardTypes)[number])) {
    errors.boardType = "Choose a board type.";
  }
  if (input.dimensionsRequired && cleanText(input.dimensions, 40).length < 2) {
    errors.dimensions = "Enter the custom dimensions.";
  }
  if (parseQuantity(input.quantity) == null) errors.quantity = "Enter a whole quantity from 1 to 999.";
  if (input.file) {
    if (!quoteAttachmentTypes.includes(input.file.type as (typeof quoteAttachmentTypes)[number])) {
      errors.file = "Upload a PNG, JPEG, WebP, or PDF file.";
    } else if (input.file.size > quoteAttachmentMaxBytes) {
      errors.file = "The file must be 2 MB or smaller.";
    }
  }
  return errors;
}

export function catalogueLine(productId: string, quantity: number, detail: string) {
  const product = getProductById(productId);
  if (!product) return null;
  const safeQuantity = parseQuantity(String(quantity));
  if (safeQuantity == null) return null;
  return {
    productId: product.id,
    name: product.shortName,
    sku: product.sku,
    quantity: safeQuantity,
    catalogueUnitPrice: product.price,
    detail: cleanText(detail, 300),
  };
}

export function describeCartConfiguration(configuration: {
  sizeId?: string;
  frameId?: string;
  colourId?: string;
  features?: string[];
  customWidthFt?: number;
  customHeightFt?: number;
  branding?: boolean;
  combinationLayout?: CombinationLayout;
}) {
  const size =
    configuration.customWidthFt && configuration.customHeightFt
      ? `${configuration.customWidthFt} × ${configuration.customHeightFt} ft`
      : configuration.sizeId;
  const frame = frames.find((item) => item.id === configuration.frameId)?.name;
  const colour = colours.find((item) => item.id === configuration.colourId)?.name;
  const features = configuration.features?.map(featureName).join(", ");
  const layout = configuration.combinationLayout
    ? layoutSummary(configuration.combinationLayout)
    : "";
  return [size, layout, frame, colour, features, configuration.branding ? "Logo requested" : ""]
    .filter(Boolean)
    .join(" · ");
}
