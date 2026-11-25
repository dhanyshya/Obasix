import { expect, test, type Browser } from "@playwright/test";
import { nextIp, open, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-010: the account pages (associate, distributor, partner, company, proofs) read through FastAPI
 * when their areas are switched on, as they are in this suite. Each page is rendered for a real account
 * and must show what the API holds; the customer proof list is a new FastAPI endpoint.
 */
const PREFIX = "mig010";
const SITE = "http://localhost:3218";
const GSTIN = "27AAPFU0939F1ZV";

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(async () => {
  const users = (await query<{ id: string }>("SELECT id FROM users WHERE email LIKE $1", [`${PREFIX}+%`])).map((u) => u.id);
  if (users.length) {
    await query("DELETE FROM distributors WHERE user_id = ANY($1)", [users]);
    await query("DELETE FROM partners WHERE user_id = ANY($1)", [users]);
    await query("DELETE FROM associates WHERE user_id = ANY($1)", [users]);
  }
  const companies = (await query<{ company_id: string }>("SELECT company_id FROM company_members WHERE email LIKE $1", [`${PREFIX}+%`])).map((c) => c.company_id);
  if (companies.length) {
    await query("DELETE FROM reorder_lists WHERE company_id = ANY($1)", [companies]);
    await query("DELETE FROM company_members WHERE company_id = ANY($1)", [companies]);
    await query("DELETE FROM companies WHERE id = ANY($1)", [companies]);
  }
  await query("DELETE FROM demo_orders WHERE email LIKE $1", [`${PREFIX}+%`]);
  await query("DELETE FROM design_proofs WHERE quote_reference LIKE 'OBX-QUOTE-MIG010%'");
  await query("DELETE FROM quote_requests WHERE reference LIKE 'OBX-QUOTE-MIG010%'");
  await removeAccounts(PREFIX);
});

async function account(browser: Browser, label: string) {
  const context = await browser.newContext({ baseURL: SITE, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const email = uniqueEmail(PREFIX, label);
  await signUp(context.request, SITE, email, `${label} person`);
  const post = (path: string, data: unknown) => context.request.post(path, { data, headers: { origin: SITE } });
  return { context, email, post, page: await context.newPage() };
}

test("associate dashboard shows the code FastAPI issued", async ({ browser }) => {
  const a = await account(browser, "associate");
  const joined = await (await a.post("/api/associates", { profession: "Architect or interior designer", city: "Pune", accept: true })).json();
  await open(a.page, "/account/associate");
  await expect(a.page.getByRole("heading", { name: "Associate dashboard" })).toBeVisible();
  await expect(a.page.getByText(joined.associate.code, { exact: true })).toBeVisible();
  await a.context.close();
});

test("distributor and partner applications show as received", async ({ browser }) => {
  const d = await account(browser, "dealer");
  await d.post("/api/distributors", {
    businessName: `Traders ${Date.now().toString(36)}`, businessType: "Regional wholesaler", gstin: GSTIN, city: "Pune", state: "Maharashtra", territoryRequest: "Pune district", accept: true,
  });
  await open(d.page, "/account/distributor");
  await expect(d.page.getByRole("heading", { name: "Application received" })).toBeVisible();

  const p = await account(browser, "partner");
  await p.post("/api/partners", { action: "apply", companyName: `Fitout ${Date.now().toString(36)}`, partnerType: "Fit-out or interior contractor", gstin: GSTIN, city: "Mumbai", state: "MH", sectors: ["Hotel"], accept: true });
  await open(p.page, "/account/partner");
  await expect(p.page.getByRole("heading", { name: "Application received" })).toBeVisible();
  await d.context.close();
  await p.context.close();
});

test("company page shows the company created through FastAPI", async ({ browser }) => {
  const c = await account(browser, "buyer");
  const name = `Branches ${Date.now().toString(36)}`;
  expect((await c.post("/api/company", { action: "create", name, gstin: "", billingAddress: "Pune" })).ok()).toBe(true);
  const placed = await c.context.request.post("/api/commerce/orders", {
    data: { details: { name: "Company Buyer", email: c.email, phone: "+91 98765 43210", shipping: { line: "12 MG Road", city: "Pune", state: "MH", postal: "411001" } }, lines: [{ productId: "cmwb6090", quantity: 2 }], method: "upi" },
    headers: { origin: SITE, "idempotency-key": `mig010-${Date.now()}` },
  });
  const orderId = (await placed.json()).order.id;
  const listed = await (await c.context.request.get("/api/commerce/orders")).json();
  expect(listed.orders.map((o: { id: string }) => o.id)).toEqual([orderId]);
  await open(c.page, "/account/company");
  await expect(c.page.getByRole("heading", { name })).toBeVisible();
  await expect(c.page.getByText(orderId, { exact: true })).toBeVisible(); // recent orders, read through FastAPI
  await c.context.close();
});

test("proofs page lists only the customer's own threads, from the new GET /api/proofs", async ({ browser }) => {
  const c = await account(browser, "proofs");
  const mine = `OBX-QUOTE-MIG010-${Date.now().toString(36).toUpperCase()}`;
  const theirs = `${mine}X`;
  for (const [reference, email] of [[mine, c.email], [theirs, "someone-else@example.test"]]) {
    const payload = { reference, idempotencyKey: `k-${reference}`, createdAt: "2026-11-20T10:00:00.000Z", email };
    await query("INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) VALUES ($1, $2, $3, $4, $5)", [reference, payload.idempotencyKey, email, payload.createdAt, JSON.stringify(payload)]);
    await query(
      "INSERT INTO design_proofs (id, quote_reference, version, file_name, stored_as, mime_type, size, staff_note, uploaded_by, created_at, status) VALUES ($1, $2, 1, 'logo.png', 'x.png', 'image/png', 5, 'Check it', 'staff@example.test', '2026-11-21T10:00:00.000Z', 'pending')",
      [`PRF-${reference.slice(-8)}`, reference],
    );
  }
  const listed = await (await c.context.request.get("/api/proofs")).json();
  expect(listed.threads.map((t: { reference: string }) => t.reference)).toEqual([mine]);
  await open(c.page, "/account/proofs");
  await expect(c.page.getByText(mine, { exact: true })).toBeVisible();
  await expect(c.page.getByText(theirs, { exact: true })).toHaveCount(0);
  await c.context.close();
});
