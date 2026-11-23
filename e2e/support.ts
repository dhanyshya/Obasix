import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

/**
 * Shared fixtures for the cross-application tests (storefront → API → staff portal).
 *
 * - Each test gets its own client address (X-Forwarded-For, trusted because the test
 *   server sets TRUST_PROXY_HEADERS=1), so the shared, database-backed rate limits
 *   behave per visitor instead of tripping across the whole suite.
 * - Set-up steps (sign-up, sign-in) go through the real HTTP API; the behaviour under
 *   test is driven through the UI.
 * - Navigations wait for "networkidle" before typing: on a slow or busy server (WebKit
 *   under parallel load especially), text typed before React hydrates is discarded.
 */
export const STAFF_EMAIL = "e2e-staff@example.test"; // listed in OBASIX_ADMIN_EMAILS by playwright.config.ts
export const PASSWORD = "Correct-horse-2027";

const randomIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The dev server's hot-reload socket (`/_next/hmr` with Turbopack, `/_next/webpack-hmr` with
 * webpack). Turbopack's dev server sends WebKit a full reload every few seconds (dev only;
 * production has no hot reload), resetting forms mid-test. Tests never edit source files, so the
 * socket is answered locally and left silent in every browser.
 */
const hotReload = /\/_next\/(webpack-)?hmr/;
async function silenceHotReload(context: BrowserContext) {
  await context.routeWebSocket(hotReload, () => {});
}

export const test = base.extend<{ silencedHotReload: void }>({
  silencedHotReload: [
    async ({ context }, provide) => {
      await silenceHotReload(context);
      await provide();
    },
    { auto: true },
  ],
  // The fixture callback is named `provide` (Playwright calls it `use`) so the React hooks lint rule doesn't mistake it for a hook.
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ "x-forwarded-for": randomIp() });
  },
});
export { expect };

/** A fresh browser context with its own client address, for a second person in the same test. */
export async function newVisitor(browser: Browser, baseURL: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomIp() } });
  await silenceHotReload(context);
  return { context, page: await context.newPage() };
}

/** POST JSON to an app API route the way the browser does (same-origin header included). */
export const appOrigin = () => new URL(String(test.info().project.use.baseURL)).origin;

export async function api(page: Page, url: string, data: unknown) {
  const response = await page.request.post(url, { data: data as object, headers: { origin: appOrigin() } });
  return { status: response.status(), body: await response.json().catch(() => ({})) };
}

/** Registers a new customer through the API; the session cookie lands in the page's context. */
export async function signUp(page: Page, label: string) {
  const email = `e2e-${label}-${uid()}@example.test`;
  const { status, body } = await api(page, "/api/auth?action=register", { name: `E2E ${label}`, email, password: PASSWORD });
  expect(status, JSON.stringify(body)).toBe(200);
  return { email, id: body.user.id as string };
}

/** Signs in as the staff account, creating it on first use. */
export async function signInAsStaff(page: Page) {
  const login = await api(page, "/api/auth?action=login", { email: STAFF_EMAIL, password: PASSWORD });
  if (login.status === 200) return;
  const register = await api(page, "/api/auth?action=register", { name: "E2E Staff", email: STAFF_EMAIL, password: PASSWORD });
  expect(register.status, JSON.stringify(register.body)).toBe(200);
}

/**
 * Places a demo-mode order (priced by the server) in this context. A referral recorded
 * earlier in the context (visiting a ?ref= link) travels with it in the cookie jar.
 */
export async function placeDemoOrder(page: Page, opts: { productId: string; quantity: number; email: string; phone: string }) {
  const headers: Record<string, string> = { origin: appOrigin(), "idempotency-key": `e2e-${uid()}` };
  const response = await page.request.post("/api/commerce/orders", {
    headers,
    data: {
      method: "upi",
      details: {
        name: "E2E Buyer",
        email: opts.email,
        phone: opts.phone,
        shipping: { line: "12 Test Road", city: "Pune", state: "MH", postal: "411001", country: "India" },
      },
      lines: [{ productId: opts.productId, quantity: opts.quantity, configuration: {} }],
    },
  });
  const body = await response.json();
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.order as { id: string; subtotal: number; status: string };
}
