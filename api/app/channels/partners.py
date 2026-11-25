"""Project partners: a port of src/lib/partners/* and its routes.

Partners bring institutional bulk projects. A registered client is protected for 90 days; a second
partner registering the same client is held as a conflict. Staff quote a negotiated margin, move
projects to delivery, and pay the margin out. One order earns one payout: never both a partner
margin and an associate commission.
"""

import json
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.admin import audit
from app.admin.deps import NOT_FOUND, require
from app.admin.rbac import Permission, Staff, read_staff
from app.auth.sessions import read_session
from app.channels.distributors import GSTIN_RE
from app.commerce.store import now_iso
from app.core import js
from app.core.db import connection
from app.core.http import fail, trusted_origin
from app.core.money import format_inr
from app.core.text import clean, json_body

router = APIRouter(tags=["partners"])

PARTNER_TYPES = [
    "Fit-out or interior contractor", "Facility management company", "Real estate developer",
    "Institutional procurement consultant", "Signage installer", "HSN Group company", "Other",
]  # fmt: skip
SECTORS = [
    "School or college", "Hospital or clinic", "Hotel", "Co-working or office", "Residential project",
    "Retail chain", "Government or PSU", "Other",
]  # fmt: skip
PROTECTION_DAYS = 90
MINIMUM_PROJECT_VALUE = 100000
MAX_MARGIN = 0.3
RESEND_WINDOW = timedelta(minutes=2)
NEXT_STATUS = {"Quoted": "Won", "Won": "In production", "In production": "Delivered"}
WON = ["Won", "In production", "Delivered", "Paid"]


def client_key(name: str, city: str) -> str:
    """ "ABC Public School", "abc public school " and "ABC Public School." in one city are one client."""

    def norm(s: str) -> str:
        return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

    return f"{norm(name)}|{norm(city)}"


def js_date_ok(value: str) -> bool:
    """YYYY-MM-DD that Date.parse accepts: months 1-12, days 1-31 in any month (V8 rolls 02-30 over)."""
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", value)
    return bool(match) and 1 <= int(match[2]) <= 12 and 1 <= int(match[3]) <= 31


def to_partner(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "userId": row["user_id"], "companyName": row["company_name"], "partnerType": row["partner_type"],
        "gstin": row["gstin"], "city": row["city"], "state": row["state"], "sectors": json.loads(row["sectors"]),
        "notes": row["notes"], "status": row["status"], "decisionNote": row["decision_note"],
        "decidedBy": row["decided_by"], "createdAt": row["created_at"],
    }  # fmt: skip


def to_project(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"], "partnerUserId": row["partner_user_id"], "clientName": row["client_name"],
        "city": row["city"], "sector": row["sector"], "scope": row["scope"], "expectedValue": row["expected_value"],
        "expectedDate": row["expected_date"], "status": row["status"], "quotedValue": row["quoted_value"],
        "marginRate": row["margin_rate"], "earning": js.round_half_up(row["quoted_value"] * row["margin_rate"]),
        "linkedOrderId": row["linked_order_id"], "conflictWith": row["conflict_with"], "staffNote": row["staff_note"],
        "payoutRef": row["payout_ref"], "protectedUntil": row["protected_until"], "createdAt": row["created_at"],
        "updatedAt": row["updated_at"], "updatedBy": row["updated_by"],
    }  # fmt: skip


async def find(user_id: str) -> dict[str, Any] | None:
    async with connection() as conn:
        row = await (await conn.execute("SELECT * FROM partners WHERE user_id = %s", (user_id,))).fetchone()
    return to_partner(row) if row else None


async def projects_of(user_id: str) -> list[dict[str, Any]]:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                "SELECT * FROM partner_projects WHERE partner_user_id = %s ORDER BY created_at DESC", (user_id,)
            )
        ).fetchall()
    return [to_project(r) for r in rows]


# ---------- Partner ----------


