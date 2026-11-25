"""/api/auth: the same path, query actions and responses as the site's route handler."""

from typing import Annotated, Any, Literal

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from app.auth import schemas, service
from app.auth.sessions import read_session
from app.core.config import get_settings
from app.core.http import client_address, fail, trusted_origin
from app.core.ratelimit import allow_attempt
from app.core.text import json_body

router = APIRouter(prefix="/api/auth", tags=["auth"])

Action = Literal["register", "login", "logout", "forgot", "reset"]


@router.get("", response_model=schemas.SessionOut, summary="The signed-in customer")
async def current(request: Request) -> dict[str, Any]:
    return {"user": await read_session(request)}


@router.post(
    "",
    summary="Register, sign in, sign out, or reset a password",
    description="`action` picks the operation. Bodies: register → RegisterIn, login → LoginIn, "
    "forgot → ForgotIn, reset → ResetIn, logout → none. Errors are `{ok: false, message}` "
    "or `{ok: false, errors: {field: message}}`.",
    responses={
        200: {"model": schemas.SignedIn},
        400: {"model": schemas.Failure},
        401: {"model": schemas.Failure},
        403: {"model": schemas.Failure},
        409: {"model": schemas.Failure},
        429: {"model": schemas.Failure},
        503: {"model": schemas.Failure},
    },
)
async def act(request: Request, action: Annotated[str | None, Query()] = None) -> JSONResponse:
    if not get_settings().auth_configured:
        return JSONResponse(
            {
                "ok": False,
                "message": "Accounts are not available. Set AUTH_SECRET on the server before production sign-in.",
                "required": ["AUTH_SECRET"],
            },
            status_code=503,
        )
    if not trusted_origin(request):
        return fail(403, "The account request was rejected.")
    # Same bucket name as the site, so both count toward one limit.
    bucket = f"auth:{client_address(request)}:{action if action is not None else 'null'}"
    if not await allow_attempt(bucket, 8, 10 * 60 * 1000):
        return fail(429, "Too many attempts. Wait a few minutes and try again.")
    if action == "logout":
        return await service.logout(request)
    body = await json_body(request)
    if body is None:
        return fail(400, "The request could not be read.")
    handlers = {"register": service.register, "login": service.login, "forgot": service.forgot, "reset": service.reset}
    handler = handlers.get(action or "")
    if handler is None:
        return fail(404, "Unknown account action.")
    return await handler(body)
