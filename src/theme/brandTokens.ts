/**
 * OBASIX brand system — warm, architectural, editorial.
 * White surfaces, ivory editorial bands, forest green for action,
 * oak and beige as quiet material accents.
 * Keep in sync with globals.css.
 */
export const brandTokens = {
  /** Soft stage behind product photography. */
  stage: "#FFFFFF",
  /** Card / control corner radius. */
  radius: 16,
  forest: "#164E3B",
  forestDark: "#0E3A2B",
  forestDeep: "#14211C",
  charcoal: "#1B1D1C",
  body: "#4A4F4C",
  muted: "#6B706D",
  white: "#FFFFFF",
  /** Cool enamel ground (sign-panel grey), not cream. */
  ivory: "#F5F5F2",
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
  line: "#E5E5E0",
  paleGreen: "#EDF2EE",
  secondary: "#C45C4A",
  accent: "#C9A477",
} as const;

export type BrandTokens = typeof brandTokens;
