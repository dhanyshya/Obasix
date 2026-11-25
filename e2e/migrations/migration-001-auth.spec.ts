import { expect, test, type APIRequestContext } from "@playwright/test";
import { nextIp, PASSWORD, query, removeAccounts, uniqueEmail as unique } from "./helpers";

/**
 * MIG-001: accounts (/api/auth) served by FastAPI. See docs/migrations/tracking.md.
 * Checks that the site's real pages work against the new service, that sessions
 * are shared with routes still in Next.js, and what ends up in the database.
 */
const uniqueEmail = (label: string) => unique("mig001", label);

const post = (request: APIRequestContext, action: string, data: unknown, origin: string, ip = nextIp()) =>
  request.post(`/api/auth?action=${action}`, { data, headers: { origin, "x-forwarded-for": ip } });

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });

test.afterAll(() => removeAccounts("mig001"));

test("auth requests are answered by FastAPI, not the Next.js route", async ({ request, baseURL }) => {
  const response = await request.get("/api/auth");
  expect(response.status()).toBe(200);
  // Only the FastAPI service sets a request id.
  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f]{32}$/);
  expect(await response.json()).toEqual({ user: null });
  const bad = await post(request, "register", { name: "X" }, baseURL!);
  expect(bad.headers()["x-request-id"]).toBeTruthy();
});

test("register in the browser → account page → database row → sign out → sign in", async ({ page }) => {
  const email = uniqueEmail("journey");
  await page.goto("/register", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Migration One");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('main form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator("main")).toContainText("Migration One");

  const [user] = await query<{ name: string; role: string; password_hash: string }>(
    "SELECT name, role, password_hash FROM users WHERE email = $1",
    [email],
  );
  expect(user.name).toBe("Migration One");
  expect(user.role).toBe("customer");
  expect(user.password_hash).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);

  // /api/account is still a Next.js route: it must accept the session FastAPI created.
  const account = await page.request.get("/api/account");
  expect(account.status()).toBe(200);
  expect((await account.json()).user.email).toBe(email);

  await page.request.post("/api/auth?action=logout", { headers: { origin: new URL(page.url()).origin } });
  expect((await page.request.get("/api/account")).status()).toBe(401);

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.locator('main form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/account/);
});

test("form errors from the API show on the page", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
  await page.locator('main form button[type="submit"]').click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("validation, duplicates and cross-site requests are refused", async ({ request, baseURL }) => {
  const email = uniqueEmail("dupe");
  const short = await post(request, "register", { name: "Dee", email, password: "short" }, baseURL!);
  expect(short.status()).toBe(400);
  expect(await short.json()).toEqual({ ok: false, errors: { password: "Use 8 to 72 characters." } });

  expect((await post(request, "register", { name: "Dee", email, password: PASSWORD }, baseURL!)).status()).toBe(200);
  const again = await post(request, "register", { name: "Dee", email, password: PASSWORD }, baseURL!);
  expect(again.status()).toBe(409);
  expect((await query("SELECT 1 FROM users WHERE email = $1", [email])).length).toBe(1);

  const forged = await post(request, "login", { email, password: PASSWORD }, "https://evil.example");
  expect(forged.status()).toBe(403);
});

test("brute force is limited per visitor, and other visitors are unaffected", async ({ request, baseURL }) => {
  const attacker = nextIp();
  const attempt = (ip: string) => post(request, "login", { email: uniqueEmail("x"), password: "wrong-pass" }, baseURL!, ip);
  const statuses: number[] = [];
  for (let i = 0; i < 9; i++) statuses.push((await attempt(attacker)).status());
  expect(statuses.slice(0, 8)).toEqual(Array(8).fill(401));
  expect(statuses[8]).toBe(429);
  expect((await attempt(nextIp())).status()).toBe(401);
});

test("a guest cart is kept on sign-up and stored for the account", async ({ request, baseURL }) => {
  const email = uniqueEmail("cart");
  const response = await post(
    request,
    "register",
    { name: "Cart Person", email, password: PASSWORD, cart: [{ productId: "cmwb6090", quantity: 3 }], wishlist: ["cmwb6090"] },
    baseURL!,
  );
  const body = await response.json();
  expect(body.cart).toEqual([
    expect.objectContaining({ productId: "cmwb6090", quantity: 3, unitPrice: 1825 }),
  ]);
  expect(body.wishlist).toEqual(["cmwb6090"]);
  const [saved] = await query<{ payload: string }>(
    "SELECT carts.payload FROM carts JOIN users ON users.id = carts.user_id WHERE users.email = $1",
    [email],
  );
  expect(JSON.parse(saved.payload)[0]).toMatchObject({ productId: "cmwb6090", quantity: 3 });
});

test("password reset: the link works once, and old sessions end", async ({ page, browser, baseURL }) => {
  const email = uniqueEmail("reset");
  expect((await post(page.request, "register", { name: "Reset Person", email, password: PASSWORD }, baseURL!)).status()).toBe(200);
  expect((await page.request.get("/api/account")).status()).toBe(200);

  const other = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  const visitor = await other.newPage();
  await visitor.goto("/forgot-password", { waitUntil: "networkidle" });
  await visitor.getByLabel("Email").fill(email);
  await visitor.locator('main form button[type="submit"]').click();
  const link = visitor.locator('a[href^="/reset-password?token="]');
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href"))!;
  await link.click();
  await visitor.getByLabel(/password/i).first().fill("New-horse-battery-3");
  await visitor.locator('main form button[type="submit"]').click();
  await expect(visitor).toHaveURL(/\/login$/);

  // The first browser's session ended with the reset.
  expect((await page.request.get("/api/account")).status()).toBe(401);
  // The same link can't be used again.
  const token = new URL(href, baseURL).searchParams.get("token");
  const reuse = await post(page.request, "reset", { token, password: "Another-horse-4" }, baseURL!);
  expect(reuse.status()).toBe(400);
  const ok = await post(page.request, "login", { email, password: "New-horse-battery-3" }, baseURL!);
  expect(ok.status()).toBe(200);
  await other.close();
});
