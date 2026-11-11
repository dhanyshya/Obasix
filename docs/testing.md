# Testing

## How to run

```bash
npm run typecheck      # next typegen && tsc --noEmit
npm run test:e2e       # Playwright
```

Playwright starts `next dev` on port 3217 in demo commerce mode. The database is `.data/e2e-auth.sqlite`, so tests don't touch real data. No real payments are made: the payment provider is not integrated, and demo mode only simulates payment.

## Coverage

**`e2e/layout.spec.ts`** covers 17 pages at three viewports: desktop 1440, tablet 820 and mobile (Pixel 7). That's 51 checks. Each check confirms:

- HTTP status below 400
- No console errors or page errors
- No horizontal overflow
- No broken images, after scrolling to load lazy images
- No 5xx responses from `/api` calls (AI routes excluded)

**`e2e/flows.spec.ts`** (desktop, 14 tests):

- Search by name; search by product code; sorting by price
- Quick View; product detail with JSON-LD; comparing two products
- Cart → checkout → demo payment → confirmation. Also checks the cart is cleared afterwards and the order can be tracked from a second browser using a phone number with country code.
- Tracking refuses a wrong contact
- Quote submission with a PDF attachment
- Customizer with a logo upload → add to cart
- Visualizer wall page; Solutions and Smart Space product links
- Register → wishlist → orders page → anonymous API returns 401 → forgot password → reset → login
- AI assistant: answers, or falls back with catalogue links when no key is configured

**`e2e/mobile.spec.ts`**: mobile bottom navigation.

## API checks (run manually with curl)

- An order with a tampered `unitPrice` is re-priced from the catalogue.
- Retrying with the same idempotency key returns the same order.
- Cross-origin order requests are rejected with 403.
- Custom-size lines and unknown products are refused.
- Quote: a fake PDF (wrong file signature) is refused; a real PDF is stored.
- Signed-out `/api/account` returns 401. Fetching a guest order by id returns 404.

## Not covered by automation

- Visualizer drag, resize and image export.
- Profile editing and address management.
- Live AI answers, which need an API key.
- Real payment, which is not integrated.
- Screen-reader accessibility.
