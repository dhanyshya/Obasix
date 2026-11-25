"""Access checks for admin endpoints."""

from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request

from app.admin.rbac import Permission, Staff, read_staff
from app.core.http import trusted_origin

NOT_FOUND = "Not found."


def require(permission: Permission, *, change: bool = False) -> Callable[[Request], Awaitable[Staff]]:
    """Dependency: the signed-in staff member, if they hold `permission`.

    change=True also refuses requests from other sites (403), checked first, as the site does.
    """

    async def check(request: Request) -> Staff:
        if change and not trusted_origin(request):
            raise HTTPException(403, "The request was rejected.")
        staff = await read_staff(request)
        if staff is None:
            raise HTTPException(404, NOT_FOUND)
        if not staff.can(permission):
            raise HTTPException(403, "You don't have permission to do that.")
        return staff

    return check
