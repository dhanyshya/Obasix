"""Admin API: who am I, stock, the audit log and staff roles. All require a staff role."""

import json
from datetime import UTC, datetime
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse

from app.admin import audit, schemas
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.catalogue import all_products, get_product
from app.core import js
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.text import clean

router = APIRouter(prefix="/api/admin", tags=["admin"])

LOW_STOCK = 5  # src/lib/stock/store.ts lowStockThreshold
PageNo = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(alias="pageSize", ge=1, le=100)]


def _now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"


def _state(on_hand: int | None) -> str:
    if on_hand is None:
        return "untracked"
    return "made-to-order" if on_hand <= 0 else "low" if on_hand <= LOW_STOCK else "in-stock"


# ---------- Who am I ----------


@router.get("/me", response_model=schemas.Me, summary="The signed-in staff member and their permissions")
async def me(staff: Annotated[Staff, Depends(require(Permission.STOCK_READ))]) -> dict[str, Any]:
    return {
        "email": staff.email,
        "name": staff.name,
        "role": staff.role,
        "source": staff.source,
        "permissions": sorted(staff.permissions),
    }


# ---------- Stock ----------


@router.get("/stock", response_model=schemas.StockPage, summary="Stock levels for every catalogue product")
async def list_stock(
    _: Annotated[Staff, Depends(require(Permission.STOCK_READ))],
    q: Annotated[str, Query(max_length=60, description="Name, SKU or id contains")] = "",
    state: Annotated[Literal["in-stock", "low", "made-to-order", "untracked", "tracked"] | None, Query()] = None,
    sort: Annotated[Literal["name", "sku", "onHand", "updatedAt"], Query()] = "name",
    order: Annotated[Literal["asc", "desc"], Query()] = "asc",
    page: PageNo = 1,
    page_size: PageSize = 25,
) -> dict[str, Any]:
    async with connection() as conn:
        rows = await (await conn.execute("SELECT * FROM product_stock")).fetchall()
    levels = {r["product_id"]: r for r in rows}
    items = []
    for p in all_products():
        level = levels.get(p["id"])
        on_hand = level["on_hand"] if level else None
        items.append(
            {
                "product_id": p["id"],
                "name": p["name"],
                "sku": p["sku"],
                "on_hand": on_hand,
                "state": _state(on_hand),
                "updated_by": level["updated_by"] if level else None,
                "updated_at": level["updated_at"] if level else None,
            }
        )
    needle = q.strip().lower()
    if needle:
        items = [i for i in items if needle in f"{i['name']} {i['sku']} {i['product_id']}".lower()]
    if state == "tracked":
        items = [i for i in items if i["on_hand"] is not None]
    elif state:
        items = [i for i in items if i["state"] == state]
    key = {"name": "name", "sku": "sku", "onHand": "on_hand", "updatedAt": "updated_at"}[sort]
    # Untracked (None) sorts last either way.
    present = sorted((i for i in items if i[key] is not None), key=lambda i: i[key], reverse=order == "desc")
    items = present + [i for i in items if i[key] is None]
    start = (page - 1) * page_size
    return {"items": items[start : start + page_size], "page": page, "page_size": page_size, "total": len(items)}


@router.post("/stock", summary="Set a product's on-hand count, or stop tracking it (onHand: null)")
async def set_stock(request: Request) -> JSONResponse:
    # Same checks, order and messages as src/app/api/admin/stock/route.ts.
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)
    if not staff.can(Permission.STOCK_WRITE):
        return fail(403, "You don't have permission to do that.")
    try:
        body = json.loads(await request.body())
    except ValueError:
        body = None
    body = body if isinstance(body, dict) else {}
    product_id = clean(body.get("productId"), 60)
    raw = body.get("onHand")
    if not get_product(product_id):
        return fail(400, "That product isn't in the catalogue.")
    async with connection() as conn:
        # FOR UPDATE: two changes to one product at once are logged in order, each with the right "before".
        before = await (
            await conn.execute("SELECT on_hand FROM product_stock WHERE product_id = %s FOR UPDATE", (product_id,))
        ).fetchone()
        previous = before["on_hand"] if before else None
        if raw is None and "onHand" in body:
            if previous is None:
                return JSONResponse({"ok": True})  # Already untracked: nothing changed, nothing to log.
            await conn.execute("DELETE FROM product_stock WHERE product_id = %s", (product_id,))
            await audit.record(
                conn, request, staff, "stock.untrack", "product", product_id, {"before": previous, "after": None}
            )
            return JSONResponse({"ok": True})
        number = js.number(raw)
        if number != number or number != int(number) or not 0 <= number <= 100000:  # NaN, fractions, range
            return fail(400, "Enter a whole number from 0 to 100,000.")
        on_hand = int(number)
        await conn.execute(
            """INSERT INTO product_stock (product_id, on_hand, updated_by, updated_at) VALUES (%s, %s, %s, %s)
               ON CONFLICT (product_id) DO UPDATE SET on_hand = excluded.on_hand,
               updated_by = excluded.updated_by, updated_at = excluded.updated_at""",
            (product_id, on_hand, staff.email, _now_iso()),
        )
        await audit.record(
            conn, request, staff, "stock.set", "product", product_id, {"before": previous, "after": on_hand}
        )
    return JSONResponse({"ok": True})


