#!/usr/bin/env bash
# Runs the site's existing Playwright suites against a production build with every migrated
# area served by FastAPI (Postgres from docker compose). Used after each micro-migration.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${MIGRATION_DATABASE_URL:-postgresql://obasix:obasix-local-only@localhost:54329/obasix}"
ROUTES="${OBASIX_API_ROUTES:-auth,account,admin-core,admin-stock,quotes,admin-quotes,quote-submit,admin-quote-files,proofs,admin-proofs,commerce,stock,admin-orders,associates,admin-associates,distributors,admin-distributors,partners,admin-partners,company,ai}"
SECRET="$(openssl rand -hex 24)"; AUTH="$(openssl rand -hex 24)"; SITE=http://localhost:3218
cleanup() { pkill -f "next start -p 3218" 2>/dev/null || true; pkill -f "uvicorn app.main:app --port 8218" 2>/dev/null || true; }
trap cleanup EXIT
(cd api && DATABASE_URL="$DB" uv run alembic upgrade head)
(cd api && PYTHONDONTWRITEBYTECODE=1 DATABASE_URL="$DB" APP_ENV=production AUTH_SECRET="$AUTH" \
  ALLOWED_ORIGINS="$SITE" NEXT_PUBLIC_SITE_URL="$SITE" OBASIX_API_PROXY_SECRET="$SECRET" OBASIX_COMMERCE_MODE=demo \
  OBASIX_ADMIN_EMAILS=e2e-staff@example.test OBASIX_FILES_DIR="$PWD/../.data" \
  uv run uvicorn app.main:app --port 8218 > /dev/null 2>&1 &)
[ -d .next ] && [ "${SKIP_BUILD:-0}" = "1" ] || npx next build > /dev/null
# MIG-011: production sends /admin to the React admin app. Override with ADMIN_APP_URL=off to keep the old portal.
ADMIN_APP="${ADMIN_APP_URL:-http://localhost:4173}"; [ "$ADMIN_APP" = off ] && ADMIN_APP=""

start_site() {
  pkill -f "next start -p 3218" 2>/dev/null || true
  for _ in $(seq 1 30); do curl -s -o /dev/null "$SITE" || break; sleep 1; done
  DATABASE_URL="$DB" OBASIX_SCHEMA_OWNER=alembic OBASIX_API_URL=http://127.0.0.1:8218 OBASIX_API_ROUTES="$ROUTES" OBASIX_API_PROXY_SECRET="$SECRET" \
    OBASIX_COMMERCE_MODE=demo OBASIX_ADMIN_EMAILS=e2e-staff@example.test TRUST_PROXY_HEADERS=1 NEXT_PUBLIC_SITE_URL="$SITE" \
    OBASIX_ADMIN_APP_URL="$1" AUTH_SECRET="$AUTH" npx next start -p 3218 > /dev/null 2>&1 &
  local ready=0
  for _ in $(seq 1 90); do
    if curl -sf -o /dev/null "$SITE/api/commerce/mode" && curl -sf -o /dev/null http://127.0.0.1:8218/health; then ready=1; break; fi
    sleep 1
  done
  [ "$ready" = 1 ] || { echo "The site or FastAPI did not become healthy." >&2; exit 1; }
}

run() { E2E_SERVER=production E2E_BASE_URL="$SITE" npx playwright test "${SPECS[@]}" --project=desktop --workers=1 --reporter=line "$@"; }

SPECS=("$@"); [ ${#SPECS[@]} -eq 0 ] && SPECS=(e2e/flows.spec.ts e2e/security.spec.ts e2e/cart-sync.spec.ts e2e/admin.spec.ts e2e/channels.spec.ts)
if [ -z "$ADMIN_APP" ]; then
  start_site ""
  run
  exit
fi
# Pass 1, as in production: /admin redirects to the admin app; tests of the old portal are left out.
echo "== Pass 1: OBASIX_ADMIN_APP_URL=$ADMIN_APP (tests tagged @portal left out)"
start_site "$ADMIN_APP"
E2E_ADMIN_APP_URL="$ADMIN_APP" run --grep-invert @portal
# Pass 2: the old portal still works for deployments that haven't set the URL (the MIG-011 rollback).
echo "== Pass 2: OBASIX_ADMIN_APP_URL unset (only tests tagged @portal)"
start_site ""
run --grep @portal
