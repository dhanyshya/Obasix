#!/usr/bin/env bash
# Proves Alembic (api/migrations) creates the schema the site creates for itself: two empty
# databases, one set up by the site's own stores and one by `alembic upgrade head`, then a diff
# of every table, column (type, nullability, default) and index. Alembic may add what the API
# owns (staff_roles, audit_log, alembic_version); it must not miss anything the site has.
#
# SCHEMA_CHECK_URL: a Postgres server URL without a database name (default: docker compose's).
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${SCHEMA_CHECK_URL:-postgresql://obasix:obasix-local-only@localhost:54329}"
[ -n "${SCHEMA_CHECK_URL:-}" ] || docker compose up -d --wait db >/dev/null
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
for name in schema_site schema_alembic; do
  psql "$BASE/postgres" -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS $name WITH (FORCE)" -c "CREATE DATABASE $name" 2>/dev/null
done
DATABASE_URL="$BASE/schema_site" node scripts/schema/site-schema.mjs >/dev/null
(cd api && DATABASE_URL="$BASE/schema_alembic" uv run alembic upgrade head)

describe() {
  psql "$BASE/$1" -v ON_ERROR_STOP=1 -At -c "
    SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type || ' null=' || is_nullable || ' default=' || coalesce(column_default, '')
      FROM information_schema.columns WHERE table_schema = 'public'
    UNION ALL
    SELECT 'index ' || tablename || ' ' || regexp_replace(indexdef, '^CREATE (UNIQUE )?INDEX \S+ ON public\.\S+ ', '\1')
      FROM pg_indexes WHERE schemaname = 'public'
    ORDER BY 1"
}
describe schema_site > "$work/site.txt"
describe schema_alembic > "$work/alembic.txt"
missing=$(comm -23 "$work/site.txt" "$work/alembic.txt")
extra=$(comm -13 "$work/site.txt" "$work/alembic.txt" | grep -vE " (staff_roles|audit_log|alembic_version)[ .]" || true)
echo "Site schema: $(wc -l < "$work/site.txt" | tr -d ' ') columns and indexes; Alembic: $(wc -l < "$work/alembic.txt" | tr -d ' ')."
if [ -n "$extra" ]; then echo "Alembic has these that the site doesn't (check they're intended):"; echo "$extra"; fi
if [ -n "$missing" ]; then echo "MISSING from Alembic (the site creates these):"; echo "$missing"; exit 1; fi
echo "OK: Alembic creates everything the site creates."
