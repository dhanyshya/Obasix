"""Distributors: a port of src/lib/distributors/* and its routes.

A distributor is a customer account with an approved profile. Trade orders are priced at the tier
discount, kept apart from retail orders, and never earn associate commission.
"""

import json
import re
import secrets
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.admin import audit
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.auth.sessions import read_session
from app.catalogue import get_product
from app.commerce.store import now_iso
from app.core import js
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.money import format_inr
from app.core.text import clean, json_body

router = APIRouter(tags=["distributors"])

TIERS = {"silver": 0.18, "gold": 0.23, "platinum": 0.28}
MINIMUM_TRADE_ORDER = 15000
BUSINESS_TYPES = [
    "Stationery or office supplies dealer",
    "Furniture or interiors dealer",
    "School and institutional supplier",
    "Signage or printing business",
    "Regional wholesaler",
    "Other",
]
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
NEXT_STATUS = {"Confirmed": "Dispatched", "Dispatched": "Delivered"}


def tier_id(value: str) -> str:
    return value if value in TIERS else "silver"


def trade_price(list_price: float, discount: float) -> int:
    return js.round_half_up(list_price * (1 - discount))


def financial_quarter(now: datetime) -> tuple[datetime, datetime, str]:
    """Indian financial-year quarter (Q1 = April to June), in the server's local time, as the site computes it."""
    local = now.astimezone()
    month = local.month - 1
    fy_start = local.year if month >= 3 else local.year - 1
    quarter = ((month + 9) % 12) // 3 + 1
    start_month = 3 + (quarter - 1) * 3
    start = local.replace(year=fy_start + start_month // 12, month=start_month % 12 + 1, day=1, hour=0, minute=0,
                          second=0, microsecond=0)  # fmt: skip
    end_month = start_month + 3
    end = start.replace(year=fy_start + end_month // 12, month=end_month % 12 + 1)
    return start, end, f"Q{quarter} FY{str(fy_start + 1)[-2:]}"


def to_distributor(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "userId": row["user_id"], "businessName": row["business_name"], "businessType": row["business_type"],
        "gstin": row["gstin"], "city": row["city"], "state": row["state"],
        "territoryRequest": row["territory_request"], "notes": row["notes"], "status": row["status"],
        "tier": tier_id(row["tier"]), "territory": row["territory"], "creditLimit": row["credit_limit"],
        "quarterlyTarget": row["quarterly_target"], "reviewDate": row["review_date"], "decidedAt": row["decided_at"],
        "decidedBy": row["decided_by"], "decisionNote": row["decision_note"], "createdAt": row["created_at"],
    }  # fmt: skip


def to_trade_order(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"], "userId": row["user_id"], "items": json.loads(row["items"]),
        "listSubtotal": row["list_subtotal"], "discountRate": row["discount_rate"], "netTotal": row["net_total"],
        "paymentTerms": row["payment_terms"], "status": row["status"], "reference": row["reference"],
        "createdAt": row["created_at"], "paidAt": row["paid_at"], "paymentRef": row["payment_ref"],
        "updatedBy": row["updated_by"],
    }  # fmt: skip


async def find(user_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        row = await (await conn.execute("SELECT * FROM distributors WHERE user_id = %s", (user_id,))).fetchone()
    return to_distributor(row) if row else None


async def trade_orders(user_id: str) -> list[dict[str, Any]]:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                "SELECT * FROM distributor_orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 100", (user_id,)
            )
        ).fetchall()
    return [to_trade_order(r) for r in rows]


def credit_used(orders: list[dict[str, Any]]) -> int:
    """Unpaid credit orders that haven't been cancelled."""
    return sum(o["netTotal"] for o in orders
               if o["paymentTerms"] == "credit" and not o["paidAt"] and o["status"] != "Cancelled")  # fmt: skip


def quarter_purchases(orders: list[dict[str, Any]], now: datetime | None = None) -> int:
    start, end, _ = financial_quarter(now or datetime.now(UTC))
    total = 0
    for o in orders:
        if o["status"] == "Cancelled":
            continue
        at = datetime.fromisoformat(o["createdAt"].replace("Z", "+00:00"))
        if start <= at < end:
            total += o["netTotal"]
    return total


# ---------- Customer ----------


