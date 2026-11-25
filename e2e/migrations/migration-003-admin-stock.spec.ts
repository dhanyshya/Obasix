import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";
import { nextIp, open, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-003: staff roles, the audit log, and stock (/api/admin/stock) on FastAPI.
 * See docs/migrations/tracking.md.
 *
 * mig003+admin@example.test is in OBASIX_ADMIN_EMAILS (playwright.migrations.config.ts).
 * Audit rows are append-only by design, so they stay in the test database; product
 * stock is put back to untracked at the end.
 */
const PREFIX = "mig003";
const ADMIN = "mig003+admin@example.test";
const PRODUCT = { id: "spbpcbg6090", slug: "superior-pinup-green-2x3", name: /Superior Pin-up Green 2×3/ };

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });

async function visitor(browser: Browser, baseURL: string) {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  return { context, page: await context.newPage() };
}

async function signInAdmin(request: APIRequestContext, origin: string) {
  const login = await request.post("/api/auth?action=login", {
    data: { email: ADMIN, password: "Correct-horse-2027" },
    headers: { origin },
  });
  if (login.ok()) return;
  await signUp(request, origin, ADMIN, "MIG-003 Admin");
}

const stockRow = async () =>
  (await query<{ on_hand: number; updated_by: string }>("SELECT on_hand, updated_by FROM product_stock WHERE product_id = $1", [PRODUCT.id]))[0];
/** Audit rows written after `afterId` (ids only grow; no clocks involved). */
const lastAuditId = async () => Number((await query<{ id: string | null }>("SELECT MAX(id) AS id FROM audit_log"))[0].id ?? 0);
const auditFor = (afterId: number) =>
  query<{ action: string; actor_email: string; actor_role: string; detail: { before: number | null; after: number | null } }>(
    "SELECT action, actor_email, actor_role, detail FROM audit_log WHERE target_id = $1 AND id > $2 ORDER BY id",
    [PRODUCT.id, afterId],
  );

test.beforeAll(async () => {
  await query("DELETE FROM product_stock WHERE product_id = $1", [PRODUCT.id]);
  await query("DELETE FROM staff_roles WHERE email LIKE $1", [`${PREFIX}+%`]);
});
test.afterAll(async () => {
  await query("DELETE FROM product_stock WHERE product_id = $1", [PRODUCT.id]);
  await query("DELETE FROM staff_roles WHERE email LIKE $1", [`${PREFIX}+%`]);
  await removeAccounts(PREFIX);
});

test("staff set stock on the staff page → FastAPI saves and audits it → customers see it", async ({ browser, baseURL, page }) => {
  const started = await lastAuditId();
  const staff = await visitor(browser, baseURL!);
  await signInAdmin(staff.context.request, baseURL!);
  await open(staff.page, "/admin/stock");

  const row = staff.page.getByRole("row", { name: PRODUCT.name });
  const saved = staff.page.waitForResponse((r) => r.url().endsWith("/api/admin/stock") && r.request().method() === "POST");
  await row.getByRole("spinbutton").fill("5");
  await row.getByRole("button", { name: "Save" }).click();
  const response = await saved;
  expect(response.headers()["x-request-id"]).toBeTruthy(); // answered by FastAPI
  await expect(row.getByRole("status")).toHaveText("Saved");

  expect(await stockRow()).toEqual({ on_hand: 5, updated_by: ADMIN });
  await open(page, `/products/${PRODUCT.slug}`);
  await expect(page.getByRole("status").filter({ hasText: "Only 5 left in stock" })).toBeVisible();

  // A value the site refuses is refused with the same message, and isn't logged.
  await row.getByRole("spinbutton").fill("100001");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByRole("status")).toHaveText("Enter a whole number from 0 to 100,000.");

  const stopped = staff.page.waitForResponse((r) => r.url().endsWith("/api/admin/stock") && r.request().method() === "POST" && r.ok());
  await staff.page.reload();
  await staff.page.getByRole("row", { name: PRODUCT.name }).getByRole("button", { name: "Stop tracking" }).click();
  await stopped;
  expect(await stockRow()).toBeUndefined();
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: /in stock|left|Made to order/ })).toHaveCount(0);

  expect(await auditFor(started)).toEqual([
    { action: "stock.set", actor_email: ADMIN, actor_role: "admin", detail: { before: null, after: 5 } },
    { action: "stock.untrack", actor_email: ADMIN, actor_role: "admin", detail: { before: 5, after: null } },
  ]);
  await staff.context.close();
});

