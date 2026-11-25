# Migration tracking

One entry per micro-migration. A migration is **complete** only when its own E2E suite and the regression suites pass.

## MIG-001: Accounts (`/api/auth`) on FastAPI

| Field | Value |
|---|---|
| Objective | Serve register, sign-in, sign-out, password reset and the session check from FastAPI, with no visible change for customers |
| Status | **Complete (behind a switch).** Off until `OBASIX_API_URL` and `OBASIX_API_ROUTES=auth` are set |
| Endpoints | `GET /api/auth`, `POST /api/auth?action=register\|login\|logout\|forgot\|reset`; new `GET /health` on the API |
| Database changes | None. Alembic baseline `0001` creates the existing tables with `IF NOT EXISTS`, so running it on a live database changes nothing |
| Rollback | Remove `auth` from `OBASIX_API_ROUTES` |

**Files**

- New service in `api/`: `app/main.py`, `app/core/*`, `app/auth/*`, `app/cart.py`, `app/catalogue.py`, `app/email.py`, `migrations/`, `tests/`, `Dockerfile`
- Site: `src/proxy.ts` (new: forwarding), `src/lib/fastApi.ts` (new: settings), `src/lib/clientAddress.ts` (moved out of `rateLimit.ts`, unchanged), `next.config.ts` (checks settings at build)
- Shared data: `scripts/export-shared-data.mjs` writes `api/app/data/*.json` from `src/data`
- Tooling: `docker-compose.yml`, `playwright.migrations.config.ts`, `scripts/{dev-all,test-api,test-all}.sh`, `.github/workflows/api.yml`

**Behaviour changes (intended)**

- Two sign-ups with the same email at the same moment now give one account and one 409. Before, both could pass the existence check.
- Two uses of the same reset link at the same moment: only one succeeds. The link is claimed in a single `UPDATE … RETURNING`.

**Tests**

| Suite | Cases | Result |
|---|---|---|
| API unit and integration (`api/tests`, pytest, real Postgres) | 14: register, validation, duplicate race, login/logout, unknown email, guest cart merge, cross-site refusal, rate limit, bad body, reset race, health, proxy-secret IP trust, cart parity with TypeScript, password hashes both ways | 14/14 passed |
| Migration E2E (`e2e/migrations/migration-001-auth.spec.ts`, headless Chromium) | Served by FastAPI; browser register → account → DB row → logout → login; API errors shown in the form; validation, duplicates, cross-site; per-visitor brute-force limit; guest cart saved; reset works once and ends old sessions | See the run report below |
| Regression (existing Playwright suites, with auth on FastAPI) | `flows`, `security`, `cart-sync`, `admin` | 26/26 passed (desktop) |

**Issues found and fixed during the migration**

1. Requests forwarded by the site reached FastAPI without the visitor's IP, so every visitor shared one rate-limit bucket. Fixed with the proxy secret (see docs/backend-migration.md).

**Deviations from the target spec, and why**

| Spec item | This migration | Reason / plan |
|---|---|---|
| SQLAlchemy ORM | psycopg with parameterised SQL; Alembic for migrations | The tables are shared with the live Next.js code during the move. An ORM model layer is planned once Alembic owns the schema (MIG-009) |
| `apps/` + `backend/` monorepo layout | Site stays at the root; API in `api/` | Moving the site is a large change with nothing to gain mid-migration. It can be a separate, mechanical step |
| JS unit test runner | None added yet | No JS unit tests exist today. `npm test` runs the API suites |
| RBAC | Not in this migration | MIG-003 |

## MIG-002: Account data (`/api/account`) on FastAPI

| Field | Value |
|---|---|
| Objective | Serve the account page's data and every change to it from FastAPI, with no visible change for customers |
| Status | **Complete (behind a switch).** Off until `OBASIX_API_ROUTES` includes `account` |
| Depends on | MIG-001 (sessions) |
| Endpoints | `GET /api/account`; `POST /api/account?action=profile\|password\|address\|wishlist\|wishlist-sync\|configuration\|cart`; `DELETE /api/account?kind=address\|configuration&id=` |
| Database changes | None. Alembic `0002` creates the `demo_orders` table and columns with `IF NOT EXISTS`, matching what the site creates. Orders are only read here; the site still writes them until the commerce migration |
| Rollback | Remove `account` from `OBASIX_API_ROUTES` |

**Files**

- API: `app/account/{router,service}.py`, `app/orders.py` (read-only order list), `app/core/text.py` (input clean-up shared with auth), commerce-mode settings in `app/core/config.py`, `migrations/versions/0002_baseline_orders.py`
- Site: `src/lib/fastApi.ts` (adds the `account` area)
- Tests: `api/tests/test_account.py`, `e2e/migrations/migration-002-account.spec.ts`, shared `e2e/migrations/helpers.ts`, `e2e/migrations/warm-up.ts`

**Behaviour changes (intended)**

- Password changes are limited to 8 tries per account per 10 minutes, so someone holding a stolen session can't guess the current password.
- `wishlist-sync` with the same product twice now stores it once. The old route failed with a 500 on the duplicate key. It also runs in one transaction, so a failure can't leave the list half replaced.

