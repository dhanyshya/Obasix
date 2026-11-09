---
name: OBASIX
description: Boards for working spaces, sold through a lobby wayfinding system.
colors:
  forest: "#164E3B"
  forest-dark: "#0E3A2B"
  forest-deep: "#0B2E22"
  signal: "#EE6A1F"
  action: "#C8282E"
  action-dark: "#A11E23"
  action-pressed: "#86181C"
  charcoal: "#141917"
  body: "#3F4843"
  muted: "#5F6862"
  white: "#FFFFFF"
  ivory: "#F2F3F0"
  line: "#DCDFDA"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(3rem, 7vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
    fontVariation: "\"wdth\" 88"
  headline:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 90"
  title:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontVariation: "\"wdth\" 94"
  price:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"ss01\", \"cv11\""
  label:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
    fontFeature: "\"tnum\" 1"
rounded:
  none: "0px"
  roundel: "50%"
spacing:
  page-xs: "16px"
  page-sm: "32px"
  page-md: "48px"
  page-lg: "64px"
  gap-sm: "16px"
  gap-md: "24px"
  section-sm: "64px"
  section-lg: "96px"
  page-max: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-dark}"
    textColor: "{colors.white}"
  button-primary-active:
    backgroundColor: "{colors.action-pressed}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.white}"
  card-add-to-cart:
    backgroundColor: "{colors.action}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    height: "46px"
    width: "100%"
  size-key:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.none}"
    height: "48px"
    width: "88px"
  size-key-selected:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.white}"
  roundel:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.white}"
    rounded: "{rounded.roundel}"
    size: "40px"
  sku-plate:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "3px 10px"
  wayfinding-arrow-block:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    size: "64px"
  wayfinding-arrow-block-hover:
    backgroundColor: "{colors.action}"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.charcoal}"
    rounded: "{rounded.none}"
---

# Design System: OBASIX

## Overview

**Creative North Star: "The Lobby Directory"**

The storefront is built as the wayfinding system of an office building. Spaces are zones on a directory board, products are destinations with codes, and the logo's tick is redrawn as the arrow that points to them. Deep signage green is the committed ground for the header band, the directory hero and the maker section; product information sits on enamel-white plates; orange from the logo's "O" marks where you are; red from the logo lettering is spent only on the action that buys.

Density is high and factual. Rows, codes, sizes and prices are the content; imagery is the official product photography, set on white or enamel grey with generous internal padding so each board reads as an object, never as a lifestyle scene. Lettering is a heavy, slightly condensed grotesk set tight like sign vinyl, with tabular numerals wherever a number is a fact.

Surfaces are flat and square. Structure comes from rules (heavy charcoal tops, hairline row dividers) and from colour fields, not from cards, shadows or radii. The only curved shapes in the system are the numbered roundels of the directory.

**Key Characteristics:**
- Committed forest-green fields; white and enamel-grey plates for product content.
- Three logo colours with fixed jobs: green ground, orange position, red action.
- Archivo set heavy and condensed for every sign-like role; Inter for reading.
- Lists as directories: full-width rows with a code or roundel, a name, a fact, an arrow.
- Square corners everywhere except the circular roundel.
- One easing curve, cubic-bezier(0.16, 1, 0.3, 1), for every state change.

## Colors

Three logo colours on a field of signage green, white and cool enamel grey, with a near-black charcoal for text and heavy rules.

### Primary
- **Signage Forest** (forest): the brand ground. Fills the Maker section, the wayfinding arrow blocks, SKU plates on the product page, SKU text on cards, and the green segment of the stripe spine. Hover colour for text links on white.
- **Lobby Forest Deep** (forest-deep): the darkest field, used for the directory hero and the header's utility band so the first viewport reads as the directory board itself.
- **Forest Dark** (forest-dark): the pressed and hover shade of forest in theme components.

### Secondary
- **Signal Orange** (signal): position and attention. Active roundel fill, the active nav underline, the 3px top edge of the code band, the hover rule under product cards, the selected size key's inset bar, focus rings everywhere, text selection, and the orange segment of the stripe spine.

### Tertiary
- **Action Red** (action): the buying action only. Primary buttons, card Add to Cart, the bulk-quote call to action, the cart count badge, the hover fill of wayfinding arrows, and the red segment of the stripe spine.
- **Action Red Dark / Pressed** (action-dark, action-pressed): hover and active states of the red action.

