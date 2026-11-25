"""Account data. A port of src/app/api/account/route.ts: same rules, messages and status codes."""

import json
import re
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi.responses import JSONResponse

from app import cart
from app.auth.sessions import create_session
from app.catalogue import get_product
from app.core import js
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import fail
from app.core.ratelimit import allow_attempt
from app.core.security import hash_password, password_error, verify_password
from app.core.text import clean, dumps, raw_string
from app.orders import orders_for_user

_POSTAL = re.compile(r"[A-Za-z0-9][A-Za-z0-9 -]{2,11}")
_NOT_DIGIT = re.compile(r"\D")
NOT_IN_CATALOGUE = "That product is not in the catalogue."


def _now_iso() -> str:
    """new Date().toISOString()"""
    return datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"


async def overview(user: dict[str, Any]) -> JSONResponse:
    mode = get_settings().commerce_mode
    async with connection() as conn:

        async def rows(sql: str) -> list[dict[str, Any]]:
            return await (await conn.execute(sql, (user["id"],))).fetchall()

        addresses = await rows("SELECT id, line, city, state, postal, country FROM addresses WHERE user_id = %s")
        wishlist = [r["product_id"] for r in await rows("SELECT product_id FROM wishlist_items WHERE user_id = %s")]
        configurations = await rows(
            "SELECT id, name, product_id, payload, created_at FROM saved_configs WHERE user_id = %s "
            "ORDER BY created_at DESC"
        )
        quotes = await rows(
            "SELECT reference, summary, created_at FROM customer_quotes WHERE user_id = %s ORDER BY created_at DESC"
        )
        cart_rows = await rows("SELECT payload FROM carts WHERE user_id = %s")
        orders = await orders_for_user(conn, user["id"]) if mode == "demo" else []
    items: list[dict[str, Any]] = []
    if cart_rows:
        try:
            items = cart.to_cart_items(cart.normalize_cart_lines(json.loads(cart_rows[0]["payload"])))
        except ValueError:
            items = []
    return JSONResponse(
        {
            "ok": True,
            "user": user,
            "addresses": addresses,
            "wishlist": wishlist,
            "configurations": configurations,
            "quotes": quotes,
            "cart": items,
            "orders": orders,
            "ordersAvailable": mode == "demo",
            "ordersMode": mode,
        }
    )


async def profile(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    name = clean(body.get("name"), 80)
    phone = clean(body.get("phone"), 20)
    company = clean(body.get("company"), 80)
    if len(name) < 2:
        return fail(400, errors={"name": "Enter your name."})
    digits = len(_NOT_DIGIT.sub("", phone))
    if phone and not 8 <= digits <= 15:
        return fail(400, errors={"phone": "Enter a phone number with 8 to 15 digits."})
    async with connection() as conn:
        await conn.execute(
            "UPDATE users SET name = %s, phone = %s, company = %s WHERE id = %s AND role = 'customer'",
            (name, phone, company, user["id"]),
        )
    return JSONResponse({"ok": True})


async def password(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    # New in MIG-002: a stolen session can't be used to guess the current password.
    if not await allow_attempt(f"account-password:{user['id']}", 8, 10 * 60 * 1000):
        return fail(429, "Too many attempts. Wait a few minutes and try again.")
    current, new = raw_string(body.get("current")), raw_string(body.get("next"))
    async with connection() as conn:
        row = await (await conn.execute("SELECT password_hash FROM users WHERE id = %s", (user["id"],))).fetchone()
    if not row or not await verify_password(current, row["password_hash"]):
        return fail(400, errors={"current": "The current password is incorrect."})
    if message := password_error(new):
        return fail(400, errors={"next": message})
    password_hash = await hash_password(new)
    async with connection() as conn:
        await conn.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, user["id"]))
        # Signs out every other device; this one gets a fresh session below.
        await conn.execute("DELETE FROM sessions WHERE user_id = %s", (user["id"],))
    out = JSONResponse({"ok": True})
    await create_session(out, user["id"])
    return out


