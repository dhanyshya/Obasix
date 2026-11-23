import { expect, test } from "./support";

const pages = [
  "/",
  "/products",
  "/products/cmwb6090",
  "/customize",
  "/visualize",
  "/visualize/modern-office",
  "/smart-space",
  "/solutions",
  "/solutions/office",
  "/cart",
  "/quote",
  "/about",
  "/compare",
  "/orders/track",
  "/login",
  "/register",
  "/forgot-password",
  // Added with the Reimagine 2027 work.
  "/signage",
  "/signage/design",
  "/planning",
  "/kits",
  "/kits/education",
  "/materials",
  "/materials/glass",
  "/premium",
  "/oem",
  "/associates",
  "/distributors",
  "/partners",
];

// Known, harmless dev-only noise.
const ignored = [/Download the React DevTools/, /\[Fast Refresh\]/, /\[HMR\]/];

for (const path of pages) {
  test(`renders cleanly: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !ignored.some((re) => re.test(msg.text()))) errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    const failedApi: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/") && res.status() >= 500 && !res.url().includes("/api/ai/")) failedApi.push(`${res.status()} ${res.url()}`);
    });

    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "HTTP status").toBeLessThan(400);
    await page.waitForLoadState("load");
    // Scroll through the page so lazy images load, then return to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(1);

    const broken = await page.evaluate(() =>
      [...document.images]
        .filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0)
        .map((img) => img.currentSrc),
    );
    expect(broken, "broken images").toEqual([]);
    expect(page.locator("h1").first()).toBeTruthy();
    expect(failedApi, "server errors from APIs").toEqual([]);
    expect(errors, "console errors").toEqual([]);
  });
}
