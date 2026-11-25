"""Baseline: accounts, sessions, carts, wishlists and rate limits.

These tables already exist wherever the Next.js site has run (it creates them
on first request), so every statement is IF NOT EXISTS: this is safe to run
on a live database and changes nothing there.

Revision ID: 0001
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at BIGINT NOT NULL,
      used_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      line TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal TEXT NOT NULL,
      country TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS wishlist_items (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS saved_configs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      product_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_quotes (
      reference TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS carts (
      user_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      bucket TEXT NOT NULL,
      at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rate_limit_hits_bucket ON rate_limit_hits(bucket, at);
    """)


def downgrade() -> None:
    # The site depends on these tables; dropping them is never part of a rollback.
    pass
