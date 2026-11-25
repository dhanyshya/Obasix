"""POST /api/quotes: a port of src/app/api/quotes/route.ts. Same rules, messages, status codes and
stored JSON, so quotes saved by either side read the same."""

import json
import logging
import re
import secrets
from datetime import UTC, datetime
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.datastructures import FormData, UploadFile

from app.auth.sessions import read_session
from app.catalogue import get_product
from app.core import js
from app.core.config import get_settings
from app.core.db import connection
from app.core.http import client_address
from app.core.ratelimit import allow_attempt
from app.core.storage import EXTENSIONS, save_file, sniff_type
from app.core.text import clean, dumps
from app.email import quote_received_email, send_email, staff_alert_emails, staff_new_quote_email
from app.quotes.access import COOKIE, sign

BOARD_TYPES = [
    "Magnetic Whiteboard", "Non-Magnetic Whiteboard", "Notice Board", "Pin-up Board", "Combination Board",
    "Chalk Board", "Glass Board", "Felt Pin-up Board", "Fabric Pin-up Board", "Cork Pin-up Board",
    "Planning Board", "OEM / Private Label", "Acoustic Panel", "Illuminated Sign", "Modular Display System",
    "Interactive Display", "Custom Board", "Nameplate / Signage",
]  # fmt: skip
ATTACHMENT_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"]
ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
MAX_COOKIE_REFS = 10
log = logging.getLogger(__name__)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
QUANTITY_RE = re.compile(r"^[1-9]\d{0,2}$")


def _out(status: int, message: str, **extra: Any) -> JSONResponse:
    return JSONResponse(
        {"ok": False, "saved": False, "notified": False, "message": message, **extra}, status_code=status
    )


def parse_quantity(value: str) -> int | None:
    return int(value) if QUANTITY_RE.match(value.strip()) else None


def validate(fields: dict[str, str], dimensions_required: bool, file: dict[str, Any] | None) -> dict[str, str]:
    """validateQuoteFields in src/lib/quotes/schema.ts."""
    errors: dict[str, str] = {}
    if len(clean(fields["name"], 80)) < 2:
        errors["name"] = "Enter your name."
    digits = re.sub(r"\D", "", fields["phone"])
    if not 8 <= len(digits) <= 15:
        errors["phone"] = "Enter a phone number with 8 to 15 digits."
    email = fields["email"].strip()
    if not EMAIL_RE.match(email) or len(email) > 120:
        errors["email"] = "Enter a valid email address."
    if len(clean(fields["location"], 80)) < 2:
        errors["location"] = "Enter your city or location."
    if fields["boardType"] not in BOARD_TYPES:
        errors["boardType"] = "Choose a board type."
    if dimensions_required and len(clean(fields["dimensions"], 40)) < 2:
        errors["dimensions"] = "Enter the custom dimensions."
    if parse_quantity(fields["quantity"]) is None:
        errors["quantity"] = "Enter a whole quantity from 1 to 999."
    if file:
        if file["type"] not in ATTACHMENT_TYPES:
            errors["file"] = "Upload a PNG, JPEG, WebP, or PDF file."
        elif file["size"] > ATTACHMENT_MAX_BYTES:
            errors["file"] = "The file must be 2 MB or smaller."
    return errors


def catalogue_line(product_id: str, quantity: Any, detail: str) -> dict[str, Any] | None:
    product = get_product(product_id)
    if not product:
        return None
    safe = parse_quantity(js.string(js.plain(js.number(quantity))) if quantity is not None else "NaN")
    if safe is None:
        return None
    return {
        "productId": product["id"],
        "name": product["name"],
        "sku": product["sku"],
        "quantity": safe,
        "catalogueUnitPrice": product["price"],
        "detail": clean(detail, 300),
    }


def _field(form: FormData, name: str) -> str:
    value = form.get(name)
    return value if isinstance(value, str) else ""


def _now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"


