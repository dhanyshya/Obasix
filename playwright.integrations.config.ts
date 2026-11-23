import { defineConfig, devices } from "@playwright/test";

/**
 * Integration suite: the live payment (Razorpay), email (Resend) and AI (Claude) code paths,
 * run against a local stand-in for those services (e2e/integrations/stand-in.mjs). The keys
 * below are dummies the stand-in accepts; no real service is contacted.
 *
 *   npm run test:e2e:integrations
 *
 * Runs its own dev server on port 3218, so stop the main suite's server (3217) first:
 * Next.js allows one dev server per project folder.
 */
const port = 3218;
const standInPort = 3219;
const standIn = `http://localhost:${standInPort}`;

/** Shared with the tests, which sign payments and webhooks the way Razorpay would. */
export const integrationSecrets = {
  RAZORPAY_KEY_ID: "rzp_test_standin",
  RAZORPAY_KEY_SECRET: "standin-key-secret",
  RAZORPAY_WEBHOOK_SECRET: "standin-webhook-secret",
};

export default defineConfig({
  testDir: "./e2e/integrations",
  testMatch: /\.int\.ts$/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-integrations" }]],
  outputDir: "test-results-integrations",
  use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  webServer: [
    {
      command: `node e2e/integrations/stand-in.mjs`,
      url: `${standIn}/__calls`,
      env: { STAND_IN_PORT: String(standInPort) },
      reuseExistingServer: false,
    },
    {
      command: `next dev -p ${port}`,
      url: `http://localhost:${port}/api/commerce/mode`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        ...integrationSecrets,
        OBASIX_AUTH_DB: ".data/e2e-integrations.sqlite",
        OBASIX_ADMIN_EMAILS: "e2e-staff@example.test",
        TRUST_PROXY_HEADERS: "1",
        RAZORPAY_API_BASE: standIn,
        RESEND_API_KEY: "re_standin",
        RESEND_API_BASE: standIn,
        EMAIL_FROM: "OBASIX <orders@example.test>",
        ANTHROPIC_API_KEY: "sk-ant-standin",
        ANTHROPIC_BASE_URL: standIn,
      },
    },
  ],
});
