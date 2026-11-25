"""The associate (referral) programme: a port of src/lib/associates/* and its routes.

Associates share a link; a referred customer's paid order earns 5% commission, payable once the
order is delivered. Staff pause associates, pay commissions (with a bank reference) and void them.
"""

import re
import secrets
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.admin import audit
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.auth.sessions import read_session
from app.commerce.store import STATUS_FLOW, now_iso
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.text import clean, json_body

router = APIRouter(tags=["associates"])

PROFESSIONS = [
    "Architect or interior designer",
    "Real estate broker or property consultant",
    "Office fit-out contractor",
    "Facility manager",
    "Signage installer or local service provider",
    "Freelance sales professional",
]
COOKIE = "obasix_ref"
WINDOW_DAYS = 30
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def normalize_code(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(value if value is not None else "").upper())[:12]


def to_associate(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "userId": row["user_id"],
        "code": row["code"],
        "profession": row["profession"],
        "city": row["city"],
        "firm": row["firm"],
        "status": "paused" if row["status"] == "paused" else "active",
        "createdAt": row["created_at"],
    }


async def by_user(user_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        found = await (await conn.execute("SELECT * FROM associates WHERE user_id = %s", (user_id,))).fetchone()
    return to_associate(found) if found else None


async def by_code(code: str) -> dict[str, Any] | None:
    clean_code = normalize_code(code)
    if len(clean_code) < 6:
        return None
    async with connection() as conn:
        found = await (await conn.execute("SELECT * FROM associates WHERE code = %s", (clean_code,))).fetchone()
    return to_associate(found) if found else None


def commission_state(status: str, order_status: str | None) -> str:
    """Payable only once delivered, so returns and cancellations never need clawing back."""
    if status == "paid":
        return "Paid"
    if status == "void" or order_status == "Cancelled" or order_status is None:
        return "Void"
    return "Payable" if order_status == "Delivered" else "Awaiting delivery"


async def commissions(code: str | None = None, limit: int = 500) -> list[dict[str, Any]]:
    where = "WHERE c.code = %s" if code else ""
    async with connection() as conn:
        rows = await (
            await conn.execute(
                f"""SELECT c.*, o.status AS order_status, u.name AS associate_name
                    FROM associate_commissions c
                    LEFT JOIN demo_orders o ON o.id = c.source_id
                    LEFT JOIN associates a ON a.code = c.code
                    LEFT JOIN users u ON u.id = a.user_id
                    {where} ORDER BY c.created_at DESC LIMIT %s""",  # noqa: S608 - fixed fragment
                (*([code] if code else []), limit),
            )
        ).fetchall()
    return [
        {
            "id": r["id"], "orderId": r["source_id"], "baseAmount": r["base_amount"], "amount": r["amount"],
            "rate": r["rate"], "state": commission_state(r["status"], r["order_status"]),
            "orderStatus": r["order_status"] or "Unknown", "createdAt": r["created_at"], "code": r["code"],
            "associateName": r["associate_name"] or "Unknown", "paidAt": r["paid_at"],
            "payoutRef": r["payout_ref"], "voidReason": r["void_reason"],
        }
        for r in rows
    ]  # fmt: skip


async def attributed_quotes(code: str) -> list[dict[str, Any]]:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                "SELECT * FROM associate_quotes WHERE code = %s ORDER BY created_at DESC LIMIT 100", (code,)
            )
        ).fetchall()
    return [{"reference": r["reference"], "customer": r["customer"], "summary": r["summary"],
             "createdAt": r["created_at"]} for r in rows]  # fmt: skip


# ---------- Customer ----------