async def _attribution(conn: Any, request: Request, user: dict[str, Any] | None, saved: dict[str, Any]) -> None:
    """recordQuoteAttribution (src/lib/associates/store.ts). Shared write until trade channels move (MIG-007)."""
    code = None
    if user:
        own = await (await conn.execute("SELECT code FROM associates WHERE user_id = %s", (user["id"],))).fetchone()
        code = own["code"] if own else None
    if code is None:
        code = request.cookies.get("obasix_ref")
    normalized = re.sub(r"[^A-Z0-9]", "", str(code or "").upper())[:12]
    if len(normalized) < 6:
        return
    associate = await (
        await conn.execute(
            "SELECT a.code, a.status, u.email FROM associates a LEFT JOIN users u ON u.id = a.user_id "
            "WHERE a.code = %s",
            (normalized,),
        )
    ).fetchone()
    if not associate or associate["status"] != "active":
        return
    if associate["email"] and associate["email"].strip().lower() == saved["email"].strip().lower():
        return  # no credit for your own quote
    summary = " · ".join(
        p for p in [saved["product"], saved["boardType"], saved["dimensions"], f"qty {saved['quantity']}"] if p
    )
    await conn.execute(
        "INSERT INTO associate_quotes (reference, code, customer, summary, created_at) VALUES (%s, %s, %s, %s, %s) "
        "ON CONFLICT DO NOTHING",
        (
            saved["reference"],
            associate["code"],
            ", ".join(p for p in [saved["name"], saved["company"]] if p),
            summary,
            _now_iso(),
        ),
    )


def _grant_cookie(request: Request, response: JSONResponse, reference: str) -> None:
    """grantQuoteAccess: this browser may now read the quote."""
    existing = [t for t in request.cookies.get(COOKIE, "").split(",") if t]
    tokens = [f"{reference}.{sign(reference)}", *existing][:MAX_COOKIE_REFS]
    response.set_cookie(
        COOKIE,
        ",".join(tokens),
        max_age=30 * 24 * 60 * 60,
        path="/",
        httponly=True,
        samesite="lax",
        secure=get_settings().production,
    )


