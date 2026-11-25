import { chromium, type FullConfig } from "@playwright/test";

/**
 * Runs once, after the servers answer their health checks and before any test.
 * A fresh `next dev` compiles each page on its first visit, and while it does,
 * the browser can reload more than once. Visiting each page here until the
 * network goes quiet means the tests start against a ready site.
 */
const pages = ["/", "/register", "/login", "/forgot-password", "/reset-password", "/products", "/cart", "/account", "/account/profile", "/account/wishlist", "/admin/stock", "/products/superior-pinup-green-2x3", "/quote", "/quote/confirmation"];

export default async function warmUp(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const deadline = Date.now() + 5 * 60_000;
  for (const path of pages) {
    for (;;) {
      try {
        await page.goto(new URL(path, baseURL).toString(), { waitUntil: "networkidle", timeout: 60_000 });
        break;
      } catch (error) {
        if (Date.now() > deadline) throw new Error(`Warm-up: ${path} did not settle: ${String(error)}`);
      }
    }
  }
  await browser.close();
}
