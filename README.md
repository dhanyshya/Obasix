# OBASIX Industries — Ecommerce Site

Ecommerce site for **OBASIX Industries**: whiteboards, notice boards, pin-up boards, combination boards, signage, stands and accessories. It covers the shop, board and sign customisation, quotes, checkout, customer accounts, trade channels (distributors, partners, associates) and a staff admin.

Based on the real catalogue at [obasix.com](https://www.obasix.com/).

**Stack:** Next.js 16 (App Router), React 19, MUI 9, Tailwind 4, Postgres or SQLite, Vercel Blob, Razorpay, Resend, Claude.

## Getting started

Requires **Node 24** (Node 22.13 or later is the minimum, for `node:sqlite`). CI runs on Node 24.

```bash
npm install
cp .env.example .env.local   # optional: every integration is off until its keys are set
npm run dev
```

With no settings, the site runs in **demo mode**: SQLite and local files under `.data/`, simulated payments (`OBASIX_COMMERCE_MODE=demo`), no emails and no AI suggestions.

## Configuration

Each integration switches on when its environment variables are set. [docs/going-live.md](docs/going-live.md) has the full production checklist.

| Area | Variables |
| --- | --- |
| Site & accounts | `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET` (required in production), `OBASIX_ADMIN_EMAILS` (staff allowed into `/admin`) |
| Database | `DATABASE_URL` (Postgres, e.g. Neon). Without it, data is stored in local SQLite (`OBASIX_AUTH_DB`) |
| File storage | `BLOB_READ_WRITE_TOKEN`: private Vercel Blob store for quote attachments and design proofs |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `OBASIX_STAFF_ALERT_EMAILS` (optional) |
| AI design help | `ANTHROPIC_API_KEY`: frame-colour suggestions in the visualizer and alternative layouts in the sign studio |
| AI chat assistant | `OBASIX_AI_API_KEY` (falls back to `OPENAI_API_KEY`), `OBASIX_AI_BASE_URL`, `OBASIX_AI_MODEL` |
| Hosting | `TRUST_PROXY_HEADERS=1` only when self-hosting behind a proxy you control |

API keys are only read on the server. Never prefix them with `NEXT_PUBLIC_`.

### Ask OBASIX AI (chat assistant)

The floating chat button appears on every page. It calls `POST /api/ai/chat`, which uses any OpenAI-compatible Chat Completions provider (the default is `https://api.openai.com/v1` with `gpt-4o-mini`). Answers are based on the catalogue in `src/data/catalogue.ts`, and the server checks each recommended product id before showing a product card.

If no key is set, or the provider returns an auth or quota error, the chat shows a short message, a Retry button, suggestions from the catalogue and links to Products, Customize and Quote. It never makes up an answer. To check the configuration, call `GET /api/ai/chat` or `GET /api/ai/status`, or run `node scripts/diagnose-ai.mjs`.

## Routes

| Area | Routes |
| --- | --- |
| Shop | `/`, `/products`, `/products/[id]`, `/compare`, `/kits`, `/materials`, `/premium` |
| Design tools | `/customize`, `/visualize`, `/smart-space`, `/planning`, `/signage`, `/signage/design` |
| Buying | `/cart`, `/checkout`, `/quote`, `/orders/track` |
| Company | `/about`, `/solutions`, `/projects`, `/oem` |
| Trade channels | `/distributors`, `/partners`, `/associates` |
| Accounts | `/login`, `/register`, `/forgot-password`, `/account/*` (orders, quotes, proofs, wishlist, company, channel dashboards) |
| Staff | `/admin/*` (orders, quotes, proofs, stock, distributors, partners, associates) |
| API | `/api/*`: route handlers for AI, auth, commerce, quotes, proofs, stock and the trade channels |

## Project layout

- `src/app/`: pages and API route handlers
- `src/components/`: UI, including the chat assistant in `src/components/ai/`
- `src/data/`: catalogue (`catalogue.ts`) and image map (`images.ts`)
- `src/lib/`: server logic: `db`, `auth`, `commerce` (Razorpay), `email` (Resend), `storage` (Blob or local files), `ai`, `quotes`, `proofs`, `stock`, and the trade channels
- `src/theme/`: brand tokens and the MUI theme

## Brand

- Logo: `public/obasix-logo.png`
- Colours: forest green `#174F3A`, charcoal `#202923`, pale green `#F0F5EF`. They are defined in `src/theme/brandTokens.ts` and `src/app/globals.css`.
- Design system: [DESIGN.md](DESIGN.md). Product overview: [PRODUCT.md](PRODUCT.md).

## Scripts and testing

```bash
npm run lint
npm run typecheck
npx playwright install chromium     # first time only
npm run test:e2e                    # starts `next dev` on :3217 in demo mode with a throwaway database
npm run test:e2e:production         # desktop suite against a production build
npm run test:e2e:browsers           # all browsers
npm run test:e2e:integrations       # integration suite (playwright.integrations.config.ts)
```

[docs/testing.md](docs/testing.md) describes test coverage. The `docs/` folder also holds the codebase audit, feature inventory, gap analysis and roadmap.
