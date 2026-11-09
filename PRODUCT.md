# OBASIX flagship store

The e-commerce and workspace-planning site for OBASIX Industries Pvt. Ltd., a Delhi manufacturer of whiteboards, notice and pin-up boards, combination boards, chalk boards, stands and accessories.

## Who it serves

- **Retail buyers** (home, small office): browse, compare, buy priced catalogue items.
- **Business and institutional buyers** (corporates, schools, training centres): plan by space, customise sizes and branding, request quotes.
- **Government buyers:** pointed to OBASIX's GeM listing.
- **Distributors:** distributor enquiries.

## Core journeys

1. **Discover:** catalogue, search by name or product code, filters, Product Finder, Smart Space, Solutions, AI assistant.
2. **Decide:** product detail with specifications, side-by-side comparison, Visualize Your Space.
3. **Design:** Design Your Board (size, frame, finish, features, logo, combination layouts). Saved to the account.
4. **Buy:** cart, checkout, payment, confirmation, tracking. Demo mode until a payment provider is integrated.
5. **Quote:** custom, bulk, branded or distributor requests with file attachments.

## Principles

- **Only verified facts.** Product data comes from `src/data/catalogue.ts`; company facts from `src/data/company.ts`, sourced in `docs/official-website-audit.md`. No invented specifications, warranty, stock or delivery promises.
- **Never fake success.** A payment or order is shown as successful only when the server confirms it. Demo mode is labelled everywhere.
- **The server is the authority.** Prices, product ids and account data are validated on the server.

## Docs

- `docs/official-website-audit.md`
- `docs/codebase-audit.md`
- `docs/feature-inventory.md`
- `docs/feature-gap-analysis.md`
- `docs/development-roadmap.md`
- `docs/testing.md`