@router.post("/api/distributors", summary="Apply to become a distributor")
async def apply(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to apply.")
    existing = await find(user["id"])
    if existing and existing["status"] != "rejected":
        return JSONResponse({"ok": True, "distributor": existing})
    body = await json_body(request) or {}
    business_name = clean(body.get("businessName"), 100)
    business_type = body.get("businessType")
    gstin = re.sub(r"\s", "", clean(body.get("gstin"), 15).upper())
    city, state = clean(body.get("city"), 60), clean(body.get("state"), 60)
    territory_request, notes = clean(body.get("territoryRequest"), 200), clean(body.get("notes"), 1000)
    if len(business_name) < 2:
        return fail(400, "Enter your registered business name.")
    if business_type not in BUSINESS_TYPES:
        return fail(400, "Choose your type of business.")
    if not GSTIN_RE.match(gstin):
        return fail(400, "Enter a valid 15-character GSTIN.")
    if len(city) < 2 or len(state) < 2:
        return fail(400, "Enter your city and state.")
    if len(territory_request) < 2:
        return fail(400, "Tell us which area you want to cover.")
    if body.get("accept") is not True:
        return fail(400, "Accept the distributor terms to apply.")
    async with connection() as conn:
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"distributor:{user['id']}",))
        current = await (
            await conn.execute("SELECT status FROM distributors WHERE user_id = %s", (user["id"],))
        ).fetchone()
        if not current or current["status"] == "rejected":
            # A re-application replaces the rejected one, so tier, credit and notes start fresh.
            await conn.execute("DELETE FROM distributors WHERE user_id = %s", (user["id"],))
            await conn.execute(
                """INSERT INTO distributors (user_id, business_name, business_type, gstin, city, state,
                     territory_request, notes, status, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)""",
                (user["id"], business_name, business_type, gstin, city, state, territory_request, notes, now_iso()),
            )
    return JSONResponse({"ok": True, "distributor": await find(user["id"])})


