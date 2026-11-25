#!/usr/bin/env bash
# The full pipeline, in order. Stops at the first failing gate.
# Each Playwright suite starts its own servers and waits for their health checks.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n=== %s ===\n' "$1"; }

step "Dependencies";            npm ci --no-audit --no-fund >/dev/null; (cd api && uv sync --quiet)
step "Shared data is current";  node scripts/export-shared-data.mjs >/dev/null && git diff --exit-code api/app/data
step "Lint";                    npx eslint src e2e
step "Type check";              npx next typegen >/dev/null && npx tsc --noEmit
step "API tests";               scripts/test-api.sh -q
step "Migration E2E (FastAPI)"; npx playwright test -c playwright.migrations.config.ts
step "Regression E2E";          npx playwright test
step "Integrations E2E";        npm run test:e2e:integrations
step "Done: all gates passed"