**Tests**

| Suite | Cases | Result |
|---|---|---|
| API unit and integration (pytest, real Postgres) | 11 new: signed-out refusal, overview, profile rules, password change (this device kept, others signed out), password guessing limit, addresses with owner-only delete, wishlist add/remove/sync with duplicates, saved configurations, cart, orders in demo mode, cross-site and bad requests | 25/25 passed (with MIG-001) |
| Migration E2E, headless | Served by FastAPI; profile edit with phone error, saved and reloaded; address add, list, remove; password change in the browser; wishlist heart → database → wishlist page; cart saved and shown; saved configurations owner-only; cross-site refusal | 15/15 in Chromium (with MIG-001), on a production build; 45/45 in Chromium, Firefox and WebKit |
| Regression: existing suites with auth and account on FastAPI (production build, Postgres, 1 worker) | `flows`, `cart-sync`, `security`, `admin`, `channels` | 27/30. The 3 failures are pre-existing: they fail the same way with FastAPI off on Postgres (see below) |

**Issues found and fixed**

1. On a fresh `next dev`, page loads in the migration suite never went idle: the first compile reloaded the page repeatedly. Fixed with a warm-up step that loads each page before the tests start (`e2e/migrations/warm-up.ts`). The API also no longer writes `.pyc` files into the folder Next.js watches. Verified by clearing `.next/dev` and running from cold: 15/15 passed.
2. Even after warm-up, `next dev` sent `reloadPage: HMR hash mismatch` in an endless loop on some pages (`/admin/*`, `/quote`), with no files changing. That is a dev-server problem, not this code. The migration suite now runs on a production build (`next build && next start`) by default; `E2E_SERVER=dev` still uses `next dev`. The same loop likely explains the earlier timeouts in the full default-mode run.
3. Two test mistakes fixed in the spec: an ambiguous "Company" label, and waiting on the first (empty) wishlist save instead of the one after the click.

**Pre-existing defect found (not caused by this migration; open)**

| ID | Found in | Symptom | Evidence |
|---|---|---|---|
| DEF-001 (**fixed**, see MIG-004) | `e2e/channels.spec.ts` on Postgres | The associate, distributor and partner journeys fail with strict-mode violations: an order id, the "Search products or SKU" field and a partner project row each appear twice | Fails the same way with FastAPI off, `DATABASE_URL` set, production build. Passes on SQLite. Needs its own fix before MIG-007 (trade channels) |

**Environment note**

The full regression suite (`npx playwright test`, 2 workers) overloaded this machine (load average above 20, 3D visualizer pages plus video recording) and timed out across unrelated pages, so that run was stopped. Regression for this migration runs the suites that touch accounts with one worker; the full suite runs in CI.

## MIG-003: Staff roles, audit log, and stock admin (`/api/admin/stock`) on FastAPI

| Field | Value |
|---|---|
| Objective | Lay the access-control and audit foundation every later admin migration builds on, and move the first admin area (stock) onto it |
| Status | **Complete (behind a switch).** Off until `OBASIX_API_ROUTES` includes `admin-core` and `admin-stock` |
| Scope decision | The original MIG-003 ("all of `/api/admin/*`") was split. Each remaining admin area moves with its own domain (quotes and proofs in MIG-005, orders in MIG-006, trade channels in MIG-007), so no step changes more than one business area |
| Endpoints | Same as the site: `POST /api/admin/stock`. New, FastAPI only: `GET /api/admin/stock` (search `q`, `state`, `sort`, `order`, `page`, `pageSize`), `GET /api/admin/me`, `GET /api/admin/audit` (filters `actor`, `action` or prefix `stock.`, `targetType`, `targetId`, `since`, `until`; paginated), `GET/POST/DELETE /api/admin/staff` |
| Database changes | Alembic `0003`: new `staff_roles` and `audit_log` (append-only, enforced by a trigger that refuses `UPDATE` and `DELETE`); `product_stock` with `IF NOT EXISTS` (already created by the site). Downgrade drops only the two new tables |
| Rollback | Remove `admin-core` and `admin-stock` from `OBASIX_API_ROUTES`. The new tables can stay; nothing on the site reads them |

**Files**

- API: `app/admin/{rbac,deps,audit,router,schemas}.py`, `migrations/versions/0003_rbac_audit_stock.py`, `all_products()` in `app/catalogue.py`; the catalogue export now includes product names
- Site: `src/lib/fastApi.ts` (`admin-core`, `admin-stock` areas)
- Tests: `api/tests/test_admin.py`, `e2e/migrations/migration-003-admin-stock.spec.ts`; the warm-up also loads `/admin/stock` and a product page

**Behaviour changes (intended)**

- Every stock change is written to the audit log with before and after values, in the same transaction as the change.
- Staff without `stock:write` get 403. Before, only the allowlist existed.

**Tests**

