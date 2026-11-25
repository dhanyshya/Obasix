#!/usr/bin/env bash
# Starts Postgres (docker compose), migrates it, then runs FastAPI and the Next.js site
# with the migrated API areas forwarded to FastAPI. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")/.."

export DATABASE_URL="${DATABASE_URL:-postgresql://obasix:obasix-local-only@localhost:54329/obasix}"
export OBASIX_API_PROXY_SECRET="${OBASIX_API_PROXY_SECRET:-$(openssl rand -hex 24)}"
# The site and the API must share it: it signs the quote cookie (MIG-005).
export AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -hex 24)}"
SITE_PORT="${PORT:-3000}"
API_PORT="${API_PORT:-8000}"

docker compose up -d --wait db
(cd api && uv sync --quiet && uv run alembic upgrade head)

cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

(cd api && OBASIX_FILES_DIR="$PWD/../.data" APP_ENV=development ALLOWED_ORIGINS="http://localhost:${SITE_PORT}" \
  NEXT_PUBLIC_SITE_URL="http://localhost:${SITE_PORT}" uv run uvicorn app.main:app --reload --port "$API_PORT") &

until curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; do sleep 1; done
echo "FastAPI ready on :${API_PORT} (docs: http://127.0.0.1:${API_PORT}/docs)"

OBASIX_API_URL="http://127.0.0.1:${API_PORT}" OBASIX_API_ROUTES="${OBASIX_API_ROUTES:-auth,account,admin-core,admin-stock,quotes,admin-quotes,quote-submit,admin-quote-files,proofs,admin-proofs,commerce,stock,admin-orders,associates,admin-associates,distributors,admin-distributors,partners,admin-partners,company,ai}" \
  npx next dev -p "$SITE_PORT" &
wait