async def address(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    line = clean(body.get("line"), 120)
    city = clean(body.get("city"), 60)
    state = clean(body.get("state"), 60)
    postal = clean(body.get("postal"), 12)
    country = clean(body.get("country"), 60)
    if len(line) < 4 or len(city) < 2 or len(state) < 2 or len(country) < 2 or not _POSTAL.fullmatch(postal):
        return fail(400, "Enter a complete address.")
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO addresses (id, user_id, line, city, state, postal, country) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), user["id"], line, city, state, postal, country),
        )
    return JSONResponse({"ok": True})


async def wishlist_sync(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    raw = body.get("ids")
    ids = [i for i in (clean(v, 80) for v in raw) if get_product(i)][:40] if isinstance(raw, list) else []
    async with connection() as conn:
        # One transaction: a failure can't leave the list half replaced.
        await conn.execute("DELETE FROM wishlist_items WHERE user_id = %s", (user["id"],))
        for product_id in ids:
            # A repeated id used to fail the whole request on the site; now it is stored once.
            await conn.execute(
                "INSERT INTO wishlist_items (user_id, product_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user["id"], product_id),
            )
    return JSONResponse({"ok": True, "wishlist": ids})


async def wishlist(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    product_id = clean(body.get("productId"), 80)
    if not get_product(product_id):
        return fail(400, NOT_IN_CATALOGUE)
    async with connection() as conn:
        if body.get("remove") is True:
            await conn.execute(
                "DELETE FROM wishlist_items WHERE user_id = %s AND product_id = %s", (user["id"], product_id)
            )
        else:
            await conn.execute(
                "INSERT INTO wishlist_items (user_id, product_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user["id"], product_id),
            )
    return JSONResponse({"ok": True})


async def configuration(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    name = clean(body.get("name"), 80)
    product_id = clean(body.get("productId"), 80)
    if len(name) < 2:
        return fail(400, "Name this configuration.")
    if not get_product(product_id):
        return fail(400, NOT_IN_CATALOGUE)
    quantity = js.number(body.get("quantity"))
    entry: dict[str, Any] = {"productId": product_id, "quantity": js.plain(quantity) if js.truthy(quantity) else 1}
    if "configuration" in body:
        entry["configuration"] = body["configuration"]
    lines = cart.normalize_cart_lines([entry])
    if not lines:
        return fail(400, "The configuration could not be saved.")
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO saved_configs (id, name, user_id, product_id, payload, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), name, user["id"], product_id, dumps(lines[0]), _now_iso()),
        )
    return JSONResponse({"ok": True})


async def save_cart(user: dict[str, Any], body: dict[str, Any]) -> JSONResponse:
    lines = cart.normalize_cart_lines(body.get("lines"))
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO carts (user_id, payload) VALUES (%s, %s) "
            "ON CONFLICT (user_id) DO UPDATE SET payload = excluded.payload",
            (user["id"], dumps(lines)),
        )
    return JSONResponse({"ok": True, "cart": cart.to_cart_items(lines)})


async def remove(user: dict[str, Any], kind: str | None, item_id: str | None) -> JSONResponse:
    tables = {"address": "addresses", "configuration": "saved_configs"}
    table = tables.get(kind or "")
    if table is None:
        return fail(400, "Nothing to remove.")
    async with connection() as conn:
        await conn.execute(
            f"DELETE FROM {table} WHERE id = %s AND user_id = %s",  # noqa: S608 - table from a fixed map
            (clean(item_id, 80), user["id"]),
        )
    return JSONResponse({"ok": True})


ACTIONS = {
    "profile": profile,
    "password": password,
    "address": address,
    "wishlist-sync": wishlist_sync,
    "wishlist": wishlist,
    "configuration": configuration,
    "cart": save_cart,
}
