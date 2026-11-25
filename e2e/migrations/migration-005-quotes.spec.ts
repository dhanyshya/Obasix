import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { nextIp, open, PASSWORD, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-005: reading saved quotes on FastAPI (customer lookup and the staff list), and the
 * admin app's Quotes page. (Submitting moved later, in MIG-005b.)
 * See docs/migrations/tracking.md. mig005+admin@example.test is in OBASIX_ADMIN_EMAILS.
 */
const PREFIX = "mig005";
const ADMIN = "mig005+admin@example.test";
const ADMIN_APP = "http://localhost:4173";
const SITE = "http://localhost:3218";

const tmp = mkdtempSync(path.join(tmpdir(), "mig005-"));
const pdf = path.join(tmp, "floor-plan.pdf");
writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(async () => {
  const refs = await query<{ reference: string }>("SELECT reference FROM quote_requests WHERE email LIKE $1", [`${PREFIX}+%`]);
  for (const { reference } of refs) await query("DELETE FROM customer_quotes WHERE reference = $1", [reference]);
  await query("DELETE FROM quote_requests WHERE email LIKE $1", [`${PREFIX}+%`]);
  await query("DELETE FROM staff_roles WHERE email LIKE $1", [`${PREFIX}+%`]);
  await removeAccounts(PREFIX);
});

async function visitor(browser: Browser, baseURL = SITE) {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  return { context, page: await context.newPage() };
}

/** Fills the site's quote form and submits it; returns the reference from the confirmation page. */
async function submitQuote(page: Page, email: string, name: string) {
  await open(page, "/quote?boardType=Glass%20Board&quantity=3");
  await page.getByLabel("Full Name").fill(name);
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Mobile Number").fill("9876509876");
  await page.getByLabel("Location / City").fill("Pune");
  const dims = page.getByLabel(/Dimensions|Size/i).first();
  if (await dims.count()) await dims.fill("6x4 ft").catch(() => {});
  await page.locator('input[type="file"]').setInputFiles(pdf);
  const submitted = page.waitForResponse((r) => r.url().endsWith("/api/quotes") && r.request().method() === "POST");
  const lookedUp = page.waitForResponse((r) => /\/api\/quotes\/OBX-QUOTE-DEMO-/.test(r.url()));
  await page.locator('main form button[type="submit"]').click();
  const post = await submitted;
  expect(post.status()).toBe(200);
  // Submitting moved to FastAPI in MIG-005b ("quote-submit"); this suite only needs it to work.
  const submitOnFastApi = (process.env.OBASIX_API_ROUTES ?? "quote-submit").split(",").includes("quote-submit");
  expect(Boolean(post.headers()["x-request-id"]), "submission served where the configured areas say").toBe(submitOnFastApi);
  const lookup = await lookedUp;
  expect(lookup.status()).toBe(200);
  expect(lookup.headers()["x-request-id"], "reading is served by FastAPI").toBeTruthy();
  await expect(page).toHaveURL(/quote\/confirmation/);
  const reference = (await page.getByText(/OBX-QUOTE-DEMO-[0-9A-F]{12}/).first().textContent())!.match(/OBX-QUOTE-DEMO-[0-9A-F]{12}/)![0];
  return reference;
}

test("a guest submits on the site → the confirmation page reads it from FastAPI → nobody else can", async ({ browser }) => {
  const guest = await visitor(browser);
  const email = uniqueEmail(PREFIX, "guest");
  const reference = await submitQuote(guest.page, email, "Guest Buyer");
  await expect(guest.page.getByText("floor-plan.pdf")).toBeVisible();

  const [row] = await query<{ email: string; payload: string }>("SELECT email, payload FROM quote_requests WHERE reference = $1", [reference]);
  expect(row.email).toBe(email);
  expect(JSON.parse(row.payload)).toMatchObject({ boardType: "Glass Board", quantity: 3, attachment: { name: "floor-plan.pdf" } });

  // The same browser can reload it (signed cookie); another browser gets the not-found answer.
  await guest.page.reload();
  await expect(guest.page.getByText(reference).first()).toBeVisible();
  const other = await visitor(browser);
  const denied = await other.context.request.get(`/api/quotes/${reference}`);
  expect(denied.status()).toBe(404);
  expect(denied.headers()["x-request-id"]).toBeTruthy();
  expect(await denied.json()).toEqual({ ok: false, message: "No saved demo quote matches that reference." });
  // A forged cookie doesn't help.
  await other.context.addCookies([{ name: "obasix_quotes", value: `${reference}.forged`, url: SITE }]);
  expect((await other.context.request.get(`/api/quotes/${reference}`)).status()).toBe(404);
  await guest.context.close();
  await other.context.close();
});

test("a signed-in customer's quote is readable from any browser they sign in on", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "account");
  const first = await visitor(browser);
  await signUp(first.context.request, SITE, email, "Account Buyer");
  const reference = await submitQuote(first.page, email, "Account Buyer");
  expect(await query("SELECT 1 FROM customer_quotes WHERE reference = $1", [reference])).toHaveLength(1);

  const second = await visitor(browser);
  expect((await second.context.request.get(`/api/quotes/${reference}`)).status()).toBe(404);
  const login = await second.context.request.post("/api/auth?action=login", { data: { email, password: PASSWORD }, headers: { origin: SITE } });
  expect(login.status()).toBe(200);
  const body = await (await second.context.request.get(`/api/quotes/${reference}`)).json();
  expect(body).toMatchObject({ ok: true, quote: { reference, boardType: "Glass Board", quantity: 3, attachmentName: "floor-plan.pdf" } });
  expect(body.quote.email).toBeUndefined(); // the customer view carries no contact details
  await first.context.close();
  await second.context.close();
});

