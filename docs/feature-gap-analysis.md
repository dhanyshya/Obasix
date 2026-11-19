# Feature gap analysis

What stands between the current app and a live production store, in priority order.

## P0: blocks taking real money

| Gap | Why it matters | What's needed |
|---|---|---|
| Razorpay keys not yet added | Live payments are built (Razorpay Standard Checkout with signed callback and webhook, staff order management) but need a merchant account | Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`; point a webhook for `payment.captured` and `order.paid` at `/api/commerce/payment/webhook`. Confirm GST and shipping first: checkout charges the catalogue subtotal only. |
| No production order store | Demo orders live in a local SQLite file | A managed database such as Postgres, plus an `orders` table with the same shape as `demo_orders`. The `order-store.ts` interface can be kept. |
| Local SQLite and file storage | Breaks on serverless or multi-instance hosting | Managed Postgres and object storage for quote files |
| Resend key not yet added | Email is built (order confirmation and dispatch, password reset, quote and proof notices, staff alerts) but sends nothing until configured | Verify the sending domain in Resend, then set `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `OBASIX <orders@obasix.com>`) and optionally `OBASIX_STAFF_ALERT_EMAILS`. Set `NEXT_PUBLIC_SITE_URL` so links point at the live site. |
| In-memory rate limits | Don't hold across instances and can be bypassed with a spoofed header | Shared rate limiting using a trusted client IP |

## P1: completeness

- **Catalogue accuracy:** run a full SKU and price check against obasix.com and obasix.in. Add verified glass boards and the missing SCUV, SMWB and CWBPB variants.
- **Quote API integration:** wire `QUOTE_API_URL` to the sales system or CRM. Add a staff view of stored quotes and their attachments.
- **Stock and availability:** built. Staff enter on-hand counts at /admin/stock; paid orders deduct them. Untracked products show no availability, so nothing appears until OBASIX enters real counts.
- **Tax and shipping:** checkout shows a catalogue subtotal only. GST and shipping rules need to be confirmed with OBASIX.
- **Promotions:** OBASIX5 and the sale terms are unverified, so they are not implemented.
- **Lint debt:** resolved. The React Compiler errors are fixed; six effects that restore state from browser storage after hydration keep a commented rule exception. Four unused style constants remain as warnings.

## P2: experience

- Visualizer: automated tests for drag, resize and export, and a manual QA pass on touch devices.
- Homepage: an editorial refresh using verified product photography from OBASIX rather than stock imagery (some hero images come from Unsplash).
- Product Finder: tests and tuning.
- AI: streaming responses, and live provider evaluation once a key is configured.

## P3: growth

- B2B: company accounts, multiple buyers, tax-invoice details (GSTIN), reorder from past orders.
- Analytics: privacy-respecting events for funnel steps.
- Accessibility: automated WCAG 2.1 AA scan (axe-core) is clean on 41 public, account and staff pages after scrolling content into view. Still needed: a manual pass with NVDA/VoiceOver and keyboard-only testing of the visualizer and studios.
- Performance: Core Web Vitals measurement on production hosting.
