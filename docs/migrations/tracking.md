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

## MIG-005: Reading saved quotes on FastAPI

| Field | Value |
|---|---|
| Objective | Serve the customer's quote lookup and a new staff quote list from FastAPI, and add Quotes to the admin app |
| Status | **Complete (behind a switch).** Off until `OBASIX_API_ROUTES` includes `quotes` and `admin-quotes` |
| Scope decision | Quotes and proofs were split. Quote submission (with its file), the staff attachment download and proofs all need file storage, which FastAPI can't reach yet (private Vercel Blob, no Python SDK). Decided with the product owner: move the Postgres-only reads now; files and the rest are MIG-005b, after a storage decision (docs/backend-migration.md, "Files") |
| Endpoints | Same as the site: `GET /api/quotes/{reference}` (signed `obasix_quotes` cookie, matching account email, or linked account; one 404 for "missing" and "not yours"; 60 lookups per 10 min per visitor). New: `GET /api/admin/quotes` (search across reference, name, company, email and phone; board type; with or without a file; date range; order; pages), permission `quotes:read` (admin and staff) |
| Stays in Next.js | `POST /api/quotes`, `GET /api/admin/quotes/{reference}/file` |
| Database changes | Alembic `0004`: `quote_requests` with `IF NOT EXISTS` (already created by the site); read-only here |
| Site changes | `src/lib/fastApi.ts`: entries ending in `/` are prefixes (`/api/quotes/` covers `/api/quotes/<ref>` but not `POST /api/quotes`); `quotes` and `admin-quotes` areas; the build fails if `quotes` is on without `AUTH_SECRET` |
| Rollback | Remove `quotes` and `admin-quotes` from `OBASIX_API_ROUTES` |

**Behaviour changes (intended)**

- `AUTH_SECRET` must be the same on the site and the API once `quotes` is on. Without it, the site signs quote cookies with a random per-process key that FastAPI can't verify, so FastAPI trusts no quote cookie.
- The staff role gains `quotes:read`: staff prepare quotes and proofs. Quote requests contain customer names, emails and phones.

**Tests**

| Suite | Cases | Result |
|---|---|---|
| API (pytest) | 10 new: non-demo and unknown references; "not yours" gives the same 404; signed cookie accepted, forged ignored, cookie ignored without `AUTH_SECRET`; matching and linked accounts; lookup rate limit; cookie signature identical to the site's (Node `crypto`); staff list access by role; search, board type, file filter, date range incl. time zones, order, pages, literal `%` | 46/46 |
| Admin app (Vitest) | Quotes list, filters and order sent to the API, details dialog, date-range check; staff nav includes Quotes | 25/25 |
| Migration E2E | Guest submits on the site (Next.js, no request id) → confirmation page reads it from FastAPI → reload works → other browser and forged cookie get 404; signed-in customer reads it from a second browser after signing in, with no contact details in the customer view; customer gets 404 from the staff list; admin app search, file filter, details | 26/26 Chromium (MIG-001 to 005, twice); 78/78 Chromium, Firefox and WebKit |
| Regression, all six areas on FastAPI (production build, Postgres) | `flows` (incl. quote submission and confirmation), `security` (incl. "a saved quote is readable by its sender only"), `cart-sync`, `admin`, `channels` | 30/30 |

**Issues found and fixed**

1. JSON `null` attachments: `->'attachment'` is a jsonb `null`, not SQL `NULL`, so "without a file" matched nothing. Now `jsonb_typeof(...) = 'object'`.
2. Date filters compared Python's `+00:00` ISO format with the site's `...000Z` as text. Now converted to the stored format.
3. The MIG-003 audit check compared database time with the test machine's clock. It now filters by audit id.

**Watch**

- The MIG-002 password-change test failed once in the first full run (the "current password is incorrect" message never appeared), then passed alone and in two full runs. Not reproduced; if it recurs, the trace will be in the CI report.

## MIG-005b: Files, quote submission and design proofs on FastAPI