test("staff find a quote in the admin app: search, file filter, details; customers can't list quotes", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "listed");
  const buyer = await visitor(browser);
  const reference = await submitQuote(buyer.page, email, "Listed Buyer");
  await buyer.context.close();

  const customer = await visitor(browser);
  await signUp(customer.context.request, SITE, uniqueEmail(PREFIX, "nosy"));
  const refused = await customer.context.request.get("/api/admin/quotes");
  expect(refused.status()).toBe(404);
  expect(refused.headers()["x-request-id"]).toBeTruthy();
  await customer.context.close();

  const site = await visitor(browser);
  if ((await query("SELECT 1 FROM users WHERE email = $1", [ADMIN])).length === 0) await signUp(site.context.request, SITE, ADMIN, "MIG-005 Admin");
  await site.context.close();

  const staff = await visitor(browser, ADMIN_APP);
  await staff.page.goto("/");
  await staff.page.getByLabel("Email").fill(ADMIN);
  await staff.page.getByLabel("Password").fill(PASSWORD);
  await staff.page.getByRole("button", { name: "Sign in" }).click();
  await staff.page.getByRole("link", { name: "Quotes" }).click();
  await expect(staff.page.getByRole("heading", { name: "Quotes" })).toBeVisible();

  await staff.page.getByLabel("Search").fill(reference);
  await staff.page.getByRole("button", { name: "Apply" }).click();
  const table = staff.page.getByRole("table", { name: "Quote requests" });
  await expect(table.getByRole("row")).toHaveCount(2); // header + this quote
  await expect(table).toContainText("Listed Buyer");
  await expect(table).toContainText("File: floor-plan.pdf");

  await staff.page.getByRole("combobox", { name: "File" }).click();
  await staff.page.getByRole("option", { name: "No file" }).click();
  await staff.page.getByRole("button", { name: "Apply" }).click();
  await expect(staff.page.getByText("No quotes match.")).toBeVisible();
  await staff.page.getByRole("combobox", { name: "File" }).click();
  await staff.page.getByRole("option", { name: "With a file" }).click();
  await staff.page.getByRole("button", { name: "Apply" }).click();
  await expect(table).toContainText(reference);

  await staff.page.getByRole("button", { name: `Details for ${reference}` }).click();
  const dialog = staff.page.getByRole("dialog", { name: `Quote ${reference}` });
  await expect(dialog).toContainText(email);
  await expect(dialog).toContainText("9876509876");
  await expect(dialog).toContainText("floor-plan.pdf");
  await staff.context.close();
});
