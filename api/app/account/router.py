"""/api/account: the same path, query actions and responses as the site's route handler."""

from typing import Annotated

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from app.account import service
from app.auth.sessions import read_session
from app.core.http import fail, trusted_origin
from app.core.text import json_body

router = APIRouter(prefix="/api/account", tags=["account"])

_ERRORS = {
    400: {"description": "`{ok: false, message}` or `{ok: false, errors: {field: message}}`"},
    401: {"description": "Not signed in"},
    403: {"description": "Request from another site"},
    404: {"description": "Unknown action"},
}


@router.get("", summary="Everything on the account page", responses={401: _ERRORS[401]})
async def overview(request: Request) -> JSONResponse:
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to view this account.")
    return await service.overview(user)


@router.post(
    "",
    summary="Change the profile, password, addresses, wishlist, saved configurations or cart",
    description="`action`: profile {name, phone, company} · password {current, next} · "
    "address {line, city, state, postal, country} · wishlist {productId, remove?} · wishlist-sync {ids} · "
    "configuration {name, productId, quantity?, configuration} · cart {lines}.",
    responses=_ERRORS,
)
async def change(request: Request, action: Annotated[str | None, Query()] = None) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The account request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to change this account.")
    body = await json_body(request)
    if body is None:
        return fail(400, "The request could not be read.")
    handler = service.ACTIONS.get(action or "")
    if handler is None:
        return fail(404, "Unknown account action.")
    return await handler(user, body)


@router.delete("", summary="Remove an address or a saved configuration", responses=_ERRORS)
async def remove(
    request: Request,
    kind: Annotated[str | None, Query()] = None,
    id: Annotated[str | None, Query()] = None,  # noqa: A002 - the site's query name
) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The account request was rejected.")
    user = await read_session(request)
    if not user:
        return fail(401, "Sign in to change this account.")
    return await service.remove(user, kind, id)
