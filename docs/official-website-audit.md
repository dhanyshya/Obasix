# Official website audit — obasix.com and obasix.in

Reviewed 9 November 2026. Only what was observed on the live pages is recorded. Pages that could not be loaded are listed at the end.

## obasix.com

**Platform:** Shopify storefront, priced in INR (Rs.). Footer: "A HSN group company".

**Catalogue structure (Products menu):**

- Whiteboards, non-magnetic: Superior, Classic, Pinewood series
- Whiteboards, magnetic (resin coated): Superior, Classic, Pinewood series
- Whiteboards, ceramic steel (magnetic)
- Whiteboard stands
- Glass boards (links to the quote page, not to a product list)
- Notice / pin-up boards: Superior, Classic
- Chalk boards: Classic, Pinewood
- Combination boards: Classic
- Whiteboard accessories (markers, holders), display stands, desk accessories, easel stands, wooden products, other products
- Downloadable PDF catalogue

**Products seen on the homepage:**

| Code | Product | Price | List price | Button |
|---|---|---|---|---|
| SMWBPCB90120 | Superior Series Magnetic White Board 3×4 ft, heavy aluminium frame, black | Rs. 4,330 | Rs. 7,077 | Add to cart |
| SMWBPCB4560 | Superior Series Magnetic 1.5×2 ft, black frame | Rs. 2,733 | Rs. 4,555 | Pre-order |
| SMWB6090 | Superior Series Magnetic 2×3 ft, natural finesse frame | Rs. 4,278 | Rs. 7,130 | Pre-order |

**Specifications stated:**

- Aluminium and ABS construction.
- Surface described as "grade IS: 2046:1995 thermosetting synthetic resin bonded laminated" (the text was cut off on the page).
- No warranty term was seen.

**Commerce features:**

- Cart, account sign-in and registration, wishlist, quick view, search.
- Newsletter sign-up and back-in-stock alerts.
- Card logos: Visa, Mastercard, Maestro, Amex.
- Promotions: banners for code OBASIX5 (5% off), "Save up to 30%" and free shipping.

**Bulk and custom orders:** /pages/get-quote, plus a WhatsApp link. The site promises "any size" and "special bulk pricing and free delivery".

## obasix.in

**Platform:** WordPress / WooCommerce-style catalogue. It is positioned as a Delhi manufacturer.

**Pages:**

- Categories and Shop
- Bulk Buying
- Customisation
- Distributor
- About, Contacts
- PDF catalogue

**Products seen:**

| Code | Product | Price shown |
|---|---|---|
| SCUV4560 | Ceramic steel 1.5×2 ft | $2,331 → $2,190 |
| SCUV6090 | Ceramic steel 2×3 ft | $4,710 → $3,790 |
| SCUV90120 | Ceramic steel 3×4 ft | $8,530 → $7,677 |
| SCUV120120 | Ceramic steel 4×4 ft | $11,355 → $10,219 |
| SCWB120150 | Superior ceramic steel 4×5 ft | $13,180 → $11,800 |
| SCUV120180 | Ceramic steel 4×6 ft | $17,060 → $15,354 |
| CWBPBB4560 / CWBPBMG4560 | Classic combination 1.5×2 ft (blue / mid-grey pin-up) | $1,490 → $1,211 |
| CWBPBB6090 | Classic combination 2×3 ft, blue | $2,850 → $1,940 |

**Product specifications (SCUV4560 page):**

- Ceramic-coated steel surface, described as smooth, scratch-free and warp-free, and magnetic.
- Claims EN-101 conformance.
- Frame: heavy anodised aluminium, 16 mm outer thickness, alloy 63400 HE9 / 6063. ABS corners stamped with the OBASIX logo.
- Made in India.
- Supplied as one board in corrugated packaging.

**Company claims:**

- OBASIX Industries Pvt Ltd, "leading manufacturer".
- Certification logos (logos only, no certificate numbers): ISO 9001:2015, CE, QCI, DPCC, IEC, registered trademark.
- About page statistics: "20+ years of innovation", "15+ product categories", "95% customer satisfaction".
- Registered OEM on GeM, with a link to the GeM search page.

**Programmes:**

- Customisation: logo, colour, non-standard sizes, magnetic or planner options.
- Bulk buying: aimed at retailers, distributors and corporates.
- Distributor programme: city-level distributors, GeM reseller approval, priority for regional resellers.
- No minimum order quantities, lead times or discount tiers are stated.

## Shared contact details

Both sites give the same phone number, email, factory and store addresses:

- Phone: +91 9999 044 222. Email: info@obasix.com.
- Factory: J-199, DSIIDC Industrial Area, Sector 1, Bawana, Delhi 110039.
- Wholesale store: 4124, First Floor, Nai Sarak, Delhi 110006.
- Retail store: B-12, LGF, Shubham Enclave, Paschim Vihar, New Delhi 110063.
- Named people: Sunil Sahni (Managing Director) and Hriday Kohli (Director).

## Discrepancies

| # | Topic | obasix.com | obasix.in | Decision in this app |
|---|---|---|---|---|
| 1 | Currency | Rs. (INR) | "$" on every price | INR. The "$" is almost certainly a WooCommerce setting error. |
| 2 | Registered office | 1105, 11th Floor, Ansal Bhawan, 16 KG Marg | F-96, 9th Floor, Himalaya House, 23 KG Marg | obasix.com address used. Needs confirmation from OBASIX. |
| 3 | Product codes | SMWB… (resin magnetic) | SCUV… / CWBPB… (ceramic, combination) | Both families are valid. The app catalogue keeps its existing codes. |
| 4 | Prices for the same size | e.g. 1.5×2 magnetic Rs. 2,733 | 1.5×2 ceramic 2,190 | Different products, so not comparable. App prices are unchanged. |
| 5 | Commerce model | Full cart and checkout | Mostly "Get a Quote" | The app supports both: cart for priced items, quote for custom or bulk. |
| 6 | Promotions | OBASIX5, "up to 30%", free shipping | None | Not used in the app. The promotion terms are unverified. |
| 7 | Certifications and stats | Not shown | ISO 9001:2015, CE, QCI, DPCC, IEC; 20+ years | Certifications listed on About and labelled "as listed on obasix.in". Statistics not used. |
| 8 | GeM / distributor | Not mentioned | Present | Used on About and in the AI context. |
| 9 | Glass boards | Quote only | Collection page | Not added to the app catalogue. No verified codes or prices. |
| 10 | Warranty | Not stated | Not stated | The app makes no warranty claim. The AI is told to say it doesn't know. |

## Not loaded

- obasix.com: two collection and product pages returned HTTP 429 (rate limited). Policy pages and the catalogue PDF were not read.
- obasix.in: /categories, /shop, /enquiry, the policy pages and the catalogue PDF were not read.

A full SKU-by-SKU price check of `src/data/catalogue.ts` against the live stores is still open (see the roadmap).
