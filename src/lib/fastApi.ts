/**
 * Migration to the FastAPI service in api/ (docs/backend-migration.md).
 *
 * Each area listed in OBASIX_API_ROUTES is served by OBASIX_API_URL instead of
 * the route handlers in src/app/api. src/proxy.ts does the forwarding. With
 * OBASIX_API_URL unset, everything stays in Next.js.
 */
export const apiAreas: Record<string, string[]> = {
  auth: ["/api/auth"],
  account: ["/api/account"],
  // Staff roles, the audit log and "who am I": endpoints that only exist on FastAPI.
  "admin-core": ["/api/admin/me", "/api/admin/audit", "/api/admin/staff"],
  "admin-stock": ["/api/admin/stock"],
};

export type FastApiConfig = { target: string; secret: string; paths: Set<string> } | null;

/** Reads and checks the settings. Throws on a mistake, so a bad deploy fails at build time. */
export function fastApiConfig(env: Record<string, string | undefined> = process.env): FastApiConfig {
  const target = env.OBASIX_API_URL?.replace(/\/$/, "");
  if (!target) return null;
  if (!env.DATABASE_URL) {
    // Both sides must read the same accounts and sessions, which local SQLite can't share.
    throw new Error("OBASIX_API_URL needs DATABASE_URL: the site and the API must use the same Postgres database.");
  }
  const secret = env.OBASIX_API_PROXY_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("OBASIX_API_URL needs OBASIX_API_PROXY_SECRET (32+ characters), the same value the API has.");
  }
  const paths = new Set<string>();
  for (const area of (env.OBASIX_API_ROUTES ?? "").split(",").map((a) => a.trim()).filter(Boolean)) {
    const sources = apiAreas[area];
    if (!sources) throw new Error(`OBASIX_API_ROUTES: unknown area "${area}". Known: ${Object.keys(apiAreas).join(", ")}`);
    sources.forEach((path) => paths.add(path));
  }
  return { target, secret, paths };
}
