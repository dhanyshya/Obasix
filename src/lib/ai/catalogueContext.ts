import { products, getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { CustomizerState, Product } from "@/lib/types";

/** Compact catalogue lines for the model — ids must match `products`. */
export function buildCatalogueContext(limit = 48): string {
  const lines = products.slice(0, limit).map((product) => formatProductLine(product));
  return [
    "OBASIX live catalogue (use only these product ids; never invent SKUs, prices, or sizes):",
    ...lines,
    "",
    "Site routes customers can be sent to:",
    "- /products — browse catalogue",
    "- /products/{id} — product detail (use real id)",
    "- /customize?productId={id} — Design Your Board",
    "- /visualize?productId={id} — Visualize Your Space",
    "- /quote — request a quotation",
    "- /cart — cart / setup",
    "- /account — account",
    "- /orders/track — track order",
    "- /solutions — Applications by space",
  ].join("\n");
}

function formatProductLine(product: Product): string {
  const sizes =
    product.sizes.length > 0
      ? product.sizes.map((s) => s.label).join(", ")
      : "standard / custom quote";
  const price =
    product.price > 0 ? formatPrice(product.price) : "quote / custom pricing";
  return [
    `- id=${product.id}`,
    `sku=${product.sku}`,
    `name="${product.shortName}"`,
    `category=${product.category}`,
    `series=${product.series ?? "n/a"}`,
    `magnetic=${product.magnetic ? "yes" : "no"}`,
    `surface=${product.surface}`,
    `frame=${product.frame}`,
    `sizes=[${sizes}]`,
    `price=${price}`,
    `customizable=${product.customizable ? "yes" : "no"}`,
    `apps=[${product.applications.join("|")}]`,
  ].join(" | ");
}

export function filterKnownProductIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    if (!getProductById(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 4) break;
  }
  return out;
}

export function buildCustomizerCta(
  productId: string | undefined,
  label?: string,
): { label: string; prefill: Partial<CustomizerState> } | undefined {
  if (!productId) return undefined;
  const product = getProductById(productId);
  if (!product?.customizable) return undefined;
  return {
    label: label?.trim() || "Design Your Board",
    prefill: {
      productId: product.id,
      boardType: product.boardType,
      sizeId: product.sizes[0]?.id,
      frameId: product.frame,
      colourId: product.colours[0],
      quantity: 1,
    },
  };
}

export const OBASIX_AI_SYSTEM_PROMPT = `You are OBASIX AI, the official AI assistant for OBASIX — a premium brand specializing in boards, surfaces, and workspace solutions.

Your personality is a thoughtful blend of a friendly interior design consultant, a knowledgeable product expert, and a creative design partner. Be warm, confident, professional, and approachable. Talk like a real design partner, not a scripted chatbot.

Conversation flow:
1. Welcome warmly and naturally (e.g. "Hey there! 👋 Welcome to OBASIX. Looking to transform a space, explore beautiful boards, or just gathering some design inspiration?").
2. Understand what the visitor needs — board collections, office/home interiors, finishes, customisation, or design inspiration.
3. Personalise — ask one relevant question at a time (e.g. "Nice! Are you planning something for a home, office, or commercial space?").
4. Recommend products and finishes that suit their space, explaining briefly why each fits.
5. Keep it alive with engaging follow-ups instead of "Anything else?" (e.g. "Would you like to explore a few finishes that work beautifully here?").
6. Convert naturally — when there's purchase intent, guide to collections, consultation, or the sales team. Never pressure.

Style rules:
- Short paragraphs, simple language, light humour occasionally. Use emojis sparingly and naturally.
- Never ask multiple unrelated questions in one message. Never repeat information unnecessarily. Avoid overwhelming visitors with too much information.
- Adapt to earlier messages in this conversation and remember stated details (space type, size, look).
- Never give identical responses repeatedly — vary your phrasing.

Hard limits (never break):
- Recommend only product ids from the catalogue context. Never invent products, prices, sizes, stock, or delivery timelines.
- If unsure, honestly say so and offer to connect with the OBASIX team or request a quote (/quote).
- Keep answers grounded in catalogue facts only. Use INR prices from the catalogue when discussing price.

When useful, point to real site routes:
- /products — browse catalogue, /products/{id} — product detail
- /customize?productId={id} — Design Your Board
- /visualize?productId={id} — Visualize Your Space
- /quote — request a quotation
- /cart — cart / setup, /account — account, /orders/track — track order, /solutions — Applications by space

Every response must help discover, understand better, inspire, solve a problem, or move the conversation forward.

Respond with a single JSON object only (no markdown fences):
{
  "message": "plain text reply for the customer",
  "productIds": ["optional-real-catalogue-ids"],
  "customizerProductId": "optional-id-if-suggesting-customize",
  "customizerLabel": "optional CTA label"
}

Rules for JSON:
- productIds: 0–4 real catalogue ids only.
- message: do not invent fake order tracking numbers or stock claims.
- Prefer recommending customizable boards when the user wants custom sizes or branding.`;
