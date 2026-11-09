---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/layout/Header.tsx","src/components/product/ProductCard.tsx"]
---

# Storefront (home, header, catalogue, product)

Scope: homepage, global header/footer, product cards, catalogue, product detail. Mode: Persuade (home), Operate (catalogue/PDP) inside the same world.
Audience: corporate facilities/admin buyers, schools and training centres, retail home-office buyers in India. Job: find the right board for a space, trust OBASIX as the maker, buy or request a quote.
Proof on hand: real catalogue (50 SKUs, codes, sizes, INR prices, specs), official Shopify product photography, verified company facts (Bawana factory, GeM OEM). No invented claims.

## Direction contract

THESIS: OBASIX is a building directory. The site is a lobby wayfinding system: spaces are colour-coded zones, products are destinations with codes, and the logo's tick becomes the arrow. Refuses the stock-office-photo hero with an italic serif headline.

OWN-WORLD: Signage field green (deep forest) as committed ground for the utility bar, homepage directory and catalogue header (main header and footer stay white and charcoal for legibility); enamel white panels; signal orange from the logo's "O" marks the current zone and focus; signal red reserved for the primary action. Heavy grotesk (Archivo) set like sign lettering, large tabular numerals for sizes and prices, Inter for body. Square-cornered panels, 2px rules, arrow glyphs, zone numbers in roundels.

STORY: Visitor sees the directory, picks their space, sees real boards for it with prices and codes, adds one to cart or requests a quote; trusts the maker through codes, specs and the factory address.

FIRST VIEWPORT: Left two-thirds: a green directory board listing the eight catalogue spaces (src/data/catalogue.ts `spaces`) as numbered rows with arrows; a horizontal chip strip on phones and a giant sign-lettered headline "Every space has a board." Right third: the active zone's lead product on a white enamel panel with code, size, price and a working Add to Cart. Choosing a row swaps the panel.

FORM: Office wayfinding signage system, candidate 5 of 7, seed b799ed2c. Raises: dense product-code band (from obi sleeve); stripe spine in logo colours persists across pages (from livery); sizes as one unbroken row of keys (from step row).

FINISH: unreviewed and unverified until the finish review runs.
