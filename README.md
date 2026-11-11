# OBASIX Industries — Premium Ecommerce UI

Next-generation ecommerce experience for **OBASIX Industries** — whiteboards, notice boards, pin-up boards, combination boards, stands and accessories.

Inspired by the real catalogue at [obasix.com](https://www.obasix.com/).

## Brand

- Official logo: `public/obasix-logo.png`
- Tokens: forest green (`#174F3A`), charcoal (`#202923`), pale green (`#F0F5EF`) in `src/theme/brandTokens.ts` and `src/app/globals.css`

## Run

```bash
npm run dev
```

Copy `.env.example` to `.env.local` and set AI keys when you want live chat answers (see below).

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — Discover / Customize / Build |
| `/products` | Showroom catalogue |
| `/products/[id]` | Product detail |
| `/customize` | Design Your Board customizer |
| `/visualize` | Visualize Your Space |
| `/smart-space` | Space setups + Build Your Setup |
| `/cart` | Your OBASIX Setup |
| `/quote` | Custom quote with file uploads |
| `/orders/track` | Order tracking |
| `/solutions` | Application solutions |
| `/about` | About OBASIX |
| `/compare` | Side-by-side product comparison |
| `/api/ai/chat` | Server-side OBASIX AI chat (POST) |

## OBASIX AI Assistant

The floating **Ask OBASIX AI** button is global (root layout). Chat calls **`POST /api/ai/chat`** on the server — API keys are never exposed to the browser.

### Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `OBASIX_AI_API_KEY` | Yes (for live AI) | API key for an OpenAI-compatible Chat Completions provider |
| `OBASIX_AI_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |
| `OBASIX_AI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `OPENAI_API_KEY` | Fallback | Used if `OBASIX_AI_API_KEY` is unset |

Without a key — or if the provider returns quota/auth errors — the assistant stays usable with a friendly message, Retry, catalogue-grounded suggestions, and links to Products / Customize / Quote. It does **not** invent fake AI answers or claim a live model reply succeeded.

If OpenAI returns `insufficient_quota` / `credit_balance_exhausted`, add credits in the OpenAI billing dashboard or switch `OBASIX_AI_BASE_URL` / `OBASIX_AI_API_KEY` to another OpenAI-compatible provider.

Catalogue grounding uses `src/data/catalogue.ts`. Recommended product ids are validated server-side before cards are shown.

Check status: `GET /api/ai/chat`.

## Data architecture

- Catalogue: `src/data/catalogue.ts` (real SKUs / series / prices from OBASIX catalogue)
- Images: `src/data/images.ts` (centralized — replace with official CDN assets later)
- AI: `src/app/api/ai/chat/route.ts` + `src/lib/ai/*` + floating UI in `src/components/ai/`

## Experience

**Discover → Ask OBASIX AI → Find product → Customize → Visualize → Accessories → Cart / Quote**

## Testing

```bash
npm run typecheck
npx playwright install chromium   # first time only
npm run test:e2e                  # starts `next dev` on :3217 in demo mode with a throwaway DB
```

See `docs/testing.md` for coverage and `PRODUCT.md` / `docs/` for the audit, feature inventory and roadmap.
