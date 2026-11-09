import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const tmp = path.join(__dirname, ".tmp");
mkdirSync(tmp, { recursive: true });
// 1×1 PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
writeFileSync(path.join(tmp, "logo.png"), png);
writeFileSync(path.join(tmp, "ref.pdf"), "%PDF-1.4\n%%EOF\n");

async function addToCartFromPdp(page: Page, id: string) {
  await page.goto(`/products/${id}`);
  await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
}

test.describe("catalogue", () => {
  test("search by product name", async ({ page }) => {
    await page.goto("/products?q=ceramic");
    await expect(page.locator("article").first()).toBeVisible();
    const titles = await page.locator("article").allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.join(" ").toLowerCase()).toContain("ceramic");
  });

  test("search by product code", async ({ page }) => {
    await page.goto("/products?q=CMWB6090");
    await expect(page.locator("article", { hasText: "Classic Magnetic Whiteboard 2×3" }).first()).toBeVisible();
  });

  test("sorting by price ascending", async ({ page }) => {
    await page.goto("/products?sort=price-asc");
    await expect(page.locator("article").first()).toBeVisible();
    const prices = await page.locator("article").evaluateAll((cards) =>
      cards
        .map((c) => (c.textContent ?? "").match(/₹\s?([\d,]+)/)?.[1])
        .filter(Boolean)
        .map((v) => Number(v!.replace(/,/g, ""))),
    );
    expect(prices.length).toBeGreaterThan(2);
    for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
  });

  test("quick view opens", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: "Quick view" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("product detail shows specs, recommendations and JSON-LD", async ({ page }) => {
    await page.goto("/products/cmwb6090");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Classic");
    await expect(page.getByText("CMWB6090").first()).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld!).sku).toBe("CMWB6090");
  });

  test("compare two products", async ({ page }) => {
    await page.goto("/products/cmwb6090");
    await page.getByRole("button", { name: /^Compare$/ }).first().click();
    await page.goto("/products/cmwb90120");
    await page.getByRole("button", { name: /^Compare$/ }).first().click();
    await page.goto("/compare");
    await expect(page.getByRole("table")).toContainText("CMWB6090");
    await expect(page.getByRole("table")).toContainText("CMWB90120");
  });
});

test.describe("commerce (demo mode)", () => {
  test("cart → checkout → demo payment → confirmation → tracking", async ({ page }) => {
    await addToCartFromPdp(page, "cmwb6090");
    await page.goto("/cart");
    await expect(page.getByText("₹1,825").first()).toBeVisible();
    // Guest cart survives reload
    await page.reload();
    await expect(page.getByText("Classic Magnetic Whiteboard 2×3").first()).toBeVisible();
    await page.getByRole("link", { name: /Proceed to Checkout/ }).first().click();

    await page.getByLabel("Full name").fill("E2E Tester");
    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByLabel("Phone").fill("9876501234");
    await page.getByLabel("Address").first().fill("12 Test Road");
    await page.getByLabel("City").first().fill("Delhi");
    await page.getByLabel("State").first().fill("Delhi");
    await page.getByLabel("PIN / postal code").first().fill("110001");
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    await expect(page).toHaveURL(/checkout\/payment/);
    await page.getByLabel("UPI").check();
    await page.getByRole("button", { name: "Simulate Successful Payment" }).click();
    await expect(page).toHaveURL(/checkout\/confirmation\?order=OBX-DEMO-/);
    const orderId = new URL(page.url()).searchParams.get("order")!;
    await expect(page.getByText(/Demo/i).first()).toBeVisible();

    // Cart was cleared after the server confirmed the order
    await page.goto("/cart");
    await expect(page.getByText("Classic Magnetic Whiteboard 2×3")).toHaveCount(0);

    // Track from a fresh context (another device)
    const other = await page.context().browser()!.newContext();
    const p2 = await other.newPage();
    await p2.goto("/orders/track");
    await p2.getByLabel("Order number").fill(orderId);
    await p2.getByLabel("Email or phone").fill("+91 98765 01234");
    await p2.getByRole("button", { name: "Track Order" }).click();
    await expect(p2.getByText(orderId)).toBeVisible();
    await expect(p2.getByText(/Status:/)).toBeVisible();
    await other.close();
  });

  test("tracking rejects wrong contact", async ({ page }) => {
    await page.goto("/orders/track");
    await page.getByLabel("Order number").fill("OBX-DEMO-00000000");
    await page.getByLabel("Email or phone").fill("nobody@example.com");
    await page.getByRole("button", { name: "Track Order" }).click();
    await expect(page.getByText("No order matches that order number and contact.")).toBeVisible();
  });
});

