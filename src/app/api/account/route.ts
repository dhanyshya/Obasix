import { randomUUID } from "node:crypto";
import { getProductById } from "@/data/catalogue";
import { normalizeCartLines, toCartItems } from "@/lib/auth/cart";
import { authDatabase } from "@/lib/auth/db";
import { hashPassword, passwordError, verifyPassword } from "@/lib/auth/password";
import { readSession, sameOrigin } from "@/lib/auth/session";
import { commerceMode } from "@/lib/commerce/mode";
import { listDemoOrdersForUser } from "@/lib/commerce/order-store";

export const runtime = "nodejs";

async function customer() {
  const session = await readSession();
  if (!session) return null;
  return session.user;
}

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function GET() {
  const user = await customer();
  if (!user) return Response.json({ ok: false, message: "Sign in to view this account." }, { status: 401 });
  const database = authDatabase();
  const addresses = database.prepare("SELECT id, line, city, state, postal, country FROM addresses WHERE user_id = ?").all(user.id);
  const wishlist = (database.prepare("SELECT product_id FROM wishlist_items WHERE user_id = ?").all(user.id) as { product_id: string }[]).map((item) => item.product_id);
  const configurations = database.prepare("SELECT id, name, product_id, payload, created_at FROM saved_configs WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
  const quotes = database.prepare("SELECT reference, summary, created_at FROM customer_quotes WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
  const cartRow = database.prepare("SELECT payload FROM carts WHERE user_id = ?").get(user.id) as { payload: string } | undefined;
  let cart: ReturnType<typeof toCartItems> = [];
  if (cartRow) {
    try {
      cart = toCartItems(normalizeCartLines(JSON.parse(cartRow.payload)));
    } catch {
      cart = [];
    }
  }
  return Response.json({
    ok: true,
    user,
    addresses,
    wishlist,
    configurations,
    quotes,
    cart,
    orders: commerceMode() === "demo" ? listDemoOrdersForUser(user.id) : [],
    ordersAvailable: commerceMode() === "demo",
    ordersMode: commerceMode(),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, message: "The account request was rejected." }, { status: 403 });
  const user = await customer();
  if (!user) return Response.json({ ok: false, message: "Sign in to change this account." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, message: "The request could not be read." }, { status: 400 });
  const action = new URL(request.url).searchParams.get("action");
  const database = authDatabase();

  if (action === "profile") {
    const name = clean(body.name, 80);
    const phone = clean(body.phone, 20);
    const company = clean(body.company, 80);
    if (name.length < 2) return Response.json({ ok: false, errors: { name: "Enter your name." } }, { status: 400 });
    if (phone && (phone.replace(/\D/g, "").length < 8 || phone.replace(/\D/g, "").length > 15)) {
      return Response.json({ ok: false, errors: { phone: "Enter a phone number with 8 to 15 digits." } }, { status: 400 });
    }
    database.prepare("UPDATE users SET name = ?, phone = ?, company = ? WHERE id = ? AND role = 'customer'").run(name, phone, company, user.id);
    return Response.json({ ok: true });
  }

  if (action === "password") {
    const current = String(body.current ?? "");
    const next = String(body.next ?? "");
    const row = database.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
    if (!(await verifyPassword(current, row.password_hash))) {
      return Response.json({ ok: false, errors: { current: "The current password is incorrect." } }, { status: 400 });
    }
    const message = passwordError(next);
    if (message) return Response.json({ ok: false, errors: { next: message } }, { status: 400 });
    database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), user.id);
    database.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
    const { createSession } = await import("@/lib/auth/session");
    await createSession(user.id);
    return Response.json({ ok: true });
  }

  if (action === "address") {
    const line = clean(body.line, 120);
    const city = clean(body.city, 60);
    const state = clean(body.state, 60);
    const postal = clean(body.postal, 12);
    const country = clean(body.country, 60);
    if (line.length < 4 || city.length < 2 || state.length < 2 || country.length < 2 || !/^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/.test(postal)) {
      return Response.json({ ok: false, message: "Enter a complete address." }, { status: 400 });
    }
    database.prepare("INSERT INTO addresses (id, user_id, line, city, state, postal, country) VALUES (?, ?, ?, ?, ?, ?, ?)").run(randomUUID(), user.id, line, city, state, postal, country);
    return Response.json({ ok: true });
  }

  if (action === "wishlist-sync") {
    const ids = Array.isArray(body.ids) ? body.ids.map((id) => clean(id, 80)).filter((id) => getProductById(id)).slice(0, 40) : [];
    database.prepare("DELETE FROM wishlist_items WHERE user_id = ?").run(user.id);
    for (const productId of ids) {
      database.prepare("INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)").run(user.id, productId);
    }
    return Response.json({ ok: true, wishlist: ids });
  }

  if (action === "wishlist") {
    const productId = clean(body.productId, 80);
    if (!getProductById(productId)) return Response.json({ ok: false, message: "That product is not in the catalogue." }, { status: 400 });
    if (body.remove === true) database.prepare("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?").run(user.id, productId);
    else database.prepare("INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)").run(user.id, productId);
    return Response.json({ ok: true });
  }

  if (action === "configuration") {
    const name = clean(body.name, 80);
    const productId = clean(body.productId, 80);
    if (name.length < 2) return Response.json({ ok: false, message: "Name this configuration." }, { status: 400 });
    if (!getProductById(productId)) return Response.json({ ok: false, message: "That product is not in the catalogue." }, { status: 400 });
    const payload = JSON.stringify(normalizeCartLines([{ productId, quantity: Number(body.quantity) || 1, configuration: body.configuration }])[0] ?? null);
    if (payload === "null") return Response.json({ ok: false, message: "The configuration could not be saved." }, { status: 400 });
    database.prepare("INSERT INTO saved_configs (id, name, user_id, product_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(randomUUID(), name, user.id, productId, payload, new Date().toISOString());
    return Response.json({ ok: true });
  }

  if (action === "cart") {
    const lines = normalizeCartLines(body.lines);
    database.prepare("INSERT INTO carts (user_id, payload) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload").run(user.id, JSON.stringify(lines));
    return Response.json({ ok: true, cart: toCartItems(lines) });
  }

  return Response.json({ ok: false, message: "Unknown account action." }, { status: 404 });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, message: "The account request was rejected." }, { status: 403 });
  const user = await customer();
  if (!user) return Response.json({ ok: false, message: "Sign in to change this account." }, { status: 401 });
  const id = clean(new URL(request.url).searchParams.get("id"), 80);
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind === "address") authDatabase().prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(id, user.id);
  else if (kind === "configuration") authDatabase().prepare("DELETE FROM saved_configs WHERE id = ? AND user_id = ?").run(id, user.id);
  else return Response.json({ ok: false, message: "Nothing to remove." }, { status: 400 });
  return Response.json({ ok: true });
}
