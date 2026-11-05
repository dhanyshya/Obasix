import type { BoardCategory, Product } from "@/lib/types";
import { buildCustomizeHref } from "@/lib/format";

const VISUALIZE_CATEGORIES: BoardCategory[] = [
  "magnetic-whiteboard",
  "non-magnetic-whiteboard",
  "notice-board",
  "pin-up-board",
  "chalk-board",
  "combination-board",
  "wooden-product",
];

export function canAddProductToCart(product: Product): boolean {
  return product.price > 0;
}

export function canCustomizeProduct(product: Product): boolean {
  return product.customizable || VISUALIZE_CATEGORIES.includes(product.category);
}

export function canVisualizeProduct(product: Product): boolean {
  return VISUALIZE_CATEGORIES.includes(product.category);
}

export function buildVisualizeHref(options: {
  productId: string;
  sizeId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("productId", options.productId);
  if (options.sizeId) params.set("sizeId", options.sizeId);
  return `/visualize?${params.toString()}`;
}

export function productCustomizeHref(product: Product, sizeId?: string): string {
  return buildCustomizeHref({
    productId: product.id,
    ...(sizeId ? { sizeId } : {}),
  });
}

export function defaultCartConfiguration(product: Product, sizeId?: string) {
  return {
    sizeId: sizeId ?? product.sizes[0]?.id ?? "standard",
    frameId: product.frame,
    colourId: product.colours[0],
    features: [] as string[],
  };
}
