"""Baseline: design proofs and the associate tables quote attribution writes to (MIG-005b).

Both are created by the site (src/lib/proofs/store.ts, src/lib/associates/store.ts);
IF NOT EXISTS, so this changes nothing where the site has run.

Revision ID: 0005
"""

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS design_proofs (
      id TEXT PRIMARY KEY,
      quote_reference TEXT NOT NULL,
      version INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      stored_as TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      staff_note TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      decided_at TEXT,
      decided_by TEXT,
      customer_comment TEXT NOT NULL DEFAULT '',
      UNIQUE (quote_reference, version)
    );
    CREATE INDEX IF NOT EXISTS design_proofs_quote ON design_proofs(quote_reference);

    CREATE TABLE IF NOT EXISTS associates (
      user_id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      profession TEXT NOT NULL,
      city TEXT NOT NULL,
      firm TEXT NOT NULL DEFAULT '',
      pan_last4 TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS associate_commissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL UNIQUE,
      base_amount INTEGER NOT NULL,
      rate REAL NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS associate_commissions_code ON associate_commissions(code);
    CREATE TABLE IF NOT EXISTS associate_quotes (
      reference TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      customer TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS associate_quotes_code ON associate_quotes(code);
    """)


def downgrade() -> None:
    pass  # The site depends on these tables.
