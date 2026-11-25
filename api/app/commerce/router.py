"""Checkout, payment, tracking and staff orders: ports of src/app/api/commerce/* and /api/admin/orders.
Same paths, rules, messages and status codes; the staff list is new."""

import json
import re
from datetime import datetime
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, PlainTextResponse

from app.admin import audit
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.auth.sessions import read_session
from app.catalogue import get_product
from app.commerce import razorpay, store
from app.core import js
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import client_address, fail, trusted_origin
from app.core.ratelimit import allow_attempt
from app.core.text import clean, json_body
from app.email import order_dispatched_email, send_email
from app.orders import orders_for_user, to_order
from app.quotes.router import iso_z

router = APIRouter(tags=["commerce"])

REQUIREMENTS = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]
DEMO_METHODS = ["upi", "card", "cod"]
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def unavailable(code: str, message: str, status: int) -> JSONResponse:
    body: dict[str, Any] = {"ok": False, "code": code, "charged": False, "orderCreated": False, "message": message}
    if code == "provider_not_configured":
        body["required"] = REQUIREMENTS
    return JSONResponse(body, status_code=status)


def invalid(message: str, status: int = 400) -> JSONResponse:
    return unavailable("invalid_request", message, status)


def read_customer(body: dict[str, Any]) -> dict[str, Any] | str:
    details = body.get("details") if isinstance(body.get("details"), dict) else {}
    shipping = details.get("shipping") if isinstance(details.get("shipping"), dict) else {}
    name = clean(details.get("name"), 80)
    email = clean(details.get("email"), 120).lower()
    phone = clean(details.get("phone"), 20)
    if len(name) < 2:
        return "Enter the customer name."
    if not EMAIL_RE.match(email):
        return "Enter a valid email address."
    if len(re.sub(r"\D", "", phone)) < 8:
        return "Enter a valid phone number."
    address = {
        "line": clean(shipping.get("line"), 160),
        "city": clean(shipping.get("city"), 60),
        "state": clean(shipping.get("state"), 60),
        "postal": clean(shipping.get("postal"), 12),
        "country": clean(shipping.get("country"), 60) or "India",
    }
    if len(address["line"]) < 4 or len(address["city"]) < 2 or len(address["postal"]) < 4:
        return "Enter a complete shipping address."
    return {"name": name, "email": email, "phone": phone, "address": address}


@router.get("/api/commerce/mode", summary="real, demo or unconfigured")
async def mode() -> dict[str, str]:
    return {"mode": get_settings().commerce_mode}


@router.post("/api/commerce/orders", summary="Place an order (Idempotency-Key header)")
async def place(request: Request) -> JSONResponse:
    key = clean(request.headers.get("idempotency-key"), 80)
    if len(key) < 8:
        return invalid("An order needs an idempotency key so a retry cannot create a second order.")
    current = get_settings().commerce_mode
    if current == "unconfigured":
        return unavailable(
            "provider_not_configured", "An order was not created. Online payment isn't set up on the server yet.", 503
        )
    if not trusted_origin(request):
        return invalid("The order request was rejected.", 403)
    body = await json_body(request)
    if body is None:
        return invalid("The order could not be read.")
    customer = read_customer(body)
    if isinstance(customer, str):
        return invalid(customer)
    user = await read_session(request)
    referral = request.cookies.get("obasix_ref")
    common = {
        "key": key, "user_id": user["id"] if user else None, "name": customer["name"], "email": customer["email"],
        "phone": customer["phone"], "shipping": customer["address"], "lines": body.get("lines"),
    }  # fmt: skip

    if current == "real":
        result = await store.create(**common, method="online", pending=True, referral=referral)
        if not result["ok"]:
            return invalid(result["message"], 422)
        order = result["order"]
        record = await store.row(order["id"])
        assert record is not None
        if record["payment_status"] == "paid":
            return JSONResponse({"ok": True, "mode": "real", "alreadyPaid": True, "order": to_order(record)})
        provider_order_id = record["provider_order_id"]
        if not provider_order_id:
            try:
                created = await razorpay.create_order(
                    js.round_half_up(order["subtotal"] * 100), order["id"], {"obasix_order": order["id"]}
                )
            except Exception:  # noqa: BLE001 - nothing was charged; the customer can retry
                return unavailable(
                    "payment_failed", "We couldn't start the payment. Nothing was charged. Try again in a moment.", 502
                )
            async with connection() as conn:
                await conn.execute(
                    "UPDATE demo_orders SET provider_order_id = %s WHERE id = %s AND provider_order_id IS NULL",
                    (created["id"], order["id"]),
                )
            provider_order_id = (await store.row(order["id"]) or {}).get("provider_order_id")
        settings = get_settings()
        return JSONResponse({
            "ok": True, "mode": "real", "order": to_order(record),
            "razorpay": {
                "keyId": settings.razorpay_key_id, "orderId": provider_order_id,
                "amount": js.round_half_up(order["subtotal"] * 100), "currency": "INR",
                "prefill": {"name": customer["name"], "email": customer["email"], "contact": customer["phone"]},
            },
        })  # fmt: skip

    method = clean(body.get("method"), 8)
    if method not in DEMO_METHODS:
        return invalid("Choose UPI, Card, or Cash on Delivery.")
    result = await store.create(**common, method=method)
    if not result["ok"]:
        return invalid(result["message"], 422)
    await store.after_paid(result["order"], referral, user["id"] if user else None)
    return JSONResponse({"ok": True, "mode": "demo", "charged": False, "orderCreated": True, "order": result["order"]})


