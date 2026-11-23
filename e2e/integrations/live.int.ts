import { createHmac } from "node:crypto";
import type { APIRequestContext, Page } from "@playwright/test";
import { integrationSecrets } from "../../playwright.integrations.config";
import { api, appOrigin, expect, signUp, test, uid } from "../support";

/**
 * The live payment, email and AI paths, against the local stand-in for Razorpay, Resend and
 * Claude (see playwright.integrations.config.ts). The app runs exactly as it would with real
 * keys; only the services' addresses differ.
 */
const standIn = "http://localhost:3219";
type Call = { service: "razorpay" | "resend" | "claude"; authorization: string; apiKey: string; body: Record<string, unknown> };

async function calls(request: APIRequestContext) {
  return (await (await request.get(`${standIn}/__calls`)).json()) as Call[];
}
async function failNext(request: APIRequestContext, service: "razorpay" | "claude", status: number, times = 1) {
  await request.post(`${standIn}/__fail`, { data: { service, status, times } });
}
const emailsTo = (all: Call[], address: string) =>
  all.filter((c) => c.service === "resend" && (c.body.to as string[]).includes(address));

const sign = (secret: string, payload: string) => createHmac("sha256", secret).update(payload).digest("hex");

async function startPayment(page: Page, email: string) {
  const response = await page.request.post("/api/commerce/orders", {
    headers: { origin: appOrigin(), "idempotency-key": `int-${uid()}` },
    data: {
      method: "upi",
      details: {
        name: "Integration Buyer",
        email,
        phone: "9876501234",
        shipping: { line: "12 Test Road", city: "Pune", state: "MH", postal: "411001", country: "India" },
      },
      lines: [{ productId: "cmwb6090", quantity: 2, configuration: {} }],
    },
  });
  return { status: response.status(), body: await response.json() };
}

test.describe("payments (Razorpay)", () => {
  test("checkout creates a Razorpay order, refuses a forged signature, and confirms a genuine one once", async ({ page, request }) => {
    expect((await (await page.request.get("/api/commerce/mode")).json()).mode).toBe("real");
    const email = `int-pay-${uid()}@example.test`;

    const started = await startPayment(page, email);
    expect(started.status, JSON.stringify(started.body)).toBe(200);
    expect(started.body.mode).toBe("real");
    const { order, razorpay } = started.body;
    expect(razorpay.keyId).toBe(integrationSecrets.RAZORPAY_KEY_ID);
    expect(razorpay.amount).toBe(Math.round(order.subtotal * 100));

    // Razorpay was asked for the server-priced amount, with the account's credentials.
    const created = (await calls(request)).filter((c) => c.service === "razorpay" && c.body.receipt === order.id);
    expect(created).toHaveLength(1);
    expect(created[0].body.amount).toBe(razorpay.amount);
    const expectedAuth = Buffer.from(`${integrationSecrets.RAZORPAY_KEY_ID}:${integrationSecrets.RAZORPAY_KEY_SECRET}`).toString("base64");
    expect(created[0].authorization).toBe(`Basic ${expectedAuth}`);

    const paymentId = `pay_${uid()}`;
    const confirm = (signature: string) =>
      api(page, "/api/commerce/payment", {
        orderId: order.id,
        razorpay_order_id: razorpay.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    // A made-up signature doesn't mark the order paid, and nobody is emailed.
    const forged = await confirm(sign("not-the-secret", `${razorpay.orderId}|${paymentId}`));
    expect(forged.status).toBe(400);
    expect(forged.body.charged).toBe(false);
    expect(emailsTo(await calls(request), email)).toHaveLength(0);

    // The signature Razorpay's checkout would send confirms it.
    const genuine = sign(integrationSecrets.RAZORPAY_KEY_SECRET, `${razorpay.orderId}|${paymentId}`);
    const paid = await confirm(genuine);
    expect(paid.status, JSON.stringify(paid.body)).toBe(200);
    expect(paid.body.order.paymentStatus).toBe("paid");

    // The customer and staff are each emailed once, even if the confirmation arrives twice.
    expect((await confirm(genuine)).status).toBe(200);
    const all = await calls(request);
    const toCustomer = emailsTo(all, email);
    expect(toCustomer).toHaveLength(1);
    expect(String(toCustomer[0].body.subject)).toContain(order.id);
    expect(toCustomer[0].authorization).toBe("Bearer re_standin");
    expect(emailsTo(all, "e2e-staff@example.test").filter((c) => String(c.body.subject).includes(order.id))).toHaveLength(1);
  });

  test("the webhook confirms a payment when the browser never comes back, and rejects unsigned calls", async ({ page, request }) => {
    const email = `int-hook-${uid()}@example.test`;
    const { body } = await startPayment(page, email);
    const event = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: `pay_${uid()}`, order_id: body.razorpay.orderId, status: "captured" } } },
    });
    const deliver = (signature: string) =>
      page.request.post("/api/commerce/payment/webhook", { headers: { "content-type": "application/json", "x-razorpay-signature": signature }, data: event });

    expect((await deliver(sign("wrong", event))).status()).toBe(401);
    expect(emailsTo(await calls(request), email)).toHaveLength(0);

    const good = sign(integrationSecrets.RAZORPAY_WEBHOOK_SECRET, event);
    expect((await deliver(good)).status()).toBe(200);
    expect((await deliver(good)).status()).toBe(200); // Razorpay retries; the order is paid once
    expect(emailsTo(await calls(request), email)).toHaveLength(1);

    const track = await api(page, "/api/commerce/track", { orderNumber: body.order.id, contact: email });
    expect(track.body.order.paymentStatus ?? track.body.order.status).toMatch(/paid|confirmed|processing/i);
  });

  test("if Razorpay is down, checkout says nothing was charged", async ({ page, request }) => {
    await failNext(request, "razorpay", 500);
    const { status, body } = await startPayment(page, `int-down-${uid()}@example.test`);
    expect(status).toBe(502);
    expect(body.charged).toBe(false);
    expect(body.message).toMatch(/Nothing was charged/);
  });
});

