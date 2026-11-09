import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite. Runs against a dev server in demo commerce mode (no real payments).
 * PORT defaults to 3217; set E2E_BASE_URL to reuse a running server.
 * The server uses a throwaway SQLite file so tests never touch real account data.
 */
const port = Number(process.env.E2E_PORT ?? 3217);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `next dev -p ${port}`,
        url: `${baseURL}/api/commerce/mode`,
        reuseExistingServer: true,
        timeout: 180_000,
        env: { OBASIX_AUTH_DB: ".data/e2e-auth.sqlite", OBASIX_COMMERCE_MODE: "demo" },
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true }, testMatch: /layout\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /layout\.spec|mobile\.spec/ },
  ],
});
