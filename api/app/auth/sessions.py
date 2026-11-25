"""Cookie sessions in the shared `sessions` table (the same cookie the site uses)."""

import time
from typing import Any

from fastapi import Request, Response

from app.core.config import get_settings
from app.core.db import connection
from app.core.security import hash_token, new_token

COOKIE = "obasix_session"
SESSION_MS = 14 * 24 * 60 * 60 * 1000


def now_ms() -> int:
    return int(time.time() * 1000)


async def read_session(request: Request) -> dict[str, Any] | None:
    """The signed-in customer, or None. Expired sessions are deleted when seen."""
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    token_hash = hash_token(token)
    async with connection() as conn:
        row = await (
            await conn.execute(
                """SELECT users.id, users.email, users.name, users.phone, users.company, users.role, sessions.expires_at
                   FROM sessions JOIN users ON users.id = sessions.user_id
                   WHERE sessions.token_hash = %s""",
                (token_hash,),
            )
        ).fetchone()
        if not row or row["expires_at"] < now_ms() or row["role"] != "customer":
            if row:
                await conn.execute("DELETE FROM sessions WHERE token_hash = %s", (token_hash,))
            return None
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "phone": row["phone"],
        "company": row["company"],
        "role": "customer",
    }


async def create_session(response: Response, user_id: str) -> None:
    token = new_token()
    async with connection() as conn:
        await conn.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (%s, %s, %s)",
            (hash_token(token), user_id, now_ms() + SESSION_MS),
        )
    response.set_cookie(
        COOKIE,
        token,
        max_age=SESSION_MS // 1000,
        path="/",
        httponly=True,
        samesite="lax",
        secure=get_settings().production,
    )


async def destroy_session(request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE)
    if token:
        async with connection() as conn:
            await conn.execute("DELETE FROM sessions WHERE token_hash = %s", (hash_token(token),))
    response.set_cookie(COOKIE, "", max_age=0, path="/", httponly=True)
