"""Alembic runs plain SQL migrations against DATABASE_URL (no ORM models)."""

from alembic import context
from sqlalchemy import create_engine

from app.core.config import get_settings


def _url() -> str:
    url = get_settings().database_url
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def run() -> None:
    if context.is_offline_mode():
        context.configure(url=_url(), literal_binds=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = create_engine(_url())
    with engine.connect() as connection:
        context.configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()


run()
