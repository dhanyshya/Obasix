import path from "node:path";
import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";
import { integrationSecrets } from "./playwright.integrations.config";

/**
 * The integration suite (e2e/integrations: live Razorpay payments, Resend email, Claude) unchanged,
 * against a production build with every migrated area served by FastAPI. Same stand-in, ports and
 * dummy keys as playwright.integrations.config.ts; Postgres from docker compose.
 *
 *   npm run test:e2e:integrations-fastapi
 */
const port = 3218;
const apiPort = 8219;
const standIn = "http://localhost:3219";
const site = `http://localhost:${port}`;
const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? "postgresql://obasix:obasix-local-only@localhost:54329/obasix";
const routes =
  "auth,account,admin-core,admin-stock,quotes,admin-quotes,quote-submit,admin-quote-files,proofs,admin-proofs,commerce,stock,admin-orders,associates,admin-associates,distributors,admin-distributors,partners,admin-partners,company";
const proxySecret = randomBytes(24).toString("hex");
const authSecret = randomBytes(24).toString("hex");
const shared = {
  ...integrationSecrets,
  DATABASE_URL: databaseUrl,
  AUTH_SECRET: authSecret,
  OBASIX_ADMIN_EMAILS: "e2e-staff@example.test",
  RAZORPAY_API_BASE: standIn,
  RESEND_API_KEY: "re_standin",
  RESEND_API_BASE: standIn,
  EMAIL_FROM: "OBASIX <orders@example.test>",
  NEXT_PUBLIC_SITE_URL: site,
};

export default defineConfig({
  testDir: "./e2e/integrations",
  testMatch: /\.int\.ts$/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-integrations-fastapi" }]],
  outputDir: "test-results-integrations-fastapi",
  use: { ...devices["Desktop Chrome"], baseURL: site, trace: "retain-on-failure" },
  webServer: [
    { command: "node e2e/integrations/stand-in.mjs", url: `${standIn}/__calls`, env: { STAND_IN_PORT: "3219" }, reuseExistingServer: false },
    {
      name: "FastAPI",
      command: `cd api && uv run alembic upgrade head && uv run uvicorn app.main:app --port ${apiPort}`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      // FastAPI's request log (JSON lines on stdout) in the test output: shows which calls it served.
      stdout: "pipe",
      env: {
        ...shared,
        APP_ENV: "production",
        ALLOWED_ORIGINS: site,
        OBASIX_API_PROXY_SECRET: proxySecret,
        OBASIX_FILES_DIR: path.join(__dirname, ".data"),
        PYTHONDONTWRITEBYTECODE: "1",
      },
    },
    {
      name: "Next.js",
      command: `next build && next start -p ${port}`,
      url: `${site}/api/commerce/mode`,
      reuseExistingServer: false,
      timeout: 600_000,
      env: {
        ...shared,
        OBASIX_API_URL: `http://127.0.0.1:${apiPort}`,
        OBASIX_API_ROUTES: routes,
        OBASIX_API_PROXY_SECRET: proxySecret,
        TRUST_PROXY_HEADERS: "1",
        ANTHROPIC_API_KEY: "sk-ant-standin",
        ANTHROPIC_BASE_URL: standIn,
      },
    },
  ],
});
