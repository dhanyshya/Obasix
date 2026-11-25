#!/usr/bin/env bash
# FastAPI lint, unit and integration tests against a throwaway database in the compose Postgres.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d --wait db
docker compose exec -T db psql -U obasix -d obasix -qc "DROP DATABASE IF EXISTS obasix_test WITH (FORCE)" -c "CREATE DATABASE obasix_test"
cd api
uv sync --quiet
uv run ruff check .
uv run ruff format --check .
TEST_DATABASE_URL="postgresql://obasix:obasix-local-only@localhost:54329/obasix_test" \
  uv run pytest --junitxml=../test-results-api/junit.xml "$@"
