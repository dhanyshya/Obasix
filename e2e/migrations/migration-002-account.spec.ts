import { expect, test } from "@playwright/test";
import { nextIp, open, PASSWORD, query, removeAccounts, settled, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-002: account data (/api/account) served by FastAPI. See docs/migrations/tracking.md.
 * Each customer journey goes through the real account pages; the database is checked directly.
 */
const PREFIX = "mig002";
const email = (label: string) => uniqueEmail(PREFIX, label);

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(() => removeAccounts(PREFIX));

test("account requests are answered by FastAPI and refused when signed out", async ({ request }) => {
  const response = await request.get("/api/account");
  expect(response.status()).toBe(401);
  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f]{32}$/);
  expect(await response.json()).toEqual({ ok: false, message: "Sign in to view this account." });
});

test("profile: edit in the browser, see the error for a bad phone, saved to the database", async ({ page, baseURL }) => {
  const address = email("profile");
  await signUp(page.request, baseURL!, address);
  await open(page, "/account/profile");

  await page.locator("#profile-phone").fill("12-34");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Enter a phone number with 8 to 15 digits.")).toBeVisible();

  // By id: the account menu also has a "Company" field.
  await page.locator("#profile-name").fill("Priya Sharma");
  await page.locator("#profile-phone").fill("+91 99990 44222");
  await page.locator("#profile-company").fill("Sharma Interiors");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();

  const [row] = await query<{ name: string; phone: string; company: string }>(
    "SELECT name, phone, company FROM users WHERE email = $1",
    [address],
  );
  expect(row).toEqual({ name: "Priya Sharma", phone: "+91 99990 44222", company: "Sharma Interiors" });
  await page.reload();
  await settled(page);
  await expect(page.locator("#profile-company")).toHaveValue("Sharma Interiors");
});

test("addresses: add, list and remove in the browser", async ({ page, baseURL }) => {
  const address = email("address");
  await signUp(page.request, baseURL!, address);
  await open(page, "/account/profile");
  await expect(page.getByText("No saved addresses.")).toBeVisible();

  await page.getByLabel("Address").fill("1105 Ansal Bhawan, 16 KG Marg");
  await page.getByLabel("City").fill("New Delhi");
  await page.getByLabel("State").fill("Delhi");
  await page.getByLabel("PIN").fill("110001");
  await page.getByLabel("Country").fill("India");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("Address saved.")).toBeVisible();
  await expect(page.getByText("1105 Ansal Bhawan, 16 KG Marg, New Delhi, Delhi, 110001, India")).toBeVisible();

  const saved = await query<{ postal: string }>(
    "SELECT a.postal FROM addresses a JOIN users u ON u.id = a.user_id WHERE u.email = $1",
    [address],
  );
  expect(saved).toEqual([{ postal: "110001" }]);

  const removed = page.waitForResponse((r) => r.url().includes("/api/account?kind=address") && r.request().method() === "DELETE");
  await page.getByRole("button", { name: "Remove" }).click();
  expect((await removed).status()).toBe(200);
  await expect(page.getByText("No saved addresses.")).toBeVisible();
  expect(
    await query("SELECT 1 FROM addresses a JOIN users u ON u.id = a.user_id WHERE u.email = $1", [address]),
  ).toHaveLength(0);
});

test("password change: wrong current password is refused; this device stays in, others are signed out", async ({
  page,
  browser,
  baseURL,
}) => {
  const address = email("password");
  await signUp(page.request, baseURL!, address);
  const elsewhere = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const login = await elsewhere.request.post("/api/auth?action=login", {
    data: { email: address, password: PASSWORD },
    headers: { origin: baseURL! },
  });
  expect(login.status()).toBe(200);

  await open(page, "/account/profile");
  await page.getByLabel("Current password").fill("not-my-password");
  await page.getByLabel("New password").fill("Brand-new-horse-5");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("The current password is incorrect.")).toBeVisible();

  await page.getByLabel("Current password").fill(PASSWORD);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password updated.")).toBeVisible();

  expect((await page.request.get("/api/account")).status()).toBe(200);
  expect((await elsewhere.request.get("/api/account")).status()).toBe(401);
  await elsewhere.close();

  const relogin = await page.request.post("/api/auth?action=login", {
    data: { email: address, password: "Brand-new-horse-5" },
    headers: { origin: baseURL! },
  });
  expect(relogin.status()).toBe(200);
});

