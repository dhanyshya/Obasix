"""Baseline: partners and their projects (MIG-007c). Created by the site
(src/lib/partners/store.ts); IF NOT EXISTS, so nothing changes where it has run.

Revision ID: 0008
"""

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS partners (
      user_id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      partner_type TEXT NOT NULL,
      gstin TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      sectors TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      decision_note TEXT NOT NULL DEFAULT '',
      decided_by TEXT NOT NULL DEFAULT '',
      decided_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS partner_projects (
      id TEXT PRIMARY KEY,
      partner_user_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_key TEXT NOT NULL,
      city TEXT NOT NULL,
      sector TEXT NOT NULL,
      scope TEXT NOT NULL,
      expected_value INTEGER NOT NULL,
      expected_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      quoted_value INTEGER NOT NULL DEFAULT 0,
      margin_rate REAL NOT NULL DEFAULT 0,
      linked_order_id TEXT UNIQUE,
      conflict_with TEXT NOT NULL DEFAULT '',
      staff_note TEXT NOT NULL DEFAULT '',
      payout_ref TEXT NOT NULL DEFAULT '',
      protected_until TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS partner_projects_partner ON partner_projects(partner_user_id);
    CREATE INDEX IF NOT EXISTS partner_projects_client ON partner_projects(client_key);
    """)


def downgrade() -> None:
    pass  # The site depends on these tables.
