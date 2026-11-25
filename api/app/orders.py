"""Read-only view of a customer's orders, for the account page.

Orders are still written by the site (src/lib/commerce/order-store.ts) until the
commerce migration; this only lists them, in the same shape as toOrder() there.
"""

import json
from typing import Any

from psycopg import AsyncConnection


def to_order(row: dict[str, Any]) -> dict[str, Any]:
    order = {
        "id": row["id"],
        "idempotencyKey": row["idempotency_key"],
        "method": row["method"],
        "email": row["email"],
        "phone": row["phone"],
        "customerName": row["customer_name"],
        "items": json.loads(row["items"]),
        "subtotal": row["subtotal"],
        "status": row["status"],
        "shippingAddress": json.loads(row["shipping"]),
        "createdAt": row["created_at"],
        "paymentStatus": "pending" if row["payment_status"] == "pending" else "paid",
    }
    if row["courier"] is not None:
        order["courier"] = row["courier"]
    if row["tracking_number"] is not None:
        order["trackingNumber"] = row["tracking_number"]
    return order


async def orders_for_user(conn: AsyncConnection[dict[str, Any]], user_id: str) -> list[dict[str, Any]]:
    rows = await (
        await conn.execute("SELECT * FROM demo_orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (user_id,))
    ).fetchall()
    return [to_order(row) for row in rows]
