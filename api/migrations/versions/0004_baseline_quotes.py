"""Baseline: quote requests (MIG-005).

The site creates this table itself (src/lib/quotes/demo-store.ts); IF NOT EXISTS, so
this changes nothing where the site has run. FastAPI only reads it for now.

Revision ID: 0004
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS quote_requests (
      reference TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS quote_requests_created ON quote_requests(created_at);
    """)


def downgrade() -> None:
    # The site depends on this table; dropping it is never part of a rollback.
    pass
