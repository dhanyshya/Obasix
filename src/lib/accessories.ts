import { getProductById, products } from "@/data/catalogue";
import type { BoardCategory, Product } from "@/lib/types";

export type AccessoryRecommendationSource = "explicit" | "category-peer";

export interface AccessoryRecommendation {
  product: Product;
  source: AccessoryRecommendationSource;
  /** Only set when the catalogue supports the relationship. */
  compatibilityNote?: string;
}

const ACCESSORY_CATEGORIES: BoardCategory[] = ["accessory", "stand", "desk-accessory"];

const WRITING_BOARD_CATEGORIES: BoardCategory[] = [
  "magnetic-whiteboard",
  "non-magnetic-whiteboard",
  "combination-board",
  "chalk-board",
];

function isAccessoryLike(product: Product) {
  return ACCESSORY_CATEGORIES.includes(product.category);
}

function isMagnetAccessory(product: Product) {
  return (
    product.category === "accessory" &&
    (/magnet/i.test(`${product.id} ${product.name} ${product.shortName}`) || product.magnetic)
  );
}

function isMarkerHolder(product: Product) {
  return product.category === "accessory" && /marker|holder|duster/i.test(`${product.id} ${product.name}`);
}

function resolveIds(ids: string[]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const id of ids) {
    const item = getProductById(id);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function canSuggestAsPeerAccessory(board: Product, accessory: Product) {
  if (accessory.id === board.id) return false;
  if (!isAccessoryLike(accessory)) return false;
  // Desk accessories are never inferred — only explicit catalogue links.
  if (accessory.category === "desk-accessory") return false;
  // Magnets only for magnetic boards.
  if (isMagnetAccessory(accessory) && !board.magnetic) return false;
  // Marker holders only for writing surfaces.
  if (isMarkerHolder(accessory) && !WRITING_BOARD_CATEGORIES.includes(board.category)) return false;
  // Stands only when a peer board of the same category already lists them.
  if (accessory.category === "stand") {
    return products.some(
      (peer) =>
        peer.id !== board.id &&
        peer.category === board.category &&
        peer.accessories.includes(accessory.id),
    );
  }
  return true;
}

/**
 * Product-specific accessory recommendations from catalogue relationships.
 * Prefers explicit `product.accessories`; peers only fill gaps with verified rules.
 */
export function getRecommendedAccessories(
  product: Product,
  options: { limit?: number } = {},
): { items: AccessoryRecommendation[]; total: number; all: AccessoryRecommendation[] } {
  const limit = options.limit ?? 4;
  const byId = new Map<string, AccessoryRecommendation>();

  for (const item of resolveIds(product.accessories)) {
    if (item.id === product.id) continue;
    byId.set(item.id, {
      product: item,
      source: "explicit",
      compatibilityNote: "Listed with this product in the OBASIX catalogue",
    });
  }

  // Pure accessories (not stands) with no linked extras: omit recommendations.
  if (product.category === "accessory" || product.category === "desk-accessory") {
    const all = [...byId.values()];
    return { items: all.slice(0, limit), total: all.length, all };
  }

  // Peer fallback for boards when the explicit list is empty or sparse.
  if (byId.size < limit && !isAccessoryLike(product)) {
    const peerIds = products
      .filter((peer) => peer.category === product.category && peer.id !== product.id)
      .flatMap((peer) => peer.accessories);

    const frequency = new Map<string, number>();
    for (const id of peerIds) {
      frequency.set(id, (frequency.get(id) ?? 0) + 1);
    }

    const ranked = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => getProductById(id))
      .filter((item): item is Product => Boolean(item));

    for (const item of ranked) {
      if (byId.has(item.id)) continue;
      if (!canSuggestAsPeerAccessory(product, item)) continue;
      // Do not invent compatibility wording for peer-inferred items.
      byId.set(item.id, {
        product: item,
        source: "category-peer",
      });
      if (byId.size >= Math.max(limit * 2, 8)) break;
    }
  }

  const all = [...byId.values()];
  return { items: all.slice(0, limit), total: all.length, all };
}

/** True when the accessory needs its own configurator / PDP before cart. */
export function accessoryRequiresConfiguration(product: Product) {
  if (product.customizable) return true;
  if (product.sizes.length > 1) return true;
  if (product.category === "stand" && product.boardType) return true;
  return false;
}

export function accessoriesViewAllHref() {
  return "/products?family=stands-accessories";
}
