import { expect, test, type Browser } from "@playwright/test";
import { nextIp, open, PASSWORD, query, removeAccounts, signUp, uniqueEmail } from "./helpers";

/**
 * MIG-006: checkout, tracking and staff order handling on FastAPI (demo mode here; live Razorpay
 * payments run unchanged in playwright.integrations-fastapi.config.ts). See docs/migrations/tracking.md.
 * mig006+admin@example.test is in OBASIX_ADMIN_EMAILS.
 */
const PREFIX = "mig006";
const ADMIN = "mig006+admin@example.test";
const ADMIN_APP = "http://localhost:4173";
const SITE = "http://localhost:3218";

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
test.afterAll(async () => {
  await query("DELETE FROM demo_orders WHERE email LIKE $1", [`${PREFIX}+%`]);
  await removeAccounts(PREFIX);
});

async function visitor(browser: Browser, baseURL = SITE) {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  return { context, page: await context.newPage() };
}

async function checkout(browser: Browser, email: string, phone: string) {
  const v = await visitor(browser);
  await open(v.page, "/products/classic-magnetic-whiteboard-2x3");
  await v.page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(v.page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
  await open(v.page, "/cart");
  await v.page.getByRole("link", { name: /Proceed to Checkout/ }).first().click();
  await v.page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await v.page.getByLabel("Full name").fill("Commerce Customer");
  await v.page.getByLabel("Email").fill(email);
  await v.page.getByLabel("Phone").fill(phone);
  await v.page.getByLabel("Address").first().fill("12 Test Road");
  await v.page.getByLabel("City").first().fill("Delhi");
  await v.page.getByLabel("State").first().fill("Delhi");
  await v.page.getByLabel("PIN / postal code").first().fill("110001");
  await v.page.getByRole("button", { name: "Continue to Payment" }).click();
  await expect(v.page).toHaveURL(/checkout\/payment/);
  await v.page.getByLabel("UPI").check();
  const placed = v.page.waitForResponse((r) => r.url().endsWith("/api/commerce/orders") && r.request().method() === "POST");
  await v.page.getByRole("button", { name: "Simulate Successful Payment" }).click();
  const response = await placed;
  expect(response.status()).toBe(200);
  expect(response.headers()["x-request-id"], "checkout served by FastAPI").toBeTruthy();
  await expect(v.page).toHaveURL(/checkout\/confirmation\?order=OBX-DEMO-/);
  const orderId = new URL(v.page.url()).searchParams.get("order")!;
  await v.context.close();
  return orderId;
}

async function staffSignIn(browser: Browser) {
  if ((await query("SELECT 1 FROM users WHERE email = $1", [ADMIN])).length === 0) {
    const site = await visitor(browser);
    await signUp(site.context.request, SITE, ADMIN, "MIG-006 Admin");
    await site.context.close();
  }
  const staff = await visitor(browser, ADMIN_APP);
  await staff.page.goto("/");
  await staff.page.getByLabel("Email").fill(ADMIN);
  await staff.page.getByLabel("Password").fill(PASSWORD);
  await staff.page.getByRole("button", { name: "Sign in" }).click();
  await staff.page.getByRole("link", { name: "Orders" }).click();
  await expect(staff.page.getByRole("heading", { name: "Orders" })).toBeVisible();
  return staff;
}

test("checkout on the site → priced and saved by FastAPI → tracked → staff dispatch it in the admin app → the customer sees the courier", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "buyer");
  const orderId = await checkout(browser, email, "9876501234");
  const [row] = await query<{ subtotal: number; status: string; payment_status: string; items: string }>(
    "SELECT subtotal, status, payment_status, items FROM demo_orders WHERE id = $1",
    [orderId],
  );
  expect(row).toMatchObject({ subtotal: 1825, status: "Payment Confirmed", payment_status: "paid" });
  expect(JSON.parse(row.items)[0]).toMatchObject({ productId: "cmwb6090", quantity: 1, unitPrice: 1825 });

  const tracker = await visitor(browser);
  await open(tracker.page, "/orders/track");
  await tracker.page.getByLabel("Order number").fill(orderId);
  await tracker.page.getByLabel("Email or phone").fill("+91 98765 01234");
  const tracked = tracker.page.waitForResponse((r) => r.url().endsWith("/api/commerce/track"));
  await tracker.page.getByRole("button", { name: "Track Order" }).click();
  expect((await tracked).headers()["x-request-id"]).toBeTruthy();
  await expect(tracker.page.getByText(orderId)).toBeVisible();

  const staff = await staffSignIn(browser);
  await staff.page.getByLabel("Search").fill(orderId);
  await staff.page.getByRole("button", { name: "Apply" }).click();
  await staff.page.getByRole("button", { name: `Manage ${orderId}` }).click();
  const dialog = staff.page.getByRole("dialog", { name: `Order ${orderId}` });
  await dialog.getByRole("button", { name: "Mark Processing" }).click();
  await dialog.getByRole("button", { name: "Confirm: Processing" }).click();
  await expect(staff.page.getByText(`${orderId} is now Processing.`)).toBeVisible();
  await dialog.getByRole("button", { name: "Mark Dispatched" }).click();
  await dialog.getByRole("button", { name: "Confirm: Dispatched" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Enter the courier and tracking number");
  await dialog.getByLabel("Courier").fill("Delhivery");
  await dialog.getByLabel("Tracking number").fill("DLV-MIG006");
  await dialog.getByRole("button", { name: "Confirm: Dispatched" }).click();
  await expect(staff.page.getByText(`${orderId} is now Dispatched.`)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel order" })).toHaveCount(0);

  const audit = await query<{ action: string; detail: { after: string; trackingNumber?: string } }>(
    "SELECT action, detail FROM audit_log WHERE target_id = $1 ORDER BY id",
    [orderId],
  );
  expect(audit.map((a) => a.detail.after)).toEqual(["Processing", "Dispatched"]);
  expect(audit[1].detail.trackingNumber).toBe("DLV-MIG006");

  const retracked = tracker.page.waitForResponse((r) => r.url().endsWith("/api/commerce/track"));
  await tracker.page.getByRole("button", { name: "Track Order" }).click();
  const latest = await (await retracked).json();
  expect(latest.order).toMatchObject({ status: "Dispatched", courier: "Delhivery", trackingNumber: "DLV-MIG006" });
  await expect(tracker.page.getByText("Status: Dispatched")).toBeVisible();
  // Demo orders don't show the courier to the customer (the site says so); live ones do.
  await expect(tracker.page.getByText("Courier, tracking number, and delivery date are not available for this demo.")).toBeVisible();
  await tracker.context.close();
  await staff.context.close();
});

test("staff cancel with a reason; wrong contact and strangers get nothing", async ({ browser }) => {
  const email = uniqueEmail(PREFIX, "cancel");
  const orderId = await checkout(browser, email, "9876509999");
  const staff = await staffSignIn(browser);
  await staff.page.getByLabel("Search").fill(orderId);
  await staff.page.getByRole("button", { name: "Apply" }).click();
  await staff.page.getByRole("button", { name: `Manage ${orderId}` }).click();
  const dialog = staff.page.getByRole("dialog", { name: `Order ${orderId}` });
  await dialog.getByRole("button", { name: "Cancel order" }).click();
  await dialog.getByLabel("Reason (shown to staff)").fill("Duplicate order");
  await dialog.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(staff.page.getByText(`${orderId} cancelled.`)).toBeVisible();
  const [row] = await query<{ status: string; staff_note: string }>("SELECT status, staff_note FROM demo_orders WHERE id = $1", [orderId]);
  expect(row).toEqual({ status: "Cancelled", staff_note: "Duplicate order" });
  await staff.context.close();

  const stranger = await visitor(browser);
  const wrong = await stranger.context.request.post("/api/commerce/track", { data: { orderNumber: orderId, contact: "someone@else.com" } });
  expect(wrong.status()).toBe(404);
  expect(await wrong.json()).toEqual({ ok: false, found: false, message: "No order matches that order number and contact." });
  await signUp(stranger.context.request, SITE, uniqueEmail(PREFIX, "nosy"));
  expect((await stranger.context.request.get("/api/admin/orders")).status()).toBe(404);
  expect((await stranger.context.request.get(`/api/commerce/orders?id=${orderId}`)).status()).toBe(404);
  await stranger.context.close();
});
