import { api, expect, newVisitor, signInAsStaff, signUp, test } from "./support";

/** Regression tests for the access-control fixes from the E2E audit. */

test("a saved quote is readable by its sender only", async ({ page, browser, baseURL }) => {
  const owner = await signUp(page, "quote-owner");
  await page.context().clearCookies(); // submit as a guest, using the owner's email
  await page.goto("/quote?boardType=Glass%20Board&quantity=2&customSize=6%20%C3%97%204%20ft&custom=1", { waitUntil: "networkidle" });
  await page.getByLabel("Full Name").fill("Quote Owner");
  await page.getByLabel("Email Address").fill(owner.email);
  await page.getByLabel("Mobile Number").fill("9876509876");
  await page.getByLabel("Location / City").fill("Pune");
  await page.getByLabel(/requirements|notes/i).first().fill("Private site address: 12 Secret Lane");
  await page.locator('main form button[type="submit"]').click();
  await expect(page).toHaveURL(/quote\/confirmation/, { timeout: 20_000 });
  const reference = new URL(page.url()).searchParams.get("ref")!;

  // The submitting browser sees its quote.
  const own = await page.request.get(`/api/quotes/${reference}`);
  expect(own.status()).toBe(200);
  expect((await own.json()).quote.notes).toContain("12 Secret Lane");

  // Anyone else who learns the reference gets the same answer as for a quote that doesn't exist.
  const stranger = await newVisitor(browser, baseURL!);
  expect((await stranger.page.request.get(`/api/quotes/${reference}`)).status()).toBe(404);
  await signUp(stranger.page, "quote-stranger");
  expect((await stranger.page.request.get(`/api/quotes/${reference}`)).status()).toBe(404);
  await stranger.context.close();

  // The owner, signed in on another device, can read it through their account.
  const ownerElsewhere = await newVisitor(browser, baseURL!);
  await api(ownerElsewhere.page, "/api/auth?action=login", { email: owner.email, password: "Correct-horse-2027" });
  expect((await ownerElsewhere.page.request.get(`/api/quotes/${reference}`)).status()).toBe(200);
  await ownerElsewhere.context.close();
});

test("the AI assistant refuses requests from other sites", async ({ page }) => {
  const foreign = await page.request.post("/api/ai/chat", {
    data: { messages: [{ role: "user", content: "hello" }] },
    headers: { origin: "https://evil.example" },
  });
  expect(foreign.status()).toBe(403);
  const own = await api(page, "/api/ai/chat", { messages: [{ role: "user", content: "Which board suits a classroom?" }] });
  expect(own.status).not.toBe(403);
});

test("the staff portal opens on Orders", async ({ page }) => {
  await signInAsStaff(page);
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
});
