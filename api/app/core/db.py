"""Postgres connection pool. Queries use psycopg placeholders (%s) and return dict rows."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from psycopg import AsyncConnection
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

_pool: AsyncConnectionPool | None = None


async def open_pool(url: str, max_size: int) -> None:
    global _pool
    _pool = AsyncConnectionPool(url, min_size=1, max_size=max_size, kwargs={"row_factory": dict_row}, open=False)
    await _pool.open(wait=True, timeout=10)


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def connection() -> AsyncIterator[AsyncConnection[dict[str, Any]]]:
    """One connection for the duration of the block, committed at the end (rolled back on error)."""
    if _pool is None:
        raise RuntimeError("The database pool is not open.")
    async with _pool.connection() as conn:
        yield conn  # type: ignore[misc]
