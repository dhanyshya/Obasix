import { Client } from "pg";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Shared by the micro-migration suites (playwright.migrations.config.ts). */
export const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ?? "postgresql://obasix:obasix-local-only@localhost:54329/obasix";
export const PASSWORD = "Correct-horse-2027";

let ipCounter = 0;
/** A fresh client address per visitor, so rate limits count per test, not for the whole suite. */
export const nextIp = () => `10.1.${Math.floor(Math.random() * 250)}.${(ipCounter = (ipCounter % 250) + 1)}`;
export const uniqueEmail = (prefix: string, label: string) =>
  `${prefix}+${label}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}@example.test`;

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

/** Deletes the accounts whose email starts with `prefix+`, and everything they own. */
export async function removeAccounts(prefix: string) {
  const users = await query<{ id: string }>("SELECT id FROM users WHERE email LIKE $1", [`${prefix}+%`]);
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  for (const table of ["sessions", "password_resets", "carts", "wishlist_items", "addresses", "saved_configs"]) {
    await query(`DELETE FROM ${table} WHERE user_id = ANY($1)`, [ids]);
  }
  await query("DELETE FROM users WHERE id = ANY($1)", [ids]);
}

export async function signUp(request: APIRequestContext, origin: string, email: string, name = "Migration Tester") {
  const response = await request.post("/api/auth?action=register", {
    data: { name, email, password: PASSWORD },
    headers: { origin },
  });
  if (!response.ok()) throw new Error(`sign-up failed: ${response.status()} ${await response.text()}`);
  return (await response.json()).user as { id: string; email: string };
}

/**
 * Waits until React has hydrated the page and no streamed copy is left behind.
 * A hidden `<div id="S:n">` that stays means React client-rendered a Suspense boundary
 * and the streamed HTML was never swapped in: a duplicate of the page with the same ids
 * (fixed in the site's contexts; this guards against it coming back).
 */
export async function settled(page: Page) {
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await expect(page.locator('[id^="S:"][hidden]'), "a streamed page copy was left behind").toHaveCount(0);
}

export async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await settled(page);
}
