# OBASIX Design System — "Quiet Luxury"

A calm, product-first storefront in the spirit of premium furniture and consumer-tech brands: mostly white and warm grey, generous space, large photography, medium-weight type and soft corners. Brand green leads actions; orange and red live only in the logo.

## Tokens (`src/theme/brandTokens.ts`)

| Token | Value | Use |
|---|---|---|
| `white` | #FFFFFF | Main ground, cards, product stages |
| `ivory` | #F5F5F2 | Alternate section ground, footer, workspaces |
| `line` | #E5E5E0 | Hairlines, card borders |
| `charcoal` | #1B1D1C | Headings, ink, card "Add to Cart" |
| `body` / `muted` | #4A4F4C / #6B706D | Body copy / secondary text |
| `forest` | #164E3B | Primary pill buttons, eyebrows, links, focus |
| `paleGreen` | #EDF2EE | Tags, tick badges, selected menu rows |
| `forestDeep` | #14211C | The one dark moment per page: rounded closing panels |
| `radius` | 16 | Default card radius |

`signal` (orange) and `action` (red) remain for the logo and legacy references only — not for UI chrome.

## Type
- Display: **Inter Tight** 600, tracking −0.035 to −0.045em (`signType.mega`, `.title`, `.plate` in `components/home/directory/sign.tsx`).
- Body: **Inter** 400/500/600. Eyebrows are sentence-case, 14px, 500, forest — no tracked caps.
- Prices: 500 weight, tabular numerals.

## Shape and elevation
- Corners: 10–12px controls, 16–20px cards and product stages, 24–40px feature panels and photography.
- Buttons are pills (`buttonStyles.ts`): contained = forest; outlined = transparent with a 22%-ink hairline, hover tint only; on dark panels use a white pill.
- Shadow only on hover: `0 24px 48px -28px rgba(20,25,23,0.3)`. No accent stripes, side tabs or thick rules.

## Components
- **Header**: frosted glass (`rgba(255,255,255,0.78)` + 20px blur), no utility bar, nav as quiet text pills.
- **PageMasthead**: white band, slash breadcrumbs, green sentence-case eyebrow, large title; right slot for steps or actions.
- **ProductCard**: white rounded stage with hairline, product image contained, SKU · name · category · price, charcoal pill "Add to Cart", text links for tools. All test labels preserved.
- **Step rails** (checkout, configurator, visualiser, wall studio): 2–3px rounded segments; current = ink, done = forest, upcoming = line.
- **Workspaces** (Design Your Board, Visualise): stage on the left in a rounded light canvas, controls in a white panel; mobile summary bar pinned above the bottom nav.
- **Space detail**: full-bleed photo with neutral dark gradient and rounded bottom corners, pill focus selector, "Start here" lead product card, product grid, light next-steps band.
- **Closing panel**: one rounded `forestDeep` panel per page with a white pill CTA.
- **Footer**: light ivory, plain column headings, underline-on-hover links.

## Motion
Ease `cubic-bezier(0.16,1,0.3,1)`, 200–600ms; reveal-on-scroll, image scale 1.03–1.05 on hover. All motion respects `prefers-reduced-motion`.

## Rules
- Numbers on brand pages are computed from the catalogue; materials and claims must exist in `data/catalogue.ts` or `data/company.ts`.
- Global `* { box-sizing }` lives in `@layer base` so MUI input sizing wins.
- Visually hidden text uses `width: "1px"` — MUI's `width: 1` means 100%.
