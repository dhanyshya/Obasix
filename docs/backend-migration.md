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
| `admin` | `stock:read`, `stock:write`, `audit:read`, `staff:manage`, `quotes:read` |
| `staff` | `stock:read`, `stock:write`, `quotes:read` |

Each later admin migration adds its own permissions (for example `orders:write`) and decides which roles get them.

- Emails in `OBASIX_ADMIN_EMAILS` are always `admin`. They can't be changed or removed through the API, so there is always a way back in.
- An admin grants or removes other roles with `POST`/`DELETE /api/admin/staff`. Each change is audited.
- Signed-out visitors and customers get `404 Not found.` from every admin endpoint. Staff without the permission an endpoint needs get `403`.
- Until the React admin app (MIG-004) exists, the `/admin` pages in Next.js still admit only `OBASIX_ADMIN_EMAILS`. Someone granted `staff` in the table can use the admin API, but can't open those pages yet.

## Files (open decision, MIG-005b)

Quote attachments and design proofs are stored in a private Vercel Blob store in production (`.data/` on disk otherwise). Vercel has no Python SDK, so FastAPI can't yet write or read them. MIG-005 therefore moved only the quote reads that live in Postgres. Before MIG-005b, choose one:

1. Re-implement the private Blob protocol in Python. Must be verified against a real store with a test token.
2. Move both apps to S3-compatible storage (R2 or S3), with official SDKs on both sides and a one-off copy of existing files.
3. A shared directory (`OBASIX_FILES_DIR`), for a single-server or Docker deployment only.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `OBASIX_API_URL` | site | FastAPI base URL. Leave unset to keep everything in Next.js |
| `OBASIX_API_ROUTES` | site | Areas to forward, comma-separated (`auth`, `account`, `admin-core`, `admin-stock`, `quotes`, `admin-quotes`). An entry ending in `/` in `src/lib/fastApi.ts` is a prefix |
| `AUTH_SECRET` | site and API | Required on both, with the same value, once `quotes` is on: it signs the cookie that lets a browser read the quote it sent. The build fails without it |
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
| MIG-005b | Files, quote submission, proofs | File storage decision first (see below), then `POST /api/quotes`, quote attachment download, `/api/proofs*`, `/api/admin/proofs` | Planned |
| MIG-006 | Commerce (incl. `/api/admin/orders`) | orders, payment, Razorpay webhook, tracking, stock | Planned; highest risk, money moves |
| MIG-007 | Trade channels | distributors, partners, associates, and their `/api/admin/*` routes; fix DEF-001 first | Planned |
| MIG-008 | AI | chat, frame colours, sign layouts | Planned |
| MIG-009 | Schema ownership | Next.js stops creating tables; Alembic owns every change; SQLite dropped | Planned |

## Running it

```bash
npm run dev:all           # Postgres (docker) + migrations + FastAPI :8000 + site :3000 (auth, account and admin stock on FastAPI)
npm test                  # FastAPI lint, unit and integration tests (needs docker)
npm run test:e2e:migrations
npm run test:all          # every gate, in order
npm run build:all         # site production build + API container image
```

FastAPI docs: http://127.0.0.1:8000/docs (turned off when `APP_ENV=production`).