@router.post("/api/partners", summary="apply, or register-project (approved partners)")
async def partner_action(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in first.")
    body = await json_body(request) or {}
    partner = await find(user["id"])

    if body.get("action") == "apply":
        if partner and partner["status"] != "rejected":
            return JSONResponse({"ok": True})
        company = clean(body.get("companyName"), 100)
        gstin = re.sub(r"\s", "", clean(body.get("gstin"), 15).upper())
        city, state, notes = clean(body.get("city"), 60), clean(body.get("state"), 60), clean(body.get("notes"), 1000)
        raw = body.get("sectors")
        sectors = list(dict.fromkeys(s for s in raw if s in SECTORS)) if isinstance(raw, list) else []
        if len(company) < 2:
            return fail(400, "Enter your registered company name.")
        if body.get("partnerType") not in PARTNER_TYPES:
            return fail(400, "Choose your type of business.")
        if not GSTIN_RE.match(gstin):
            return fail(400, "Enter a valid 15-character GSTIN.")
        if len(city) < 2 or len(state) < 2:
            return fail(400, "Enter your city and state.")
        if not sectors:
            return fail(400, "Choose at least one sector you work in.")
        if body.get("accept") is not True:
            return fail(400, "Accept the partner terms to apply.")
        async with connection() as conn:
            await conn.execute(
                """INSERT INTO partners (user_id, company_name, partner_type, gstin, city, state, sectors, notes,
                     status, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
                   ON CONFLICT (user_id) DO UPDATE SET company_name = excluded.company_name,
                     partner_type = excluded.partner_type, gstin = excluded.gstin, city = excluded.city,
                     state = excluded.state, sectors = excluded.sectors, notes = excluded.notes, status = 'pending',
                     decision_note = '', decided_by = '', decided_at = NULL, created_at = excluded.created_at
                   WHERE partners.status = 'rejected'""",
                (user["id"], company, body["partnerType"], gstin, city, state, json.dumps(sectors), notes, now_iso()),
            )
        return JSONResponse({"ok": True})

    if body.get("action") == "register-project":
        if not partner or partner["status"] != "approved":
            return fail(403, "Only approved partners can register projects.")
        client = clean(body.get("clientName"), 120)
        city, scope = clean(body.get("city"), 60), clean(body.get("scope"), 1500)
        expected_date = clean(body.get("expectedDate"), 10)
        value = js.number(body.get("expectedValue"))
        expected_value = js.round_half_up(value) if value == value and abs(value) != float("inf") else None
        if len(client) < 2:
            return fail(400, "Enter the client's name.")
        if len(city) < 2:
            return fail(400, "Enter the project city.")
        if body.get("sector") not in SECTORS:
            return fail(400, "Choose the project's sector.")
        if len(scope) < 10:
            return fail(400, "Describe the scope: rooms, boards, signage and quantities.")
        if expected_value is None or not 1 <= expected_value <= 1e9:
            return fail(400, "Enter the expected project value in rupees.")
        if not js_date_ok(expected_date):
            return fail(400, "Enter the expected order date.")
        if expected_value < MINIMUM_PROJECT_VALUE:
            return fail(409, f"Projects start at {format_inr(MINIMUM_PROJECT_VALUE)}. Smaller orders can go through "
                             "the website or the associate programme.")  # fmt: skip
        key = client_key(client, city)
        now = datetime.now(UTC)
        async with connection() as conn:
            # One registration at a time per partner, and per client across partners.
            await conn.execute("SELECT 1 FROM partners WHERE user_id = %s FOR UPDATE", (user["id"],))
            await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"client:{key}",))
            open_row = await (
                await conn.execute(
                    """SELECT id, partner_user_id, created_at FROM partner_projects
                       WHERE client_key = %s AND status NOT IN ('Lost', 'Paid') AND protected_until > %s
                       ORDER BY created_at LIMIT 1""",
                    (key, now_iso()),
                )
            ).fetchone()
            if open_row and open_row["partner_user_id"] == user["id"]:
                created = datetime.fromisoformat(open_row["created_at"].replace("Z", "+00:00"))
                if now - created < RESEND_WINDOW:
                    return JSONResponse({"ok": True, "id": open_row["id"]})  # the same form sent again
                return fail(409, f"You already registered this client ({open_row['id']}).")
            project_id = f"PRJ-{secrets.token_hex(3).upper()}"
            stamp = now.isoformat(timespec="milliseconds")[:-6] + "Z"
            protected = (now + timedelta(days=PROTECTION_DAYS)).isoformat(timespec="milliseconds")[:-6] + "Z"
            await conn.execute(
                """INSERT INTO partner_projects (id, partner_user_id, client_name, client_key, city, sector, scope,
                     expected_value, expected_date, conflict_with, protected_until, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (project_id, user["id"], client, key, city, body["sector"], scope, expected_value, expected_date,
                 open_row["id"] if open_row else "", protected, stamp, stamp),
            )  # fmt: skip
        # Only the new id: a held registration mustn't reveal the earlier partner's project.
        return JSONResponse({"ok": True, "id": project_id})

    return fail(400, "Unknown action.")


@router.get("/api/partners/me", summary="The signed-in partner's profile and projects")
async def me(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in first.")
    partner = await find(user["id"])
    if not partner:
        return fail(404, "This account hasn't applied to be a partner.")
    own = await projects_of(user["id"])
    # The partner sees that a project is held, not whose project holds it.
    shown = [{**p, "conflictWith": "held" if p["conflictWith"] else ""} for p in own]
    return JSONResponse({"ok": True, "partner": partner, "projects": shown})


# ---------- Staff ----------


@router.get("/api/admin/partners", summary="Partners, pending first, with projects and earnings")
async def staff_partners(_: Annotated[Staff, Depends(require(Permission.PARTNERS_READ))]) -> JSONResponse:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                """SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
                   FROM partners p LEFT JOIN users u ON u.id = p.user_id
                   ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END, p.created_at DESC"""
            )
        ).fetchall()
    items = []
    for r in rows:
        own = await projects_of(r["user_id"])
        items.append({**to_partner(r), "name": r["user_name"] or "", "email": r["user_email"] or "",
                      "phone": r["user_phone"] or "", "projects": len(own),
                      "wonValue": sum(p["quotedValue"] for p in own if p["status"] in WON),
                      "earned": sum(p["earning"] for p in own if p["status"] == "Paid")})  # fmt: skip
    return JSONResponse({"ok": True, "items": items})


@router.get("/api/admin/projects", summary="Partner projects: submitted first, then delivered")
async def staff_projects(_: Annotated[Staff, Depends(require(Permission.PARTNERS_READ))]) -> JSONResponse:
    async with connection() as conn:
        rows = await (
            await conn.execute(
                """SELECT pp.*, p.company_name AS partner_company, u.email AS partner_email
                   FROM partner_projects pp LEFT JOIN partners p ON p.user_id = pp.partner_user_id
                   LEFT JOIN users u ON u.id = pp.partner_user_id
                   ORDER BY CASE pp.status WHEN 'Submitted' THEN 0 WHEN 'Delivered' THEN 1 ELSE 2 END,
                     pp.created_at DESC"""
            )
        ).fetchall()
    return JSONResponse({"ok": True, "items": [{**to_project(r), "partnerCompany": r["partner_company"] or "Unknown",
                                                "partnerEmail": r["partner_email"] or ""} for r in rows]})  # fmt: skip


@router.post("/api/admin/partners", summary="decide / quote / advance / lose / pay")
async def staff_action(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    staff = await read_staff(request)
    if staff is None:
        return fail(404, NOT_FOUND)
    body = await json_body(request) or {}
    action, note = clean(body.get("action"), 30), clean(body.get("note"), 500)
    needs = Permission.PARTNERS_APPROVE if action in ("decide", "quote", "pay") else Permission.PARTNERS_WRITE
    if action in ("decide", "quote", "advance", "lose", "pay") and not staff.can(needs):
        return fail(403, "You don't have permission to do that.")

    if action == "decide":
        status = body.get("status")
        if status not in ("approved", "rejected", "suspended"):
            return fail(400, "Choose a decision.")
        if status != "approved" and len(note) < 3:
            return fail(400, "Add a note explaining the decision.")
        user_id = clean(body.get("userId"), 60)
        async with connection() as conn:
            changed = await conn.execute(
                "UPDATE partners SET status = %s, decision_note = %s, decided_by = %s, decided_at = %s "
                "WHERE user_id = %s",
                (status, note, staff.email, now_iso(), user_id),
            )
            if changed.rowcount:
                await audit.record(conn, request, staff, "partner.decide", "partner", user_id,
                                   {"after": status, "note": note})  # fmt: skip
        return JSONResponse({"ok": True}) if changed.rowcount else fail(404, "No partner application found.")

    if action not in ("quote", "advance", "lose", "pay"):
        return fail(400, "Unknown action.")
    project_id = clean(body.get("projectId"), 20)
    fields: dict[str, Any]
    if action == "quote":
        quoted = js.number(body.get("quotedValue"))
        margin_percent = js.number(body.get("marginPercent"))
        if quoted != quoted or abs(quoted) == float("inf") or js.round_half_up(quoted) > 1e9:
            return fail(400, "Enter the quoted value in rupees.")
        if margin_percent != margin_percent or abs(margin_percent) == float("inf"):
            return fail(400, "Enter the negotiated margin as a percentage.")
        quoted_value = js.round_half_up(quoted)
        margin_rate = js.round_half_up(margin_percent * 10) / 1000

    async with connection() as conn:
        row = await (
            await conn.execute("SELECT * FROM partner_projects WHERE id = %s FOR UPDATE", (project_id,))
        ).fetchone()
        if not row:
            return fail(409, "Project not found.")
        project = to_project(row)
        status = project["status"]
        if action == "quote":
            if status not in ("Submitted", "Quoted"):
                return fail(409, f"A {status.lower()} project can't be re-quoted.")
            if project["conflictWith"]:
                return fail(
                    409, f"This client was registered first in {project['conflictWith']}. Resolve that before quoting."
                )
            if quoted_value < 1:
                return fail(409, "Enter the quoted project value.")
            if not 0 <= margin_rate <= MAX_MARGIN:
                return fail(409, f"Set a margin between 0 and {round(MAX_MARGIN * 100)}%.")
            fields = {"status": "Quoted", "quoted_value": quoted_value, "margin_rate": margin_rate, "staff_note": note}
        elif action == "advance":
            following = NEXT_STATUS.get(status)
            if not following:
                return fail(409, f"A {status.lower()} project can't move forward from here.")
            fields = {"status": following, "staff_note": note or project["staffNote"]}
            order_id = clean(body.get("linkedOrderId"), 40)
            if following == "Won" and order_id:
                if not await (await conn.execute("SELECT 1 FROM demo_orders WHERE id = %s", (order_id,))).fetchone():
                    return fail(409, f"No website order {order_id} was found.")
                commission = await (
                    await conn.execute("SELECT status FROM associate_commissions WHERE source_id = %s", (order_id,))
                ).fetchone()
                if commission and commission["status"] != "void":
                    return fail(409, f"Order {order_id} already earns an associate commission. Void it first: "
                                     "one order earns one payout.")  # fmt: skip
                taken = await (
                    await conn.execute(
                        "SELECT id FROM partner_projects WHERE linked_order_id = %s AND id != %s",
                        (order_id, project_id),
                    )
                ).fetchone()
                if taken:
                    return fail(409, f"Order {order_id} already belongs to {taken['id']}.")
                fields["linked_order_id"] = order_id
        elif action == "lose":
            if status in ("Delivered", "Paid", "Lost"):
                return fail(409, f"A {status.lower()} project can't be marked lost.")
            if len(note) < 3:
                return fail(409, "Add a note explaining why the project was lost.")
            fields = {"status": "Lost", "staff_note": note}
        else:
            if status != "Delivered":
                return fail(409, "Partner margin is paid only after the project is delivered.")
            payout_ref = clean(body.get("payoutRef"), 60)
            if len(payout_ref) < 3:
                return fail(409, "Enter the payment or UTR reference.")
            fields = {"status": "Paid", "payout_ref": payout_ref}
        assignments = ", ".join(f"{column} = %s" for column in fields)  # column names are ours, never input
        await conn.execute(
            f"UPDATE partner_projects SET {assignments}, updated_at = %s, updated_by = %s WHERE id = %s",  # noqa: S608
            (*fields.values(), now_iso(), staff.email, project_id),
        )
        await audit.record(conn, request, staff, f"project.{action}", "project", project_id,
                           {"before": status, "after": fields["status"],
                            **{k: v for k, v in fields.items() if k not in ("status",)}})  # fmt: skip
        updated = await (await conn.execute("SELECT * FROM partner_projects WHERE id = %s", (project_id,))).fetchone()
    return JSONResponse({"ok": True, "project": to_project(updated)})