test.describe("email (Resend)", () => {
  test("a password reset is emailed with a working link, and unknown addresses get the same answer", async ({ page, request }) => {
    const { email } = await signUp(page, "int-reset");
    const asked = await api(page, "/api/auth?action=forgot", { email });
    expect(asked.body.delivered).toBe(true);
    expect(asked.body.resetPath).toBeUndefined(); // the link only goes by email

    const message = emailsTo(await calls(request), email).at(-1)!;
    const token = String(message.body.text).match(/reset-password\?token=([\w-]+)/)![1];
    const reset = await api(page, "/api/auth?action=reset", { token, password: "Brand-new-horse-2027" });
    expect(reset.status, JSON.stringify(reset.body)).toBe(200);
    expect((await api(page, "/api/auth?action=login", { email, password: "Brand-new-horse-2027" })).status).toBe(200);

    const before = (await calls(request)).length;
    const unknown = await api(page, "/api/auth?action=forgot", { email: `nobody-${uid()}@example.test` });
    expect(unknown.body.message).toBe(asked.body.message);
    expect((await calls(request)).length).toBe(before);
  });
});

test.describe("design help (Claude)", () => {
  const photo = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const suggest = (page: Page) =>
    page.request.post("/api/ai/frame-colours", {
      headers: { origin: appOrigin() },
      multipart: { photo: { name: "wall.png", mimeType: "image/png", buffer: photo }, productId: "cmwb6090" },
    });

  test("frame and colour suggestions come back from Claude, limited to what OBASIX makes", async ({ page, request }) => {
    const response = await suggest(page);
    const body = await response.json();
    expect(response.status(), JSON.stringify(body)).toBe(200);
    expect(body.suggestions[0]).toMatchObject({ frameId: "aluminium-light", frameName: "Light Aluminium", colourId: "white" });

    const sent = (await calls(request)).filter((c) => c.service === "claude").at(-1)!;
    // The SDK sends the key as x-api-key, or as a bearer token, depending on how it's configured.
    expect([sent.apiKey, sent.authorization]).toContainEqual(expect.stringContaining("sk-ant-standin"));
    expect(sent.body.model).toBe("claude-opus-5-5");
    const content = (sent.body.messages as { content: { type: string }[] }[])[0].content;
    expect(content.some((part) => part.type === "image")).toBe(true);
  });

  test("a Claude outage gives the customer a plain message, not an error page", async ({ page, request }) => {
    await failNext(request, "claude", 500, 2); // the client retries once
    const response = await suggest(page);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect((await response.json()).message).toMatch(/couldn't get suggestions|unavailable|try again/i);
  });
});
