/**
 * OBASIX brand system — warm, architectural, editorial.
 * White surfaces, ivory editorial bands, forest green for action,
 * oak and beige as quiet material accents.
 * Keep in sync with globals.css.
 */
export const brandTokens = {
  forest: "#164E3B",
  forestDark: "#0B3829",
  forestDeep: "#0B3829",
  charcoal: "#292D29",
  body: "#4C544E",
  muted: "#6F766F",
  white: "#FFFFFF",
  ivory: "#FAF9F6",
  paper: "#FFFFFF",
  beige: "#EAE3D8",
  oak: "#C9A477",
  line: "#E8E7E2",
  paleGreen: "#EEF2ED",
  secondary: "#C45C4A",
  accent: "#C9A477",
} as const;

export type BrandTokens = typeof brandTokens;