| Field | Value |
|---|---|
| Objective | Move everything left in quotes and proofs: submitting a quote with its file, staff file downloads, and the proof workflow |
| Status | **Complete (behind a switch).** Areas `quote-submit`, `admin-quote-files`, `proofs`, `admin-proofs` |
| Storage decision | Taken without the product owner, as instructed to proceed. Port the private Vercel Blob protocol and prove it against the official SDK (see docs/backend-migration.md, "Files"); a shared `OBASIX_FILES_DIR` for local and single-server use. Reversible: the areas can be switched off, and storage is one module |
| Endpoints | Same as the site: `POST /api/quotes`, `GET /api/admin/quotes/{ref}/file`, `POST /api/admin/proofs`, `POST /api/proofs`, `GET /api/proofs/{id}/file`. New: `GET /api/admin/proofs` (filter by quote and status, pages) |
| Database changes | Alembic `0005`: `design_proofs` and the associate tables, `IF NOT EXISTS` (already created by the site) |
| Permissions | `proofs:read`, `proofs:write` (admin and staff). Quote files need `quotes:read` |
| Audit | `proof.upload`, `quote.file.download` |
| Rollback | Remove the four areas from `OBASIX_API_ROUTES` |

**Shared writes until later migrations**

- Quote submission credits associates (`associate_quotes`), as the site does. The associate tables stay owned by the site until trade channels move (MIG-007).

**Behaviour changes (intended)**

- Proof uploads take a per-quote lock, so two uploads at once can't get the same version number.
- Downloading a customer's quote file is written to the audit log.
- Attribution failures are logged; the site ignored them silently.

**Tests**

| Suite | Result |
|---|---|
| API (pytest): storage incl. byte-for-byte parity with `@vercel/blob`; 21 quote-submission cases (every field rule, idempotency, rate limit, modes, account link, associate credit); proofs (rules, versions, approval closes the thread, decisions, who may see files, staff list, audit) | 73/73 |
| Admin app (Vitest): Proofs page (list, file checks, confirm, multipart upload), quote download and proofs links | 28/28 |
| Migration E2E: quote with a file submitted on the site → FastAPI → file in the shared store → downloaded from the site's staff portal and the admin app (audited) → stranger 404; proofs v1 from the admin app → customer requests changes on the site → v2 → approved → further uploads refused → stranger can't see or decide | 28/28 Chromium; 84/84 three browsers |
| Regression with all ten areas on FastAPI (`scripts/regression-fastapi.sh`, new) | 30/30 |

**Issues found and fixed**

1. `request.form()` returns Starlette's `UploadFile`, not FastAPI's subclass, so files were ignored. Fixed in both endpoints.
2. A multipart part limit just above 2 MB turned "file too large" into "could not be read". Limits are now above the validation sizes (8 MB quotes, 12 MB proofs), so the site's messages come through.
3. The first version of the regression script ran `alembic` without `DATABASE_URL`, so FastAPI never started, and the script carried on after its readiness wait anyway (15 false failures). It now fails unless both servers are healthy.

## MIG-006: Commerce on FastAPI

| Field | Value |
|---|---|
| Objective | Checkout (demo and live Razorpay), payment confirmation, tracking, public stock and staff order handling on FastAPI; Orders in the admin app |
| Status | **Complete (behind a switch).** Areas `commerce`, `stock`, `admin-orders` |
| Endpoints | Same as the site: `GET /api/commerce/mode`, `POST/GET /api/commerce/orders`, `POST /api/commerce/payment`, `POST /api/commerce/payment/webhook`, `POST /api/commerce/track`, `GET /api/stock`, `POST /api/admin/orders`. New: `GET /api/admin/orders` (search, status, payment, live/demo, dates, pages) |
| Database changes | None (`demo_orders`, `product_stock`, `associate_commissions` have baselines in 0002, 0003, 0005) |
| Permissions | `orders:read`, `orders:write` (admin and staff) |
| Audit | `order.advance` (before/after, courier and tracking number on dispatch), `order.cancel` (with the note) |
| Rollback | Remove the three areas from `OBASIX_API_ROUTES` |

