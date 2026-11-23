import { expect, newVisitor, placeDemoOrder, signInAsStaff, signUp, test, uid } from "./support";
import type { Page } from "@playwright/test";

/**
 * Sales channels and company accounts, end to end: a person applies on the
 * storefront, staff act in the portal, and the result shows back on the storefront.
 */
test.slow(); // each journey spans two or three sessions

async function pick(page: Page, label: string | RegExp, option: string | RegExp) {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option }).click();
}

test("associate: join → share link → referred order → commission on both dashboards", async ({ page, browser, baseURL }) => {
  await signUp(page, "associate");
  await page.goto("/account/associate", { waitUntil: "networkidle" });
  await pick(page, "What work do you do?", "Architect or interior designer");
  await page.getByLabel("City you work in").fill("Pune");
  await page.getByRole("checkbox").check();
  await page.locator("main form button[type=submit]").click();
  const homeLink = page.getByText(/\/\?ref=[A-Z0-9]+$/).first();
  await expect(homeLink).toBeVisible();
  const code = (await homeLink.textContent())!.match(/ref=([A-Z0-9]+)/)![1];
  await expect(page.getByText("Your referral code")).toBeVisible();

  // A buyer arrives through the shared link and orders.
  const buyer = await newVisitor(browser, baseURL!);
  const recorded = buyer.page.waitForResponse((r) => r.url().includes("/api/associates/ref") && r.status() === 200);
  await buyer.page.goto(`/?ref=${code}`, { waitUntil: "networkidle" });
  await recorded;
  const buyerAccount = await signUp(buyer.page, "referred");
  const order = await placeDemoOrder(buyer.page, { productId: "cmwb90120", quantity: 1, email: buyerAccount.email, phone: "9876500021" });
  await buyer.context.close();

  await page.reload();
  await expect(page.getByText(order.id)).toBeVisible();

  const staff = await newVisitor(browser, baseURL!);
  await signInAsStaff(staff.page);
  await staff.page.goto("/admin/associates", { waitUntil: "networkidle" });
  // New commissions wait under "Awaiting delivery" until the order is delivered.
  await staff.page.getByRole("tab", { name: /Awaiting delivery/ }).click();
  await expect(staff.page.getByText(order.id)).toBeVisible();
  await staff.context.close();
});

test("distributor: apply → staff approve with credit → trade order on credit → staff sees it", async ({ page, browser, baseURL }) => {
  await signUp(page, "distributor");
  const business = `E2E Traders ${uid()}`;
  await page.goto("/account/distributor", { waitUntil: "networkidle" });
  await page.getByLabel("Registered business name").fill(business);
  await pick(page, "Type of business", "Regional wholesaler");
  await page.getByLabel("GSTIN").fill("27AAPFU0939F1ZV");
  await page.getByLabel("City").fill("Pune");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("Area you want to cover").fill("Pune district");
  await page.getByRole("checkbox").check();
  await page.locator("main form button[type=submit]").click();
  await expect(page.getByText(/under review|pending|received/i).first()).toBeVisible();

  const staff = await newVisitor(browser, baseURL!);
  await signInAsStaff(staff.page);
  await staff.page.goto("/admin/distributors", { waitUntil: "networkidle" });
  await staff.page.locator("tr").filter({ hasText: business }).getByRole("button", { name: "Review" }).click();
  await staff.page.getByLabel("Credit limit (₹)").fill("100000");
  await staff.page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(staff.page.locator("tr").filter({ hasText: business })).toContainText("Approved");

  await page.reload();
  await page.getByLabel("Search products or SKU").fill("CMWB90120");
  await page.getByLabel("Quantity of Classic Magnetic Whiteboard 3×4").fill("10");
  await page.getByRole("radio", { name: /credit/i }).check();
  await page.getByLabel("Your PO number (optional)").fill("PO-E2E-1");
  await page.getByRole("button", { name: "Place trade order" }).click();
  await expect(page.getByText(/PO-E2E-1|order placed|DST-/i).first()).toBeVisible();

  await staff.page.reload();
  await expect(staff.page.getByText(business).first()).toBeVisible();
  await expect(staff.page.getByText(/PO-E2E-1|Credit/).first()).toBeVisible();
  await staff.context.close();
});

