"""Payout columns on associate commissions (MIG-007a). The site adds them itself
(src/lib/associates/store.ts adminDb); IF NOT EXISTS, so nothing changes where it has run.

Revision ID: 0006
"""

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE associate_commissions ADD COLUMN IF NOT EXISTS paid_at TEXT;
    ALTER TABLE associate_commissions ADD COLUMN IF NOT EXISTS payout_ref TEXT NOT NULL DEFAULT '';
    ALTER TABLE associate_commissions ADD COLUMN IF NOT EXISTS void_reason TEXT NOT NULL DEFAULT '';
    """)


def downgrade() -> None:
    pass  # The site uses these columns.
