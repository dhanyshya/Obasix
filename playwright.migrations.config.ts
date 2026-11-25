import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * Micro-migration suite: the site with migrated API areas served by FastAPI (api/).
 *
 * Needs Postgres: MIGRATION_DATABASE_URL, default the docker-compose database
 * (`docker compose up -d db`). Playwright starts FastAPI (after `alembic upgrade head`)
 * and Next.js, and waits for both health checks before any browser test runs.
 * Set E2E_ALL_BROWSERS=1 to add Firefox and WebKit. Next.js allows one dev server per
 * project folder, so run this after (not alongside) the other Playwright suites.
 */
const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? "postgresql://obasix:obasix-local-only@localhost:54329/obasix";
const sitePort = 3218;
const adminPort = 4173;
const adminApp = `http://localhost:${adminPort}`;
const apiPort = 8218;
const site = process.env.E2E_BASE_URL ?? `http://localhost:${sitePort}`;
const secret = randomBytes(24).toString("hex");
// Shared by the site and the API: it signs sessions and the quote cookie (MIG-005).
const authSecret = randomBytes(24).toString("hex");
// The MIG-003 and MIG-004 suites' admins; their accounts are removed after each run.
const STAFF_EMAILS = "e2e-staff@example.test,mig003+admin@example.test,mig004+admin@example.test,mig005+admin@example.test";
const allBrowsers = process.env.E2E_ALL_BROWSERS === "1";
// A production build by default: `next dev` can fall into an endless "HMR hash mismatch"
// reload on freshly compiled pages, which stalls browser tests. E2E_SERVER=dev to use it anyway.
const dev = process.env.E2E_SERVER === "dev";

export default defineConfig({
  testDir: "./e2e/migrations",
  globalSetup: "./e2e/migrations/warm-up.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-migrations", open: "never" }],
    ["junit", { outputFile: "test-results-migrations/junit.xml" }],
    ["json", { outputFile: "test-results-migrations/results.json" }],
  ],
  outputDir: "test-results-migrations/artifacts",
  use: { baseURL: site, headless: true, trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" },
  // E2E_BASE_URL: use servers that are already running (same settings as below).
  webServer: process.env.E2E_BASE_URL ? undefined : [
    {
      name: "FastAPI",
      command: `cd api && uv run alembic upgrade head && uv run uvicorn app.main:app --port ${apiPort}`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: databaseUrl,
        APP_ENV: "development",
        AUTH_SECRET: authSecret,
        // No .pyc files in the project while Next.js watches it.
        PYTHONDONTWRITEBYTECODE: "1",
        // The site, and the admin app (MIG-004), which reaches FastAPI through its own proxy.
        ALLOWED_ORIGINS: `${site},${adminApp}`,
        TRUST_PROXY_HEADERS: "1",
        NEXT_PUBLIC_SITE_URL: site,
        OBASIX_API_PROXY_SECRET: secret,
        OBASIX_ADMIN_EMAILS: STAFF_EMAILS,
        // Same as the site, so both report the same order mode.
        OBASIX_COMMERCE_MODE: "demo",
      },
    },
    {
      name: "Next.js",
      command: dev ? `next dev -p ${sitePort}` : `next build && next start -p ${sitePort}`,
      url: `${site}/api/commerce/mode`,
      reuseExistingServer: false,
      timeout: 600_000,
      env: {
        DATABASE_URL: databaseUrl,
        OBASIX_API_URL: `http://127.0.0.1:${apiPort}`,
        OBASIX_API_ROUTES: "auth,account,admin-core,admin-stock,quotes,admin-quotes",
        OBASIX_API_PROXY_SECRET: secret,
        OBASIX_COMMERCE_MODE: "demo",
        OBASIX_ADMIN_EMAILS: STAFF_EMAILS,
        TRUST_PROXY_HEADERS: "1",
        NEXT_PUBLIC_SITE_URL: site,
        // A production build refuses sign-in without it. A throwaway value for the test servers only.
        AUTH_SECRET: authSecret,
      },
    },
    {
      name: "Admin app",
      command: "npm --prefix admin run build && npm --prefix admin run preview",
      url: adminApp,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { ADMIN_API_PROXY: `http://127.0.0.1:${apiPort}` },
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(allBrowsers
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
});