test("wishlist: a heart on the products page shows on the wishlist page and in the database", async ({ page, baseURL }) => {
  const address = email("wishlist");
  await signUp(page.request, baseURL!, address);
  await open(page, "/products");
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  // The site saves the whole list shortly after a change (wishlist-sync); wait for it to land.
  const saved = () =>
    query("SELECT w.product_id FROM wishlist_items w JOIN users u ON u.id = w.user_id WHERE u.email = $1", [address]);
  await expect.poll(async () => (await saved()).length, { timeout: 10_000 }).toBe(1);
  await open(page, "/account/wishlist");
  await expect(page.locator("main")).not.toContainText(/no saved|empty/i);
});

test("cart: saved for the account and back after a reload", async ({ page, baseURL }) => {
  const address = email("cart");
  await signUp(page.request, baseURL!, address);
  const save = await page.request.post("/api/account?action=cart", {
    data: { lines: [{ productId: "cmwb6090", quantity: 2 }] },
    headers: { origin: baseURL! },
  });
  expect((await save.json()).cart).toEqual([expect.objectContaining({ productId: "cmwb6090", quantity: 2, unitPrice: 1825 })]);
  const [row] = await query<{ payload: string }>(
    "SELECT c.payload FROM carts c JOIN users u ON u.id = c.user_id WHERE u.email = $1",
    [address],
  );
  expect(JSON.parse(row.payload)).toEqual([expect.objectContaining({ productId: "cmwb6090", quantity: 2 })]);
  await open(page, "/cart");
  await expect(page.locator("main")).toContainText(/1,825|3,650/);
});

test("saved configurations: stored, listed and removable by their owner only", async ({ page, browser, baseURL }) => {
  const owner = email("config-owner");
  await signUp(page.request, baseURL!, owner);
  const saved = await page.request.post("/api/account?action=configuration", {
    data: { name: "Boardroom board", productId: "cmwb6090", quantity: 1, configuration: { branding: true } },
    headers: { origin: baseURL! },
  });
  expect(await saved.json()).toEqual({ ok: true });
  const [config] = (await (await page.request.get("/api/account")).json()).configurations;
  expect(config).toMatchObject({ name: "Boardroom board", product_id: "cmwb6090" });

  const stranger = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  await signUp(stranger.request, baseURL!, email("config-stranger"));
  await stranger.request.delete(`/api/account?kind=configuration&id=${config.id}`, { headers: { origin: baseURL! } });
  await stranger.close();
  expect(await query("SELECT 1 FROM saved_configs WHERE id = $1", [config.id])).toHaveLength(1);

  await page.request.delete(`/api/account?kind=configuration&id=${config.id}`, { headers: { origin: baseURL! } });
  expect(await query("SELECT 1 FROM saved_configs WHERE id = $1", [config.id])).toHaveLength(0);
});

test("cross-site changes and bad input are refused", async ({ page, baseURL }) => {
  await signUp(page.request, baseURL!, email("guard"));
  const forged = await page.request.post("/api/account?action=profile", {
    data: { name: "Mallory" },
    headers: { origin: "https://evil.example" },
  });
  expect(forged.status()).toBe(403);
  const unknown = await page.request.post("/api/account?action=wishlist", {
    data: { productId: "not-a-product" },
    headers: { origin: baseURL! },
  });
  expect(await unknown.json()).toEqual({ ok: false, message: "That product is not in the catalogue." });
});
