"""Baseline: distributors and trade orders (MIG-007b). Created by the site
(src/lib/distributors/store.ts); IF NOT EXISTS, so nothing changes where it has run.

Revision ID: 0007
"""

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS distributors (
      user_id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      gstin TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      territory_request TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      tier TEXT NOT NULL DEFAULT 'silver',
      territory TEXT NOT NULL DEFAULT '',
      credit_limit INTEGER NOT NULL DEFAULT 0,
      quarterly_target INTEGER NOT NULL DEFAULT 0,
      review_date TEXT NOT NULL DEFAULT '',
      decided_at TEXT,
      decided_by TEXT NOT NULL DEFAULT '',
      decision_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS distributor_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      items TEXT NOT NULL,
      list_subtotal INTEGER NOT NULL,
      discount_rate REAL NOT NULL,
      net_total INTEGER NOT NULL,
      payment_terms TEXT NOT NULL,
      status TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      paid_at TEXT,
      payment_ref TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS distributor_orders_user ON distributor_orders(user_id);
    """)


def downgrade() -> None:
    pass  # The site depends on these tables.