@router.get(
    "/api/commerce/orders",
    summary="The signed-in account's orders (newest 50), or one of them with ?id=",
)
async def own_order(request: Request, id: Annotated[str | None, Query()] = None) -> JSONResponse:  # noqa: A002
    if id is None:
        # The account's own history (listDemoOrdersForUser), in every mode: the company page reorders from it.
        user = await read_session(request)
        if not user:
            return fail(401, "Sign in to see your orders.")
        async with connection() as conn:
            return JSONResponse({"ok": True, "orders": await orders_for_user(conn, user["id"])})
    current = get_settings().commerce_mode
    if current == "unconfigured":
        return unavailable("tracking_unavailable", "No order service is connected.", 503)
    order_id = clean(id, 40).upper()
    user = await read_session(request)
    found = await store.row(order_id) if order_id else None
    if not found or not user or found["user_id"] != user["id"]:
        return fail(404, "No order matches that reference.")
    return JSONResponse({"ok": True, "mode": current, "order": to_order(found)})


@router.post("/api/commerce/payment", summary="Razorpay checkout callback")
async def payment(request: Request) -> JSONResponse:
    if get_settings().commerce_mode != "real":
        return unavailable("provider_not_configured", "Online payment isn't set up on the server.", 503)
    if not trusted_origin(request):
        return unavailable("invalid_request", "The payment confirmation was rejected.", 403)
    body = await json_body(request) or {}

    def text(key: str, limit: int) -> str:
        value = body.get(key)
        return ("" if value is None else str(value))[:limit]

    order_id, provider_order_id = text("orderId", 40), text("razorpay_order_id", 60)
    payment_id, signature = text("razorpay_payment_id", 60), text("razorpay_signature", 200)
    record = await store.row(order_id)
    if not record or not record["provider_order_id"] or record["provider_order_id"] != provider_order_id:
        return unavailable("invalid_request", "That payment doesn't match an order.", 404)
    if not razorpay.verify_payment_signature(provider_order_id, payment_id, signature):
        return unavailable(
            "payment_failed",
            "We couldn't verify this payment. If money left your account, contact us with your order number.",
            400,
        )
    paid = await store.mark_paid(provider_order_id, payment_id)
    assert paid is not None
    if paid["newlyPaid"]:
        await store.after_paid(paid["order"], paid["referralCode"], paid["userId"])
    return JSONResponse({"ok": True, "order": paid["order"]})