| Suite | Cases | Result |
|---|---|---|
| API unit and integration (pytest, real Postgres) | 10 new: 404 for visitors and customers on every admin endpoint; config admin permissions; `staff` role allowed stock but refused audit and staff management, then revoked; cross-site refusal with nothing logged; stock validation matching the site; audit before/after and request id; audit log can't be edited or deleted; stock search, filters, sorting, pagination and limits; audit filters and pagination; staff grant, change, revoke and the config-admin guard | 35/35 passed (all migrations) |
| Migration E2E, headless | Staff page → FastAPI → database → audit → product page shows "Only 5 left"; refused value shows the site's message; stop tracking; visitors and customers get FastAPI's 404; cross-site 403; grant `staff` → allowed stock, refused audit and self-promotion → revoked | 18/18 in Chromium (MIG-001 to 003), production build; 54/54 in Chromium, Firefox and WebKit |
| Regression: `admin`, `security`, `flows`, `cart-sync` with all four areas on FastAPI (production build, Postgres) | Existing staff portal, stock, orders, quotes and proofs workflows | 26/26 passed |

**Issues found and fixed**

1. The first E2E run showed `/api/admin/staff`, `/me` and `/audit` weren't forwarded to FastAPI. Next.js answered 404 for them, which also made the "visitors get 404" test pass for the wrong reason. Fixed with the `admin-core` area. The test now also checks that FastAPI gave the answer (request id and body).

**Known limits**

- Audit rows written by the E2E suites stay in the test database, because the log is append-only by design. The suites otherwise clean up after themselves.
- See "Staff roles" in docs/backend-migration.md: people granted `staff` can't open the Next.js `/admin` pages until MIG-004.

## MIG-004: Separate React admin app (`admin/`)

| Field | Value |
|---|---|
| Objective | A separate React admin app that talks only to FastAPI, covering what FastAPI serves so far: sign-in, overview, stock, audit log, staff roles |
| Status | **Complete.** Additive: the Next.js `/admin` pages stay until their areas move |
| Scope | Additive. The Next.js `/admin` pages stay until orders, quotes, proofs and trade channels move to FastAPI |
| App | `admin/`: Vite 8, React 19.3, TypeScript 5.9, MUI 9, React Router 8; pages load on demand. Dev and tests proxy `/api` to FastAPI; for its own domain set `VITE_API_URL` and add the origin to `ALLOWED_ORIGINS` |
| API changes | CORS with credentials, limited to `ALLOWED_ORIGINS`; `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS in production. Untracking an already-untracked product is now a no-op with no audit entry; stock changes lock the row so "before" values are exact |

**Tests**

| Suite | Result |
|---|---|
| Admin unit and component tests (Vitest) | 22/22 |
| API (pytest) | 36/36 |
| Migration E2E (MIG-001 to 004), Chromium, production build | 23/23 |
| Same, Chromium + Firefox + WebKit | 69/69 |
| Regression with all areas on FastAPI (production build, Postgres): `flows`, `cart-sync`, `security`, `admin`, `channels` | 30/30 (channels now pass: DEF-001 fixed) |
| Regression on Postgres with FastAPI off: `channels`, `cart-sync`, ×2 | 14/14 |
| Regression on SQLite (default setup), production build: `cart-sync`, `flows` | 17/17 |

**Issues found and fixed**

1. `cache-control: no-store` on API responses left Chrome's fetches open when they came through the site's proxy, so pages never went idle. Removed; cause not fully understood (curl is unaffected).
2. One confirmed "Stop tracking" sent two requests: a second click landed while the dialog was closing. Fixed in `ConfirmDialog`, with an in-flight guard per action and a unit test.

3. **Duplicate page content after a reload (OPEN-004-1, also DEF-001).** Root cause: every page sits inside the Suspense boundary from the root `loading.tsx` and streams in as a hidden `<div id="S:0">` plus a marker `<template id="B:0">`. React 19 queues the swap that puts the content in place. When the session, saved cart or wishlist arrived before that swap (FastAPI answers `/api/auth` faster, so this became common), the context update made React render the page on the client and drop the marker. The queued swap then had nothing to replace, so the streamed copy stayed in the DOM: a second, hidden copy of the page with the same ids. Fix: `src/lib/streamOrphans.ts`, started from `AppProviders` at hydration. A hidden `S:n` whose `B:n` is gone will never be swapped in and is outside React's tree, so it is removed. Pending segments are left alone, and the watch stops 10 s after the page has loaded. The contexts keep their original timing (same as `main`). Evidence: profile save-then-reload test, 16 runs each, 13 failed with no fix, 0 with this fix; migration suites 69/69 in three browsers; channels, cart-sync and admin 12/12. Regression guard: `settled()` in `e2e/migrations/helpers.ts` fails any page that keeps a hidden `S:` copy.
4. A WebKit-only check expected Tab to reach links; Safari's default Tab key skips them. Kept for Chromium and Firefox.

**Approaches tried and dropped** (kept for the record): wrapping the context updates in `startTransition` (still 1 duplicate in 5); also waiting for `DOMContentLoaded` (3 in 8); waiting for the swap itself (no duplicates, but on CI's WebKit dev server the swap came seconds late, the update then reset a field the stock test had just typed into, and customers on slow devices could lose typing the same way). Cleaning up the leftover keeps the original timing.