# ---------- Audit log ----------


@router.get("/audit", response_model=schemas.AuditPage, summary="Admin activity, newest first")
async def list_audit(
    _: Annotated[Staff, Depends(require(Permission.AUDIT_READ))],
    actor: Annotated[str | None, Query(max_length=120)] = None,
    action: Annotated[str | None, Query(max_length=60, description="Exact, or a prefix ending in '.'")] = None,
    target_type: Annotated[str | None, Query(alias="targetType", max_length=40)] = None,
    target_id: Annotated[str | None, Query(alias="targetId", max_length=120)] = None,
    since: Annotated[datetime | None, Query()] = None,
    until: Annotated[datetime | None, Query()] = None,
    page: PageNo = 1,
    page_size: PageSize = 25,
) -> dict[str, Any]:
    where, params = [], []
    if actor:
        where.append("actor_email = %s")
        params.append(actor.strip().lower())
    if action:
        if action.endswith("."):
            where.append("action LIKE %s")
            params.append(action.replace("%", r"\%").replace("_", r"\_") + "%")
        else:
            where.append("action = %s")
            params.append(action)
    for column, value in (("target_type", target_type), ("target_id", target_id)):
        if value:
            where.append(f"{column} = %s")
            params.append(value)
    if since:
        where.append("at >= %s")
        params.append(since)
    if until:
        where.append("at < %s")
        params.append(until)
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    async with connection() as conn:
        total = (await (await conn.execute(f"SELECT COUNT(*) AS n FROM audit_log {clause}", params)).fetchone())["n"]  # noqa: S608
        rows = await (
            await conn.execute(
                f"SELECT * FROM audit_log {clause} ORDER BY at DESC, id DESC LIMIT %s OFFSET %s",  # noqa: S608
                [*params, page_size, (page - 1) * page_size],
            )
        ).fetchall()
    return {"items": rows, "page": page, "page_size": page_size, "total": total}


# ---------- Staff roles ----------


@router.get("/staff", response_model=schemas.StaffList, summary="Everyone with a staff role")
async def list_staff(_: Annotated[Staff, Depends(require(Permission.STAFF_MANAGE))]) -> dict[str, Any]:
    configured = [{"email": e, "role": "admin", "source": "config"} for e in sorted(get_settings().admin_emails)]
    async with connection() as conn:
        rows = await (await conn.execute("SELECT * FROM staff_roles ORDER BY email")).fetchall()
    granted = [{**r, "source": "granted"} for r in rows if r["email"] not in get_settings().admin_emails]
    return {"items": configured + granted}


@router.post("/staff", response_model=schemas.Done, summary="Give an email a staff role, or change it")
async def grant(
    body: schemas.GrantIn,
    request: Request,
    staff: Annotated[Staff, Depends(require(Permission.STAFF_MANAGE, change=True))],
) -> dict[str, Any]:
    email = body.email.strip().lower()
    if email in get_settings().admin_emails:
        return fail(409, "That email is an admin through OBASIX_ADMIN_EMAILS; change it there.")  # type: ignore[return-value]
    async with connection() as conn:
        before = await (await conn.execute("SELECT role FROM staff_roles WHERE email = %s", (email,))).fetchone()
        await conn.execute(
            """INSERT INTO staff_roles (email, role, granted_by) VALUES (%s, %s, %s)
               ON CONFLICT (email) DO UPDATE SET role = excluded.role, granted_by = excluded.granted_by,
               granted_at = now()""",
            (email, body.role, staff.email),
        )
        await audit.record(
            conn,
            request,
            staff,
            "staff.grant",
            "staff",
            email,
            {"before": before["role"] if before else None, "after": body.role},
        )
    return {}


@router.delete("/staff", response_model=schemas.Done, summary="Remove an email's staff role")
async def revoke(
    request: Request,
    staff: Annotated[Staff, Depends(require(Permission.STAFF_MANAGE, change=True))],
    email: Annotated[str, Query(max_length=120)],
) -> dict[str, Any]:
    email = email.strip().lower()
    if email in get_settings().admin_emails:
        return fail(409, "That email is an admin through OBASIX_ADMIN_EMAILS; change it there.")  # type: ignore[return-value]
    async with connection() as conn:
        removed = await (
            await conn.execute("DELETE FROM staff_roles WHERE email = %s RETURNING role", (email,))
        ).fetchone()
        if not removed:
            return fail(404, "No staff role for that email.")  # type: ignore[return-value]
        await audit.record(
            conn, request, staff, "staff.revoke", "staff", email, {"before": removed["role"], "after": None}
        )
    return {}
