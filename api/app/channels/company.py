"""Company reorder accounts: a port of src/lib/company/store.ts and /api/company.

Colleagues share a company account (owners and buyers) and its reorder lists. Lists are re-priced
from today's catalogue whenever they are read; retired products drop out.
"""

import json
import re
import secrets
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from psycopg.errors import UniqueViolation

from app import cart
from app.auth.sessions import read_session
from app.catalogue import get_product
from app.channels.distributors import GSTIN_RE
from app.commerce.store import now_iso
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.text import clean, dumps, json_body

router = APIRouter(tags=["company"])

MAX_LISTS = 30
MAX_MEMBERS = 50
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _company(row: dict[str, Any]) -> dict[str, Any]:
    return {"id": row["id"], "name": row["name"], "gstin": row["gstin"], "billingAddress": row["billing_address"],
            "createdAt": row["created_at"]}  # fmt: skip


async def membership(conn: Any, email: str) -> dict[str, Any] | None:
    row = await (
        await conn.execute(
            "SELECT c.*, m.role FROM company_members m JOIN companies c ON c.id = m.company_id WHERE m.email = %s",
            (email.strip().lower(),),
        )
    ).fetchone()
    return {"company": _company(row), "role": row["role"]} if row else None


async def members(conn: Any, company_id: str) -> list[dict[str, Any]]:
    rows = await (
        await conn.execute(
            "SELECT email, role, added_by, added_at FROM company_members WHERE company_id = %s "
            "ORDER BY role DESC, added_at",
            (company_id,),
        )
    ).fetchall()
    return [{"email": r["email"], "role": r["role"], "addedBy": r["added_by"], "addedAt": r["added_at"]} for r in rows]


def _list(row: dict[str, Any]) -> dict[str, Any]:
    raw = json.loads(row["lines"])
    lines = []
    for line in cart.normalize_cart_lines(raw):
        product = get_product(line["productId"])
        assert product is not None
        lines.append({**line, "name": product["name"], "sku": product["sku"], "unitPrice": product["price"]})
    return {"id": row["id"], "name": row["name"], "lines": lines, "droppedLines": len(raw) - len(lines),
            "total": sum(line["unitPrice"] * line["quantity"] for line in lines), "source": row["source"],
            "createdBy": row["created_by"], "createdAt": row["created_at"]}  # fmt: skip