@router.post("/api/associates", summary="Join the associate programme with the signed-in account")
async def join(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to join the associate programme.")
    existing = await by_user(user["id"])
    if existing:
        return JSONResponse({"ok": True, "associate": existing})
    body = await json_body(request) or {}
    profession, city, firm = body.get("profession"), clean(body.get("city"), 60), clean(body.get("firm"), 80)
    if profession not in PROFESSIONS:
        return fail(400, "Choose the work you do.")
    if len(city) < 2:
        return fail(400, "Enter the city you work in.")
    if body.get("accept") is not True:
        return fail(400, "Accept the programme terms to continue.")
    stem = re.sub(r"[^A-Z]", "", user["name"].upper())[:4].ljust(4, "X")
    async with connection() as conn:
        # One registration per account even if the form is sent twice at once.
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"associate:{user['id']}",))
        existing_row = await (
            await conn.execute("SELECT * FROM associates WHERE user_id = %s", (user["id"],))
        ).fetchone()
        if existing_row:
            return JSONResponse({"ok": True, "associate": to_associate(existing_row)})
        for _ in range(10):
            code = stem + "".join(secrets.choice(ALPHABET) for _ in range(4))
            taken = await (await conn.execute("SELECT 1 FROM associates WHERE code = %s", (code,))).fetchone()
            if not taken:
                break
        else:
            return fail(500, "Could not allocate a referral code.")
        await conn.execute(
            "INSERT INTO associates (user_id, code, profession, city, firm, status, created_at) "
            "VALUES (%s, %s, %s, %s, %s, 'active', %s)",
            (user["id"], code, profession, city, firm, now_iso()),
        )
    return JSONResponse({"ok": True, "associate": await by_user(user["id"])})


@router.post("/api/associates/ref", summary="Remember a referral code from a shared link")
async def remember_referral(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return JSONResponse({"ok": False}, status_code=403)
    body = await json_body(request) or {}
    associate = await by_code(normalize_code(body.get("code")))
    if not associate or associate["status"] != "active":
        return JSONResponse({"ok": False}, status_code=404)
    current = request.cookies.get(COOKIE)
    # First valid referral wins for the whole window: a later link can't take over the customer.
    if current and await by_code(current):
        return JSONResponse({"ok": True, "kept": True})
    response = JSONResponse({"ok": True, "kept": False})
    response.set_cookie(COOKIE, associate["code"], max_age=WINDOW_DAYS * 24 * 60 * 60, path="/", httponly=True,
                        samesite="lax", secure=get_settings().production)  # fmt: skip
    return response


@router.get("/api/associates/me", summary="The signed-in associate's dashboard")
async def dashboard(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to see your associate dashboard.")
    associate = await by_user(user["id"])
    if not associate:
        return fail(404, "This account hasn't joined the associate programme.")
    own = await commissions(associate["code"], 200)
    return JSONResponse({"ok": True, "associate": associate, "commissions": own,
                         "quotes": await attributed_quotes(associate["code"])})  # fmt: skip


# ---------- Staff ----------


@router.get("/api/admin/associates", summary="Associates with their referred sales and commission totals")
async def staff_associates(_: Annotated[Staff, Depends(require(Permission.ASSOCIATES_READ))]) -> JSONResponse:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                "SELECT a.*, u.name, u.email, u.phone FROM associates a JOIN users u ON u.id = a.user_id "
                "ORDER BY a.created_at DESC"
            )
        ).fetchall()
    every = await commissions(None, 5000)
    items = []
    for r in rows:
        own = [c for c in every if c["code"] == r["code"]]
        live = [c for c in own if c["state"] != "Void"]

        def total(state: str, entries: list[dict[str, Any]] = own) -> int:
            return sum(c["amount"] for c in entries if c["state"] == state)

        items.append({
            **to_associate(r), "name": r["name"], "email": r["email"], "phone": r["phone"],
            "orders": len(live), "referredSales": sum(c["baseAmount"] for c in live),
            "awaiting": total("Awaiting delivery"), "payable": total("Payable"), "paid": total("Paid"),
            "quotes": len(await attributed_quotes(r["code"])),
        })  # fmt: skip
    return JSONResponse({"ok": True, "items": items})