**Shared writes until MIG-007**

- A paid order credits the referring associate (`associate_commissions`), with the site's rules (not your own order, not your own email, active associates only).

**Behaviour changes (intended)**

- Two identical checkouts at the same moment (same idempotency key) make one order; on the site both could pass the "already exists?" check.
- Staff order changes lock the order row instead of failing with "the order changed meanwhile".
- An account reads one of its orders by owner, not by "is it among my latest 50".

**Parity bugs found and fixed before release**

1. Python's `round()` rounds halves to even, and JavaScript's `Math.round` rounds them up. The 5% commission on ₹3,650 (182.5) would have been ₹182 instead of the site's ₹183. Now `js.round_half_up`; the Razorpay amount uses it too.
2. The same trap in rupee formatting: `Intl.NumberFormat` rounds halves away from zero (₹1,824.5 → ₹1,825). Fixed and checked against Node for 11 amounts, including Indian grouping (₹1,00,000) and a negative half.
3. The shared JSON body reader treated `{}` as unreadable; JavaScript treats it as a real body. It now matches `!body` exactly (MIG-001 onward).

**Tests**

| Suite | Result |
|---|---|
| API (pytest): 24 commerce cases (modes, demo pricing and idempotency incl. simultaneous duplicates, every checkout message, commission rules, live checkout against a Razorpay stand-in, Razorpay down, forged and genuine callback, unsigned and genuine webhook, paid exactly once (emails, stock and commission once), tracking by email or phone, same 404 for wrong contact, rate limit, own orders only, public stock, staff advance/dispatch/cancel with audit, list filters, rupees and signatures vs Node) | 97/97 |
| Admin app (Vitest): dispatch needs courier and tracking; cancel needs a reason; unpaid can't advance; filters | 31/31 |
| Migration E2E: demo checkout on the site → FastAPI prices and saves it → tracked → staff move it to Processing and Dispatched in the admin app (audited) → the customer's tracking shows it; cancel with a reason; wrong contact and strangers get nothing | 30/30 Chromium; 90/90 three browsers |
| The site's own live-payment and email suite, unchanged, with commerce on FastAPI (`playwright.integrations-fastapi.config.ts`, new): Razorpay order, forged signature refused, genuine confirmed once, webhook-only payment, unsigned webhook refused, Razorpay down, reset email. FastAPI's request log confirms it served each call | 6/6 |
| Regression with all 13 areas on FastAPI | 30/30 |

## MIG-007: Trade channels on FastAPI (associates, distributors, partners, company accounts)

| Field | Value |
|---|---|
| Objective | Move the four trade channels (customer and staff endpoints) and give staff admin app pages for them |
| Status | **Complete (behind a switch).** Areas `associates`, `admin-associates`, `distributors`, `admin-distributors`, `partners`, `admin-partners`, `company` |
| Steps | 007a associates, 007b distributors, 007c partners, 007d company accounts. Each was ported, unit and integration tested, and checked against the site's own channel journeys before the next |
| Endpoints | Same as the site: `POST /api/associates`, `/api/associates/ref`, `/api/admin/associates`; `POST /api/distributors`, `/api/distributors/orders`, `/api/admin/distributors`; `POST /api/partners`, `/api/admin/partners`; `POST /api/company`. New reads: `GET /api/associates/me`, `/api/admin/associates`, `/api/admin/commissions`, `/api/distributors/me`, `/api/admin/distributors`, `/api/admin/trade-orders`, `/api/partners/me`, `/api/admin/partners`, `/api/admin/projects`, `/api/company` |
| Database changes | Alembic `0006` (payout columns), `0007` distributors, `0008` partners, `0009` company: all `IF NOT EXISTS` matching what the site creates |
| Permissions | Admin only: `associates:*` (payouts), `distributors:approve` (tier, credit, territory), `partners:approve` (approval, margins, payouts). Staff: `distributors:read`/`write` (trade orders), `partners:read`/`write` (advance, lost) |
| Audit | `associate.pause`/`activate`, `commission.pay`/`void`, `distributor.decide`, `trade.record-payment`/`advance`/`cancel`, `partner.decide`, `project.quote`/`advance`/`lose`/`pay` |
| Rollback | Remove the seven areas from `OBASIX_API_ROUTES` |

