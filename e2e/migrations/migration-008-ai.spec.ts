import { expect, test } from "@playwright/test";
import { nextIp, open } from "./helpers";

/**
 * MIG-008: the chat assistant and design-help status on FastAPI. No chat provider or Claude key is set
 * in this suite, so the chat answers from the catalogue (as the site does when its provider is down).
 * Live Claude calls run against a stand-in in playwright.integrations-fastapi.config.ts.
 * Sign-layout suggestions deliberately stay on the site (docs/migrations/tracking.md).
 */
const SITE = "http://localhost:3218";

test.use({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });

test("the chat widget on the site gets a catalogue answer from FastAPI with real product links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "/");
  await page.getByRole("button", { name: "Ask OBASIX design assistant" }).click();
  const answered = page.waitForResponse((r) => r.url().endsWith("/api/ai/chat") && r.request().method() === "POST");
  const box = page.getByRole("textbox").last();
  await box.fill("Do you have ceramic steel boards?");
  await box.press("Enter");
  const response = await answered;
  expect(response.headers()["x-request-id"], "served by FastAPI").toBeTruthy();
  const body = await response.json();
  expect(response.status()).toBe(503);
  expect(body).toMatchObject({ ok: false, code: "unconfigured", mode: "catalogue-fallback", retryable: true });
  expect(body.message).toContain("ceramic steel boards");
  for (const rec of body.recommendations) expect(rec.productId).toMatch(/^[a-z0-9-]+$/);
  await expect(page.locator('a[href^="/products"]').last()).toBeVisible();
});

test("status endpoints, input checks and cross-site refusal", async ({ request }) => {
  const status = await request.get("/api/ai/status");
  expect(status.headers()["x-request-id"]).toBeTruthy();
  expect(await status.json()).toEqual({ design: false });
  expect(await (await request.get("/api/ai/chat")).json()).toMatchObject({ configured: false, missing: ["OBASIX_AI_API_KEY"] });
  const short = await request.post("/api/ai/chat", { data: { message: "x" }, headers: { origin: SITE } });
  expect(await short.json()).toMatchObject({ code: "validation", message: "Please enter a short question for OBASIX Assistant." });
  const forged = await request.post("/api/ai/chat", { data: { message: "hello" }, headers: { origin: "https://evil.example" } });
  expect(forged.status()).toBe(403);
  const design = await request.post("/api/ai/frame-colours", { multipart: { photo: { name: "w.png", mimeType: "image/png", buffer: Buffer.from("x") } }, headers: { origin: SITE } });
  expect(design.status()).toBe(503);
  expect((await design.json()).message).toBe("Design suggestions aren't switched on yet.");
});

test("sign-layout suggestions stay on the site", async ({ request }) => {
  const layouts = await request.post("/api/ai/sign-layouts", { data: { design: "" }, headers: { origin: SITE } });
  expect(layouts.headers()["x-request-id"], "answered by Next.js, not FastAPI").toBeUndefined();
  expect(layouts.status()).toBe(503);
});
