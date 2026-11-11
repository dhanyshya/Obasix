# Codebase audit

## Stack

- Next.js 16.3.8 (App Router, Turbopack)
- React 19.2
- MUI 9 with an Emotion cache, Tailwind 4
- `motion` for animation
- TypeScript 5

Persistence is `node:sqlite`, a file database at `.data/auth.sqlite`, with the path overridable through `OBASIX_AUTH_DB`. Demo quotes are stored in a JSON file at `.data/demo-quotes.json`. There is no ORM and no external services.

The project had no tests before this work. It now has a Playwright suite in `e2e/`.

## Build health

| Check | Result |
|---|---|
| `next build` | Passes: 55+ routes, static and SSG where possible |
| `tsc --noEmit` | Passes after `next typegen`, which generates the `LayoutProps` / `PageProps` globals |
| `eslint` | 15 errors and 1 warning. All are React Compiler rules, mostly `set-state-in-effect` in existing components. They are style and performance warnings, not correctness bugs. |
| `npm audit` | Reports advisories in transitive dev dependencies. Not triaged. |

## Server routes

| Route | Purpose | Notes |
|---|---|---|
| `POST /api/auth?action=register\|login\|logout\|forgot\|reset` | Accounts | Same-origin check, per-IP rate limit, scrypt hashing, constant-time compare, a dummy hash on unknown email (avoids user enumeration), sessions stored as SHA-256 hashes, httpOnly cookie |
| `GET /api/auth` | Current session | |
| `GET/POST/DELETE /api/account` | Profile, password, addresses, wishlist, saved configurations, cart, orders | Every query is scoped by `user_id` |
| `GET /api/commerce/mode` | `demo` / `real` / `unconfigured` | Shared logic now lives in `lib/commerce/mode.ts` |
| `POST/GET /api/commerce/orders` | Orders | Demo orders are now stored on the server (see below). Real mode returns 501 until an order API is integrated. |
| `POST /api/commerce/payment` | Payment start | Not implemented. Returns 503 or 501 and never charges. |
| `POST /api/commerce/track` | Order tracking | Server lookup with contact verification and a rate limit |
| `POST /api/quotes`, `GET /api/quotes/[reference]` | Quotes | Validation, idempotency, rate limit. Files are now checked by their content and stored. |
| `GET/POST /api/ai/chat` | Assistant | OpenAI-compatible provider. The key stays on the server. Product ids are checked against the catalogue. Rate limited, with a catalogue-only fallback. |

## Security findings

**Strengths:**

- Password hashing, session handling and CSRF protection (an `Origin` check on mutations) are sound.
- Every account query is scoped to the signed-in user.
- The reset token is single-use, expires after 30 minutes, and resetting signs out all sessions.
- AI keys never reach the client, and error details are scrubbed of keys.

**Issues fixed in this pass:**

1. Demo order totals were calculated in the browser and the order was stored only in sessionStorage. A user could change prices, tracking worked only in the same tab, and account order history was always empty. Orders are now priced from the catalogue and stored on the server.
2. Quote attachments were checked only against the MIME type the browser declared. The file is now checked by its content (magic bytes), stored privately in `.data/quote-files/`, and recorded with the quote.
3. Tracking did not match phone numbers entered with a country code.

**Open items:**

- Rate limits are in memory and keyed on `x-forwarded-for`. That header can be spoofed unless a trusted proxy sets it, and the limits don't hold across several server instances. Use a shared store such as Redis in production.
- Expired sessions are never cleaned up. They are rejected when read but stay in the table.
- Password reset links can't be emailed because there is no email provider. In development the link is shown on screen; in production none is issued.
- SQLite on local disk won't work on serverless hosting, where the filesystem is temporary. Production needs a managed database.

## Client bugs fixed

| Bug | Effect | Fix |
|---|---|---|
| `addItem` dropped `combinationLayout` | Combination boards lost their layout in the cart | The field is now copied through |
| The visualizers always passed custom dimensions | Standard boards added from the visualizer became "Quote" lines and couldn't be bought | Dimensions matching a catalogue size are normalised to that size |
| The guest cart wasn't persisted | The cart was lost on refresh | localStorage, re-priced from the catalogue on load. Logo images are left out. |
| Guest wishlist wasn't persisted | Lost on refresh | localStorage |
| The cart wasn't cleared after an order | The cart stayed full after "payment" | Cleared once the server confirms the order |
| No quantity cap on the client | The server silently drops lines over 99 | Quantities are clamped to 1–99 |
| AI context capped at 48 of 50 products and had no specifications | Two products were invisible, and the assistant couldn't compare specs | All products are included with specs, list price and verified company facts |
| The AI launcher floated forever | WCAG 2.2.2 failure, and the moving button was hard to click | Pauses on hover and focus, and stops under reduced motion |