@router.get("/api/admin/commissions", summary="Commissions, newest first, with their payout state")
async def staff_commissions(_: Annotated[Staff, Depends(require(Permission.ASSOCIATES_READ))]) -> JSONResponse:
    return JSONResponse({"ok": True, "items": await commissions(None, 500)})


@router.post("/api/admin/associates", summary="pause / activate / pay / void / advance-order (demo)")
async def staff_action(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)  # Same answer as a missing route, so the endpoint isn't advertised.
    if not staff.can(Permission.ASSOCIATES_WRITE):
        return fail(403, "You don't have permission to do that.")
    body = await json_body(request) or {}
    action = clean(body.get("action"), 30)

    if action in ("pause", "activate"):
        code = normalize_code(clean(body.get("code"), 12))
        status = "paused" if action == "pause" else "active"
        async with connection() as conn:
            changed = await conn.execute("UPDATE associates SET status = %s WHERE code = %s", (status, code))
            if changed.rowcount:
                await audit.record(conn, request, staff, f"associate.{action}", "associate", code, {"after": status})
        return JSONResponse({"ok": True}) if changed.rowcount else fail(404, "No associate has that code.")

    if action == "pay":
        raw = body.get("ids")
        ids = [i for i in (clean(x, 20) for x in raw) if i][:200] if isinstance(raw, list) else []
        payout_ref = clean(body.get("payoutRef"), 60)
        if not ids:
            return fail(400, "Select at least one payable commission.")
        if len(payout_ref) < 3:
            return fail(400, "Enter the bank transfer or UTR reference for this payout.")
        payable = {c["id"] for c in await commissions(None, 5000) if c["state"] == "Payable"}
        paid, skipped = [], []
        async with connection() as conn:
            for commission_id in ids:
                changed = (
                    await conn.execute(
                        "UPDATE associate_commissions SET status = 'paid', paid_at = %s, payout_ref = %s "
                        "WHERE id = %s AND status = 'pending'",
                        (now_iso(), payout_ref, commission_id),
                    )
                    if commission_id in payable
                    else None
                )
                (paid if changed is not None and changed.rowcount else skipped).append(commission_id)
            if paid:
                await audit.record(conn, request, staff, "commission.pay", "payout", payout_ref, {"ids": paid})
        return JSONResponse({"ok": True, "paid": paid, "skipped": skipped})

    if action == "void":
        reason = clean(body.get("reason"), 200)
        if len(reason) < 3:
            return fail(400, "Give a reason for voiding this commission.")
        commission_id = clean(body.get("id"), 20)
        async with connection() as conn:
            changed = await conn.execute(
                "UPDATE associate_commissions SET status = 'void', void_reason = %s "
                "WHERE id = %s AND status = 'pending'",
                (reason, commission_id),
            )
            if changed.rowcount:
                await audit.record(conn, request, staff, "commission.void", "commission", commission_id,
                                   {"reason": reason})  # fmt: skip
        return JSONResponse({"ok": True}) if changed.rowcount else fail(409, "Only unpaid commissions can be voided.")

    if action == "advance-order":
        if get_settings().commerce_mode != "demo":
            return fail(409, "Order status is managed by the order system.")
        order_id = clean(body.get("orderId"), 40)
        async with connection() as conn:
            order = await (
                await conn.execute("SELECT status FROM demo_orders WHERE id = %s FOR UPDATE", (order_id,))
            ).fetchone()
            if not order:
                return fail(404, "No order has that reference.")
            position = STATUS_FLOW.index(order["status"]) if order["status"] in STATUS_FLOW else -1
            following = STATUS_FLOW[min(position + 1, len(STATUS_FLOW) - 1)]
            await conn.execute("UPDATE demo_orders SET status = %s WHERE id = %s", (following, order_id))
            await audit.record(conn, request, staff, "order.advance", "order", order_id,
                               {"before": order["status"], "after": following, "demo": True})  # fmt: skip
        return JSONResponse({"ok": True, "status": following})

    return fail(400, "Unknown action.")