### Neutral
- **Sign Charcoal** (charcoal): headings and primary text; the 3px heavy rule above directory lists, product card images and the product title block; the code band and footer ground; secondary button outline and hover fill; selected size keys.
- **Body Slate** (body): running text and descriptions.
- **Muted Slate** (muted): secondary facts such as struck-through compare-at prices and size lists.
- **Enamel White** (white): product plates, page ground for catalogue and product detail, image wells.
- **Enamel Grey** (ivory): the alternating section ground (Bestsellers), directory row hover fill, thumbnail wells. Cool, not cream.
- **Rule Grey** (line): 1px hairline row dividers, image well outlines, card borders.

### Named Rules
**The Three Jobs Rule.** Green is ground, orange is position, red is purchase. A colour never takes another colour's job: orange never fills a buy button, red never marks the current zone.

**The Red Is Spent Once Rule.** Each product plate or card carries exactly one red element, the action that adds to cart or requests a quote.

**The Signal Is A Mark Rule.** Orange marks: rules, underlines, roundels, focus rings, short labels on charcoal. It is not a ground for small white text; white on signal measures about 3.1:1 and fails AA below large-text size.

## Typography

**Display Font:** Archivo, variable width axis (with Helvetica Neue, sans-serif)
**Body Font:** Inter (with Segoe UI, sans-serif)
**Label/Mono Font:** Archivo at weight 600, tabular numerals, positive tracking

**Character:** Archivo is set the way sign lettering is cut: heavy (800), narrowed on the width axis (88 to 94), and tracked tight. Inter carries everything a visitor reads in sentences, with stylistic sets ss01 and cv11 on.

### Hierarchy
- **Display** (800, width 88, 48px rising to 96px, line-height 0.9): one per page, the directory headline in the hero. Capped near 11ch and balanced.
- **Headline** (800, width 90, 36px rising to 57.6px, line-height 0.98): section titles, written as plain declarative sentences ending in a full stop, capped at 13 to 16ch. Product page titles use the same voice at 32px to 44px.
- **Title** (700, width 94, 17px to 26px, line-height 1.05): sign plates. Directory row names, range row names, card product names (about 19px), the destination plate header. Wayfinding signs push this to 800 at 26px to 40px.
- **Price** (800, tracking -0.02em, tabular): 1.45rem on cards, 26px on the hero plate, 34px to 42px on the product page. Prices are always set in the display face with tabular numerals.
- **Body** (400, 15px to 18px, line-height 1.55 to 1.65): ledes on dark grounds at 16px to 18px and 82% white; descriptions at 15px to 17px. Ledes cap at about 520px.
- **Label / Code** (600, 12px to 14px, tracking 0.04em, tabular): SKUs, size lists, row counts and the product-code band. Uppercase only for definition terms in fact lists.

### Named Rules
**The Every Number Is A Fact Rule.** Prices, sizes, counts, SKUs and phone numbers use tabular numerals.

**The Sentence Headline Rule.** Headlines are sentences in sentence case with a full stop, set in Archivo 800. No labels stacked above them.

## Layout

Pages run inside a 1440px maximum with page padding of 16px, 32px, 48px and 64px at the xs, sm, md and lg breakpoints (MUI defaults: 600px, 900px, 1200px, 1536px). Homepage sections alternate full-bleed colour fields (forest-deep, charcoal, white, ivory, forest, white) and pad vertically 64px on mobile and 96px from md. Catalogue and product detail use the MUI large container.

The directory hero is a two-column grid at md and up (about 1.25fr to 1fr): the board of numbered space rows and headline on the left, the white destination plate on the right. Below sm the space rows become a horizontally scrolling, snap-aligned strip of outlined chips, and the destination plate runs edge to edge.

Lists are directories: full-width grid rows (thumbnail, name, description, count and price, arrow) under a 3px charcoal top rule with 1px hairlines between rows. Product grids run 1, 2 and 4 columns with 16px to 24px gaps. Fact lists use a 180px term column at sm and up.

**The Directory Row Rule.** When content is a set of destinations, render rows with a leading code or roundel and a trailing arrow, not a grid of cards.

## Elevation & Depth

The system is flat. Theme components default to zero elevation, cards and papers carry no shadow, and buttons disable elevation. Depth comes from colour fields and from rule weight: a 3px charcoal or signal rule reads as the edge of a sign, a 1px line as a seam.

### Shadow Vocabulary
- **Destination plate lift** (`box-shadow: 0 30px 60px -20px rgba(0,0,0,0.45)`, md and up only): the single lifted object, the white plate mounted on the green directory board in the hero.
- **Floating control** (`box-shadow: 0 1px 4px rgba(37,42,38,0.08)`): wishlist and quick-view buttons sitting over product photography.