@router.post("/api/commerce/payment/webhook", summary="Razorpay webhook (payment.captured, order.paid)")
async def webhook(request: Request) -> Any:
    raw = await request.body()
    if not razorpay.verify_webhook_signature(raw, request.headers.get("x-razorpay-signature")):
        return PlainTextResponse("Invalid signature", status_code=401)
    try:
        event = json.loads(raw)
    except ValueError:
        return PlainTextResponse("Bad payload", status_code=400)
    entity = (((event or {}).get("payload") or {}).get("payment") or {}).get("entity") or {}
    if event.get("event") in ("payment.captured", "order.paid") and entity.get("order_id") and entity.get("id"):
        paid = await store.mark_paid(str(entity["order_id"]), str(entity["id"]))
        if paid and paid["newlyPaid"]:
            await store.after_paid(paid["order"], paid["referralCode"], paid["userId"])
    # Acknowledge every signed event, including ones we don't act on, so Razorpay doesn't retry them.
    return JSONResponse({"ok": True})


@router.post("/api/commerce/track", summary="Track an order by number and the email or phone used")
async def track(request: Request) -> JSONResponse:
    body = await json_body(request) or {}
    order_number = str(body.get("orderNumber") or "").strip().upper()[:40]
    contact = str(body.get("contact") or "").strip()[:120]
    if len(order_number) < 4 or len(contact) < 5:
        return invalid("Enter an order number and the email or phone used at checkout.")
    current = get_settings().commerce_mode
    if current == "unconfigured":
        return unavailable("tracking_unavailable", "Tracking is not available. No order service is connected.", 503)
    if not await allow_attempt(f"auth:{client_address(request)}:track", 30, 10 * 60 * 1000):
        return fail(429, "Too many lookups. Wait a few minutes and try again.")
    order = await store.find(order_number)
    # Same response for "no such order" and "wrong contact", so order numbers can't be probed.
    if not order or not store.contact_matches(order, contact):
        return JSONResponse(
            {"ok": False, "found": False, "message": "No order matches that order number and contact."}, status_code=404
        )
    if current == "demo" and body.get("advance") is True:
        # Demo-only convenience: step the order forward. Live orders change only through staff.
        position = store.STATUS_FLOW.index(order["status"]) if order["status"] in store.STATUS_FLOW else -1
        following = store.STATUS_FLOW[min(position + 1, len(store.STATUS_FLOW) - 1)]
        async with connection() as conn:
            await conn.execute("UPDATE demo_orders SET status = %s WHERE id = %s", (following, order["id"]))
        order = {**order, "status": following}
    return JSONResponse({"ok": True, "found": True, "mode": current, "order": order})


@router.get("/api/stock", summary="Availability for up to 60 products: ?ids=a,b,c")
async def public_stock(ids: str = "") -> JSONResponse:
    wanted = [i.strip() for i in ids.split(",") if i.strip() and get_product(i.strip())][:60]
    stock: dict[str, Any] = {}
    if wanted:
        async with connection() as conn:
            rows = await (
                await conn.execute(
                    "SELECT product_id, on_hand FROM product_stock WHERE product_id = ANY(%s)", (wanted,)
                )
            ).fetchall()
        for r in rows:
            n = r["on_hand"]
            state = "made-to-order" if n <= 0 else "low" if n <= 5 else "in-stock"
            stock[r["product_id"]] = {"state": state, **({"onHand": n} if state == "low" else {})}
    return JSONResponse({"stock": stock}, headers={"cache-control": "no-store"})


# ---------- Staff ----------


