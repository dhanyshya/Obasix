"""Input clean-up shared by the routers. Matches clean() in the site's route handlers."""

import json
import re
from typing import Any

from fastapi import Request

from app.core import js

_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_SPACE = re.compile(r"\s+")


def clean(value: Any, limit: int) -> str:
    """String(value ?? ""), control characters and runs of spaces collapsed, trimmed, cut to `limit`."""
    text = "" if value is None else js.string(value)
    return _SPACE.sub(" ", _CONTROL.sub(" ", text)).strip()[:limit]


def raw_string(value: Any) -> str:
    """String(value ?? "") with no clean-up (passwords)."""
    return "" if value is None else js.string(value)


async def json_body(request: Request) -> dict[str, Any] | None:
    """The body as an object, as the site reads it: None when it can't be read or is empty."""
    try:
        body = json.loads(await request.body())
    except ValueError:
        return None
    if not body:
        return None
    return body if isinstance(body, dict) else {}


def dumps(value: Any) -> str:
    """JSON.stringify output, for payloads the site also reads."""
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
