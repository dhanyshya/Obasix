import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { mergeCartLines, normalizeCartLines, toCartItems, type SavedCartLine } from "@/lib/auth/cart";
import { authConfigured, authDatabase } from "@/lib/auth/db";
import { hashPassword, passwordError, verifyPassword } from "@/lib/auth/password";
import { allowAuthAttempt, clientAddress, createSession, destroySession, readSession, sameOrigin } from "@/lib/auth/session";

export const runtime = "nodejs";

const dummyHash = hashPassword("not-a-real-password");

function unavailable() {
  return Response.json(
    {
      ok: false,
      message: "Accounts are not available. Set AUTH_SECRET on the server before production sign-in.",
      required: ["AUTH_SECRET"],
    },
    { status: 503 },
  );
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

export async function POST(request: Request) {
  if (!authConfigured()) return unavailable();
  if (!sameOrigin(request)) return Response.json({ ok: false, message: "The account request was rejected." }, { status: 403 });
  const action = new URL(request.url).searchParams.get("action");
  if (!allowAuthAttempt(`${clientAddress(request)}:${action}`)) {
    return Response.json({ ok: false, message: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }
  const body =
    action === "logout"
      ? {}
      : ((await request.json().catch(() => null)) as Record<string, unknown> | null);
  if (!body) return Response.json({ ok: false, message: "The request could not be read." }, { status: 400 });
  if (action === "register") return register(body);
  if (action === "login") return login(body);
  if (action === "logout") {
    await destroySession();
    return Response.json({ ok: true });
  }
  if (action === "forgot") return forgot(body);
  if (action === "reset") return reset(body);
  return Response.json({ ok: false, message: "Unknown account action." }, { status: 404 });
}

export async function GET() {
  const session = await readSession();
  return Response.json({ user: session?.user ?? null });
}

async function register(body: Record<string, unknown>) {
  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password ?? "");
  if (name.length < 2) return Response.json({ ok: false, errors: { name: "Enter your name." } }, { status: 400 });
  if (!emailOk(email)) return Response.json({ ok: false, errors: { email: "Enter a valid email address." } }, { status: 400 });
  const passwordMessage = passwordError(password);
  if (passwordMessage) return Response.json({ ok: false, errors: { password: passwordMessage } }, { status: 400 });
  const database = authDatabase();
  if (database.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return Response.json({ ok: false, errors: { email: "An account with that email already exists." } }, { status: 409 });
  }
  const id = randomUUID();
  database
    .prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'customer', ?)")
    .run(id, email, name, await hashPassword(password), new Date().toISOString());
  await createSession(id);
  const merged = persistGuest(id, body.cart, body.wishlist);
  return Response.json({ ok: true, user: publicUser(id), ...merged });
}

async function login(body: Record<string, unknown>) {
  const email = clean(body.email, 120).toLowerCase();
  const password = String(body.password ?? "");
  const row = authDatabase().prepare("SELECT id, password_hash, role FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string; role: string }
    | undefined;
  const valid = await verifyPassword(password, row?.password_hash ?? (await dummyHash));
  if (!row || !valid || row.role !== "customer") {
    return Response.json({ ok: false, message: "Email or password is incorrect." }, { status: 401 });
  }
  await createSession(row.id);
  const merged = persistGuest(row.id, body.cart, body.wishlist);
  return Response.json({ ok: true, user: publicUser(row.id), ...merged });
}

function forgot(body: Record<string, unknown>) {
  const email = clean(body.email, 120).toLowerCase();
  if (!emailOk(email)) return Response.json({ ok: false, errors: { email: "Enter a valid email address." } }, { status: 400 });
  const row = authDatabase().prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (process.env.NODE_ENV !== "development" || !row) {
    return Response.json({
      ok: true,
      delivered: false,
      message: "No email service is configured, so a reset link was not sent.",
    });
  }
  const token = randomBytes(32).toString("base64url");
  authDatabase()
    .prepare("INSERT INTO password_resets (token_hash, user_id, expires_at, used_at) VALUES (?, ?, ?, NULL)")
    .run(createHash("sha256").update(token).digest("base64url"), row.id, Date.now() + 30 * 60 * 1000);
  return Response.json({
    ok: true,
    delivered: false,
    message: "Local development only. This link was not emailed.",
    resetPath: `/reset-password?token=${encodeURIComponent(token)}`,
  });
}

async function reset(body: Record<string, unknown>) {
  const token = clean(body.token, 200);
  const password = String(body.password ?? "");
  const passwordMessage = passwordError(password);
  if (!token) return Response.json({ ok: false, message: "This reset link is missing or expired." }, { status: 400 });
  if (passwordMessage) return Response.json({ ok: false, errors: { password: passwordMessage } }, { status: 400 });
  const tokenHash = createHash("sha256").update(token).digest("base64url");
  const row = authDatabase()
    .prepare("SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?")
    .get(tokenHash) as { user_id: string; expires_at: number; used_at: number | null } | undefined;
  if (!row || row.used_at || row.expires_at < Date.now()) {
    return Response.json({ ok: false, message: "This reset link is missing or expired." }, { status: 400 });
  }
  authDatabase().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), row.user_id);
  authDatabase().prepare("UPDATE password_resets SET used_at = ? WHERE token_hash = ?").run(Date.now(), tokenHash);
  authDatabase().prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
  return Response.json({ ok: true });
}

function publicUser(id: string) {
  return authDatabase().prepare("SELECT id, email, name, phone, company, role FROM users WHERE id = ? AND role = 'customer'").get(id);
}

function readSavedCart(userId: string): SavedCartLine[] {
  const row = authDatabase().prepare("SELECT payload FROM carts WHERE user_id = ?").get(userId) as { payload: string } | undefined;
  if (!row) return [];
  try {
    return normalizeCartLines(JSON.parse(row.payload));
  } catch {
    return [];
  }
}

function persistGuest(userId: string, cart: unknown, wishlist: unknown) {
  const database = authDatabase();
  const merged = mergeCartLines(readSavedCart(userId), normalizeCartLines(cart));
  database
    .prepare("INSERT INTO carts (user_id, payload) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload")
    .run(userId, JSON.stringify(merged));
  const ids = Array.isArray(wishlist) ? wishlist.map(String).slice(0, 40) : [];
  for (const productId of ids) {
    if (!getProductById(productId)) continue;
    database.prepare("INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)").run(userId, productId);
  }
  const savedWishlist = database.prepare("SELECT product_id FROM wishlist_items WHERE user_id = ?").all(userId) as { product_id: string }[];
  return { cart: toCartItems(merged), wishlist: savedWishlist.map((item) => item.product_id) };
}
