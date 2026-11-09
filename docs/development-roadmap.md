# Development roadmap

## Done (November 2026)

- Demo orders stored on the server and priced from the catalogue. Tracking works across devices. Order history added to the account.
- Quote attachments checked by content and stored privately.
- Cart fixes: combination layout, standard sizes from the visualizer, guest persistence, clearing after an order, quantity cap.
- Product comparison: up to four products, with a tray and a `/compare` page.
- AI assistant grounded in the full catalogue, specifications and verified company facts.
- About page: verified company facts, GeM and distributor sections.
- SEO: metadataBase, sitemap, robots, product metadata and JSON-LD.
- Accessibility: the AI launcher's motion fixed.
- Playwright suite: 66 checks across desktop, tablet and mobile, all passing.

## Phase 1: go live (blocking)

1. Choose hosting and a managed Postgres database. Port `lib/auth/db.ts` and `lib/commerce/order-store.ts` to it.
2. Integrate a payment gateway with order creation and signed webhooks. Remove the demo mode in production by leaving `OBASIX_COMMERCE_MODE` unset.
3. Set up transactional email for password resets, quote alerts and order confirmations.
4. Set `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`, and configure AI keys.
5. Add shared rate limiting.
6. Confirm the catalogue and prices, tax and shipping rules, and the registered office address with OBASIX.

## Phase 2: complete B2B

- Quote API / CRM integration and a staff quote console.
- Company accounts, GSTIN capture, bulk reorder.
- Distributor enquiry form with its own fields: city and business details.

## Phase 3: experience and growth

- Visualizer QA on touch devices, and image export tests.
- Homepage photography from OBASIX.
- Analytics, a Core Web Vitals budget, and a full accessibility audit.
