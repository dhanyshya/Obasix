// Writes the catalogue and company facts the Python API needs to api/app/data/.
// The TypeScript files in src/data stay the single source of truth; run this
// after changing them (CI checks the output is current).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") } });
const { products } = await jiti.import(path.join(root, "src/data/catalogue.ts"));
const { company } = await jiti.import(path.join(root, "src/data/company.ts"));
const catalogueModule = await jiti.import(path.join(root, "src/data/catalogue.ts"));
const aiContext = await jiti.import(path.join(root, "src/lib/ai/catalogueContext.ts"));

const catalogue = products.map((p) => ({
  id: p.id,
  slug: p.slug,
  name: p.shortName,
  sku: p.sku,
  price: p.price,
  frame: p.frame ?? null,
  sizes: p.sizes.map((s) => s.id),
  colours: p.colours,
}));
const out = path.join(root, "api/app/data");
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "catalogue.json"), JSON.stringify(catalogue, null, 2) + "\n");
writeFileSync(
  path.join(out, "company.json"),
  JSON.stringify({ legalName: company.legalName, email: company.email, phoneDisplay: company.phoneDisplay }, null, 2) + "\n",
);
// AI (MIG-008): the chat's fixed text exactly as the site builds it, and the fields its fallback,
// customizer links and frame-colour suggestions use.
const ai = {
  systemPrompt: aiContext.OBASIX_AI_SYSTEM_PROMPT,
  catalogueContext: aiContext.buildCatalogueContext(48),
  products: products.map((p) => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    shortName: p.shortName,
    price: p.price,
    surface: p.surface ?? null,
    category: p.category,
    frame: p.frame ?? null,
    featured: Boolean(p.featured),
    customizable: Boolean(p.customizable),
    boardType: p.boardType ?? null,
    firstSize: p.sizes[0]?.id ?? null,
    firstColour: p.colours[0] ?? null,
  })),
  frames: catalogueModule.frames.map((f) => ({ id: f.id, name: f.name, description: f.description })),
  colours: catalogueModule.colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
};
writeFileSync(path.join(out, "ai.json"), JSON.stringify(ai, null, 2) + "\n");
console.log(`Exported ${catalogue.length} products to api/app/data/.`);