@router.get("/api/distributors/me", summary="The signed-in distributor's profile, credit and trade orders")
async def me(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to see your distributor account.")
    distributor = await find(user["id"])
    if not distributor:
        return fail(404, "This account hasn't applied to be a distributor.")
    orders = await trade_orders(user["id"])
    _, _, label = financial_quarter(datetime.now(UTC))
    used = credit_used(orders)
    return JSONResponse({
        "ok": True, "distributor": distributor, "orders": orders, "discount": TIERS[distributor["tier"]],
        "creditUsed": used, "creditAvailable": max(distributor["creditLimit"] - used, 0),
        "quarter": label, "quarterPurchases": quarter_purchases(orders),
    })  # fmt: skip


@router.post("/api/distributors/orders", summary="Place a trade order (Idempotency-Key header)")
async def place(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to place a trade order.")
    key = clean(request.headers.get("idempotency-key"), 80)
    if len(key) < 8:
        return fail(400, "A trade order needs an idempotency key so a retry can't create a second order.")
    body = await json_body(request) or {}
    terms = body.get("paymentTerms") if body.get("paymentTerms") in ("credit", "advance") else None
    if not terms:
        return fail(400, "Choose credit or advance payment.")
    scoped_key = f"{user['id']}:{key}"
    async with connection() as conn:
        # One trade order at a time per distributor, so credit can't be overspent by two at once.
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"trade:{user['id']}",))
        replay = await (
            await conn.execute("SELECT * FROM distributor_orders WHERE idempotency_key = %s", (scoped_key,))
        ).fetchone()
        if replay:
            return JSONResponse({"ok": True, "order": to_trade_order(replay)})
        row = await (await conn.execute("SELECT * FROM distributors WHERE user_id = %s", (user["id"],))).fetchone()
        distributor = to_distributor(row) if row else None
        if not distributor or distributor["status"] != "approved":
            return fail(422, "Trade ordering opens once your distributor account is approved.")
        discount = TIERS[distributor["tier"]]
        merged: dict[str, int] = {}
        raw_lines = body.get("lines")
        for raw in raw_lines[:60] if isinstance(raw_lines, list) else []:
            line = raw if isinstance(raw, dict) else {}
            product = get_product(js.string(line["productId"]) if line.get("productId") is not None else "")
            quantity = js.number(line.get("quantity"))
            if not product or product["price"] <= 0 or quantity != int(quantity) or not 1 <= quantity <= 5000:
                continue
            merged[product["id"]] = merged.get(product["id"], 0) + int(quantity)
        if not merged:
            return fail(422, "Add at least one catalogue product with a quantity.")
        items = []
        for product_id, quantity in merged.items():
            product = get_product(product_id)
            assert product is not None
            unit = trade_price(product["price"], discount)
            items.append({"productId": product_id, "name": product["name"], "sku": product["sku"],
                          "quantity": quantity, "listPrice": product["price"], "tradePrice": unit,
                          "lineTotal": unit * quantity})  # fmt: skip
        list_subtotal = sum(i["listPrice"] * i["quantity"] for i in items)
        net_total = sum(i["lineTotal"] for i in items)
        if net_total < MINIMUM_TRADE_ORDER:
            return fail(422, f"The minimum trade order is {format_inr(MINIMUM_TRADE_ORDER)} at trade price.")
        if terms == "credit":
            existing = await (
                await conn.execute("SELECT * FROM distributor_orders WHERE user_id = %s", (user["id"],))
            ).fetchall()
            available = distributor["creditLimit"] - credit_used([to_trade_order(r) for r in existing])
            if net_total > available:
                return fail(422, f"This order is more than your available credit of {format_inr(max(available, 0))}. "
                                 "Choose advance payment or reduce the order.")  # fmt: skip
        order_id = f"OBX-TRADE-{secrets.token_hex(4).upper()}"
        await conn.execute(
            """INSERT INTO distributor_orders (id, user_id, idempotency_key, items, list_subtotal, discount_rate,
                 net_total, payment_terms, status, reference, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (order_id, user["id"], scoped_key, json.dumps(items, separators=(",", ":"), ensure_ascii=False),
             list_subtotal, discount, net_total, terms, "Confirmed" if terms == "credit" else "Awaiting payment",
             clean(body.get("reference"), 60), now_iso()),
        )  # fmt: skip
        created = await (await conn.execute("SELECT * FROM distributor_orders WHERE id = %s", (order_id,))).fetchone()
    return JSONResponse({"ok": True, "order": to_trade_order(created)})


# ---------- Staff ----------


@router.get(
    "/api/admin/distributors", summary="Applications and distributors, pending first, with credit and purchases"
)
async def staff_list(_: Annotated[Staff, Depends(require(Permission.DISTRIBUTORS_READ))]) -> JSONResponse:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                """SELECT d.*, u.name, u.email, u.phone FROM distributors d JOIN users u ON u.id = d.user_id
                   ORDER BY CASE d.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'suspended' THEN 2
                   ELSE 3 END, d.created_at DESC"""
            )
        ).fetchall()
    items = []
    for r in rows:
        orders = await trade_orders(r["user_id"])
        items.append({**to_distributor(r), "name": r["name"], "email": r["email"], "phone": r["phone"],
                      "creditUsed": credit_used(orders), "quarterPurchases": quarter_purchases(orders),
                      "orderCount": len(orders)})  # fmt: skip
    return JSONResponse({"ok": True, "items": items})


@router.get("/api/admin/trade-orders", summary="Trade orders, newest first")
async def staff_trade_orders(_: Annotated[Staff, Depends(require(Permission.DISTRIBUTORS_READ))]) -> JSONResponse:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                "SELECT o.*, d.business_name FROM distributor_orders o "
                "LEFT JOIN distributors d ON d.user_id = o.user_id ORDER BY o.created_at DESC LIMIT 300"
            )
        ).fetchall()
    return JSONResponse({"ok": True, "items": [{**to_trade_order(r), "businessName": r["business_name"] or "Unknown"}
                                               for r in rows]})  # fmt: skip


def _money(value: Any) -> int | None:
    n = js.number(value)
    return js.round_half_up(n) if n == n and 0 <= n <= 1e9 else None


@router.post("/api/admin/distributors", summary="decide / record-payment / advance / cancel")
async def staff_action(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)
    body = await json_body(request) or {}
    action = clean(body.get("action"), 30)

    if action == "decide":
        if not staff.can(Permission.DISTRIBUTORS_APPROVE):
            return fail(403, "You don't have permission to do that.")
        status = body.get("status")
        if status not in ("approved", "rejected", "suspended"):
            return fail(400, "Choose a decision.")
        tier = clean(body.get("tier"), 20)
        if tier not in TIERS:
            return fail(400, "Choose a tier.")
        credit_limit, target = _money(body.get("creditLimit")), _money(body.get("quarterlyTarget"))
        if credit_limit is None or target is None:
            return fail(400, "Credit limit and target must be amounts in rupees.")
        territory, review_date = clean(body.get("territory"), 200), clean(body.get("reviewDate"), 10)
        note = clean(body.get("note"), 500)
        if status == "approved":
            if len(territory) < 2:
                return fail(400, "Assign a territory before approving.")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", review_date):
                return fail(400, "Set the next territory review date.")
        if status != "approved" and len(note) < 3:
            return fail(400, "Add a note explaining the decision.")
        user_id = clean(body.get("userId"), 60)
        async with connection() as conn:
            before = await (
                await conn.execute("SELECT status FROM distributors WHERE user_id = %s", (user_id,))
            ).fetchone()
            changed = await conn.execute(
                """UPDATE distributors SET status = %s, tier = %s, territory = %s, credit_limit = %s,
                     quarterly_target = %s, review_date = %s, decision_note = %s, decided_at = %s, decided_by = %s
                   WHERE user_id = %s""",
                (status, tier, territory, credit_limit, target, review_date, note, now_iso(), staff.email, user_id),
            )
            if changed.rowcount:
                await audit.record(conn, request, staff, "distributor.decide", "distributor", user_id, {
                    "before": before["status"] if before else None, "after": status, "tier": tier,
                    "creditLimit": credit_limit, "territory": territory, "note": note,
                })  # fmt: skip
        return JSONResponse({"ok": True}) if changed.rowcount else fail(404, "No distributor application found.")

    if action in ("record-payment", "advance", "cancel"):
        if not staff.can(Permission.DISTRIBUTORS_WRITE):
            return fail(403, "You don't have permission to do that.")
        payment_ref = clean(body.get("paymentRef"), 60)
        if action == "record-payment" and len(payment_ref) < 3:
            return fail(400, "Enter the payment or UTR reference.")
        order_id = clean(body.get("orderId"), 40)
        async with connection() as conn:
            row = await (
                await conn.execute("SELECT * FROM distributor_orders WHERE id = %s FOR UPDATE", (order_id,))
            ).fetchone()
            if not row:
                return fail(409, "No trade order has that reference.")
            order = to_trade_order(row)
            if action == "record-payment":
                if order["paidAt"]:
                    return fail(409, "Payment is already recorded for this order.")
                if order["status"] == "Cancelled":
                    return fail(409, "This order is cancelled.")
                status = "Confirmed" if order["status"] == "Awaiting payment" else order["status"]
                await conn.execute(
                    "UPDATE distributor_orders SET paid_at = %s, payment_ref = %s, status = %s, updated_by = %s "
                    "WHERE id = %s",
                    (now_iso(), payment_ref, status, staff.email, order_id),
                )
            elif action == "advance":
                following = NEXT_STATUS.get(order["status"])
                if not following:
                    unpaid = order["status"] == "Awaiting payment"
                    return fail(
                        409,
                        "Record the advance payment before dispatch." if unpaid else "This order can't move forward.",
                    )
                status = following
                await conn.execute(
                    "UPDATE distributor_orders SET status = %s, updated_by = %s WHERE id = %s",
                    (status, staff.email, order_id),
                )
            else:
                if order["status"] in ("Dispatched", "Delivered"):
                    return fail(409, "Dispatched orders can't be cancelled here. Raise a return instead.")
                if order["status"] == "Cancelled":
                    return fail(409, "This order is already cancelled.")
                status = "Cancelled"
                await conn.execute(
                    "UPDATE distributor_orders SET status = 'Cancelled', updated_by = %s WHERE id = %s",
                    (staff.email, order_id),
                )
            await audit.record(conn, request, staff, f"trade.{action}", "trade-order", order_id,
                               {"before": order["status"], "after": status,
                                **({"paymentRef": payment_ref} if action == "record-payment" else {})})  # fmt: skip
            updated = await (
                await conn.execute("SELECT * FROM distributor_orders WHERE id = %s", (order_id,))
            ).fetchone()
        return JSONResponse({"ok": True, "order": to_trade_order(updated)})

    return fail(400, "Unknown action.")
