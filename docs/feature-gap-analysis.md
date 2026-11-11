# Feature gap analysis

What stands between the current app and a live production store, in priority order.

## P0: blocks taking real money

| Gap | Why it matters | What's needed |
|---|---|---|
| No payment provider | No real orders can be paid | Integrate a payment gateway such as Razorpay or Cashfree in `/api/commerce/payment`. Verify the webhook signature with `PAYMENT_WEBHOOK_SECRET`. Mark an order paid only from the webhook. |
| No production order store | Demo orders live in a local SQLite file | A managed database such as Postgres, plus an `orders` table with the same shape as `demo_orders`. The `order-store.ts` interface can be kept. |
| Local SQLite and file storage | Breaks on serverless or multi-instance hosting | Managed Postgres and object storage for quote files |
| No email provider | No password reset, quote alerts or order confirmations in production | A transactional email service |
| In-memory rate limits | Don't hold across instances and can be bypassed with a spoofed header | Shared rate limiting using a trusted client IP |

## P1: completeness

- **Catalogue accuracy:** run a full SKU and price check against obasix.com and obasix.in. Add verified glass boards and the missing SCUV, SMWB and CWBPB variants.
- **Quote API integration:** wire `QUOTE_API_URL` to the sales system or CRM. Add a staff view of stored quotes and their attachments.
- **Stock and availability:** obasix.com has pre-order items, but the app has no stock model. The app never claims something is in stock.
- **Tax and shipping:** checkout shows a catalogue subtotal only. GST and shipping rules need to be confirmed with OBASIX.
- **Promotions:** OBASIX5 and the sale terms are unverified, so they are not implemented.
- **Lint debt:** 15 React Compiler errors (setState in effects).

## P2: experience

- Visualizer: automated tests for drag, resize and export, and a manual QA pass on touch devices.
- Homepage: an editorial refresh using verified product photography from OBASIX rather than stock imagery (some hero images come from Unsplash).
- Product Finder: tests and tuning.
- AI: streaming responses, and live provider evaluation once a key is configured.

## P3: growth

- B2B: company accounts, multiple buyers, tax-invoice details (GSTIN), reorder from past orders.
- Analytics: privacy-respecting events for funnel steps.
- Accessibility: a full WCAG 2.1 AA audit with screen readers. Only automated checks and the motion fix have been done so far.
- Performance: Core Web Vitals measurement on production hosting.
