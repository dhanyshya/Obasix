import { expect, signUp, test } from "./support";

/**
 * Regression tests for two signed-in cart races found by the E2E audit:
 * 1. an item added while the saved account was still loading was wiped by the server copy;
 * 2. an item added just before a reload was lost because the delayed save never went out.
 */
async function cartCount(page: import("@playwright/test").Page) {
  // A dropped connection to the dev server (ECONNRESET) counts as "not yet", so expect.poll retries.
  const response = await page.request.get("/api/account").catch(() => null);
  if (!response) return -1;
  const body = await response.json();
  return (body.cart ?? []).reduce((sum: number, line: { quantity: number }) => sum + line.quantity, 0);
}

test("an item added while the account is still loading is kept and saved", async ({ page }) => {
  await signUp(page, "cart-race");
  // Hold back the account load so the add happens first, as on a slow connection.
  await page.route("**/api/account", async (route) => {
    if (route.request().method() === "GET") await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  const accountLoaded = page.waitForResponse((r) => r.url().endsWith("/api/account") && r.request().method() === "GET");
  // The session check runs only once React has hydrated, so clicks after it are handled.
  const hydrated = page.waitForResponse((r) => r.url().endsWith("/api/auth") && r.request().method() === "GET");
  await page.goto("/products/cmwb6090", { waitUntil: "domcontentloaded" });
  await hydrated;
  await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
  await accountLoaded;
  await page.unroute("**/api/account");

  await expect.poll(() => cartCount(page), { timeout: 10_000 }).toBe(1);
});

test("an item added just before a reload is saved", async ({ page }) => {
  await signUp(page, "cart-reload");
  const accountLoaded = page.waitForResponse((r) => r.url().endsWith("/api/account") && r.request().method() === "GET");
  await page.goto("/products/cmwb6090", { waitUntil: "networkidle" });
  await accountLoaded;
  await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
  // Reload at once, well inside the 400 ms save delay.
  await page.reload();
  await expect.poll(() => cartCount(page), { timeout: 10_000 }).toBe(1);
});

test("a guest's item added just before a reload is kept", async ({ page }) => {
  await page.goto("/products/cmwb6090", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect(page.locator("main")).toContainText(/Classic Magnetic Whiteboard 2×3/);
});
