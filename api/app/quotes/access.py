"""Who may read a saved quote: a port of src/lib/quotes/access.ts.

The account that sent it (or whose email it carries), or the browser that submitted it.
The browser proof is the `obasix_quotes` cookie: comma-separated `REFERENCE.SIGNATURE`
tokens, the signature being base64url(HMAC-SHA256(AUTH_SECRET, "quote:" + reference)).
"""

import base64
import hashlib
import hmac
from typing import Any

from fastapi import Request

from app.core.config import get_settings
from app.core.db import connection

COOKIE = "obasix_quotes"


def sign(reference: str) -> str:
    secret = get_settings().auth_secret.encode()
    digest = hmac.new(secret, f"quote:{reference}".encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def cookie_references(request: Request) -> list[str]:
    """References this browser has proved it submitted. Unsigned or forged tokens are ignored."""
    if not get_settings().auth_secret:
        return []  # The site signs with a per-process secret then; nothing here can verify it.
    references = []
    for token in request.cookies.get(COOKIE, "").split(","):
        reference, _, signature = token.partition(".")
        if reference and signature and hmac.compare_digest(sign(reference).encode(), signature.encode()):
            references.append(reference)
    return references


async def can_view(quote: dict[str, Any], request: Request, user: dict[str, Any] | None) -> bool:
    if quote["reference"] in cookie_references(request):
        return True
    if not user:
        return False
    if str(quote.get("email", "")).strip().lower() == user["email"].strip().lower():
        return True
    async with connection() as conn:
        linked = await (
            await conn.execute(
                "SELECT 1 FROM customer_quotes WHERE reference = %s AND user_id = %s", (quote["reference"], user["id"])
            )
        ).fetchone()
    return linked is not None
