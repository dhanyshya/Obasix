import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { api, expect, newVisitor, placeDemoOrder, signInAsStaff, signUp, test, uid } from "./support";

/**
 * Staff portal (/admin) end to end: access control, every screen, and the
 * workflows that start on the storefront and finish in the portal (or the reverse).
 */
const tmp = path.join(__dirname, ".tmp");
mkdirSync(tmp, { recursive: true });
// A real 1×1 PNG: uploads are checked by content, not by name.
writeFileSync(path.join(tmp, "proof.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"));

const adminPages = [
  { path: "/admin/orders", heading: "Orders" },
  { path: "/admin/quotes", heading: "Quote requests" },
  { path: "/admin/stock", heading: "Stock" },
  { path: "/admin/associates", heading: "Associates" },
  { path: "/admin/distributors", heading: "Distributors" },
  { path: "/admin/partners", heading: "Project partners" },
  { path: "/admin/proofs", heading: "Design proofs" },
];

const adminApis = [
  "/api/admin/orders",
  "/api/admin/stock",
  "/api/admin/associates",
  "/api/admin/distributors",
  "/api/admin/partners",
];

test.describe("staff portal access", () => {
  // Visits every staff page as two different people: allow 3× the default time.
  test.slow();

  test("visitors and customers can't see staff screens or call staff APIs", async ({ page }) => {
    // Signed out
    for (const { path: p } of adminPages) {
      await page.goto(p);
      await expect(page.getByText("ERROR 404")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Staff" })).toHaveCount(0);
    }
    for (const url of adminApis) {
      const { status } = await api(page, url, { action: "noop" });
      expect(status, url).toBe(404);
    }

    // Signed in as an ordinary customer
    await signUp(page, "customer");
    for (const { path: p } of adminPages) {
      await page.goto(p);
      await expect(page.getByText("ERROR 404")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Staff" })).toHaveCount(0);
    }
    for (const url of adminApis) {
      const { status } = await api(page, url, { action: "noop" });
      expect(status, url).toBe(404);
    }
  });

  test("staff can open every staff screen from the staff navigation", async ({ page }) => {
    await signInAsStaff(page);
    await page.goto("/admin", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\//);
    const nav = page.getByRole("navigation", { name: "Staff" });
    for (const { path: p, heading } of adminPages) {
      await nav.locator(`a[href="${p}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${p}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });
});

test.describe("storefront → staff → customer workflows", () => {
  // Multi-step journeys across three sessions: allow 3× the default per-test time.
  test.slow();

  test("order: customer pays (demo) → staff processes and dispatches → customer tracks the courier", async ({ page, browser, baseURL }) => {
    const customer = await signUp(page, "buyer");
    const phone = `98${Math.floor(10000000 + Math.random() * 89999999)}`;
    const order = await placeDemoOrder(page, { productId: "cmwb6090", quantity: 1, email: customer.email, phone });

    const staff = await newVisitor(browser, baseURL!);
    await signInAsStaff(staff.page);
    await staff.page.goto("/admin/orders", { waitUntil: "networkidle" });
    const card = staff.page.getByRole("region", { name: `Order ${order.id}` });
    await expect(card).toContainText("Payment Confirmed");
    await card.getByRole("button", { name: "Start processing" }).click();
    await expect(card).toContainText("Processing");
    // Dispatch needs the courier and tracking number.
    await card.getByLabel("Courier").fill("Delhivery");
    await card.getByLabel("Tracking number").fill(`DL${uid()}`.toUpperCase());
    const tracking = await card.getByLabel("Tracking number").inputValue();
    await card.getByRole("button", { name: "Mark dispatched" }).click();
    await expect(card).toContainText("Dispatched");
    await expect(card).toContainText(tracking);
    await staff.context.close();

    // The customer looks the order up on the public tracking page and sees the new status.
    await page.goto("/orders/track", { waitUntil: "networkidle" });
    await page.getByLabel("Order number").fill(order.id);
    await page.getByLabel("Email or phone").fill(phone);
    await page.getByRole("button", { name: /track/i }).first().click();
    await expect(page.getByText("Status: Dispatched")).toBeVisible();
    // The page hides courier details for demo orders; the tracking API carries them for live orders.
    const { body } = await api(page, "/api/commerce/track", { orderNumber: order.id, contact: phone });
    expect(body.order.courier).toBe("Delhivery");
    expect(body.order.trackingNumber).toBe(tracking);
  });

  test("quote → staff proof → customer approval → staff sees it approved and can't replace it", async ({ page, browser, baseURL }) => {
    const customer = await signUp(page, "quoter");
    await page.goto("/quote?boardType=Glass%20Board&quantity=2&customSize=6%20%C3%97%204%20ft&custom=1", { waitUntil: "networkidle" });
    await page.getByLabel("Full Name").fill("E2E Quoter");
    await page.getByLabel("Email Address").fill(customer.email);
    await page.getByLabel("Mobile Number").fill("9876509876");
    await page.getByLabel("Location / City").fill("Pune");
    await page.locator('input[type="file"]').setInputFiles(path.join(tmp, "proof.png"));
    await page.locator('main form button[type="submit"]').click();
    await expect(page).toHaveURL(/quote\/confirmation/, { timeout: 20_000 });
    const reference = (await page.getByText(/OBX-QUOTE-DEMO-[A-F0-9]+/).first().textContent())!.match(/OBX-QUOTE-DEMO-[A-F0-9]+/)![0];

    // Staff find the quote, download the attachment, and send a proof.
    const staff = await newVisitor(browser, baseURL!);
    await signInAsStaff(staff.page);
    await staff.page.goto(`/admin/quotes?q=${reference}`, { waitUntil: "networkidle" });
    await expect(staff.page.getByText(reference)).toBeVisible();
    await staff.page.getByText(reference).click();
    const download = await staff.page.request.get(`/api/admin/quotes/${reference}/file`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toBe("image/png");
    await staff.page.getByRole("link", { name: "Send a proof" }).click();
    await expect(staff.page.getByLabel("Quote reference")).toHaveValue(reference);
    await staff.page.locator("#proof-file").setInputFiles(path.join(tmp, "proof.png"));
    await staff.page.getByLabel("Note to the customer (optional)").fill("First layout");
    await staff.page.getByRole("button", { name: "Send proof" }).click();
    await expect(staff.page.getByText(`Version 1 sent to the customer for ${reference}.`)).toBeVisible();

    // Another customer can't open the proof file.
    const stranger = await newVisitor(browser, baseURL!);
    await signUp(stranger.page, "stranger");
    await page.goto("/account/proofs", { waitUntil: "networkidle" });
    const proofHref = await page.locator('a[href^="/api/proofs/"]').first().getAttribute("href");
    expect((await stranger.page.request.get(proofHref!)).status()).toBe(404);
    await stranger.context.close();

    // The customer approves in their account.
    await expect(page.getByText(`Version 1 · Waiting for your review`)).toBeVisible();
    await page.getByRole("button", { name: "Approve version 1" }).click();
    const approve = page.getByRole("button", { name: "Approve for production" });
    await expect(approve).toBeDisabled();
    await page.getByRole("checkbox").check();
    await approve.click();
    await expect(page.getByText("Version 1 · Approved for production")).toBeVisible();

    // Staff see the approval, and a new version is refused.
    await staff.page.goto("/admin/proofs", { waitUntil: "networkidle" });
    await expect(staff.page.getByRole("row", { name: new RegExp(reference) })).toContainText("Approved");
    await staff.page.getByLabel("Quote reference").fill(reference);
    await staff.page.locator("#proof-file").setInputFiles(path.join(tmp, "proof.png"));
    await staff.page.getByRole("button", { name: "Send proof" }).click();
    await expect(staff.page.getByText(/already approved a proof/)).toBeVisible();
    await staff.context.close();
  });

  test("stock: staff set a level → product page shows it → demo orders leave it alone → stop tracking hides it", async ({ page, browser, baseURL }) => {
    const staff = await newVisitor(browser, baseURL!);
    await signInAsStaff(staff.page);
    await staff.page.goto("/admin/stock", { waitUntil: "networkidle" });
    const row = staff.page.getByRole("row", { name: /Superior Pin-up Green 2×3/ });
    await row.getByRole("spinbutton").fill("5");
    await row.getByRole("button", { name: "Save" }).click();
    await expect(row.getByRole("status")).toHaveText("Saved");

    await page.goto("/products/superior-pinup-green-2x3", { waitUntil: "networkidle" });
    await expect(page.getByRole("status").filter({ hasText: "Only 5 left in stock" })).toBeVisible();

    const customer = await signUp(page, "stock");
    await placeDemoOrder(page, { productId: "spbpcbg6090", quantity: 2, email: customer.email, phone: "9876500011" });
    // Demo orders are simulations and don't touch stock; only live (Razorpay) payments deduct it.
    await page.reload();
    await expect(page.getByRole("status").filter({ hasText: "Only 5 left in stock" })).toBeVisible();

    // Staff stop tracking: the product shows no availability at all.
    await staff.page.reload();
    await staff.page.getByRole("row", { name: /Superior Pin-up Green 2×3/ }).getByRole("button", { name: "Stop tracking" }).click();
    await page.reload();
    await expect(page.getByRole("status").filter({ hasText: /in stock|left|Made to order/ })).toHaveCount(0);
    await staff.context.close();
  });
});
