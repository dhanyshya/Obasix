import { expect, test } from "@playwright/test";

test("mobile bottom navigation reaches products, customize and cart", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [href, url] of [["/products", /\/products/], ["/customize", /\/customize/], ["/cart", /\/cart/]] as const) {
    const link = page.locator(`.MuiBottomNavigation-root a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(url);
  }
});