test.describe("quotes", () => {
  test("submits a quote with a PDF attachment", async ({ page }) => {
    await page.goto("/quote?boardType=Magnetic%20Whiteboard&quantity=10");
    await page.getByLabel("Full Name").fill("E2E Buyer");
    await page.getByLabel("Email Address").fill("buyer@example.com");
    await page.getByLabel("Mobile Number").fill("9876509876");
    await page.getByLabel("Location / City").fill("Delhi");
    const dims = page.getByLabel(/Dimensions|Size/i).first();
    if (await dims.count()) await dims.fill("4x6 ft").catch(() => {});
    await page.locator('input[type="file"]').setInputFiles(path.join(tmp, "ref.pdf"));
    await page.locator('main form button[type="submit"]').click();
    await expect(page).toHaveURL(/quote\/confirmation/, { timeout: 20_000 });
    await expect(page.getByText(/OBX-QUOTE-DEMO-/).first()).toBeVisible();
  });
});

test.describe("design and visualise", () => {
  test("customizer accepts a logo and adds to cart", async ({ page }) => {
    await page.goto("/customize?productId=cmwb6090");
    const file = page.locator('input[type="file"][accept="image/png,image/jpeg"]');
    if (await file.count()) await file.first().setInputFiles(path.join(tmp, "logo.png"));
    await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
    await page.goto("/cart");
    await expect(page.locator("main")).toContainText("Classic");
  });

  test("visualizer wall page renders a canvas or scene", async ({ page }) => {
    await page.goto("/visualize/modern-office");
    await expect(page.locator("canvas, img").first()).toBeVisible();
  });

  test("smart space and solutions list real products", async ({ page }) => {
    await page.goto("/solutions/office");
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
    await page.goto("/smart-space");
    await expect(page.locator("main")).toContainText(/₹|Office|Classroom/);
  });
});

test.describe("accounts", () => {
  test("register → account → wishlist → saved orders → logout → login → reset", async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Account");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("correct-horse-1");
    await page.locator('main form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/account/);

    await page.goto("/products");
    await page.getByRole("button", { name: "Add to wishlist" }).first().click();
    await page.waitForTimeout(800);
    await page.goto("/account/wishlist");
    await expect(page.locator("main")).not.toContainText(/no saved|empty/i);

    await page.goto("/account/orders");
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
    await expect(page.locator("main")).toContainText(/Demo mode|not placed any orders/);

    // Unauthorised API access is refused
    const anon = await page.context().browser()!.newContext();
    const res = await anon.request.get("/api/account");
    expect(res.status()).toBe(401);
    await anon.close();

    // Password recovery (dev-only link)
    await page.context().clearCookies();
    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill(email);
    await page.locator('main form button[type="submit"]').click();
    const link = page.locator('a[href^="/reset-password?token="]');
    await expect(link).toBeVisible();
    await link.click();
    await page.getByLabel(/password/i).first().fill("new-horse-battery-2");
    await page.locator('main form button[type="submit"]').click();
    await expect(page.getByText(/updated|changed|sign in/i).first()).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("new-horse-battery-2");
    await page.locator('main form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/account/);
  });
});

test.describe("assistant", () => {
  test("AI chat answers or falls back with real catalogue links", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Ask OBASIX design assistant" }).click();
    const box = page.getByRole("textbox").last();
    await box.fill("Which magnetic board suits a meeting room?");
    await box.press("Enter");
    await expect(page.locator('a[href^="/products"]').last()).toBeVisible({ timeout: 40_000 });
  });
});
