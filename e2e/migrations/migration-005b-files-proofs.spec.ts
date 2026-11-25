import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Browser } from "@playwright/test";
import { nextIp, open, PASSWORD, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-005b: quote submission with its file, quote file downloads, and design proofs on FastAPI.
 * Files go to the site's own files folder (OBASIX_FILES_DIR), so both apps read what the other wrote.
 * See docs/migrations/tracking.md. mig5b+admin@example.test is in OBASIX_ADMIN_EMAILS.
 */
const PREFIX = "mig5b";
const ADMIN = "mig5b+admin@example.test";
const ADMIN_APP = "http://localhost:4173";
const SITE = "http://localhost:3218";
const FILES = path.join(process.cwd(), ".data");

const tmp = mkdtempSync(path.join(tmpdir(), "mig5b-"));
const plan = path.join(tmp, "room-plan.pdf");
writeFileSync(plan, "%PDF-1.4\n% room plan for MIG-005b\n%%EOF\n");
// A real 1×1 PNG, so the customer's proof page can show it.
const proofPng = path.join(tmp, "proof-v1.png");
writeFileSync(proofPng, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
const proofPng2 = path.join(tmp, "proof-v2.png");
writeFileSync(proofPng2, readFileSync(proofPng));

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(async () => {
  const refs = (await query<{ reference: string }>("SELECT reference FROM quote_requests WHERE email LIKE $1", [`${PREFIX}+%`])).map((r) => r.reference);
  if (refs.length) {
    await query("DELETE FROM design_proofs WHERE quote_reference = ANY($1)", [refs]);
    await query("DELETE FROM customer_quotes WHERE reference = ANY($1)", [refs]);
    await query("DELETE FROM quote_requests WHERE reference = ANY($1)", [refs]);
  }
  await removeAccounts(PREFIX);
});

async function visitor(browser: Browser, baseURL = SITE) {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  return { context, page: await context.newPage() };
}

async function ensureAccount(browser: Browser, email: string, name: string) {
  if ((await query("SELECT 1 FROM users WHERE email = $1", [email])).length) return;
  const v = await visitor(browser);
  await signUp(v.context.request, SITE, email, name);
  await v.context.close();
}

test("quote with a file: submitted to FastAPI, file in the shared store, staff download it from both admins", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "buyer");
  const buyer = await visitor(browser);
  await signUp(buyer.context.request, SITE, email, "Proof Buyer");
  await open(buyer.page, "/quote?boardType=Glass%20Board&quantity=1");
  await buyer.page.getByLabel("Full Name").fill("Proof Buyer");
  await buyer.page.getByLabel("Email Address").fill(email);
  await buyer.page.getByLabel("Mobile Number").fill("9876509876");
  await buyer.page.getByLabel("Location / City").fill("Pune");
  await buyer.page.locator('input[type="file"]').setInputFiles(plan);
  const submitted = buyer.page.waitForResponse((r) => r.url().endsWith("/api/quotes") && r.request().method() === "POST");
  await buyer.page.locator('main form button[type="submit"]').click();
  const post = await submitted;
  expect(post.status()).toBe(200);
  expect(post.headers()["x-request-id"], "submission is served by FastAPI").toBeTruthy();
  const { reference } = await post.json();
  await expect(buyer.page).toHaveURL(/quote\/confirmation/);
  await expect(buyer.page.getByText(reference).first()).toBeVisible();

  const stored = path.join(FILES, "quote-files", `${reference}.pdf`);
  expect(readFileSync(stored, "utf8")).toContain("room plan for MIG-005b");
  expect(await query("SELECT 1 FROM customer_quotes WHERE reference = $1", [reference])).toHaveLength(1);
  await buyer.context.close();

  await ensureAccount(browser, ADMIN, "MIG-005b Admin");
  // The site's own staff page: its download link now reaches FastAPI.
  const site = await visitor(browser);
  await site.context.request.post("/api/auth?action=login", { data: { email: ADMIN, password: PASSWORD }, headers: { origin: SITE } });
  const viaSite = await site.context.request.get(`/api/admin/quotes/${reference}/file`);
  expect(viaSite.status()).toBe(200);
  expect(viaSite.headers()["x-request-id"]).toBeTruthy();
  expect(await viaSite.text()).toContain("room plan for MIG-005b");
  await site.context.close();

  // The admin app: details → download.
  const staff = await visitor(browser, ADMIN_APP);
  await staff.page.goto("/");
  await staff.page.getByLabel("Email").fill(ADMIN);
  await staff.page.getByLabel("Password").fill(PASSWORD);
  await staff.page.getByRole("button", { name: "Sign in" }).click();
  await staff.page.getByRole("link", { name: "Quotes" }).click();
  await staff.page.getByLabel("Search").fill(reference);
  await staff.page.getByRole("button", { name: "Apply" }).click();
  await staff.page.getByRole("button", { name: `Details for ${reference}` }).click();
  const download = staff.page.waitForEvent("download");
  await staff.page.getByRole("link", { name: /Download room-plan.pdf/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${reference}.pdf`);
  expect(readFileSync(await file.path(), "utf8")).toContain("room plan for MIG-005b");
  const [downloadAudit] = await query<{ actor_email: string }>(
    "SELECT actor_email FROM audit_log WHERE action = 'quote.file.download' AND target_id = $1 ORDER BY id DESC LIMIT 1",
    [reference],
  );
  expect(downloadAudit.actor_email).toBe(ADMIN);
  await staff.context.close();

  const stranger = await visitor(browser);
  await signUp(stranger.context.request, SITE, uniqueEmail(PREFIX, "stranger"));
  expect((await stranger.context.request.get(`/api/admin/quotes/${reference}/file`)).status()).toBe(404);
  await stranger.context.close();
});

test("proofs: staff send v1 in the admin app → customer asks for changes on the site → v2 → approved → closed", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "proofs");
  const customer = await visitor(browser);
  await signUp(customer.context.request, SITE, email, "Proof Customer");
  const reference = `OBX-QUOTE-DEMO-${Date.now().toString(16).toUpperCase().slice(-12).padStart(12, "0")}`;
  const quote = { reference, idempotencyKey: `k-${reference}`, createdAt: new Date().toISOString(), email, name: "Proof Customer" };
  await query("INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) VALUES ($1, $2, $3, $4, $5)", [
    reference,
    quote.idempotencyKey,
    email,
    quote.createdAt,
    JSON.stringify(quote),
  ]);

  await ensureAccount(browser, ADMIN, "MIG-005b Admin");
  const staff = await visitor(browser, ADMIN_APP);
  await staff.page.goto("/");
  await staff.page.getByLabel("Email").fill(ADMIN);
  await staff.page.getByLabel("Password").fill(PASSWORD);
  await staff.page.getByRole("button", { name: "Sign in" }).click();
  await staff.page.getByRole("link", { name: "Proofs" }).click();
  const send = async (file: string, note: string) => {
    await staff.page.getByLabel("Quote reference").fill(reference);
    await staff.page.getByLabel("Note to the customer").fill(note);
    await staff.page.getByLabel("Proof file").setInputFiles(file);
    await staff.page.getByRole("button", { name: "Send proof" }).click();
    await staff.page.getByRole("dialog").getByRole("button", { name: "Send proof" }).click();
  };
  await send(proofPng, "First layout");
  await expect(staff.page.getByText(`Version 1 sent to the customer for ${reference}.`)).toBeVisible();

  // The customer reviews it on the site (page from Next.js, file and decision from FastAPI).
  await open(customer.page, "/account/proofs");
  await expect(customer.page.getByText("Version 1 · Waiting for your review")).toBeVisible();
  const image = customer.page.getByRole("img", { name: `Proof version 1 for ${reference}` });
  await expect(image).toBeVisible();
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await customer.page.getByRole("button", { name: "Request changes" }).click();
  await customer.page.getByLabel("What should we change?").fill("Move the logo to the left");
  const decided = customer.page.waitForResponse((r) => r.url().endsWith("/api/proofs") && r.request().method() === "POST");
  await customer.page.getByRole("button", { name: "Send changes" }).click();
  const decision = await decided;
  expect(decision.status()).toBe(200);
  expect(decision.headers()["x-request-id"]).toBeTruthy();

  await staff.page.reload();
  const table = staff.page.getByRole("table", { name: "Proofs" });
  await expect(table.getByRole("row", { name: /v1/ })).toContainText("Changes requested");
  await expect(table).toContainText("“Move the logo to the left”");
  await send(proofPng2, "Logo moved");
  await expect(staff.page.getByText(`Version 2 sent to the customer for ${reference}.`)).toBeVisible();

  await open(customer.page, "/account/proofs");
  await customer.page.getByRole("button", { name: "Approve version 2" }).click();
  await customer.page.getByRole("checkbox").check();
  await customer.page.getByRole("button", { name: "Approve for production" }).click();
  await expect(customer.page.getByText(/approved/i).first()).toBeVisible();

  const rows = await query<{ version: number; status: string }>("SELECT version, status FROM design_proofs WHERE quote_reference = $1 ORDER BY version", [reference]);
  expect(rows).toEqual([
    { version: 1, status: "changes" },
    { version: 2, status: "approved" },
  ]);
  // After an approval nothing more can be sent.
  await send(proofPng, "One more");
  await expect(staff.page.getByRole("alert")).toContainText("already approved a proof");
  const uploads = await query("SELECT 1 FROM audit_log WHERE action = 'proof.upload' AND target_id = $1", [reference]);
  expect(uploads).toHaveLength(2);

  // Someone else can't see or decide on these proofs.
  const [latest] = await query<{ id: string }>("SELECT id FROM design_proofs WHERE quote_reference = $1 AND version = 2", [reference]);
  const stranger = await visitor(browser);
  await signUp(stranger.context.request, SITE, uniqueEmail(PREFIX, "nosy"));
  expect((await stranger.context.request.get(`/api/proofs/${latest.id}/file`)).status()).toBe(404);
  const refused = await stranger.context.request.post("/api/proofs", {
    data: { proofId: latest.id, decision: "changes", comment: "Sneaky change" },
    headers: { origin: SITE },
  });
  expect(refused.status()).toBe(404);
  await staff.context.close();
  await customer.context.close();
  await stranger.context.close();
});
