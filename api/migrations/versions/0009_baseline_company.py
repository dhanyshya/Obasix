"""Baseline: company reorder accounts (MIG-007d). Created by the site (src/lib/company/store.ts);
IF NOT EXISTS, so nothing changes where it has run.

Revision ID: 0009
"""

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gstin TEXT NOT NULL DEFAULT '',
      billing_address TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS company_members (
      email TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id),
      role TEXT NOT NULL,
      added_by TEXT NOT NULL,
      added_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS company_members_company ON company_members(company_id);
    CREATE TABLE IF NOT EXISTS reorder_lists (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id),
      name TEXT NOT NULL,
      lines TEXT NOT NULL,
      source TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS reorder_lists_company ON reorder_lists(company_id);
    """)


def downgrade() -> None:
    pass  # The site depends on these tables.
