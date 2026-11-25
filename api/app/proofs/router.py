"""Design proofs: a port of src/lib/proofs/store.ts and its routes, plus a staff list (new).

Staff upload numbered versions against a quote; the customer approves one or asks for changes.
Only a pending version can be decided, once; after an approval the thread is closed.
"""

import secrets
from datetime import UTC, datetime
from pathlib import PurePath
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, Response
from starlette.datastructures import UploadFile

from app.admin import audit
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.auth.sessions import read_session
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.storage import EXTENSIONS, load_file, save_file, sniff_type
from app.core.text import clean, json_body
from app.email import proof_ready_email, send_email, staff_alert_emails, staff_proof_decision_email
from app.quotes.router import find_quote

router = APIRouter(tags=["proofs"])

PROOF_MAX_BYTES = 5 * 1024 * 1024


def _now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds")[:-6] + "Z"


def _proof(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "quoteReference": row["quote_reference"],
        "version": row["version"],
        "fileName": row["file_name"],
        "mimeType": row["mime_type"],
        "size": row["size"],
        "staffNote": row["staff_note"],
        "uploadedBy": row["uploaded_by"],
        "createdAt": row["created_at"],
        "status": row["status"],
        "decidedAt": row["decided_at"],
        "decidedBy": row["decided_by"],
        "customerComment": row["customer_comment"],
    }


async def customer_can_see(reference: str, user: dict[str, Any]) -> bool:
    """customerCanSeeQuote: the quote is linked to the account, or was sent from its email."""
    async with connection() as conn:
        linked = await (
            await conn.execute(
                "SELECT 1 FROM customer_quotes WHERE reference = %s AND user_id = %s", (reference, user["id"])
            )
        ).fetchone()
    if linked:
        return True
    quote = await find_quote(reference)
    return bool(quote) and str(quote["email"]).strip().lower() == user["email"].strip().lower()


async def _find(proof_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        return await (await conn.execute("SELECT * FROM design_proofs WHERE id = %s", (proof_id,))).fetchone()


# ---------- Staff ----------


@router.post(
    "/api/admin/proofs", summary="Upload a new proof version for a quote (multipart: quoteReference, note, file)"
)
async def upload(request: Request) -> JSONResponse:
    # Same order and messages as src/app/api/admin/proofs/route.ts.
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)
    if not staff.can(Permission.PROOFS_WRITE):
        return fail(403, "You don't have permission to do that.")
    try:
        form = await request.form(max_files=1, max_fields=10, max_part_size=12 * 1024 * 1024)
    except Exception:  # noqa: BLE001
        return fail(400, "Send the proof as a form upload.")
    reference = clean(form.get("quoteReference") if isinstance(form.get("quoteReference"), str) else "", 40).upper()
    note = clean(form.get("note") if isinstance(form.get("note"), str) else "", 600)
    file = form.get("file")
    if not reference:
        return fail(400, "Enter the quote reference.")
    if not isinstance(file, UploadFile) or not file.size:
        return fail(400, "Choose the proof file.")
    if file.size > PROOF_MAX_BYTES:
        return fail(400, "The proof must be 5 MB or smaller.")
    data = await file.read()
    mime = sniff_type(data)
    if not mime:
        return fail(400, "Upload the proof as a PNG, JPEG, WebP or PDF.")
    quote = await find_quote(reference)
    if not quote:
        return fail(409, "No quote matches that reference.")

    proof_id = f"PRF-{secrets.token_hex(4).upper()}"
    stored = f"{proof_id}.{EXTENSIONS[mime]}"
    file_name = clean(file.filename or "", 120) or f"proof.{EXTENSIONS[mime]}"
    async with connection() as conn:
        # One upload per quote at a time, so versions are numbered without gaps or clashes.
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"proofs:{reference}",))
        existing = await (
            await conn.execute(
                "SELECT version, status FROM design_proofs WHERE quote_reference = %s ORDER BY version DESC",
                (reference,),
            )
        ).fetchall()
        if any(p["status"] == "approved" for p in existing):
            return fail(409, "The customer has already approved a proof for this quote. Production uses that version.")
        version = (existing[0]["version"] if existing else 0) + 1
        await save_file(f"proof-files/{stored}", data, mime)
        # A new version replaces any version still waiting for the customer.
        await conn.execute(
            "UPDATE design_proofs SET status = 'superseded' WHERE quote_reference = %s AND status = 'pending'",
            (reference,),
        )
        await conn.execute(
            """INSERT INTO design_proofs (id, quote_reference, version, file_name, stored_as, mime_type, size,
                 staff_note, uploaded_by, created_at, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')""",
            (proof_id, reference, version, file_name, stored, mime, len(data), note, staff.email, _now_iso()),
        )
        await audit.record(
            conn, request, staff, "proof.upload", "quote", reference,
            {"proofId": proof_id, "version": version, "file": file_name, "size": len(data)},
        )  # fmt: skip
    await send_email(quote["email"], proof_ready_email(reference, version, note))
    return JSONResponse({"ok": True, "version": version})


