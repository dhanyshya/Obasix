# Backend migration: Next.js API routes → FastAPI, admin → separate React app

Status and evidence for each step: [migrations/tracking.md](migrations/tracking.md).

## Target

| Part | Today | Target |
|---|---|---|
| Customer site | Next.js 16 (`src/app`) | Next.js 16, pages only; all data through FastAPI |
| Backend | Next.js route handlers (`src/app/api`) | FastAPI service in `api/` |
| Admin | Pages inside the Next.js site (`/admin`) | Separate React app, talking only to FastAPI |
| Database | Postgres (SQLite locally) | Postgres everywhere; schema owned by Alembic in `api/migrations` |

## How it moves without breaking the site

1. **One database, shared during the move.** FastAPI reads and writes the tables the site already uses. Passwords use the same scrypt format and sessions use the same `obasix_session` cookie and `sessions` table, so a customer signed in by either side is signed in on both.
2. **One area at a time.** `src/proxy.ts` forwards the API areas listed in `OBASIX_API_ROUTES` to `OBASIX_API_URL`. Every other route keeps running in Next.js. Removing an area from the list rolls it back immediately; no data changes are needed.
3. **Responses don't change.** A migrated endpoint keeps its path, status codes and JSON, so the site's pages need no changes. The parity tests in `api/tests/test_parity.py` run the site's TypeScript and the Python port on the same inputs and compare the results.
4. **Old code is removed last.** An area's route handler in `src/app/api` is deleted only after it has run on FastAPI in production without problems.

### Visitor IPs and rate limits

The site's proxy sends the visitor's IP to FastAPI in `x-obasix-client-ip`, along with `x-obasix-proxy-secret`. FastAPI only trusts that IP when the secret matches `OBASIX_API_PROXY_SECRET`. Without the secret, every visitor would share one rate-limit bucket. Without the check, an attacker could pick their own IP and get around the limit.

## Staff roles (from MIG-003)

| Role | Permissions |
|---|---|
| `admin` | all of the above, plus `audit:read` and `staff:manage` |
| `staff` | `stock:read`, `stock:write`, `quotes:read`, `proofs:read`, `proofs:write` |

Each later admin migration adds its own permissions (for example `orders:write`) and decides which roles get them.

- Emails in `OBASIX_ADMIN_EMAILS` are always `admin`. They can't be changed or removed through the API, so there is always a way back in.
- An admin grants or removes other roles with `POST`/`DELETE /api/admin/staff`. Each change is audited.
- Signed-out visitors and customers get `404 Not found.` from every admin endpoint. Staff without the permission an endpoint needs get `403`.
- Until the React admin app (MIG-004) exists, the `/admin` pages in Next.js still admit only `OBASIX_ADMIN_EMAILS`. Someone granted `staff` in the table can use the admin API, but can't open those pages yet.

## Files (decided in MIG-005b)

Quote attachments and design proofs live in a private Vercel Blob store in production, and in the site's `.data/` folder otherwise. FastAPI uses the same store:

- **Production:** `api/app/core/storage.py` speaks the private Blob protocol of `@vercel/blob` 2.x. `api/tests/test_storage.py` runs the official SDK and the Python client against the same recording server and requires identical uploads (method, path, body, every header except the per-request id and the HTTP client's own). Downloads use the SDK's URL and token. Set the same `BLOB_READ_WRITE_TOKEN` on both sides.
- **Local and single-server:** set `OBASIX_FILES_DIR` to the site's `.data` folder. `npm run dev:all` and the migration tests do this.
- If the Blob protocol changes (new `@vercel/blob` major version), the parity test fails before anything ships.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `OBASIX_API_URL` | site | FastAPI base URL. Leave unset to keep everything in Next.js |
| `OBASIX_API_ROUTES` | site | Areas to forward, comma-separated (`auth`, `account`, `admin-core`, `admin-stock`, `quotes`, `admin-quotes`, `quote-submit`, `admin-quote-files`, `proofs`, `admin-proofs`, `commerce`, `stock`, `admin-orders`). An entry ending in `/` in `src/lib/fastApi.ts` is a prefix |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | site and API | The same values on both once `commerce` is on (the webhook URL stays the site's) |
| `BLOB_READ_WRITE_TOKEN` | site and API | The same private Blob store (production) |
| `OBASIX_FILES_DIR` | API | The site's `.data` folder when there's no Blob token |
| `AUTH_SECRET` | site and API | Required on both, with the same value, once `quotes` or `quote-submit` is on: it signs the cookie that lets a browser read the quote it sent. The build fails without it |
| `OBASIX_API_PROXY_SECRET` | site and API | Same random value on both sides, 32+ characters |
| `DATABASE_URL` | site and API | The same Postgres database |
| `ALLOWED_ORIGINS` | API | Browser origins allowed to make changes (the site, later the admin) |
| `OBASIX_COMMERCE_MODE`, `RAZORPAY_*` | API | Same values as the site, so the account page reports the same order mode |

The build fails if `OBASIX_API_URL` is set without `DATABASE_URL` or a valid secret, or if `OBASIX_API_ROUTES` names an unknown area.

## Phases

| ID | Area | Endpoints | Status |
|---|---|---|---|
| MIG-001 | Accounts | `/api/auth` | Done, off by default; see tracking |
| MIG-002 | Account data | `/api/account` (profile, password, addresses, wishlist, saved configs, cart; lists orders read-only) | Done, off by default; see tracking |
| MIG-003 | Admin foundation + stock | Roles (`admin`, `staff`) and permissions, append-only audit log, `/api/admin/{me,audit,staff}`, `/api/admin/stock` | Done, off by default; see tracking |
| MIG-004 | Admin app | New React app (`admin/`, Vite) on MIG-003; the `/admin` pages in Next.js are retired | Planned |
| MIG-005 | Reading quotes | `GET /api/quotes/{reference}`, staff list `GET /api/admin/quotes`, admin app Quotes page | Done, off by default; see tracking |
| MIG-005b | Files, quote submission, proofs | `POST /api/quotes`, `/api/admin/quotes/{ref}/file`, `/api/proofs`, `/api/proofs/{id}/file`, `/api/admin/proofs`; admin app Proofs page | Done, off by default; see tracking |
| MIG-006 | Commerce | `/api/commerce/{mode,orders,payment,payment/webhook,track}`, `/api/stock`, `/api/admin/orders`; admin app Orders page | Done, off by default; see tracking |
| MIG-007 | Trade channels | distributors, partners, associates, and their `/api/admin/*` routes; fix DEF-001 first | Planned |
| MIG-008 | AI | chat, frame colours, sign layouts | Planned |
| MIG-009 | Schema ownership | Next.js stops creating tables; Alembic owns every change; SQLite dropped | Planned |

## Running it

```bash
npm run dev:all           # Postgres (docker) + migrations + FastAPI :8000 + site :3000 (auth, account and admin stock on FastAPI)
npm test                  # FastAPI lint, unit and integration tests (needs docker)
npm run test:e2e:migrations
npm run test:all          # every gate, in order
npm run build:all         # site production build + admin app + API container image
npm run test:e2e:regression-fastapi   # the site's own suites with every migrated area on FastAPI
npm run test:e2e:integrations-fastapi # live payments, email and AI (stand-ins) with every migrated area on FastAPI
```

FastAPI docs: http://127.0.0.1:8000/docs (turned off when `APP_ENV=production`).