async def submit(request: Request) -> JSONResponse:
    settings = get_settings()
    mode = settings.quote_mode
    idempotency_key = clean(request.headers.get("idempotency-key", ""), 80)
    if len(idempotency_key) < 8:
        return _out(400, "Submit the quote again. The request is missing an idempotency key.")
    if mode == "unconfigured":
        return _out(
            503,
            "Quote requests are not saved. This server has no quote database.",
            required=["QUOTE_API_URL", "QUOTE_API_TOKEN"],
        )
    if mode == "real":
        return _out(
            501,
            "A quote API is named in the server settings, but this storefront does not call it yet. "
            "The request was not saved.",
            required=["QUOTE_API_URL", "QUOTE_API_TOKEN"],
        )
    if not await allow_attempt(f"quote:{client_address(request)}", 12, 10 * 60 * 1000):
        return _out(429, "Too many quote attempts. Wait a few minutes and try again.")
    try:
        form = await request.form(max_files=2, max_fields=60, max_part_size=8 * 1024 * 1024)
    except Exception:  # noqa: BLE001 - any parse failure is "could not be read", as on the site
        return _out(400, "The quote could not be read.")
    if _field(form, "simulateFailure") == "1":
        return _out(503, "Demo failure. The quote was not saved.")

    upload = form.get("file")
    attachment = upload if isinstance(upload, UploadFile) and (upload.size or 0) > 0 else None
    fields = {k: _field(form, k) for k in ("name", "phone", "email", "location", "boardType", "dimensions", "quantity")}
    errors = validate(
        fields,
        _field(form, "dimensionsRequired") == "1",
        {"type": attachment.content_type or "", "size": attachment.size or 0} if attachment else None,
    )
    if errors:
        return _out(400, "Check the highlighted fields.", errors=errors)

    data: bytes | None = None
    if attachment:
        data = await attachment.read()
        if sniff_type(data) != attachment.content_type:
            return _out(
                400,
                "Check the highlighted fields.",
                errors={"file": "The file content does not match a PNG, JPEG, WebP, or PDF file."},
            )

    try:
        raw_lines = json.loads(_field(form, "lines") or "[]")
    except ValueError:
        return _out(400, "The product list could not be read.")
    raw_lines = raw_lines if isinstance(raw_lines, list) else []
    lines = []
    for line in raw_lines[:20]:
        line = line if isinstance(line, dict) else {}
        product_id = clean(js.string(line["productId"]) if line.get("productId") is not None else "", 80)
        if not product_id:
            continue
        resolved = catalogue_line(
            product_id, line.get("quantity"), js.string(line["detail"]) if line.get("detail") is not None else ""
        )
        if not resolved:
            return _out(400, "A product in this quote is not in the catalogue.")
        lines.append(resolved)

    product_id = clean(_field(form, "productId"), 80)
    if product_id and not catalogue_line(product_id, 1, ""):
        return _out(400, "The selected product is not in the catalogue.")

    board_type = _field(form, "boardType")
    quote: dict[str, Any] = {
        "reference": f"OBX-QUOTE-DEMO-{secrets.token_hex(6).upper()}",
        "idempotencyKey": idempotency_key,
        "createdAt": _now_iso(),
        "mode": "demo",
        "name": clean(fields["name"], 80),
        "company": clean(_field(form, "company"), 80),
        "phone": clean(fields["phone"], 20),
        "email": clean(fields["email"], 120),
        "location": clean(fields["location"], 80),
        "boardType": board_type if board_type in BOARD_TYPES else "Custom Board",
        "dimensions": clean(fields["dimensions"], 40),
        "quantity": parse_quantity(fields["quantity"]),
        "product": clean(_field(form, "product"), 120),
        "productId": product_id,
        "frame": clean(_field(form, "frame"), 80),
        "colour": clean(_field(form, "colour"), 40),
        "surface": clean(_field(form, "surface"), 60),
        "features": clean(_field(form, "features"), 400),
        "accessories": clean(_field(form, "accessories"), 400),
        "branding": clean(_field(form, "branding"), 200),
        "notes": clean(_field(form, "notes"), 2000),
        "configurationSummary": clean(_field(form, "configurationSummary"), 800),
        "lines": lines,
        "catalogueListSubtotal": sum(line["catalogueUnitPrice"] * line["quantity"] for line in lines),
        "attachment": {
            "name": clean(attachment.filename or "", 120),
            "type": attachment.content_type
            if attachment.content_type in ATTACHMENT_TYPES
            else "application/octet-stream",
            "size": min(attachment.size or 0, ATTACHMENT_MAX_BYTES),
        }
        if attachment
        else None,
        "notified": False,
    }
    if attachment and data is not None:
        # Private storage (Vercel Blob or the shared files folder). Only staff can download it.
        stored = f"{quote['reference']}.{EXTENSIONS[attachment.content_type or '']}"
        await save_file(f"quote-files/{stored}", data, attachment.content_type or "application/octet-stream")
        quote["attachment"] = {**quote["attachment"], "storedAs": stored}

    user = await read_session(request)
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) "
            "VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (quote["reference"], quote["idempotencyKey"], quote["email"], quote["createdAt"], dumps(quote)),
        )
        row = await (
            await conn.execute("SELECT payload FROM quote_requests WHERE idempotency_key = %s", (idempotency_key,))
        ).fetchone()
    saved = json.loads(row["payload"])
    summary_parts = [saved["product"], saved["boardType"], saved["dimensions"], f"qty {saved['quantity']}"]
    short_summary = " · ".join(p for p in summary_parts if p)
    if user:
        async with connection() as conn:
            await conn.execute(
                "INSERT INTO customer_quotes (reference, user_id, summary, created_at) VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (reference) DO UPDATE SET user_id = excluded.user_id, summary = excluded.summary, "
                "created_at = excluded.created_at",
                (saved["reference"], user["id"], short_summary, saved["createdAt"]),
            )
    try:
        async with connection() as conn:
            await _attribution(conn, request, user, saved)
    except Exception:  # noqa: BLE001 - best effort, as on the site: the quote is already saved
        log.exception("Quote attribution failed for %s", saved["reference"])

    is_new = saved["reference"] == quote["reference"]
    notified = False
    if is_new:
        summary = saved["configurationSummary"] or short_summary
        notified = await send_email(saved["email"], quote_received_email(saved["reference"], saved["name"], summary))
        await send_email(
            staff_alert_emails(),
            staff_new_quote_email(
                saved["reference"], saved["name"], saved["company"], saved["email"], saved["phone"], summary
            ),
        )
    message = (
        "We already have this request."
        if not is_new
        else "Quote saved. We've emailed you a copy."
        if notified
        else "Quote saved on this server. No email was sent."
    )
    response = JSONResponse(
        {
            "ok": True,
            "saved": True,
            "mode": "demo",
            "notified": notified,
            "reference": saved["reference"],
            "message": message,
        }
    )
    _grant_cookie(request, response, saved["reference"])
    return response
