// Creates every table the site creates for itself (each store's ensureSchema), in DATABASE_URL.
// Used by scripts/check-schema.sh to prove Alembic's migrations create the same schema.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(root, "src"), "server-only": path.join(root, "scripts/schema/server-only-stub.mjs") },
});
const load = (p) => jiti.import(path.join(root, "src/lib", p));

await (await load("auth/db.ts")).authDb();
await (await load("rateLimit.ts")).allowAttempt("schema-check", 1, 1);
await (await load("stock/store.ts")).listStock();
await (await load("quotes/demo-store.ts")).findDemoQuote("none");
await (await load("proofs/store.ts")).listAllProofs();
await (await load("commerce/order-store.ts")).findDemoOrderById("none");
const associates = await load("associates/store.ts");
await associates.findAssociateByUser("none");
await associates.listAdminCommissions();
await (await load("distributors/store.ts")).findDistributor("none");
await (await load("partners/store.ts")).findPartner("none");
await (await load("company/store.ts")).findMembership("none");
console.log("site schema created");
process.exit(0);
