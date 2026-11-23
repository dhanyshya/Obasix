import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite. Runs against a dev server in demo commerce mode (no real payments).
 * PORT defaults to 3217; set E2E_BASE_URL to reuse a running server.
 * The server uses a throwaway SQLite file so tests never touch real account data.
 *
 * Headed:        npm run test:e2e:headed     (watch the browser)
 * UI mode:       npm run test:e2e:ui
 * Report:        npm run test:e2e:report     (HTML report from the last run)
 * All browsers:  npm run test:e2e:browsers   (adds Firefox and WebKit; run `npx playwright install firefox webkit` once)
 */
const allBrowsers = process.env.E2E_ALL_BROWSERS === "1";
const port = Number(process.env.E2E_PORT ?? 3217);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Turbopack's dev server sends WebKit into a reload loop (every page reloads every few
        // seconds, so forms reset mid-test). Production has no hot reload, so real Safari users are
        // unaffected; the cross-browser runs use the webpack dev server, which doesn't loop.
        command: `next dev${allBrowsers ? " --webpack" : ""} -p ${port}`,
        url: `${baseURL}/api/commerce/mode`,
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
          OBASIX_AUTH_DB: ".data/e2e-auth.sqlite",
          OBASIX_COMMERCE_MODE: "demo",
          // The staff account used by the admin-portal tests (see e2e/support.ts).
          OBASIX_ADMIN_EMAILS: "e2e-staff@example.test",
          // Tests send a per-test X-Forwarded-For so the shared rate limits don't trip across tests.
          TRUST_PROXY_HEADERS: "1",
        },
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true }, testMatch: /layout\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /layout\.spec|mobile\.spec/ },
    ...(allBrowsers
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] }, testIgnore: /mobile\.spec/ },
          { name: "webkit", use: { ...devices["Desktop Safari"] }, testIgnore: /mobile\.spec/ },
        ]
      : []),
  ],
});