@router.get("/api/company", summary="The signed-in account's company, colleagues and reorder lists")
async def overview(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to manage your company account.")
    async with connection() as conn:
        mine = await membership(conn, user["email"])
        if not mine:
            return JSONResponse({"ok": True, "membership": None})
        lists = await (
            await conn.execute(
                "SELECT * FROM reorder_lists WHERE company_id = %s ORDER BY created_at DESC", (mine["company"]["id"],)
            )
        ).fetchall()
        people = await members(conn, mine["company"]["id"])
    return JSONResponse({"ok": True, "membership": mine, "members": people, "lists": [_list(r) for r in lists]})


@router.post("/api/company", summary="create / add-member / remove-member / set-role / save-list / delete-list")
async def act(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to manage your company account.")
    body = await json_body(request) or {}
    action, me = body.get("action"), user["email"].strip().lower()

    if action == "create":
        name = clean(body.get("name"), 100)
        gstin = re.sub(r"\s", "", clean(body.get("gstin"), 15).upper())
        billing = clean(body.get("billingAddress"), 300)
        if len(name) < 2:
            return fail(400, "Enter your company name.")
        if gstin and not GSTIN_RE.match(gstin):
            return fail(400, "Enter a valid 15-character GSTIN, or leave it blank.")
        async with connection() as conn:
            existing = await membership(conn, me)
            if existing:
                return fail(409, f"You're already part of {existing['company']['name']}.")
            company_id = f"CO-{secrets.token_hex(4).upper()}"
            now = now_iso()
            await conn.execute(
                "INSERT INTO companies (id, name, gstin, billing_address, created_by, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (company_id, name, gstin, billing, me, now),
            )
            try:
                await conn.execute(
                    "INSERT INTO company_members (email, company_id, role, added_by, added_at) "
                    "VALUES (%s, %s, 'owner', %s, %s)",
                    (me, company_id, me, now),
                )
            except UniqueViolation:
                await conn.rollback()  # created twice at once: keep the first
                return fail(409, "You're already part of a company account.")
        return JSONResponse({"ok": True})

    async with connection() as conn:
        mine = await membership(conn, me)
    if not mine:
        return fail(403, "You're not part of a company account.")
    company_id, is_owner = mine["company"]["id"], mine["role"] == "owner"

    if action in ("add-member", "remove-member", "set-role"):
        if not is_owner:
            return fail(403, "Only company owners can manage people.")
        email = clean(body.get("email"), 120).lower()
        if not EMAIL_RE.match(email):
            return fail(400, "Enter a valid email address.")
        async with connection() as conn:
            # One change to a company's people at a time, so the last owner can't be removed twice over.
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"company:{company_id}",))
            people = await members(conn, company_id)
            member = next((m for m in people if m["email"] == email), None)
            owners = sum(1 for m in people if m["role"] == "owner")
            if action == "add-member":
                role = body.get("role") if body.get("role") in ("owner", "buyer") else "buyer"
                other = await membership(conn, email)
                if other:
                    return fail(409, f"{email} is already in your company." if other["company"]["id"] == company_id
                                else f"{email} already belongs to another company account.")  # fmt: skip
                if len(people) >= MAX_MEMBERS:
                    return fail(409, f"A company can have up to {MAX_MEMBERS} people.")
                try:
                    await conn.execute(
                        "INSERT INTO company_members (email, company_id, role, added_by, added_at) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (email, company_id, role, me, now_iso()),
                    )
                except UniqueViolation:
                    await conn.rollback()
                    return fail(409, f"{email} already belongs to another company account.")
                return JSONResponse({"ok": True})
            if action == "set-role" and body.get("role") not in ("owner", "buyer"):
                return fail(400, "Choose owner or buyer.")
            if not member:
                return fail(409, "That person isn't in your company.")
            if action == "set-role":
                if member["role"] == "owner" and body["role"] != "owner" and owners == 1:
                    return fail(409, "A company needs at least one owner.")
                await conn.execute(
                    "UPDATE company_members SET role = %s WHERE email = %s AND company_id = %s",
                    (body["role"], email, company_id),
                )
                return JSONResponse({"ok": True})
            if member["role"] == "owner" and owners == 1:
                return fail(409, "A company needs at least one owner. Make someone else an owner first.")
            await conn.execute("DELETE FROM company_members WHERE email = %s AND company_id = %s", (email, company_id))
        return JSONResponse({"ok": True})

    if action == "save-list":
        name = clean(body.get("name"), 80)
        if len(name) < 2:
            return fail(400, 'Give the list a name, such as "Branch office standard".')
        lines: Any = body.get("lines")
        source = "Saved from cart"
        if isinstance(body.get("orderId"), str):
            async with connection() as conn:
                order = await (
                    await conn.execute("SELECT user_id, items FROM demo_orders WHERE id = %s", (body["orderId"],))
                ).fetchone()
            # Only orders placed while signed in to this account: guest orders can't be claimed by email.
            if not order or not order["user_id"] or order["user_id"] != user["id"]:
                return fail(404, "That order wasn't found in your account.")
            lines = [{"productId": i["productId"], "quantity": min(i["quantity"], 99),
                      **({"configuration": i["configuration"]} if "configuration" in i else {})}
                     for i in json.loads(order["items"])]  # fmt: skip
            source = f"Saved from order {body['orderId']}"
        normalized = cart.normalize_cart_lines(lines)
        if not normalized:
            return fail(400, "There's nothing to save: the list has no catalogue products.")
        async with connection() as conn:
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"lists:{company_id}",))
            count = (await (await conn.execute("SELECT COUNT(*) AS n FROM reorder_lists WHERE company_id = %s",
                                               (company_id,))).fetchone())["n"]  # fmt: skip
            if count >= MAX_LISTS:
                return fail(400, f"A company can keep up to {MAX_LISTS} lists. Delete one first.")
            list_id = f"RL-{secrets.token_hex(4).upper()}"
            await conn.execute(
                "INSERT INTO reorder_lists (id, company_id, name, lines, source, created_by, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (list_id, company_id, name, dumps(normalized), source, me, now_iso()),
            )
        return JSONResponse({"ok": True, "id": list_id})

    if action == "delete-list":
        if not is_owner:
            return fail(403, "Only company owners can delete shared lists.")
        async with connection() as conn:
            deleted = await conn.execute(
                "DELETE FROM reorder_lists WHERE id = %s AND company_id = %s",
                (clean(body.get("listId"), 20), company_id),
            )
        return JSONResponse({"ok": True}) if deleted.rowcount else fail(404, "That list wasn't found.")

    return fail(400, "Unknown action.")
