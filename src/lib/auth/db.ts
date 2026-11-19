import "server-only";

import { ensureSchema } from "@/lib/db";

/** Accounts, sessions, carts and wishlists. Returns the database once these tables exist. */
export function authDb() {
  return ensureSchema("auth", async (db) => {
    await db.exec(`
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
  `);
  });
}

export function authConfigured() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) return false;
  return true;
}
