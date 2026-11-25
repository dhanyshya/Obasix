"""Rate limiting shared with the Next.js site (same table, same bucket names)."""

import random
import time

from app.core.db import connection


async def allow_attempt(bucket: str, limit: int, window_ms: int) -> bool:
    now = int(time.time() * 1000)
    async with connection() as conn:
        # One lock per bucket, so concurrent requests can't all pass the count check.
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (bucket,))
        row = await (
            await conn.execute(
                "SELECT COUNT(*) AS n FROM rate_limit_hits WHERE bucket = %s AND at > %s", (bucket, now - window_ms)
            )
        ).fetchone()
        if row and row["n"] >= limit:
            return False
        await conn.execute("INSERT INTO rate_limit_hits (bucket, at) VALUES (%s, %s)", (bucket, now))
        if random.random() < 0.02:  # noqa: S311 - pruning schedule, not security
            await conn.execute("DELETE FROM rate_limit_hits WHERE at < %s", (now - 24 * 60 * 60 * 1000,))
    return True