### Named Rules
**The One Mounted Plate Rule.** Only the hero destination plate is lifted off its ground. Everything else sits flush.

## Shapes

Corners are square throughout: theme radius 0, buttons 0, inputs 0, cards 0, chips 0, size keys 0. The roundel (a 34px to 40px circle with a 2px ring) is the one curve, and it exists because directory boards number their floors that way. The logo-derived marks are drawn as square-capped, mitred strokes: the arrow at 2.6 stroke on a 24 grid, the tick at 3.

The **stripe spine** is the recurring silhouette: a three-band rule in the logo's proportions (green 6, orange 1, red 2) at 4px to 6px, across the top of the header and the footer.

**The Square Plate Rule.** Panels, buttons, fields and images have square corners; only roundels are round.

## Components

### Buttons
Blunt sign plates: heavy lettering, square edges, no shadow.
- **Shape:** square (0px), minimum height 48px (40px small, 56px large).
- **Primary:** action red with white Archivo 700 at 0.95rem, padding 12px 24px. Hover action-dark, active action-pressed.
- **Secondary:** white with a charcoal outline (2px as rendered, the global stylesheet overrides the theme's 1px) and charcoal text; hover and active invert to a charcoal fill with white text.
- **Text:** charcoal, 44px minimum height, faint charcoal wash on hover.
- **Focus:** 3px signal outline offset 3px, no glow.
- **Disabled:** warm grey fill (#E8E6E0), grey border, slate text, still fully opaque.
- **Transition:** 200ms to 250ms colour and border transitions.

### Cards / Containers
The product card is a labelled object, not a box.
- **Corner Style:** square.
- **Background:** transparent card; the image sits in a square white well with a 1px rule-grey inset outline, photography contained with 9% padding.
- **Rule:** a 3px charcoal bar under the image; on hover an orange bar wipes across it left to right (420ms) while the photo scales to 1.035.
- **Content:** SKU in forest code type and first size in muted tabular type on one line; the name as a two-line clamped plate title; the category in small body; the price in display weight; a full-width red Add to Cart (46px); then an underlined "View Details" text link and the compare toggle.
- **Shadow Strategy:** none (see Elevation).

### Inputs / Fields
- **Style:** outlined, small, white ground, square corners, MUI default stroke.
- **Focus:** MUI primary (forest) stroke on the field outline.

### Navigation
- **Header:** the stripe spine (4px) on top, a forest-deep utility band with phone and a signal-coloured link, then a white bar with a 1px rule-grey bottom border. Desktop links are Archivo 700 at 15.5px to 16px in charcoal; the current section and an open mega menu are marked by a 3px signal underline; hover turns links forest. Icon controls are square 40px. The cart badge is action red.
- **Footer:** charcoal ground under a stripe spine, Archivo 700 group headings, small white-at-76% body.
- **Mobile:** a drawer of up to 360px with a search field and accordion groups, plus a bottom tab bar (64px).

### Directory Row (signature)
A row on the lobby board: a numbered roundel, the space name in plate type (17px to 23px), and a sign arrow. Inactive rows are 78% white with a 45% white arrow shifted 6px left; the active row goes white, fills the roundel with signal and slides the arrow home in signal. Hover selects on pointer devices; click and keyboard always work. Focus is a 3px signal outline.

### Destination Plate (signature)
The white plate on the hero board: a signal header strip naming the zone with a link to all boards for it, a contained product photo, SKU and sizes in code type, name and price in plate type, the card Add to Cart, and an "Also for this space" line of forest links. Swapping zones wipes the plate in from the right with a clip-path reveal (520ms), suppressed under reduced motion.

### Code Band
A charcoal strip with a 3px signal top edge carrying every priced board as a horizontal, scrollable run of SKUs and sizes in code type, fading out on the right. The proof that the catalogue is real.

### Range And Wayfinding Rows
Range rows: thumbnail on enamel grey, plate-type name, description, count and entry price, trailing arrow that turns red and nudges 4px on hover; the row fills enamel grey. Wayfinding signs: a large 800-weight title, one line of body, and a square forest arrow block (48px to 64px) that turns red and slides 6px on hover.

### Size Keys
Sizes on the product page form one row of square keys (88px by 48px minimum) with a 2px charcoal border in Archivo 700 at 15px. The selected key fills charcoal with white text and a 4px signal inset bar along its bottom edge.

### SKU Plate
On the product page the SKU sits on a small forest plate in white Archivo 700 with 0.05em tracking, beside the series name, above a 3px charcoal rule.

## Do's and Don'ts

### Do:
- **Do** set green as a committed ground (forest or forest-deep) for whole sections, not as a tint behind content.
- **Do** keep red to one buying action per plate, card or section.
- **Do** mark the current item, active zone and keyboard focus with signal orange (3px).
- **Do** draw arrows and ticks with the sign primitives (square caps, mitred joins), and number directory rows with roundels.
- **Do** set every price, size, count and SKU with tabular numerals in Archivo.
- **Do** separate list rows with a 3px charcoal top rule and 1px rule-grey hairlines.
- **Do** run state changes on cubic-bezier(0.16, 1, 0.3, 1) between 200ms and 520ms, and guard reveal animations with prefers-reduced-motion.

### Don't:
- **Don't** round corners on panels, buttons, fields, chips or images; the roundel is the only curve.
- **Don't** add shadows to cards or sections; the hero destination plate is the one mounted object.
- **Don't** set small white text on signal orange or small signal text on forest; both measure about 3:1.
- **Don't** use oak, beige or the older terracotta secondary as accents on migrated surfaces; they belong to the previous system.
- **Don't** stack uppercase tracked labels above headlines; headlines stand alone as sentences.
- **Don't** substitute stock arrow icons for the sign arrow on wayfinding links.

## Migration Status

The system above is evidenced by the homepage directory sections, header, product card and product detail page. Checkout, account, quote, customize, visualize and about have not been migrated: they inherit only the theme tokens (square corners, red primary buttons, forest primary, Archivo headings) and still use older component styling. The footer is partly migrated (stripe spine and charcoal ground, but oak links and focus and a stock arrow icon). The `:root` custom properties in the global stylesheet still carry the previous palette and are out of sync with the theme tokens, which are the source of truth.

## Inner pages (added)

- **PageMasthead** (`src/components/layout/PageMasthead.tsx`): the one header for every inner page. Deep-green panel, breadcrumb with sign arrows, orange-square code label, heavy title (the page's only h1), optional lede and a right-hand slot (steps, actions). Ends in the three-colour stripe. Use `compact` for task pages (cart, checkout, track).
- **PurchaseSteps**: wayfinding strip, not a MUI Stepper. Done = tick + orange rule, current = orange rule + bold label.
- **Summary panels** (cart, checkout): deep-green aside with white type and a red primary button.
- **AuthCard**: split panel, green side with the title and the real account features, white side with the form.
- **Account shell**: green band with section tabs; the current tab carries a 4px orange underline.
- **Orange text**: `signal` (#EE6A1F) is for fills and marks only. Small orange text uses `signalInk` (#B0440C) on light grounds, `#FFC59E` on green.
- **Corners**: square everywhere; only true circles (roundels, avatars) and pills for counters are round.
- Global `* { box-sizing }` lives in `@layer base` so MUI input sizing wins.

## Tool workspaces and brand pages (round 3)

- **Workspace pattern** (Design Your Board, Visualise, sample-room studio): compact `PageMasthead` on top, then a two-column workspace on ivory. The *stage* (live preview / wall scene) is the larger column on desktop, framed in charcoal or on a ruled grey canvas and sticky; the *controls* sit in a white panel with a 6px forest top rule. On mobile the stage stacks first and a white summary bar with a 4px orange top rule stays fixed above the bottom nav.
- **Step rail**: replaces MUI `Stepper` everywhere (checkout, configurator, visualiser, wall studio). A grid of equal cells, each with a 4px top rule (orange when current or done, line/white-22% otherwise), a two-digit code (✓ prefix when done) and a plate label. Current step gets `aria-current="step"`. Dark variant lives inside the masthead's right slot.
- **Selectable card** (`customizerUi.SelectableCard`, visualiser product cards): white, 2px line border; selected = 2px charcoal border + 4px orange inset bottom + black tick square in the top-right corner.
- **Space detail**: full-bleed room photo with a left-weighted green gradient carrying the mega title; focus selector as roundel buttons; a large **Start here** lead product (orange plate tag, size keys, price, real cart actions) followed by the shared `ProductCard` grid with Quick view; a three-step next-actions band (design, visualise, quote) and an "other spaces" sign row.
- **About**: brand narrative in eight bands alternating forest and white/ivory: statement + photo with a floating product plate, a fact rail computed from the catalogue (product, frame and colour counts — never hand-typed), principles, the range as numbered tiles, the studio list with roundels, signature boards, spaces, verified company facts (`data/company.ts`), and the programmes close. Anchors `#studio`, `#company`, `#start-project` are linked from the footer and assistant.
- **Copy rule**: numbers on brand pages are derived from data (`products.length`, `frames.length`, `colours.length`); materials named must exist in the catalogue.
