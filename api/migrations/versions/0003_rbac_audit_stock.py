"""Staff roles, the admin audit log, and the stock table (MIG-003).

`staff_roles` and `audit_log` are new and owned by the API. `product_stock` already
exists wherever the site has run (src/lib/stock/store.ts), so it is IF NOT EXISTS.

Revision ID: 0003
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_stock (
      product_id TEXT PRIMARY KEY,
      on_hand INTEGER NOT NULL,
      updated_by TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_roles (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
      granted_by TEXT NOT NULL,
      granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      at TIMESTAMPTZ NOT NULL DEFAULT now(),
      actor_email TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      detail JSONB NOT NULL DEFAULT '{}'::jsonb,
      request_id TEXT NOT NULL,
      ip TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log (at DESC);
    CREATE INDEX IF NOT EXISTS audit_log_actor ON audit_log (actor_email, at DESC);
    CREATE INDEX IF NOT EXISTS audit_log_target ON audit_log (target_type, target_id, at DESC);
    """)
    # The log is append-only for the API's database role: no edits, no deletes.
    op.execute("""
    CREATE OR REPLACE FUNCTION audit_log_append_only() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit_log is append-only';
    END;
    $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS audit_log_no_change ON audit_log;
    CREATE TRIGGER audit_log_no_change BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS audit_log_no_change ON audit_log")
    op.execute("DROP FUNCTION IF EXISTS audit_log_append_only()")
    op.execute("DROP TABLE IF EXISTS audit_log")
    op.execute("DROP TABLE IF EXISTS staff_roles")
    # product_stock belongs to the site as well; it is never dropped here.
