/**
 * OBASIX brand system — warm, architectural, editorial.
 * White surfaces, ivory editorial bands, forest green for action,
 * oak and beige as quiet material accents.
 * Keep in sync with globals.css.
 */
export const brandTokens = {
  forest: "#164E3B",
  forestDark: "#0E3A2B",
  forestDeep: "#0B2E22",
  charcoal: "#141917",
  body: "#3F4843",
  muted: "#5F6862",
  white: "#FFFFFF",
  /** Cool enamel ground (sign-panel grey), not cream. */
  ivory: "#F2F3F0",
  /** Logo "O" orange: current zone, focus, wayfinding marks. */
  signal: "#EE6A1F",
  /** Text-safe orange for small text on white/ivory (≥4.5:1). */
  signalInk: "#B0440C",
  /** Logo lettering red: reserved for the primary action. */
  action: "#C8282E",
  actionDark: "#A11E23",
  paper: "#FFFFFF",
  beige: "#EAE3D8",
  oak: "#C9A477",
  line: "#DCDFDA",
  paleGreen: "#EEF2ED",
  secondary: "#C45C4A",
  accent: "#C9A477",
} as const;

export type BrandTokens = typeof brandTokens;
