import { expect, test, type Browser, type Page } from "@playwright/test";
import { nextIp, open, PASSWORD, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-004: the separate React admin app (admin/), talking only to FastAPI.
 * See docs/migrations/tracking.md.
 *
 * The admin app runs on its own origin (vite preview, :4173) and reaches FastAPI through
 * its proxy. mig004+admin@example.test is in OBASIX_ADMIN_EMAILS. Every page is checked
 * for console errors and failed API calls.
 */
const PREFIX = "mig004";
const ADMIN = "mig004+admin@example.test";
const ADMIN_APP = "http://localhost:4173";
const SITE = "http://localhost:3218";
const PRODUCT = { id: "cmwb90120", name: "Classic Magnetic Whiteboard 3×4", slug: "classic-magnetic-whiteboard-3x4" };

type Visitor = { page: Page; problems: string[]; close: () => Promise<void> };

/** A fresh browser session on the admin app, recording console errors and failed API calls. */
async function adminVisitor(browser: Browser): Promise<Visitor> {
  const context = await browser.newContext({ baseURL: ADMIN_APP, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const page = await context.newPage();
  const problems: string[] = [];
  // Chrome logs every 4xx response as a console error; expected refusals are checked by the tests,
  // and real server failures are caught below.
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("response", (r) => r.status() >= 500 && problems.push(`${r.status()} ${r.url()}`));
  return { page, problems, close: () => context.close() };
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function ensureAccount(browser: Browser, email: string, name: string) {
  const context = await browser.newContext({ baseURL: SITE, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const exists = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (exists.length === 0) await signUp(context.request, SITE, email, name);
  await context.close();
}

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.beforeAll(async () => {
  await query("DELETE FROM product_stock WHERE product_id = $1", [PRODUCT.id]);
});
test.afterAll(async () => {
  await query("DELETE FROM product_stock WHERE product_id = $1", [PRODUCT.id]);
  await query("DELETE FROM staff_roles WHERE email LIKE $1", [`${PREFIX}+%`]);
  await removeAccounts(PREFIX);
});

test("a customer account can't sign in to the admin app, and isn't left signed in", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "customer");
  await ensureAccount(browser, email, "Just A Customer");
  const v = await adminVisitor(browser);
  await signIn(v.page, email);
  await expect(v.page.getByRole("alert")).toContainText("doesn't have staff access");
  await v.page.reload();
  await expect(v.page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();
  const me = await v.page.request.get("/api/auth");
  expect(await me.json()).toEqual({ user: null });

  await signIn(v.page, ADMIN, "wrong-password");
  await expect(v.page.getByRole("alert")).toContainText("Email or password is incorrect.");
  expect(v.problems.filter((p) => !p.startsWith("console:"))).toEqual([]);
  await v.close();
});

test("admin: overview → stock search, filter, sort, paging → edit with validation → stop tracking with confirmation → site shows it", async ({ browser, page }) => {
  await ensureAccount(browser, ADMIN, "MIG-004 Admin");
  const v = await adminVisitor(browser);
  await signIn(v.page, ADMIN);
  await expect(v.page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(v.page.getByText(`${ADMIN} · admin`)).toBeVisible();
  const untracked = Number(await v.page.getByTestId("count-untracked").textContent());
  expect(untracked).toBeGreaterThan(0);

  await v.page.getByRole("link", { name: "Stock", exact: true }).click();
  await expect(v.page.getByRole("heading", { name: "Stock" })).toBeVisible();
  // Paging: 24 products, 10 per page → "1–10 of 24".
  await v.page.getByRole("combobox", { name: /Rows per page/ }).click();
  await v.page.getByRole("option", { name: "10", exact: true }).click();
  await expect(v.page.getByText("1–10 of 24")).toBeVisible();
  await v.page.getByRole("button", { name: "Go to next page" }).click();
  await expect(v.page.getByText("11–20 of 24")).toBeVisible();
  expect(new URL(v.page.url()).searchParams.get("page")).toBe("2");

  // Search narrows the list and survives a reload (it lives in the URL).
  await v.page.getByLabel("Search name or SKU").fill("CMWB90120");
  await expect(v.page.getByText("1–1 of 1")).toBeVisible();
  await v.page.reload();
  await expect(v.page.getByRole("row", { name: new RegExp(PRODUCT.name) })).toBeVisible();

  const input = v.page.getByLabel(`On hand for ${PRODUCT.name}`);
  await input.fill("12.5");
  await expect(v.page.getByText("Enter a whole number from 0 to 100,000.")).toBeVisible();
  await expect(v.page.getByRole("button", { name: "Save" })).toBeDisabled();
  await input.fill("4");
  await v.page.getByRole("button", { name: "Save" }).click();
  await expect(v.page.getByText(`${PRODUCT.name}: on hand set to 4.`)).toBeVisible();
  await expect(v.page.getByRole("row", { name: new RegExp(PRODUCT.name) }).getByText("Low")).toBeVisible();

  const [stock] = await query<{ on_hand: number; updated_by: string }>("SELECT on_hand, updated_by FROM product_stock WHERE product_id = $1", [PRODUCT.id]);
  expect(stock).toEqual({ on_hand: 4, updated_by: ADMIN });
  await open(page, `${SITE}/products/${PRODUCT.slug}`);
  await expect(page.getByRole("status").filter({ hasText: "Only 4 left in stock" })).toBeVisible();

  // Filter by availability and sort by count.
  await v.page.getByLabel("Search name or SKU").fill("");
  await v.page.getByRole("combobox", { name: "Availability" }).click();
  await v.page.getByRole("option", { name: "Low" }).click();
  await expect(v.page.getByRole("row", { name: new RegExp(PRODUCT.name) })).toBeVisible();
  await v.page.getByRole("button", { name: "On hand" }).click();
  expect(new URL(v.page.url()).searchParams.get("sort")).toBe("onHand");

  // Stop tracking: cancel first (nothing changes), then confirm.
  await v.page.getByRole("button", { name: "Stop tracking" }).click();
  await v.page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  expect(await query("SELECT 1 FROM product_stock WHERE product_id = $1", [PRODUCT.id])).toHaveLength(1);
  const untrackPosts: string[] = [];
  v.page.on("request", (r) => r.method() === "POST" && r.url().endsWith("/api/admin/stock") && untrackPosts.push(r.postData() ?? ""));
  await v.page.getByRole("button", { name: "Stop tracking" }).click();
  await v.page.getByRole("dialog").getByRole("button", { name: "Stop tracking" }).click();
  await expect(v.page.getByText(`Stopped tracking ${PRODUCT.name}.`)).toBeVisible();
  await v.page.waitForTimeout(500);
  expect(untrackPosts).toEqual([JSON.stringify({ productId: PRODUCT.id, onHand: null })]);
  expect(await query("SELECT 1 FROM product_stock WHERE product_id = $1", [PRODUCT.id])).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: /in stock|left|Made to order/ })).toHaveCount(0);

  // The audit log shows both changes, newest first.
  await v.page.getByRole("link", { name: "Audit log" }).click();
  await v.page.getByLabel("Product or email changed").fill(PRODUCT.id);
  await v.page.getByRole("button", { name: "Apply" }).click();
  // Newest first, so this run's two entries are on top (earlier runs' rows stay: the log is append-only).
  const rows = v.page.getByRole("table", { name: "Audit log entries" }).getByRole("row");
  await expect(rows.nth(1)).toContainText(`stopped tracking ${PRODUCT.id} (was 4)`);
  await expect(rows.nth(2)).toContainText(`set stock for ${PRODUCT.id}: none → 4`);
  expect(v.problems).toEqual([]);
  await v.close();
});

test("roles: admin gives 'staff' in the app → that person gets staff sections only → role removed → sent back to sign-in", async ({ browser }) => {
  await ensureAccount(browser, ADMIN, "MIG-004 Admin");
  const clerkEmail = uniqueEmail(PREFIX, "clerk");
  await ensureAccount(browser, clerkEmail, "Clerk Person");

  const boss = await adminVisitor(browser);
  await signIn(boss.page, ADMIN);
  await boss.page.getByRole("link", { name: "Staff" }).click();
  await boss.page.getByLabel("Email").fill("not an email");
  await boss.page.getByRole("button", { name: "Give role" }).click();
  await expect(boss.page.getByText("Enter an email address.")).toBeVisible();
  await boss.page.getByLabel("Email").fill(clerkEmail);
  await boss.page.getByRole("button", { name: "Give role" }).click();
  await expect(boss.page.getByText(`${clerkEmail} is now staff.`)).toBeVisible();
  expect(await query<{ role: string; granted_by: string }>("SELECT role, granted_by FROM staff_roles WHERE email = $1", [clerkEmail])).toEqual([
    { role: "staff", granted_by: ADMIN },
  ]);

  const clerk = await adminVisitor(browser);
  await signIn(clerk.page, clerkEmail);
  await expect(clerk.page.getByText(`${clerkEmail} · staff`)).toBeVisible();
  const nav = clerk.page.getByRole("navigation", { name: "Admin sections" });
  // Staff sections only: never the audit log or staff management.
  await expect(nav.getByRole("link", { name: "Stock", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Audit log" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Staff" })).toHaveCount(0);
  await clerk.page.goto("/audit");
  await expect(clerk.page.getByRole("heading", { name: "No access" })).toBeVisible();
  await clerk.page.goto("/staff");
  await expect(clerk.page.getByRole("heading", { name: "No access" })).toBeVisible();

  // Removing the role needs confirmation and takes effect on the clerk's next request.
  const row = boss.page.getByRole("row", { name: new RegExp(clerkEmail.replace(/[+.]/g, "\\$&")) });
  await row.getByRole("button", { name: "Remove" }).click();
  await boss.page.getByRole("dialog").getByRole("button", { name: "Remove role" }).click();
  await expect(boss.page.getByText(`Removed ${clerkEmail}'s role.`)).toBeVisible();
  expect(await query("SELECT 1 FROM staff_roles WHERE email = $1", [clerkEmail])).toHaveLength(0);

  // Still in the app: the next request finds the role gone and returns to sign-in.
  await clerk.page.getByRole("link", { name: "Stock", exact: true }).click();
  await expect(clerk.page.getByText("Your session ended or your role changed. Sign in again.")).toBeVisible();
  // A fresh visit just shows sign-in.
  await clerk.page.reload();
  await expect(clerk.page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();

  const actions = await query<{ action: string }>("SELECT action FROM audit_log WHERE target_id = $1 ORDER BY id", [clerkEmail]);
  expect(actions.map((a) => a.action)).toEqual(["staff.grant", "staff.revoke"]);
  expect([...boss.problems, ...clerk.problems]).toEqual([]);
  await boss.close();
  await clerk.close();
});

test("sign out, and an expired session, both return to sign-in", async ({ browser }) => {
  await ensureAccount(browser, ADMIN, "MIG-004 Admin");
  const v = await adminVisitor(browser);
  await signIn(v.page, ADMIN);
  await expect(v.page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await v.page.getByRole("button", { name: "Sign out" }).click();
  await expect(v.page.getByText("You're signed out.")).toBeVisible();
  await v.page.reload();
  await expect(v.page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();

  await signIn(v.page, ADMIN);
  await expect(v.page.getByRole("heading", { name: "Overview" })).toBeVisible();
  // The session expires on the server (e.g. after 14 days, or a password reset elsewhere).
  await query("UPDATE sessions SET expires_at = 0 WHERE user_id = (SELECT id FROM users WHERE email = $1)", [ADMIN]);
  await v.page.getByRole("link", { name: "Stock", exact: true }).click();
  await expect(v.page.getByText("Your session ended or your role changed. Sign in again.")).toBeVisible();
  await v.close();
});

test("the admin app is keyboard usable and not indexed", async ({ browser, browserName }) => {
  await ensureAccount(browser, ADMIN, "MIG-004 Admin");
  const v = await adminVisitor(browser);
  await v.page.goto("/");
  await expect(v.page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(v.page.getByLabel("Email")).toBeFocused();
  await v.page.keyboard.type(ADMIN);
  await v.page.keyboard.press("Tab");
  await v.page.keyboard.type(PASSWORD);
  await v.page.keyboard.press("Enter");
  await expect(v.page.getByRole("heading", { name: "Overview" })).toBeVisible();
  // Safari's default Tab key skips links, so the skip link is only reachable that way elsewhere.
  if (browserName !== "webkit") {
    await v.page.keyboard.press("Tab");
    await expect(v.page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  }
  await v.close();
});
