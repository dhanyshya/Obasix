"""Request helpers shared by the routers."""

import hmac
from urllib.parse import urlsplit

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.config import get_settings


def fail(status: int, message: str | None = None, errors: dict[str, str] | None = None) -> JSONResponse:
    """The error shape the site's forms already read: {ok: false, message} or {ok: false, errors}."""
    body: dict[str, object] = {"ok": False}
    if message:
        body["message"] = message
    if errors:
        body["errors"] = errors
    return JSONResponse(body, status_code=status)


def trusted_origin(request: Request) -> bool:
    """Blocks cross-site form posts. The origin must be a configured one, or this API's own host."""
    origin = request.headers.get("origin")
    if not origin:
        return False
    settings = get_settings()
    allowed = settings.allowed_origins or [settings.site_url]
    if origin.rstrip("/") in [a.rstrip("/") for a in allowed]:
        return True
    host = request.headers.get("host")
    try:
        return bool(host) and urlsplit(origin).netloc == host
    except ValueError:
        return False


def client_address(request: Request) -> str:
    """The visitor's IP.

    Through the site's proxy: the IP it states, if the proxy secret matches.
    Behind another proxy you control: forwarded headers, with TRUST_PROXY_HEADERS=1.
    Otherwise every request counts as "local", as on the site in development.
    """
    settings = get_settings()
    secret = request.headers.get("x-obasix-proxy-secret", "")
    if settings.proxy_secret and hmac.compare_digest(secret.encode(), settings.proxy_secret.encode()):
        return request.headers.get("x-obasix-client-ip", "").strip() or "unknown"
    if settings.trust_proxy_headers:
        for header in ("x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"):
            value = request.headers.get(header, "").split(",")[0].strip()
            if value:
                return value
        return "unknown"
    return "local"
