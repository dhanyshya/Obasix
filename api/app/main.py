"""OBASIX API. Run with: uv run uvicorn app.main:app --reload"""

import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from app.account.router import router as account_router
from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.core import db
from app.core.config import get_settings
from app.core.logging import configure_logging, request_id
from app.quotes.router import router as quotes_router

log = logging.getLogger("obasix.api")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    await db.open_pool(settings.database_url, settings.database_pool_max)
    try:
        yield
    finally:
        await db.close_pool()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment, send_default_pii=False)

    app = FastAPI(
        title="OBASIX API",
        version="0.1.0",
        lifespan=lifespan,
        # Interactive docs outside production only.
        docs_url=None if settings.production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.production else "/openapi.json",
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex
        token = request_id.set(rid)
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            log.exception("Unhandled error", extra={"method": request.method, "path": request.url.path})
            response = JSONResponse({"ok": False, "message": "Something went wrong. Try again."}, status_code=500)
        response.headers["x-request-id"] = rid
        # Nothing here should ever be framed or content-sniffed.
        # Not "cache-control: no-store": through the site's proxy it left Chrome's fetches
        # open (MIG-004, docs/migrations/tracking.md). API responses carry no validators or
        # expiry, so browsers don't cache them anyway.
        response.headers.setdefault("x-content-type-options", "nosniff")
        response.headers.setdefault("x-frame-options", "DENY")
        response.headers.setdefault("referrer-policy", "same-origin")
        if settings.production:
            response.headers.setdefault("strict-transport-security", "max-age=63072000; includeSubDomains")
        log.info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 1),
            },
        )
        request_id.reset(token)
        return response

    @app.exception_handler(HTTPException)
    async def http_error(_: Request, error: HTTPException) -> JSONResponse:
        return JSONResponse({"ok": False, "message": str(error.detail)}, status_code=error.status_code)

    @app.exception_handler(RequestValidationError)
    async def invalid(_: Request, error: RequestValidationError) -> JSONResponse:
        return JSONResponse({"ok": False, "message": "The request could not be read."}, status_code=400)

    @app.get("/health", tags=["ops"], summary="Liveness and database check")
    async def health() -> JSONResponse:
        try:
            async with db.connection() as conn:
                await conn.execute("SELECT 1")
        except Exception:
            log.exception("Health check failed")
            return JSONResponse({"ok": False, "database": "unreachable"}, status_code=503)
        return JSONResponse({"ok": True, "database": "ok"})

    # Only for browser apps on their own origin (the admin app on a separate domain).
    # Same-origin callers (the site's proxy, the admin app's dev proxy) don't need it.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["content-type", "x-request-id"],
        expose_headers=["x-request-id"],
        max_age=600,
    )

    app.include_router(auth_router)
    app.include_router(account_router)
    app.include_router(admin_router)
    app.include_router(quotes_router)
    return app


app = create_app()