**Behaviour changes (intended)**

- Locks where the site had check-then-write races: joining the associate programme, applying as a distributor, trade orders (two at once could both fit the same available credit), project registration per client, company people changes (the last owner can't be removed twice over), reorder list limits, and order or project updates (row locks).
- Approvals, margins and payouts are admin-only. On the site any allowlisted staff member could do them.
- A partner's own project list says a project is "held" without naming the other partner's project.
- **Site fix:** the partner margin message read "Set a margin between 0 and 30.000000000000004%." (`0.3 * 100` in JavaScript). Now "30%" on both sides.

**Parity checked against the site's code** (Node runs the TypeScript): financial-quarter boundaries for six dates around year and quarter edges; trade prices (`Math.round(price × (1 − discount))` with JavaScript rounding); V8's acceptance of dates like 2027-02-30 for expected order dates.

**Tests**

| Suite | Result |
|---|---|
| API (pytest): associates 9, distributors 6, partners 4, company 3 (rules and messages, codes, referral window, commission states, payouts, approvals, credit and simultaneous orders, protection and conflicts, one payout per order, owners, reorder lists, role limits, audit, Node parity) | 120/120 |
| Admin app (Vitest): bulk payout with a reference; full distributor decision; staff can't decide; partner quote | 34/34 |
| Migration E2E (admin app): distributor approved → trade order → payment → dispatch (audited); partner approved → project → margin quoted (30% limit); referred order delivered → commission paid; strangers refused | 33/33 Chromium; 99/99 three browsers |
| The site's own `channels.spec.ts` and `admin.spec.ts` with all channels on FastAPI | 9/9 |
| Regression and integration suites with all 20 areas on FastAPI | 30/30, 6/6 |

## MIG-008: AI on FastAPI (chat assistant, design help)

| Field | Value |
|---|---|
| Objective | Serve the chat assistant, frame-colour suggestions and the design-help status from FastAPI |
| Status | **Complete (behind a switch).** Area `ai` |
| Endpoints | Same as the site: `GET /api/ai/status`, `GET/POST /api/ai/chat`, `POST /api/ai/frame-colours` |
| Deliberate exception | `POST /api/ai/sign-layouts` **stays in Next.js.** Its suggestions are checked against the signage rules (`src/data/signage.ts`, about 800 lines incl. Indic script handling and `Intl.Segmenter` grapheme counting), which the design studio also runs in the browser as the customer types. A Python copy would have to match a browser-side rule set character for character, and any drift would suggest layouts the studio then rejects. The route is a thin call to Claude next to rules that must stay in TypeScript. Revisit only if the studio's rules move server-side |
| Providers | The chat keeps its **OpenAI-compatible provider** (`OBASIX_AI_*`, default `gpt-4o-mini`), ported as plain HTTP exactly as the site calls it: not switched to Claude, which is a product decision. Frame colours use Claude (`claude-opus-5-5`) through the official Anthropic Python SDK: `beta.messages.parse` with a Pydantic output model, `output_config.effort: "low"`, and the server-side refusal fallback (`fallbacks: "default"`). A probe confirmed the SDK sends the same request body the TypeScript route sends |
| Shared text | The chat's system prompt and catalogue context are **exported from the site's own code** (`scripts/export-shared-data.mjs` → `api/app/data/ai.json`), so they can't drift; CI checks the export is current |
| Database changes | None |
| Rollback | Remove `ai` from `OBASIX_API_ROUTES` |

**Tests**

| Suite | Result |
|---|---|
| API (pytest): chat against a stand-in provider (grounded answer filters made-up product ids; JSON inside text; junk → catalogue answer; provider without JSON mode gets one retry; auth and quota errors; unconfigured; input checks; 20/min limit; cross-site), frame colours against a Claude stand-in (exact request: model, beta header, `fallbacks`, effort, JSON schema, image; refusal → 422; Claude 429 → plain message; photo checks), status; parity of the catalogue fallback, product-id filter and customizer link with the site's TypeScript | 129/129 (all migrations) |
| Migration E2E: the site's chat widget answers through FastAPI with catalogue links; status, checks, cross-site; sign layouts still answered by Next.js | 36/36 Chromium; 108/108 three browsers |
| The site's integration suite with the Claude stand-in, unchanged, via FastAPI: "suggestions come back, limited to what OBASIX makes" and "a Claude outage gives a plain message". FastAPI's request log shows 200 and 502 for `/api/ai/frame-colours` | 6/6 |
| Regression with all 21 areas on FastAPI | 30/30 |

## MIG-009: Alembic owns the schema

| Field | Value |
|---|---|
| Objective | One owner for the database schema: Alembic migrations in `api/migrations`, applied at deploy. The site stops creating and altering tables |
| Status | **Complete.** Production setting: `OBASIX_SCHEMA_OWNER=alembic` on the site; run `alembic upgrade head` before starting either app |
| How it's proven | `scripts/check-schema.sh` (also in CI) builds two empty databases, one through the site's own 11 store setups and one through `alembic upgrade head`, and compares every column (type, nullability, default) and index. Result: all **233** of the site's columns and indexes are created identically by Alembic; Alembic adds only the API's own tables (`staff_roles`, `audit_log`, `alembic_version`) |
| Site change | `ensureSchema` skips the setup when `OBASIX_SCHEMA_OWNER=alembic` on Postgres. Local development without Postgres keeps SQLite and its setups (Alembic targets Postgres only) |
| Rollback | Unset `OBASIX_SCHEMA_OWNER`; the site's setups are idempotent `IF NOT EXISTS` statements |
| Rule from now on | Every schema change is an Alembic migration. CI fails if the site's own setup code ever creates something Alembic doesn't |

**Tests, each on a brand-new empty database whose only DDL came from Alembic**

| Suite | Result |
|---|---|
| Migration E2E (MIG-001 to 008) | 36/36 |
| The site's own suites with all 21 areas on FastAPI | 30/30 |
| Integration suite (live payments, email, Claude stand-ins) | 6/6 |

**Revised plan**

- "SQLite dropped" is replaced by "SQLite for local development only": dropping it would make Docker mandatory for every contributor and for the site's existing CI suite, with nothing gained in production.
- Remaining direct database access from the site: 6 account pages and 12 staff-portal files. These are MIG-010 and MIG-011.

## MIG-010: Account pages read through FastAPI

| Field | Value |
|---|---|
| Objective | The account pages (associate, distributor, partner, company, proofs) stop reading the database directly when their area is served by FastAPI |
| Status | **Complete** |
| How | `src/lib/fastApiServer.ts` `readFromFastApi(path)`: inside a server component, GETs FastAPI with the visitor's cookie, client IP and the proxy secret. It returns `undefined` when the area is still on Next.js, so each page keeps its direct read as the fallback and the switch stays reversible per area |
| New endpoint | `GET /api/proofs`: the signed-in customer's proof threads, newest first, only for quotes linked to the account or sent from its email |
| Unchanged on purpose | `layout.tsx` only reads the session cookie (same cookie and table as FastAPI's auth). The company page's "recent orders" first kept its direct read; since MIG-012a it reads `GET /api/commerce/orders` too |
| Rollback | Remove the area from `OBASIX_API_ROUTES`; the page falls back to its direct read |

**Tests**

| Suite | Result |
|---|---|
| API (pytest): new customer proof list (401 signed out; own threads only, newest version first; a stranger sees none) | 130/130 |
| Migration E2E `migration-010-account-pages.spec.ts`: each page rendered for a real account shows what FastAPI holds; the proofs page and `GET /api/proofs` hide another customer's thread | 4/4 Chromium |

## MIG-011: The site's staff portal gives way to the React admin app

| Field | Value |
|---|---|
| Objective | Staff use one admin: the React app (`admin/`), which goes only through FastAPI (roles, audit log). The site's old `/admin` pages, which write to the database directly and keep no audit trail, are no longer reachable |
| Status | **Complete** (switch). Deleting the old pages' code is part of MIG-012, so turning the switch off restores them |
| How | New setting `OBASIX_ADMIN_APP_URL` on the site. When set, `src/proxy.ts` answers every `/admin` and `/admin/<section>` page with a permanent (308) redirect to the same section of the admin app. The build fails if the URL isn't absolute http(s), or if `admin-core` isn't in `OBASIX_API_ROUTES`, because the app talks only to FastAPI |
| Why not delete now | The site's own suites (`e2e/admin.spec.ts`, `channels.spec.ts`, `security.spec.ts`) still run the portal in the deployment mode without FastAPI. Removing it before production runs on FastAPI would leave staff with no admin in that mode |
| Rollback | Unset `OBASIX_ADMIN_APP_URL` |

**Tests**

| Suite | Result |
|---|---|
| Migration E2E `migration-011-admin-portal.spec.ts`: `/admin`, `/admin/orders`, `/admin/stock`, `/admin/proofs` → 308 to the app's section; a visitor following it lands on the app's sign-in; `/api/admin/*` forwarding unchanged. `migration-003` now drives stock through the API (the screen is covered by `migration-004`) | 46/46 Chromium (whole migration suite, MIG-001 to 011) |

## MIG-012: Remove the Next.js copies (gated on production)

| Field | Value |
|---|---|
| Objective | Delete the site's own handlers for every area FastAPI now serves (`src/app/api/*` for the 21 areas), the old `/admin` pages and `src/components/admin/*`, the direct-read fallbacks added in MIG-010, and the store code only they use |
| Status | **Not started: gated.** It removes the rollback path for every earlier migration, so it waits for evidence from production |
| Gate (all required) | 1. Production has run with all 21 areas in `OBASIX_API_ROUTES`, `OBASIX_SCHEMA_OWNER=alembic` and `OBASIX_ADMIN_APP_URL` set for at least two weeks, including a month-end. 2. No rollback was used in that time. 3. FastAPI's 5xx rate and p95 latency are no worse than the site's before the switch (Sentry / request logs). 4. A sign-off from the person who owns operations |
| Also needed first | Done in MIG-012a: the customer order list. `/api/ai/sign-layouts` stays in Next.js by design (its rules also run in the browser) |
| Steps when the gate passes | Delete in one PR per area group (auth+account, admin, quotes+proofs, commerce, channels, AI), each running the regression suite with that group's code gone. Then make `OBASIX_API_URL` required in production builds, drop `servedByFastApi` fallbacks, and move the site's suites that exercised the portal (`e2e/admin.spec.ts`) onto the admin app |
| Rollback | Revert the PR; config switches still exist until the last step |

## MIG-012a: Customer order list on FastAPI

| Field | Value |
|---|---|
| Objective | The last direct read on the account pages (company page, "recent orders") goes through FastAPI |
| Status | **Complete** |
| Endpoint | `GET /api/commerce/orders` with no `id`: the signed-in account's newest 50 orders (same query as the site's `listDemoOrdersForUser`); 401 when signed out. It answers in every commerce mode, because the history is the account's own data and the company page reorders from it. With `?id=` the behaviour is unchanged. The path is already in the `commerce` area, so no forwarding change |
| Rollback | Remove `commerce` from `OBASIX_API_ROUTES`; the page falls back to its direct read |

**Tests**

| Suite | Result |
|---|---|
| API (pytest): signed out → 401; own orders newest first; still listed when checkout is unconfigured while `?id=` keeps its 503; another account sees none | 131/131 |
| Migration E2E: a demo order placed through FastAPI is listed by `GET /api/commerce/orders` and shown on `/account/company` | migration-010 and 006: 6/6 Chromium |
