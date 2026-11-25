"""The admin audit log: one row per staff change, written in the change's own transaction."""

import json
from typing import Any

from fastapi import Request
from psycopg import AsyncConnection

from app.admin.rbac import Staff
from app.core.http import client_address
from app.core.logging import request_id


async def record(
    conn: AsyncConnection[dict[str, Any]],
    request: Request,
    staff: Staff,
    action: str,
    target_type: str,
    target_id: str,
    detail: dict[str, Any],
) -> None:
    await conn.execute(
        """INSERT INTO audit_log (actor_email, actor_role, action, target_type, target_id, detail, request_id, ip)
           VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, %s)""",
        (
            staff.email,
            staff.role,
            action,
            target_type,
            target_id,
            json.dumps(detail),
            request_id.get(),
            client_address(request),
        ),
    )
