import { expect, test } from "@playwright/test";

/**
 * MIG-011: the site's old staff portal (/admin) is retired in favour of the React admin app.
 * With OBASIX_ADMIN_APP_URL set, every /admin page is a permanent redirect to the same section of the app,
 * which signs staff in against FastAPI (roles and audit log); nobody reaches the old pages' direct writes.
 */
const ADMIN_APP = "http://localhost:4173";

for (const [from, to] of [["/admin", "/"], ["/admin/orders", "/orders"], ["/admin/stock", "/stock"], ["/admin/proofs", "/proofs"]]) {
  test(`${from} redirects to the admin app's ${to}`, async ({ request }) => {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`${ADMIN_APP}${to}`);
  });
}

test("a visitor following the redirect lands on the admin app's sign-in, not a staff page", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(new RegExp(`^${ADMIN_APP}`));
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("the API forwarding is unchanged by the redirect", async ({ request }) => {
  expect((await request.get("/api/admin/me")).status()).toBe(404);
});
