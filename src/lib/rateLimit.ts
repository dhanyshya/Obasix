import "server-only";

import { ensureSchema } from "@/lib/db";

/**
 * Shared rate limiting. Attempts are counted in the database, so every server
 * instance sees the same count (in-memory counters reset per instance and
 * per deploy). Old entries are pruned as new ones are written.
 */
function db() {
  return ensureSchema("rate-limit", async (database) => {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS rate_limit_hits (
        bucket TEXT NOT NULL,
        at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS rate_limit_hits_bucket ON rate_limit_hits(bucket, at);
    `);
  });
}

/** Records an attempt and returns false once `limit` attempts fall within the window. */
export async function allowAttempt(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const database = await db();
  const now = Date.now();
  const since = now - windowMs;
  const row = await database.get<{ n: number }>("SELECT COUNT(*) AS n FROM rate_limit_hits WHERE bucket = ? AND at > ?", bucket, since);
  if (Number(row?.n ?? 0) >= limit) return false;
  await database.run("INSERT INTO rate_limit_hits (bucket, at) VALUES (?, ?)", bucket, now);
  // Keep the table small: drop entries older than a day now and then.
  if (Math.random() < 0.02) await database.run("DELETE FROM rate_limit_hits WHERE at < ?", now - 24 * 60 * 60 * 1000);
  return true;
}

/**
 * The visitor's IP address, from a header the client can't forge.
 * - On Vercel: x-vercel-forwarded-for / x-real-ip, which Vercel sets itself.
 * - Behind another proxy you control: set TRUST_PROXY_HEADERS=1 to use X-Forwarded-For.
 * - Otherwise (local development): every request counts as "local".
 */
export function clientAddress(request: Request) {
  const first = (value: string | null) => value?.split(",")[0]?.trim() || "";
  if (process.env.VERCEL) {
    return first(request.headers.get("x-vercel-forwarded-for")) || first(request.headers.get("x-real-ip")) || "unknown";
  }
  if (process.env.TRUST_PROXY_HEADERS === "1") return first(request.headers.get("x-forwarded-for")) || "unknown";
  return "local";
}
