# Going live

Every integration is built and switches on when its settings are present. Without them the site runs in demo mode: SQLite and local files, simulated payments, no emails, no AI suggestions.

Set these in Vercel (Project → Settings → Environment Variables) for Production.

## Required

| Setting | What it's for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Links in emails and the sitemap, e.g. `https://www.obasix.com` | Your domain |
| `AUTH_SECRET` | Required in production for sign-in | Any long random string |
| `OBASIX_ADMIN_EMAILS` | Staff who can open `/admin` (comma-separated) | OBASIX staff list |
| `TRUST_PROXY_HEADERS` | Only if you host somewhere other than Vercel behind a proxy you control: set to `1` so rate limits read `X-Forwarded-For`. On Vercel, leave it unset | — |
| `DATABASE_URL` | Postgres for accounts, orders, quotes, proofs, channels and stock | Vercel → Storage → Neon Postgres |
| `BLOB_READ_WRITE_TOKEN` | Private storage for quote attachments and design proofs | Vercel → Storage → Blob (private store) |

Tables are created automatically on the first request. Quotes saved earlier in `.data/demo-quotes.json` are imported once; other local SQLite data is not copied, so start production with a fresh database.

## Payments (Razorpay)

| Setting | |
|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Account & Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you choose when creating the webhook |

Create a webhook in Razorpay pointing at `https://<your-domain>/api/commerce/payment/webhook` for the `payment.captured` and `order.paid` events. Use test keys first and place a test order end to end.

Before switching to live keys, confirm GST and shipping: checkout charges the catalogue subtotal only.

## Email (Resend)

| Setting | |
|---|---|
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | An address on a domain verified in Resend, e.g. `OBASIX <orders@obasix.com>` |
| `OBASIX_STAFF_ALERT_EMAILS` | Optional: who gets new-order, new-quote and proof alerts (defaults to `OBASIX_ADMIN_EMAILS`) |

## AI design help (Claude)

| Setting | |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

Turns on frame-colour suggestions from room photos (visualizer) and alternative sign layouts (sign studio). Uses `claude-opus-5-5` with server-side fallbacks. These were tested against a stand-in only: try them on real photos before announcing them.

The chat assistant uses its own setting, `OBASIX_AI_API_KEY`.

## After setting everything

1. Redeploy.
2. Sign in with a staff email and open `/admin/orders`, `/admin/quotes`, `/admin/stock`.
3. Place a Razorpay test-mode order and check the confirmation email, the staff alert and the order in `/admin/orders`.
4. Request a quote with an attachment and download it from `/admin/quotes`.
5. Enter real stock counts in `/admin/stock`.