test("partner: apply → staff approve → register project → staff quote margin → partner sees it", async ({ page, browser, baseURL }) => {
  await signUp(page, "partner");
  const company = `E2E Fitouts ${uid()}`;
  await page.goto("/account/partner", { waitUntil: "networkidle" });
  await page.getByLabel("Registered company name").fill(company);
  await pick(page, "Type of business", "Fit-out or interior contractor");
  await page.getByLabel("GSTIN").fill("27AAPFU0939F1ZV");
  await page.getByLabel("City").fill("Pune");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("School or college").check();
  await page.getByLabel(/partner terms/).check();
  await page.getByRole("button", { name: "Apply to partner" }).click();
  await expect(page.getByText(/under review|pending|received/i).first()).toBeVisible();

  const staff = await newVisitor(browser, baseURL!);
  await signInAsStaff(staff.page);
  await staff.page.goto("/admin/partners", { waitUntil: "networkidle" });
  // The test database keeps earlier runs' applications: act on this partner's row only.
  const application = staff.page.locator("tr").filter({ hasText: company });
  await application.getByRole("button", { name: /approve/i }).click();
  await expect(application).toContainText(/approved/i);

  const client = `E2E Public School ${uid()}`;
  await page.reload();
  await page.getByLabel("Client").fill(client);
  await page.getByLabel("Project city").fill("Pune");
  await pick(page, "Sector", "School or college");
  await page.getByLabel("Expected value (₹)").fill("500000");
  await page.getByLabel("Scope").fill("40 classrooms: magnetic board and pin-up board each");
  await page.getByLabel("Expected order date").fill("2027-06-01");
  await page.getByRole("button", { name: "Register project" }).click();
  await expect(page.getByText(/reserved for you/)).toBeVisible();
  await expect(page.getByText(client)).toBeVisible();

  await staff.page.reload();
  const project = staff.page.locator("tr").filter({ hasText: client });
  await project.getByRole("button", { name: /manage/i }).click();
  await staff.page.getByLabel("Quoted value (₹)").fill("480000");
  await staff.page.getByLabel("Margin %").fill("10");
  // Let the staff save land before the partner looks.
  const quoteSaved = staff.page.waitForResponse((r) => r.url().endsWith("/api/admin/partners") && r.request().method() === "POST" && r.ok());
  await staff.page.getByRole("button", { name: /save quote|quote/i }).first().click();
  await quoteSaved;

  await page.reload();
  await expect(page.locator("tr").filter({ hasText: client })).toContainText("10%");
  await staff.context.close();
});

test("company account: create → add a colleague → save the cart as a shared reorder list", async ({ page, browser, baseURL }) => {
  await signUp(page, "owner");
  // Wait for the saved account to load first. Adding to the cart before it finishes loses the item:
  // see the AuthContext race reported in the E2E audit (applyAccount replaces the in-browser cart).
  const accountLoaded = page.waitForResponse((r) => r.url().endsWith("/api/account") && r.request().method() === "GET");
  await page.goto("/products/cmwb6090", { waitUntil: "networkidle" });
  await accountLoaded;
  // Signed-in carts save to the server shortly after a change; wait for that before leaving the page.
  // Wait for the save that carries this product (loading the account also triggers a save of the loaded cart).
  // Leaving the page within the 400 ms save delay loses the item: see the cart-save finding in the E2E audit.
  const saved = page.waitForResponse(
    (r) => r.url().includes("/api/account?action=cart") && r.ok() && (r.request().postData() ?? "").includes("cmwb6090"),
  );
  await page.getByRole("button", { name: /^Add to Cart$/ }).first().click();
  await expect(page.getByRole("button", { name: /Added/ }).first()).toBeVisible();
  await saved;

  await page.goto("/account/company", { waitUntil: "networkidle" });
  await page.getByLabel("Company name").fill(`E2E Co ${uid()}`);
  await page.getByRole("button", { name: "Create company account" }).click();

  const colleague = await newVisitor(browser, baseURL!);
  const { email } = await signUp(colleague.page, "colleague");
  await page.getByLabel("Colleague's email").fill(email);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByLabel("Save current cart as a list").fill("Branch standard");
  await page.getByRole("button", { name: "Save list" }).click();

  // The colleague sees the shared list from their own account.
  await colleague.page.goto("/account/company", { waitUntil: "networkidle" });
  await expect(colleague.page.getByText("Branch standard")).toBeVisible();
  await colleague.context.close();
});
