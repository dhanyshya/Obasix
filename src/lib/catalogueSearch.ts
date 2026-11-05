import type { BoardCategory, Product } from "@/lib/types";

/** Case-insensitive catalogue text match used by showroom and homepage search. */
export function matchesQuery(product: Product, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    product.name,
    product.shortName,
    product.shortDescription,
    product.description,
    product.sku,
    product.slug,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export type DiscoveryCategoryId =
  | "all"
  | BoardCategory
  | "glass"
  | "notice-pinup"
  | "stands-accessories";

export type DiscoveryCategory = {
  id: DiscoveryCategoryId;
  label: string;
  href: string;
  match: (product: Product) => boolean;
};

export const discoveryCategories: DiscoveryCategory[] = [
  {
    id: "all",
    label: "All Boards",
    href: "/products",
    match: () => true,
  },
  {
    id: "magnetic-whiteboard",
    label: "Magnetic Whiteboards",
    href: "/products?category=magnetic-whiteboard",
    match: (p) => p.category === "magnetic-whiteboard",
  },
  {
    id: "non-magnetic-whiteboard",
    label: "Non-Magnetic Whiteboards",
    href: "/products?category=non-magnetic-whiteboard",
    match: (p) => p.category === "non-magnetic-whiteboard",
  },
  {
    id: "glass",
    label: "Glass Boards",
    href: "/products?surface=ceramic-steel",
    match: (p) => p.surface === "ceramic-steel",
  },
  {
    id: "notice-pinup",
    label: "Notice & Pin-up Boards",
    href: "/products?family=notice-pinup",
    match: (p) => p.category === "notice-board" || p.category === "pin-up-board",
  },
  {
    id: "chalk-board",
    label: "Chalk Boards",
    href: "/products?category=chalk-board",
    match: (p) => p.category === "chalk-board",
  },
  {
    id: "combination-board",
    label: "Combination Boards",
    href: "/products?category=combination-board",
    match: (p) => p.category === "combination-board",
  },
  {
    id: "wooden-product",
    label: "Wooden Products",
    href: "/products?category=wooden-product",
    match: (p) => p.category === "wooden-product",
  },
  {
    id: "stand",
    label: "Stands",
    href: "/products?category=stand",
    match: (p) => p.category === "stand",
  },
  {
    id: "accessory",
    label: "Accessories",
    href: "/products?category=accessory",
    match: (p) => p.category === "accessory" || p.category === "desk-accessory",
  },
];

export function filterDiscoveryProducts(
  catalogue: Product[],
  categoryId: DiscoveryCategoryId,
  query: string,
) {
  const category = discoveryCategories.find((item) => item.id === categoryId) ?? discoveryCategories[0];
  return catalogue.filter((product) => category.match(product) && matchesQuery(product, query));
}
