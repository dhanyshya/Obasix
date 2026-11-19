import "server-only";

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool, types, type PoolClient } from "pg";

/**
 * One async database interface for the whole site.
 *
 * - DATABASE_URL set: Postgres (production, e.g. Neon through Vercel).
 * - Otherwise: the local SQLite file in .data/ (development and single-server installs).
 *
 * Write SQL once with "?" placeholders and portable syntax:
 *   - "INSERT ... ON CONFLICT (...) DO NOTHING / DO UPDATE" (both engines), not "INSERT OR IGNORE/REPLACE".
 *   - BIGINT for millisecond timestamps (Postgres INTEGER is 32-bit).
 *   - greatest0(expr) for "never below zero" (SQLite has no GREATEST).
 * Schema changes go through ensureSchema(), which runs once per process.
 */
export type Row = Record<string, unknown>;
export interface Db {
  get<T = Row>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  all<T = Row>(sql: string, ...params: unknown[]): Promise<T[]>;
  run(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  exec(sql: string): Promise<void>;
  /** Adds a column if it isn't there yet. */
  addColumn(table: string, column: string, definition: string): Promise<void>;
  transaction<T>(work: (tx: Db) => Promise<T>): Promise<T>;
  readonly engine: "postgres" | "sqlite";
}

export const usingPostgres = () => Boolean(process.env.DATABASE_URL);

/** SQL for max(expr, 0) in either engine. */
export const greatest0 = (expr: string) => (usingPostgres() ? `GREATEST(${expr}, 0)` : `MAX(${expr}, 0)`);

// ---------- Postgres ----------

// Return BIGINT / COUNT(*) and NUMERIC (SUM) as numbers, as SQLite does.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1700, (v) => Number(v));

function toPg(sql: string) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function pgDb(target: Pool | PoolClient): Db {
  const db: Db = {
    engine: "postgres",
    async get<T>(sql: string, ...params: unknown[]) {
      return (await target.query(toPg(sql), params)).rows[0] as T | undefined;
    },
    async all<T>(sql: string, ...params: unknown[]) {
      return (await target.query(toPg(sql), params)).rows as T[];
    },
    async run(sql: string, ...params: unknown[]) {
      return { changes: (await target.query(toPg(sql), params)).rowCount ?? 0 };
    },
    async exec(sql: string) {
      await target.query(sql);
    },
    async addColumn(table, column, definition) {
      await target.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
    },
    async transaction(work) {
      if (!(target instanceof Pool)) return work(db);
      const client = await target.connect();
      try {
        await client.query("BEGIN");
        const result = await work(pgDb(client));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
  return db;
}

// ---------- SQLite ----------

let sqliteQueue: Promise<void> = Promise.resolve();

function sqliteDb(database: DatabaseSync): Db {
  const db: Db = {
    engine: "sqlite",
    async get<T>(sql: string, ...params: unknown[]) {
      return database.prepare(sql).get(...(params as never[])) as T | undefined;
    },
    async all<T>(sql: string, ...params: unknown[]) {
      return database.prepare(sql).all(...(params as never[])) as T[];
    },
    async run(sql: string, ...params: unknown[]) {
      return { changes: Number(database.prepare(sql).run(...(params as never[])).changes) };
    },
    async exec(sql: string) {
      database.exec(sql);
    },
    async addColumn(table, column, definition) {
      const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (!columns.some((c) => c.name === column)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    },
    async transaction(work) {
      // node:sqlite is synchronous on one connection; a queue keeps transactions from interleaving.
      const run = sqliteQueue.then(async () => {
        database.exec("BEGIN");
        try {
          const result = await work(db);
          database.exec("COMMIT");
          return result;
        } catch (error) {
          database.exec("ROLLBACK");
          throw error;
        }
      });
      sqliteQueue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
  return db;
}

// ---------- Connection and schema ----------

type DbGlobal = { obasixDb?: Db; obasixSchema?: Map<string, Promise<void>> };
const globalForDb = globalThis as unknown as DbGlobal;

function connect(): Db {
  if (usingPostgres()) {
    return pgDb(new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX ?? 5) }));
  }
  const file = process.env.OBASIX_AUTH_DB || path.join(process.cwd(), ".data", "auth.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL;");
  return sqliteDb(database);
}

/** The raw connection. Stores use ensureSchema(), which also makes sure their tables exist. */
export function connection(): Db {
  // Kept on globalThis so dev-server reloads don't open a new pool each time.
  globalForDb.obasixDb ??= connect();
  return globalForDb.obasixDb;
}

/** Runs a store's schema setup once per process, then returns the connection. */
export async function ensureSchema(name: string, setup: (db: Db) => Promise<void>): Promise<Db> {
  const db = connection();
  const registry = (globalForDb.obasixSchema ??= new Map());
  let ready = registry.get(name);
  if (!ready) {
    ready = setup(db);
    registry.set(name, ready);
    // A failed setup is retried on the next call instead of being cached.
    ready.catch(() => registry.set(name, undefined as unknown as Promise<void>));
  }
  await ready;
  return db;
}
