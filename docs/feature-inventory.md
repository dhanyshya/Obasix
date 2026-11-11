# Feature inventory

Status key:

- **Working:** verified in a real browser or by API tests.
- **Partial:** works, but has a known gap.
- **Broken:** does not work.
- **Missing:** not built.
- **Needs config:** requires external configuration.
- **Not verified:** not tested.

E2E means the feature is covered by the Playwright suite in `e2e/`.

## Shopping

| Feature | Route / module | Status | Evidence / notes |
|---|---|---|---|
| Homepage | `/` | Working | E2E layout checks at 3 viewports: no console errors, overflow or broken images |
| Catalogue grid, filters, sort | `/products` | Working | E2E: price-ascending order checked |
| Search by name | `/products?q=` and header search | Working | E2E ("ceramic") |
| Search by product code | `/products?q=CMWB6090` | Working | E2E |
| Quick View | ProductQuickView | Working | E2E |
| Product Finder | ProductFinder | Not verified | Renders. Its logic was not exercised. |
| Product detail, gallery, specs | `/products/[id]` | Working | E2E. Metadata and Product JSON-LD added. |
| Complete Your Board / related products | CompleteYourBoard | Working | Visible on the detail page |
| **Product comparison** | `/compare`, compare tray | Working (new) | E2E: compare two products |
| Mega menu (desktop) | Header / MegaMenu | Working | Layout E2E |
| Mobile bottom navigation | MobileNav | Working | E2E on mobile |

## Customisation and visualisation

| Feature | Route | Status | Notes |
|---|---|---|---|
| Design Your Board (size, frame, finish, features) | `/customize` | Working | E2E: add to cart |
| Logo upload | LogoUploader | Working | PNG/JPEG only. E2E upload. The logo stays in the browser; it is not uploaded to the server. |
| Combination boards | CombinationDesigner | Working | The layout now carries through to the cart |
| Save configuration to account | SaveConfigurationButton → `/api/account` | Working | Requires sign-in |
| Quote handoff from the customizer | `/quote?…` query prefill | Working | |
| Visualize Your Space | `/visualize`, `/visualize/[wallId]` | Partial | Renders at 3 viewports. Drag, scale and export were not tested by automation. No AR is claimed. |
| Smart Space | `/smart-space` | Working | Renders with catalogue products |
| Solutions | `/solutions`, `/solutions/[slug]` | Working | 10 solution pages, linked to real products |

## Cart, checkout and orders

| Feature | Status | Notes |
|---|---|---|
| Cart, quantity, remove, subtotal | Working | E2E. Guest cart survives a reload. |
| Signed-in cart sync | Working | Stored on the server |
| Checkout details form | Working | E2E |
| Payment | Needs config | No payment provider is integrated. Demo mode simulates UPI, card or cash on delivery and labels it "demo" everywhere. Production without credentials shows "unconfigured" and never charges. |
| Order creation | Partial | Demo orders are stored in SQLite and priced on the server (E2E). Real orders need an order API (`ORDER_API_URL`, `ORDER_API_TOKEN`, `PAYMENT_WEBHOOK_SECRET`). |
| Confirmation with celebration | Working | E2E |
| Order tracking | Working (demo) | E2E: from a second browser, using a phone number with country code. Wrong contact details are refused. |
| Account order history | Working (demo) | Lists orders placed while signed in |

## Quotes

| Feature | Status | Notes |
|---|---|---|
| Quote form and validation | Working | E2E |
| File upload (PNG, JPEG, WebP, PDF, up to 2 MB) | Working | Checked by content and stored privately |
| Persistence | Partial | Demo store at `.data/demo-quotes.json`. A real quote API is named in settings but not integrated, so the server returns 501. |
| Email notification to the sales team | Needs config | No email provider |
| Quote history in the account | Working | Quotes submitted while signed in |

## Accounts

| Feature | Status | Notes |
|---|---|---|
| Register / login / logout | Working | E2E |
| Forgot / reset password | Partial | Works in development: the link is shown on screen (E2E). Production needs an email provider. |
| Profile, password change, addresses | Not verified | The API was read and looks sound. No automated test. |
| Wishlist | Working | E2E. Guest wishlist persists and merges on sign-in. |
| Access control | Working | E2E: `/api/account` returns 401 when signed out. `/account` redirects. |

## AI assistant

| Feature | Status | Notes |
|---|---|---|
| Chat widget on every page | Working | E2E |
| `/api/ai/chat` | Needs config | The route exists. Live answers need `OBASIX_AI_API_KEY`. Without it, the assistant gives catalogue-matched suggestions and links (E2E). |
| Grounding | Working | All 50 products with specifications; product ids are checked on the server; verified company facts; told not to invent warranty, stock or delivery details |

## Other

| Feature | Status |
|---|---|
| About page with verified company facts, GeM and distributor sections | Working |
| 404 page | Working |
| Reduced-motion support | Working |
| SEO: metadataBase, sitemap.xml, robots.txt, per-product metadata and JSON-LD | Working (new) |
