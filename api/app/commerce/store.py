"""Orders: a port of src/lib/commerce/order-store.ts and paid.ts."""

import json
import logging
import re
import secrets
from datetime import UTC, datetime
from typing import Any

from psycopg.errors import UniqueViolation

from app import cart
from app.catalogue import get_product
from app.core import js
from app.core.db import connection
from app.email import order_confirmation_email, send_email, staff_alert_emails, staff_new_order_email
from app.orders import to_order

log = logging.getLogger(__name__)
COMMISSION_RATE = 0.05  # src/lib/associates/program.ts associateCommissionRate
STAFF_FLOW = {"Payment Confirmed": "Processing", "Processing": "Dispatched", "Dispatched": "Out for Delivery",
              "Out for Delivery": "Delivered"}  # fmt: skip
STATUS_FLOW = ["Order Placed", "Payment Confirmed", "Processing", "Dispatched", "Out for Delivery", "Delivered"]
CANCELLABLE = ["Pending Payment", "Order Placed", "Payment Confirmed", "Processing"]


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"


def is_demo(order_id: str) -> bool:
    return order_id.startswith("OBX-DEMO-")


async def row(order_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        return await (await conn.execute("SELECT * FROM demo_orders WHERE id = %s", (order_id,))).fetchone()


async def find(order_id: str) -> dict[str, Any] | None:
    found = await row(order_id)
    return to_order(found) if found else None


async def create(*, key: str, user_id: str | None, method: str, name: str, email: str, phone: str,
                 shipping: dict[str, str], lines: Any, pending: bool = False,
                 referral: str | None = None) -> dict[str, Any]:  # fmt: skip
    """createDemoOrder: priced from the server catalogue; custom sizes are quote-only. Idempotent by key."""
    async with connection() as conn:
        existing = await (await conn.execute("SELECT * FROM demo_orders WHERE idempotency_key = %s", (key,))).fetchone()
    if existing:
        return {"ok": True, "order": to_order(existing)}
    normalized = cart.normalize_cart_lines(lines)
    if not normalized:
        return {"ok": False, "message": "The cart is empty or contains products that are no longer in the catalogue."}
    if any(
        line["configuration"].get("customWidthFt") is not None
        and line["configuration"].get("customHeightFt") is not None
        for line in normalized
    ):
        return {
            "ok": False,
            "message": "Custom-size boards need a quote. Remove them from the cart or request a quote.",
        }
    items = []
    for line in normalized:
        product = get_product(line["productId"])
        assert product is not None  # normalize_cart_lines keeps catalogue products only
        items.append({
            "productId": product["id"], "name": product["name"], "quantity": line["quantity"],
            "unitPrice": product["price"], "lineTotal": product["price"] * line["quantity"],
            "configuration": line["configuration"],
        })  # fmt: skip
    subtotal = sum(i["lineTotal"] for i in items)
    order_id = f"{'OBX' if pending else 'OBX-DEMO'}-{secrets.token_hex(4).upper()}"
    try:
        async with connection() as conn:
            await conn.execute(
                """INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items,
                     subtotal, status, shipping, created_at, payment_status, referral_code)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (order_id, key, user_id, email, phone, name, method,
                 json.dumps(items, separators=(",", ":"), ensure_ascii=False), subtotal,
                 "Pending Payment" if pending else "Payment Confirmed",
                 json.dumps(shipping, separators=(",", ":"), ensure_ascii=False), now_iso(),
                 "pending" if pending else "paid", referral),
            )  # fmt: skip
    except UniqueViolation:
        # The same checkout sent twice at once: the other request created it.
        async with connection() as conn:
            existing = await (
                await conn.execute("SELECT * FROM demo_orders WHERE idempotency_key = %s", (key,))
            ).fetchone()
        if existing:
            return {"ok": True, "order": to_order(existing)}
        raise
    return {"ok": True, "order": await find(order_id)}


async def mark_paid(provider_order_id: str, payment_id: str) -> dict[str, Any] | None:
    """Exactly once: newlyPaid is False when the callback and the webhook both arrive."""
    async with connection() as conn:
        found = await (
            await conn.execute("SELECT * FROM demo_orders WHERE provider_order_id = %s", (provider_order_id,))
        ).fetchone()
        if not found:
            return None
        update = await conn.execute(
            "UPDATE demo_orders SET payment_status = 'paid', status = 'Payment Confirmed', provider_payment_id = %s, "
            "paid_at = %s WHERE id = %s AND payment_status = 'pending'",
            (payment_id, now_iso(), found["id"]),
        )
    return {"order": await find(found["id"]), "newlyPaid": update.rowcount == 1, "referralCode": found["referral_code"],
            "userId": found["user_id"]}  # fmt: skip


async def _record_commission(order: dict[str, Any], code: str | None, buyer_user_id: str | None) -> None:
    normalized = re.sub(r"[^A-Z0-9]", "", str(code or "").upper())[:12]
    if len(normalized) < 6 or order["subtotal"] <= 0:
        return
    async with connection() as conn:
        associate = await (
            await conn.execute(
                "SELECT a.code, a.user_id, a.status, u.email FROM associates a LEFT JOIN users u ON u.id = a.user_id "
                "WHERE a.code = %s",
                (normalized,),
            )
        ).fetchone()
        if not associate or associate["status"] != "active":
            return
        if buyer_user_id and buyer_user_id == associate["user_id"]:
            return
        if associate["email"] and associate["email"].strip().lower() == order["email"].strip().lower():
            return
        await conn.execute(
            """INSERT INTO associate_commissions (id, code, source_type, source_id, base_amount, rate, amount, status,
                 created_at) VALUES (%s, %s, 'order', %s, %s, %s, %s, 'pending', %s) ON CONFLICT DO NOTHING""",
            (f"COM-{secrets.token_hex(5).upper()}", associate["code"], order["id"], order["subtotal"], COMMISSION_RATE,
             js.round_half_up(order["subtotal"] * COMMISSION_RATE), now_iso()),
        )  # fmt: skip


async def after_paid(order: dict[str, Any], referral: str | None, user_id: str | None) -> None:
    """afterOrderPaid: once per order, when payment is first confirmed."""
    try:
        await _record_commission(order, referral, user_id)
    except Exception:  # noqa: BLE001 - the payment stands; staff can add the commission later
        log.exception("Commission failed for %s", order["id"])
    if is_demo(order["id"]):
        return  # Demo orders are simulations: no stock, no emails.
    try:
        async with connection() as conn:
            for item in order["items"]:
                await conn.execute(
                    "UPDATE product_stock SET on_hand = GREATEST(on_hand - %s, 0), updated_by = %s, updated_at = %s "
                    "WHERE product_id = %s",
                    (item["quantity"], f"order {order['id']}", now_iso(), item["productId"]),
                )
    except Exception:  # noqa: BLE001 - stock is a guide for staff; it mustn't undo a confirmed payment
        log.exception("Stock deduction failed for %s", order["id"])
    await send_email(order["email"], order_confirmation_email(order))
    await send_email(staff_alert_emails(), staff_new_order_email(order))


def contact_matches(order: dict[str, Any], contact: str) -> bool:
    value = contact.strip().lower()
    digits = re.sub(r"\D", "", value)
    if value and value == order["email"].strip().lower():
        return True
    stored = re.sub(r"\D", "", order["phone"])
    if len(digits) < 8 or len(stored) < 8:
        return False
    return digits[-10:] == stored[-10:]  # "+91 98765 43210" matches "9876543210"
