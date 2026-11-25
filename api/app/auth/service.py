"""Account actions. A port of src/app/api/auth/route.ts: same rules, messages and status codes."""

import json
import re
import uuid
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app import cart
from app.auth.sessions import create_session, destroy_session, now_ms
from app.catalogue import get_product
from app.core import js
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import fail
from app.core.security import hash_password, hash_token, new_token, password_error, verify_password
from app.core.text import clean, dumps, raw_string
from app.email import password_reset_email, send_email

_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_dummy_hash: str | None = None


def email_ok(email: str) -> bool:
    return bool(_EMAIL.match(email)) and len(email) <= 120


async def _dummy() -> str:
    # Compared against when the email is unknown, so a miss takes as long as a wrong password.
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = await hash_password("not-a-real-password")
    return _dummy_hash


async def public_user(user_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        return await (
            await conn.execute(
                "SELECT id, email, name, phone, company, role FROM users WHERE id = %s AND role = 'customer'",
                (user_id,),
            )
        ).fetchone()


async def _persist_guest(user_id: str, guest_cart: Any, wishlist: Any) -> dict[str, Any]:
    async with connection() as conn:
        row = await (await conn.execute("SELECT payload FROM carts WHERE user_id = %s", (user_id,))).fetchone()
        saved: list[dict[str, Any]] = []
        if row:
            try:
                saved = cart.normalize_cart_lines(json.loads(row["payload"]))
            except ValueError:
                saved = []
        merged = cart.merge_cart_lines(saved, cart.normalize_cart_lines(guest_cart))
        await conn.execute(
            """INSERT INTO carts (user_id, payload) VALUES (%s, %s)
               ON CONFLICT (user_id) DO UPDATE SET payload = excluded.payload""",
            (user_id, dumps(merged)),
        )
        ids = [js.string(item) for item in wishlist[:40]] if isinstance(wishlist, list) else []
        for product_id in ids:
            if get_product(product_id):
                await conn.execute(
                    "INSERT INTO wishlist_items (user_id, product_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (user_id, product_id),
                )
        rows = await (
            await conn.execute("SELECT product_id FROM wishlist_items WHERE user_id = %s", (user_id,))
        ).fetchall()
    return {"cart": cart.to_cart_items(merged), "wishlist": [r["product_id"] for r in rows]}


async def _signed_in(response: Response, user_id: str, body: dict[str, Any]) -> JSONResponse:
    await create_session(response, user_id)
    merged = await _persist_guest(user_id, body.get("cart"), body.get("wishlist"))
    out = JSONResponse({"ok": True, "user": await public_user(user_id), **merged})
    for header in response.headers.getlist("set-cookie"):
        out.headers.append("set-cookie", header)
    return out


async def register(body: dict[str, Any]) -> JSONResponse:
    name = clean(body.get("name"), 80)
    email = clean(body.get("email"), 120).lower()
    password = raw_string(body.get("password"))
    if len(name) < 2:
        return fail(400, errors={"name": "Enter your name."})
    if not email_ok(email):
        return fail(400, errors={"email": "Enter a valid email address."})
    if message := password_error(password):
        return fail(400, errors={"password": message})
    user_id = str(uuid.uuid4())
    password_hash = await hash_password(password)
    async with connection() as conn:
        created = await conn.execute(
            """INSERT INTO users (id, email, name, password_hash, role, created_at)
               VALUES (%s, %s, %s, %s, 'customer', %s) ON CONFLICT (email) DO NOTHING""",
            (user_id, email, name, password_hash, datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"),
        )
    if created.rowcount == 0:
        return fail(409, errors={"email": "An account with that email already exists."})
    return await _signed_in(Response(), user_id, body)


async def login(body: dict[str, Any]) -> JSONResponse:
    email = clean(body.get("email"), 120).lower()
    password = raw_string(body.get("password"))
    async with connection() as conn:
        row = await (
            await conn.execute("SELECT id, password_hash, role FROM users WHERE email = %s", (email,))
        ).fetchone()
    valid = await verify_password(password, row["password_hash"] if row else await _dummy())
    if not row or not valid or row["role"] != "customer":
        return fail(401, "Email or password is incorrect.")
    return await _signed_in(Response(), row["id"], body)


async def _store_reset(user_id: str) -> str:
    token = new_token()
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO password_resets (token_hash, user_id, expires_at, used_at) VALUES (%s, %s, %s, NULL)",
            (hash_token(token), user_id, now_ms() + 30 * 60 * 1000),
        )
    return token


async def forgot(body: dict[str, Any]) -> JSONResponse:
    settings = get_settings()
    email = clean(body.get("email"), 120).lower()
    if not email_ok(email):
        return fail(400, errors={"email": "Enter a valid email address."})
    async with connection() as conn:
        row = await (await conn.execute("SELECT id FROM users WHERE email = %s", (email,))).fetchone()
    if settings.email_configured:
        if row:
            token = await _store_reset(row["id"])
            await send_email(email, password_reset_email(f"{settings.site_url}/reset-password?token={quote(token)}"))
        # Same answer whether or not the account exists, so addresses can't be probed.
        return JSONResponse(
            {
                "ok": True,
                "delivered": True,
                "message": "If an account uses that email, we've sent a link to reset the password. "
                "It expires in 30 minutes.",
            }
        )
    if settings.environment != "development" or not row:
        return JSONResponse(
            {"ok": True, "delivered": False, "message": "No email service is configured, so a reset link was not sent."}
        )
    token = await _store_reset(row["id"])
    return JSONResponse(
        {
            "ok": True,
            "delivered": False,
            "message": "Local development only. This link was not emailed.",
            "resetPath": f"/reset-password?token={quote(token)}",
        }
    )


async def reset(body: dict[str, Any]) -> JSONResponse:
    token = clean(body.get("token"), 200)
    password = raw_string(body.get("password"))
    message = password_error(password)
    if not token:
        return fail(400, "This reset link is missing or expired.")
    if message:
        return fail(400, errors={"password": message})
    token_hash = hash_token(token)
    password_hash = await hash_password(password)
    async with connection() as conn:
        # Claimed in one statement, so a link can't be used twice at once.
        row = await (
            await conn.execute(
                """UPDATE password_resets SET used_at = %s
                   WHERE token_hash = %s AND used_at IS NULL AND expires_at >= %s RETURNING user_id""",
                (now_ms(), token_hash, now_ms()),
            )
        ).fetchone()
        if not row:
            return fail(400, "This reset link is missing or expired.")
        await conn.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, row["user_id"]))
        await conn.execute("DELETE FROM sessions WHERE user_id = %s", (row["user_id"],))
    return JSONResponse({"ok": True})


async def logout(request: Request) -> JSONResponse:
    out = JSONResponse({"ok": True})
    await destroy_session(request, out)
    return out