test("visitors and customers can't reach the admin API; changes from other sites are refused", async ({ request, browser, baseURL }) => {
  for (const url of ["/api/admin/me", "/api/admin/stock", "/api/admin/audit", "/api/admin/staff"]) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(404);
    expect(response.headers()["x-request-id"], `${url} answered by FastAPI`).toBeTruthy();
    expect(await response.json()).toEqual({ ok: false, message: "Not found." });
  }
  const customer = await visitor(browser, baseURL!);
  await signUp(customer.context.request, baseURL!, uniqueEmail(PREFIX, "customer"));
  const attempt = await customer.context.request.post("/api/admin/stock", {
    data: { productId: PRODUCT.id, onHand: 99 },
    headers: { origin: baseURL! },
  });
  expect(attempt.status()).toBe(404);
  expect(await stockRow()).toBeUndefined();
  await customer.context.close();

  const admin = await visitor(browser, baseURL!);
  await signInAdmin(admin.context.request, baseURL!);
  const forged = await admin.context.request.post("/api/admin/stock", {
    data: { productId: PRODUCT.id, onHand: 1 },
    headers: { origin: "https://evil.example" },
  });
  expect(forged.status()).toBe(403);
  expect(await stockRow()).toBeUndefined();
  await admin.context.close();
});

test("roles: an admin grants 'staff' → stock allowed, audit and staff management refused → revoked", async ({ browser, baseURL }) => {
  const admin = await visitor(browser, baseURL!);
  await signInAdmin(admin.context.request, baseURL!);
  const clerkEmail = uniqueEmail(PREFIX, "clerk");
  const clerk = await visitor(browser, baseURL!);
  await signUp(clerk.context.request, baseURL!, clerkEmail);
  expect((await clerk.context.request.get("/api/admin/me")).status()).toBe(404);

  const granted = await admin.context.request.post("/api/admin/staff", {
    data: { email: clerkEmail, role: "staff" },
    headers: { origin: baseURL! },
  });
  expect(granted.status()).toBe(200);
  const me = await (await clerk.context.request.get("/api/admin/me")).json();
  expect(me).toMatchObject({ email: clerkEmail, role: "staff", source: "granted", permissions: ["quotes:read", "stock:read", "stock:write"] });

  const list = await (await clerk.context.request.get(`/api/admin/stock?q=${encodeURIComponent("Pin-up Green 2")}`)).json();
  expect(list.items).toEqual([expect.objectContaining({ productId: PRODUCT.id, state: "untracked", onHand: null })]);
  const set = await clerk.context.request.post("/api/admin/stock", {
    data: { productId: PRODUCT.id, onHand: 12 },
    headers: { origin: baseURL! },
  });
  expect(await set.json()).toEqual({ ok: true });
  expect(await stockRow()).toEqual({ on_hand: 12, updated_by: clerkEmail });

  expect((await clerk.context.request.get("/api/admin/audit")).status()).toBe(403);
  const escalate = await clerk.context.request.post("/api/admin/staff", {
    data: { email: clerkEmail, role: "admin" },
    headers: { origin: baseURL! },
  });
  expect(escalate.status()).toBe(403);

  const audit = await (await admin.context.request.get(`/api/admin/audit?actor=${encodeURIComponent(clerkEmail)}`)).json();
  expect(audit.items).toEqual([
    expect.objectContaining({ action: "stock.set", actorRole: "staff", targetId: PRODUCT.id, detail: { before: null, after: 12 } }),
  ]);

  const revoked = await admin.context.request.delete(`/api/admin/staff?email=${encodeURIComponent(clerkEmail)}`, {
    headers: { origin: baseURL! },
  });
  expect(revoked.status()).toBe(200);
  expect((await clerk.context.request.get("/api/admin/me")).status()).toBe(404);
  const roles = await query("SELECT 1 FROM staff_roles WHERE email = $1", [clerkEmail]);
  expect(roles).toHaveLength(0);
  await admin.context.close();
  await clerk.context.close();
});
