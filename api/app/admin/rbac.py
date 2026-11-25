"""Staff roles and permissions.

A staff member is an ordinary customer account whose email has a role:
- every email in OBASIX_ADMIN_EMAILS is an `admin` (as on the site today; this can't be
  changed from the API, so there is always a way back in);
- other emails get a role in the `staff_roles` table, granted by an admin.

Signed-out visitors and customers get 404, so staff endpoints don't reveal themselves.
Staff without the permission an endpoint needs get 403.
"""

from dataclasses import dataclass
from enum import StrEnum

from fastapi import Request

from app.auth.sessions import read_session
from app.core.config import get_settings
from app.core.db import connection


class Permission(StrEnum):
    STOCK_READ = "stock:read"
    STOCK_WRITE = "stock:write"
    AUDIT_READ = "audit:read"
    STAFF_MANAGE = "staff:manage"


ROLE_PERMISSIONS: dict[str, frozenset[Permission]] = {
    "admin": frozenset(Permission),
    "staff": frozenset({Permission.STOCK_READ, Permission.STOCK_WRITE}),
}
ROLES = tuple(ROLE_PERMISSIONS)


@dataclass(frozen=True)
class Staff:
    user_id: str
    email: str
    name: str
    role: str
    source: str  # "config" (OBASIX_ADMIN_EMAILS) or "granted" (staff_roles)

    @property
    def permissions(self) -> frozenset[Permission]:
        return ROLE_PERMISSIONS[self.role]

    def can(self, permission: Permission) -> bool:
        return permission in self.permissions


async def role_for(email: str) -> tuple[str, str] | None:
    """(role, source) for an email, or None."""
    email = email.strip().lower()
    if email in get_settings().admin_emails:
        return "admin", "config"
    async with connection() as conn:
        row = await (await conn.execute("SELECT role FROM staff_roles WHERE email = %s", (email,))).fetchone()
    return (row["role"], "granted") if row and row["role"] in ROLE_PERMISSIONS else None


async def read_staff(request: Request) -> Staff | None:
    user = await read_session(request)
    if not user:
        return None
    found = await role_for(user["email"])
    if not found:
        return None
    return Staff(user["id"], user["email"].strip().lower(), user["name"], found[0], found[1])
