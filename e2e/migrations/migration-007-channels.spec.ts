import { expect, test, type Browser } from "@playwright/test";
import { nextIp, PASSWORD, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-007: trade channels (associates, distributors, partners, company accounts) on FastAPI, run from
 * the admin app. The site's own channel journeys (e2e/channels.spec.ts) run against FastAPI in
 * scripts/regression-fastapi.sh. mig007+admin@example.test is in OBASIX_ADMIN_EMAILS.
 */
const PREFIX = "mig007";
const ADMIN = "mig007+admin@example.test";
const ADMIN_APP = "http://localhost:4173";
const SITE = "http://localhost:3218";
const GSTIN = "27AAPFU0939F1ZV";

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(async () => {
  const users = (await query<{ id: string }>("SELECT id FROM users WHERE email LIKE $1", [`${PREFIX}+%`])).map((u) => u.id);
  if (users.length) {
    await query("DELETE FROM distributor_orders WHERE user_id = ANY($1)", [users]);
    await query("DELETE FROM distributors WHERE user_id = ANY($1)", [users]);
    await query("DELETE FROM partner_projects WHERE partner_user_id = ANY($1)", [users]);
    await query("DELETE FROM partners WHERE user_id = ANY($1)", [users]);
    const codes = (await query<{ code: string }>("SELECT code FROM associates WHERE user_id = ANY($1)", [users])).map((a) => a.code);
    await query("DELETE FROM associate_commissions WHERE code = ANY($1)", [codes]);
    await query("DELETE FROM associates WHERE user_id = ANY($1)", [users]);
  }
  await query("DELETE FROM demo_orders WHERE email LIKE $1", [`${PREFIX}+%`]);
  await removeAccounts(PREFIX);
});

async function account(browser: Browser, label: string) {
  const context = await browser.newContext({ baseURL: SITE, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const email = uniqueEmail(PREFIX, label);
  await signUp(context.request, SITE, email, `${label} person`);
  const post = (path: string, data: unknown, headers: Record<string, string> = {}) =>
    context.request.post(path, { data, headers: { origin: SITE, ...headers } });
  return { context, email, post };
}

async function adminApp(browser: Browser, section: string) {
  if ((await query("SELECT 1 FROM users WHERE email = $1", [ADMIN])).length === 0) {
    const c = await browser.newContext({ baseURL: SITE, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
    await signUp(c.request, SITE, ADMIN, "MIG-007 Admin");
    await c.close();
  }
  const context = await browser.newContext({ baseURL: ADMIN_APP, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Email").fill(ADMIN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: section }).click();
  await expect(page.getByRole("heading", { name: section })).toBeVisible();
  return { context, page };
}

test("distributor: applies → approved in the admin app with terms → trade order on advance → payment recorded → dispatched", async ({ browser }) => {
  const dealer = await account(browser, "dealer");
  const business = `Traders ${Date.now().toString(36)}`;
  const applied = await dealer.post("/api/distributors", {
    businessName: business, businessType: "Regional wholesaler", gstin: GSTIN, city: "Pune", state: "Maharashtra", territoryRequest: "Pune district", accept: true,
  });
  expect(applied.headers()["x-request-id"]).toBeTruthy();
  expect((await applied.json()).distributor.status).toBe("pending");

  const staff = await adminApp(browser, "Distributors");
  await staff.page.getByRole("button", { name: `Decide ${business}` }).click();
  const decide = staff.page.getByRole("dialog", { name: `Decide ${business}` });
  await decide.getByLabel("Credit limit (₹)").fill("60000");
  await decide.getByLabel("Next territory review").fill("2027-03-31");
  await decide.getByRole("button", { name: "Save decision" }).click();
  await expect(staff.page.getByText(`Saved the decision for ${business}.`)).toBeVisible();

  const order = await dealer.post("/api/distributors/orders", { paymentTerms: "advance", lines: [{ productId: "cmwb6090", quantity: 12 }], reference: "PO-77" }, { "idempotency-key": `dealer-${Date.now()}` });
  const placed = (await order.json()).order;
  expect(placed).toMatchObject({ status: "Awaiting payment", netTotal: 17964, discountRate: 0.18 });

  await staff.page.reload();
  const row = staff.page.getByRole("table", { name: "Trade orders" }).getByRole("row", { name: new RegExp(placed.id) });
  await row.getByRole("button", { name: "Record payment" }).click();
  await staff.page.getByRole("dialog").getByLabel("Payment or UTR reference").fill("UTR-MIG007");
  await staff.page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(staff.page.getByText(`${placed.id} updated.`)).toBeVisible();
  await row.getByRole("button", { name: "Mark dispatched" }).click();
  await staff.page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(row).toContainText("Dispatched");

  const me = await (await dealer.context.request.get("/api/distributors/me")).json();
  expect(me.orders[0]).toMatchObject({ id: placed.id, status: "Dispatched", paymentRef: "UTR-MIG007" });
  const audit = await query<{ action: string }>("SELECT action FROM audit_log WHERE target_id = ANY($1) ORDER BY id", [[placed.id, me.distributor.userId]]);
  expect(audit.map((a) => a.action)).toEqual(["distributor.decide", "trade.record-payment", "trade.advance"]);
  await staff.context.close();
  await dealer.context.close();
});

test("partner: applies → approved → registers a project → quoted with a margin in the admin app", async ({ browser }) => {
  const partner = await account(browser, "partner");
  const company = `Fitout ${Date.now().toString(36)}`;
  await partner.post("/api/partners", {
    action: "apply", companyName: company, partnerType: "Fit-out or interior contractor", gstin: GSTIN, city: "Mumbai", state: "MH", sectors: ["Hotel"], accept: true,
  });
  const staff = await adminApp(browser, "Partners");
  await staff.page.getByRole("button", { name: `Decide ${company}` }).click();
  await staff.page.getByRole("dialog").getByRole("button", { name: "Save decision" }).click();
  await expect(staff.page.getByText(`Saved the decision for ${company}.`)).toBeVisible();

  const client = `Grand Hotel ${Date.now().toString(36)}`;
  const registered = await (await partner.post("/api/partners", {
    action: "register-project", clientName: client, city: "Goa", sector: "Hotel", scope: "120 rooms with notice boards", expectedValue: 400000, expectedDate: "2027-02-01",
  })).json();
  expect(registered.id).toMatch(/^PRJ-/);

  await staff.page.reload();
  const row = staff.page.getByRole("table", { name: "Projects" }).getByRole("row", { name: new RegExp(registered.id) });
  await row.getByRole("button", { name: "Quote" }).click();
  const quote = staff.page.getByRole("dialog", { name: `Quote ${registered.id}` });
  await quote.getByLabel("Partner margin (%)").fill("31");
  await quote.getByRole("button", { name: "Confirm" }).click();
  await expect(quote.getByRole("alert")).toContainText("Set a margin between 0 and 30%.");
  await quote.getByLabel("Partner margin (%)").fill("8");
  await quote.getByRole("button", { name: "Confirm" }).click();
  await expect(row).toContainText("8.0% · ₹32,000");
  const mine = (await (await partner.context.request.get("/api/partners/me")).json()).projects[0];
  expect(mine).toMatchObject({ id: registered.id, status: "Quoted", quotedValue: 400000, marginRate: 0.08, earning: 32000 });
  await staff.context.close();
  await partner.context.close();
});

test("associate: a referred order is delivered → commission payable → paid in the admin app; strangers are refused", async ({ browser }) => {
  const associate = await account(browser, "associate");
  const code = (await (await associate.post("/api/associates", { profession: "Facility manager", city: "Pune", accept: true })).json()).associate.code;
  const buyer = await account(browser, "buyer");
  expect((await (await buyer.post("/api/associates/ref", { code })).json()).kept).toBe(false);
  const order = await buyer.post("/api/commerce/orders", {
    method: "upi", lines: [{ productId: "cmwb6090", quantity: 4 }],
    details: { name: "Buyer", email: buyer.email, phone: "9876500000", shipping: { line: "1 Road", city: "Pune", state: "MH", postal: "411001" } },
  }, { "idempotency-key": `assoc-${Date.now()}` });
  const orderId = (await order.json()).order.id;
  await query("UPDATE demo_orders SET status = 'Delivered' WHERE id = $1", [orderId]);

  const staff = await adminApp(browser, "Associates");
  const commissions = staff.page.getByRole("table", { name: "Commissions" });
  const row = commissions.getByRole("row", { name: new RegExp(orderId) });
  await expect(row).toContainText("Payable");
  await expect(row).toContainText("₹365");
  await row.getByRole("checkbox").check();
  await staff.page.getByRole("button", { name: "Pay 1 selected" }).click();
  await staff.page.getByRole("dialog").getByLabel("Bank or UTR reference").fill("UTR-ASSOC-7");
  await staff.page.getByRole("dialog").getByRole("button", { name: "Mark paid" }).click();
  await expect(row).toContainText("Paid · UTR-ASSOC-7");

  const dashboard = await (await associate.context.request.get("/api/associates/me")).json();
  expect(dashboard.commissions[0]).toMatchObject({ orderId, state: "Paid", amount: 365, payoutRef: "UTR-ASSOC-7" });
  for (const path of ["/api/admin/associates", "/api/admin/distributors", "/api/admin/partners", "/api/admin/trade-orders", "/api/admin/projects"]) {
    expect((await buyer.context.request.get(path)).status(), path).toBe(404);
  }
  await staff.context.close();
  await associate.context.close();
  await buyer.context.close();
});
