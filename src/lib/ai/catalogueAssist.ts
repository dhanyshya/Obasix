import { products, getProductById } from "@/data/catalogue";
import { buildCustomizerCta } from "@/lib/ai/catalogueContext";
import type { AIRecommendation } from "@/lib/types";

/**
 * Deterministic catalogue helper used when the LLM provider is unavailable.
 * Does not pretend to be a live model response.
 */
export function catalogueAssist(message: string): {
  message: string;
  recommendations: AIRecommendation[];
  customizerCta: ReturnType<typeof buildCustomizerCta>;
  links: { label: string; href: string }[];
} {
  const lower = message.toLowerCase();
  let pool = [...products];
  let focus = "matching catalogue options";

  if (/ceramic|porcelain|steel/.test(lower)) {
    pool = products.filter((p) => p.surface === "ceramic-steel");
    focus = "ceramic steel boards";
  } else if (/notice|pin[- ]?up|softboard|fabric/.test(lower)) {
    pool = products.filter((p) => p.category === "notice-board" || p.category === "pin-up-board");
    focus = "notice and pin-up boards";
  } else if (/chalk|blackboard/.test(lower)) {
    pool = products.filter((p) => p.category === "chalk-board");
    focus = "chalk boards";
  } else if (/combin/.test(lower)) {
    pool = products.filter((p) => p.category === "combination-board");
    focus = "combination boards";
  } else if (/stand|mobile|easel/.test(lower)) {
    pool = products.filter((p) => p.category === "stand");
    focus = "stands";
  } else if (/wood|pine/.test(lower)) {
    pool = products.filter((p) => p.category === "wooden-product" || p.frame === "pine-wood");
    focus = "wooden products";
  } else if (/non[- ]?magnetic|non magnetic/.test(lower)) {
    pool = products.filter((p) => p.category === "non-magnetic-whiteboard");
    focus = "non-magnetic whiteboards";
  } else if (/magnetic|whiteboard|board|office|classroom|meeting|size|custom/.test(lower)) {
    pool = products.filter((p) => p.category === "magnetic-whiteboard" && p.featured);
    if (pool.length === 0) {
      pool = products.filter((p) => p.category === "magnetic-whiteboard");
    }
    focus = "magnetic whiteboards";
  } else if (/accessor|magnets?|marker|holder/.test(lower)) {
    pool = products.filter((p) => p.category === "accessory" || p.category === "desk-accessory");
    focus = "accessories";
  } else {
    pool = products.filter((p) => p.featured);
  }

  const picks = pool.filter((p) => p.price >= 0).slice(0, 3);
  const recommendations: AIRecommendation[] = picks.map((product) => ({
    productId: product.id,
    reason: `${product.shortName} · ${product.sku}`,
  }));

  const customizable = picks.find((p) => p.customizable);

  return {
    message: [
      "Bear with me — my live guidance is having trouble connecting right now. 👋",
      `In the meantime, here are ${focus} from the OBASIX catalogue based on what you shared.`,
      "Open a product to explore it, customize a board, or browse the full collection — would you like to start with the ones above?",
    ].join(" "),
    recommendations,
    customizerCta: buildCustomizerCta(customizable?.id, "Customize this board"),
    links: [
      { label: "Browse Products", href: "/products" },
      { label: "Design Your Board", href: "/customize" },
      { label: "Explore Accessories", href: "/products?family=stands-accessories" },
    ],
  };
}

export function recommendationsFromIds(ids: string[]): AIRecommendation[] {
  return ids
    .map((id) => getProductById(id))
    .filter(Boolean)
    .map((product) => ({
      productId: product!.id,
      reason: `${product!.shortName} · ${product!.sku}`,
    }));
}