@router.post("/api/admin/orders", summary="Move an order towards delivery, or cancel it before dispatch")
async def staff_order(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)
    if not staff.can(Permission.ORDERS_WRITE):
        return fail(403, "You don't have permission to do that.")
    body = await json_body(request) or {}
    order_id = clean(body.get("orderId"), 40).upper()
    action = body.get("action")
    if action not in ("advance", "cancel"):
        return fail(400, "Unknown action.")
    async with connection() as conn:
        found = await (await conn.execute("SELECT * FROM demo_orders WHERE id = %s FOR UPDATE", (order_id,))).fetchone()
        if not found:
            return fail(409, "No order matches that number.")
        order = to_order(found)
        if action == "advance":
            if order["paymentStatus"] == "pending":
                return fail(409, "This order hasn't been paid yet.")
            following = store.STAFF_FLOW.get(order["status"])
            if not following:
                return fail(409, f"A {order['status'].lower()} order can't move forward.")
            courier, tracking = clean(body.get("courier"), 60), clean(body.get("trackingNumber"), 60)
            if following == "Dispatched" and (not courier or not tracking):
                return fail(409, "Enter the courier and tracking number to mark the order dispatched.")
            if following == "Dispatched":
                await conn.execute(
                    "UPDATE demo_orders SET status = %s, courier = %s, tracking_number = %s, updated_by = %s, "
                    "updated_at = %s WHERE id = %s",
                    (following, courier, tracking, staff.email, store.now_iso(), order_id),
                )
            else:
                await conn.execute(
                    "UPDATE demo_orders SET status = %s, updated_by = %s, updated_at = %s WHERE id = %s",
                    (following, staff.email, store.now_iso(), order_id),
                )
            detail: dict[str, Any] = {"before": order["status"], "after": following}
            if following == "Dispatched":
                detail |= {"courier": courier, "trackingNumber": tracking}
            await audit.record(conn, request, staff, "order.advance", "order", order_id, detail)
        else:
            if order["status"] not in store.CANCELLABLE:
                return fail(409, "Orders can be cancelled only before dispatch.")
            note = clean(body.get("note"), 300)
            if len(note) < 5:
                return fail(409, "Add a note explaining the cancellation.")
            await conn.execute(
                "UPDATE demo_orders SET status = 'Cancelled', staff_note = %s, updated_by = %s, updated_at = %s "
                "WHERE id = %s",
                (note, staff.email, store.now_iso(), order_id),
            )
            await audit.record(conn, request, staff, "order.cancel", "order", order_id,
                               {"before": order["status"], "after": "Cancelled", "note": note})  # fmt: skip
    if action == "advance":
        updated = await store.find(order_id)
        if updated and updated["status"] == "Dispatched" and not store.is_demo(order_id):
            await send_email(updated["email"], order_dispatched_email(updated))
    return JSONResponse({"ok": True})


@router.get("/api/admin/orders", summary="Orders, newest first (staff)")
async def staff_orders(
    _: Annotated[Staff, Depends(require(Permission.ORDERS_READ))],
    q: Annotated[str, Query(max_length=120, description="Order number, name, email or phone contains")] = "",
    status: Annotated[str | None, Query(max_length=40)] = None,
    payment: Annotated[Literal["paid", "pending"] | None, Query()] = None,
    kind: Annotated[Literal["live", "demo"] | None, Query()] = None,
    since: Annotated[datetime | None, Query()] = None,
    until: Annotated[datetime | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 25,
) -> JSONResponse:
    where, params = [], []
    if q.strip():
        like = "%" + q.strip().replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_") + "%"
        where.append("(id ILIKE %s OR customer_name ILIKE %s OR email ILIKE %s OR phone ILIKE %s)")
        params += [like] * 4
    if status:
        where.append("status = %s")
        params.append(status)
    if payment:
        where.append("payment_status = %s")
        params.append(payment)
    if kind:
        where.append("id LIKE 'OBX-DEMO-%%'" if kind == "demo" else "id NOT LIKE 'OBX-DEMO-%%'")
    if since:
        where.append("created_at >= %s")
        params.append(iso_z(since))
    if until:
        where.append("created_at < %s")
        params.append(iso_z(until))
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    count_sql = f"SELECT COUNT(*) AS n FROM demo_orders {clause}"  # noqa: S608 - fixed fragments, bound values
    page_sql = f"SELECT * FROM demo_orders {clause} ORDER BY created_at DESC, id LIMIT %s OFFSET %s"  # noqa: S608
    async with connection() as conn:
        total = (await (await conn.execute(count_sql, params)).fetchone())["n"]
        rows = await (await conn.execute(page_sql, [*params, page_size, (page - 1) * page_size])).fetchall()
    items = [
        {**to_order(r), "staffNote": r["staff_note"] or "", "updatedBy": r["updated_by"],
         "providerPaymentId": r["provider_payment_id"], "nextStatus": store.STAFF_FLOW.get(r["status"])}
        for r in rows
    ]  # fmt: skip
    return JSONResponse({"ok": True, "items": items, "page": page, "pageSize": page_size, "total": total})
