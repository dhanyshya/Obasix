"""Saved quotes: the customer's own quote (same as src/app/api/quotes/[reference]/route.ts),
and the staff list (new). Submitting a quote, with its attachment, stays on the site until
file storage moves (see docs/migrations/tracking.md, MIG-005)."""

import json
from datetime import UTC, datetime
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse

from app.admin.deps import require
from app.admin.rbac import Permission, Staff
from app.auth.sessions import read_session
from app.core.db import connection
from app.core.http import client_address, fail
from app.core.ratelimit import allow_attempt
from app.quotes.access import can_view
from app.quotes.submit import submit

router = APIRouter(tags=["quotes"])

DEMO_PREFIX = "OBX-QUOTE-DEMO-"


def iso_z(moment: datetime) -> str:
    """The site's stored format (Date.toISOString): UTC, milliseconds, "Z". No zone means UTC."""
    utc = moment.astimezone(UTC) if moment.tzinfo else moment.replace(tzinfo=UTC)
    return utc.isoformat(timespec="milliseconds")[:-6] + "Z"


async def find_quote(reference: str) -> dict[str, Any] | None:
    async with connection() as conn:
        row = await (
            await conn.execute("SELECT payload FROM quote_requests WHERE reference = %s", (reference,))
        ).fetchone()
    return json.loads(row["payload"]) if row else None


@router.post("/api/quotes", summary="Submit a quote request (multipart form, Idempotency-Key header)")
async def submit_quote(request: Request) -> JSONResponse:
    return await submit(request)


@router.get("/api/quotes/{reference}", summary="A saved quote, for the person who sent it")
async def customer_quote(reference: str, request: Request) -> JSONResponse:
    if not await allow_attempt(f"quote:lookup:{client_address(request)}", 60, 10 * 60 * 1000):
        return fail(429, "Too many lookups. Wait a few minutes and try again.")
    if not reference.startswith(DEMO_PREFIX):
        return fail(404, "This reference is not a demo quote. No quote database is connected.")
    quote = await find_quote(reference)
    # Same answer for "no such quote" and "not yours", so references can't be probed.
    if not quote or not await can_view(quote, request, await read_session(request)):
        return fail(404, "No saved demo quote matches that reference.")
    attachment = quote.get("attachment") or None
    return JSONResponse(
        {
            "ok": True,
            "mode": "demo",
            "notified": False,
            "quote": {
                "reference": quote["reference"],
                "boardType": quote["boardType"],
                "dimensions": quote["dimensions"],
                "quantity": quote["quantity"],
                "product": quote["product"],
                "productId": quote["productId"],
                "frame": quote["frame"],
                "colour": quote["colour"],
                "surface": quote.get("surface") or "",
                "location": quote.get("location") or "",
                "features": quote["features"],
                "accessories": quote["accessories"],
                "branding": quote["branding"],
                "notes": quote["notes"],
                "configurationSummary": quote["configurationSummary"],
                "lines": [
                    {k: line[k] for k in ("productId", "name", "sku", "quantity", "catalogueUnitPrice", "detail")}
                    for line in quote["lines"]
                ],
                "catalogueListSubtotal": quote["catalogueListSubtotal"],
                "attachmentName": attachment["name"] if attachment else None,
            },
        }
    )


def _summary(quote: dict[str, Any]) -> dict[str, Any]:
    attachment = quote.get("attachment") or None
    return {
        "reference": quote["reference"],
        "createdAt": quote["createdAt"],
        "name": quote["name"],
        "company": quote.get("company", ""),
        "email": quote["email"],
        "phone": quote["phone"],
        "location": quote.get("location") or "",
        "boardType": quote["boardType"],
        "product": quote["product"],
        "dimensions": quote["dimensions"],
        "quantity": quote["quantity"],
        "configurationSummary": quote["configurationSummary"],
        "notes": quote["notes"],
        "lines": quote["lines"],
        "catalogueListSubtotal": quote["catalogueListSubtotal"],
        "attachment": {"name": attachment["name"], "type": attachment["type"], "size": attachment["size"]}
        if attachment
        else None,
    }


@router.get("/api/admin/quotes", summary="Quote requests, newest first (staff)")
async def staff_quotes(
    _: Annotated[Staff, Depends(require(Permission.QUOTES_READ))],
    q: Annotated[str, Query(max_length=120, description="Reference, name, company, email or phone contains")] = "",
    board_type: Annotated[str | None, Query(alias="boardType", max_length=60)] = None,
    since: Annotated[datetime | None, Query()] = None,
    until: Annotated[datetime | None, Query()] = None,
    attachment: Annotated[bool | None, Query(description="Only with (true) or without (false) a file")] = None,
    order: Annotated[Literal["desc", "asc"], Query()] = "desc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 25,
) -> JSONResponse:
    where, params = [], []
    needle = q.strip()
    if needle:
        like = "%" + needle.replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_") + "%"
        where.append(
            "(reference ILIKE %s OR email ILIKE %s OR payload::jsonb->>'name' ILIKE %s "
            "OR payload::jsonb->>'company' ILIKE %s OR payload::jsonb->>'phone' ILIKE %s)"
        )
        params += [like] * 5
    if board_type:
        where.append("payload::jsonb->>'boardType' = %s")
        params.append(board_type)
    # created_at is an ISO 8601 UTC string, so it compares correctly as text.
    if since:
        where.append("created_at >= %s")
        params.append(iso_z(since))
    if until:
        where.append("created_at < %s")
        params.append(iso_z(until))
    if attachment is not None:
        # jsonb_typeof is "object" for a file, "null" or missing for none.
        has_file = "jsonb_typeof(payload::jsonb->'attachment') = 'object'"
        where.append(has_file if attachment else f"NOT COALESCE({has_file}, false)")
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    # `clause` is built only from the fixed fragments above; every value is a bound parameter.
    count_sql = f"SELECT COUNT(*) AS n FROM quote_requests {clause}"  # noqa: S608
    page_sql = (
        f"SELECT payload FROM quote_requests {clause} ORDER BY created_at {order.upper()}, reference LIMIT %s OFFSET %s"  # noqa: S608, E501
    )
    async with connection() as conn:
        total = (await (await conn.execute(count_sql, params)).fetchone())["n"]
        rows = await (await conn.execute(page_sql, [*params, page_size, (page - 1) * page_size])).fetchall()
    items = [_summary(json.loads(r["payload"])) for r in rows]
    return JSONResponse({"ok": True, "items": items, "page": page, "pageSize": page_size, "total": total})