@router.get("/api/admin/proofs", summary="Proofs, newest first (staff)")
async def staff_list(
    _: Annotated[Staff, Depends(require(Permission.PROOFS_READ))],
    reference: Annotated[str | None, Query(alias="quoteReference", max_length=40)] = None,
    status: Annotated[Literal["pending", "approved", "changes", "superseded"] | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 25,
) -> JSONResponse:
    where, params = [], []
    if reference:
        where.append("quote_reference = %s")
        params.append(reference.strip().upper())
    if status:
        where.append("status = %s")
        params.append(status)
    clause = f"WHERE {' AND '.join(where)}" if where else ""
    count_sql = f"SELECT COUNT(*) AS n FROM design_proofs {clause}"  # noqa: S608 - fixed fragments, bound values
    page_sql = f"SELECT * FROM design_proofs {clause} ORDER BY created_at DESC, id LIMIT %s OFFSET %s"  # noqa: S608
    async with connection() as conn:
        total = (await (await conn.execute(count_sql, params)).fetchone())["n"]
        rows = await (await conn.execute(page_sql, [*params, page_size, (page - 1) * page_size])).fetchall()
    return JSONResponse(
        {"ok": True, "items": [_proof(r) for r in rows], "page": page, "pageSize": page_size, "total": total}
    )


# ---------- Customer ----------


@router.get("/api/proofs", summary="The signed-in customer's proof threads, most recent first")
async def customer_threads(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to review your proofs.")
    async with connection() as conn:
        rows = await (await conn.execute("SELECT * FROM design_proofs ORDER BY version DESC")).fetchall()
    by_quote: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_quote.setdefault(row["quote_reference"], []).append(_proof(row))
    threads = [
        {"reference": reference, "proofs": proofs}
        for reference, proofs in by_quote.items()
        if await customer_can_see(reference, user)
    ]
    threads.sort(key=lambda t: t["proofs"][0]["createdAt"], reverse=True)
    return JSONResponse({"ok": True, "threads": threads})


@router.post("/api/proofs", summary="The customer approves a proof or asks for changes")
async def decide(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to review your proofs.")
    body = await json_body(request) or {}
    decision = body.get("decision")
    if decision not in ("approved", "changes"):
        return fail(400, "Choose approve or request changes.")
    row = await _find(clean(body.get("proofId"), 20))
    # Same answer for "doesn't exist" and "not yours", so proof IDs can't be probed.
    if not row or not await customer_can_see(row["quote_reference"], user):
        return fail(404, "That proof wasn't found.")
    if decision == "approved" and body.get("confirm") is not True:
        return fail(400, "Confirm you've checked the wording, sizes and colours.")
    comment = clean(body.get("comment"), 1000)
    if decision == "changes" and len(comment) < 5:
        return fail(400, "Tell us what to change.")
    if row["status"] != "pending":
        return fail(409, "This version has already been decided or replaced by a newer one.")
    async with connection() as conn:
        updated = await conn.execute(
            "UPDATE design_proofs SET status = %s, decided_at = %s, decided_by = %s, customer_comment = %s "
            "WHERE id = %s AND status = 'pending'",
            (decision, _now_iso(), user["email"], comment, row["id"]),
        )
    if updated.rowcount != 1:
        return fail(409, "This version has already been decided.")
    await send_email(
        staff_alert_emails(),
        staff_proof_decision_email(row["quote_reference"], row["version"], decision, comment, user["email"]),
    )
    return JSONResponse({"ok": True})


# ---------- Files ----------


def _file_response(data: bytes, content_type: str, disposition: str) -> Response:
    return Response(
        data,
        media_type=content_type,
        headers={"content-disposition": disposition, "cache-control": "private, no-store"},
    )


@router.get("/api/proofs/{proof_id}/file", summary="A proof file, for staff or the customer whose quote it is")
async def proof_file(proof_id: str, request: Request) -> Response:
    row = await _find(proof_id[:20])
    if not row:
        return Response("Not found", status_code=404, media_type="text/plain")
    staff = await read_staff(request)
    if not (staff and staff.can(Permission.PROOFS_READ)):
        user = await read_session(request)
        if not user or not await customer_can_see(row["quote_reference"], user):
            return Response("Not found", status_code=404, media_type="text/plain")
    data = await load_file(f"proof-files/{PurePath(row['stored_as']).name}")
    if data is None:
        return Response("Not found", status_code=404, media_type="text/plain")
    extension = row["stored_as"].rsplit(".", 1)[-1]
    name = f"{row['quote_reference']}-v{row['version']}.{extension}"
    return _file_response(data, row["mime_type"], f'inline; filename="{name}"')


@router.get("/api/admin/quotes/{reference}/file", summary="A quote's attachment (staff)")
async def quote_file(reference: str, request: Request) -> Response:
    staff = await read_staff(request)
    if not (staff and staff.can(Permission.QUOTES_READ)):
        return Response("Not found", status_code=404, media_type="text/plain")
    quote = await find_quote(reference[:40])
    attachment = (quote or {}).get("attachment") or {}
    stored = attachment.get("storedAs")
    if not quote or not stored:
        return Response("Not found", status_code=404, media_type="text/plain")
    name = PurePath(stored).name
    data = await load_file(f"quote-files/{name}")
    if data is None:
        return Response("Not found", status_code=404, media_type="text/plain")
    if staff:
        async with connection() as conn:
            # Downloading a customer's file is worth a trace.
            await audit.record(conn, request, staff, "quote.file.download", "quote", quote["reference"], {"file": name})
    return _file_response(data, attachment.get("type") or "application/octet-stream", f'attachment; filename="{name}"')
