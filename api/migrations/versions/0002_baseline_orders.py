"""Baseline: the orders table the account page reads (MIG-002).

The site creates and extends this table itself (src/lib/commerce/order-store.ts).
Every statement is IF NOT EXISTS, so this changes nothing where the site has run.

Revision ID: 0002
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS demo_orders (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      user_id TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      method TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      status TEXT NOT NULL,
      shipping TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS demo_orders_user ON demo_orders(user_id);
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS provider_order_id TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS paid_at TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS courier TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS staff_note TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS updated_by TEXT;
    ALTER TABLE demo_orders ADD COLUMN IF NOT EXISTS updated_at TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS demo_orders_provider_order
      ON demo_orders(provider_order_id) WHERE provider_order_id IS NOT NULL;
    """)


def downgrade() -> None:
    # The site depends on this table; dropping it is never part of a rollback.
    pass
