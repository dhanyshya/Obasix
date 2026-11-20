/**
 * Scripts we can letter on nameplates and signs. Each Indian script is set in
 * the matching Noto Sans face (loaded in src/app/signage/layout.tsx). Sizing
 * factors are deliberately conservative: Indian scripts carry vowel signs
 * above and below the letter, and conjuncts are wider than Latin letters.
 */
export type ScriptId =
  | "latin"
  | "devanagari"
  | "bengali"
  | "gurmukhi"
  | "gujarati"
  | "odia"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam";

export interface SignScript {
  id: ScriptId;
  name: string;
  /** Languages customers will recognise, in the order shown. */
  languages: string[];
  /** BCP 47 tag for the first language, used on preview text. */
  lang: string;
  /** Matches one character of the script. */
  pattern: RegExp;
  /** CSS variable from next/font. */
  fontVar: string;
  /** Advance width of one grapheme cluster, as a share of the font size. */
  glyphWidth: number;
  /** Line height as a multiple of the font size. */
  lineGap: number;
  /** Smallest raised (cut) letter we'll make in this script, in cm. */
  minRaisedCm: number;
  /** A short sample, for the language picker. */
  sample: string;
}

export const signScripts: SignScript[] = [
  { id: "latin", name: "Latin", languages: ["English"], lang: "en", pattern: /[A-Za-zÀ-ɏ]/, fontVar: "--font-display", glyphWidth: 0.56, lineGap: 1.3, minRaisedCm: 1.5, sample: "Sharma Residence" },
  { id: "devanagari", name: "Devanagari", languages: ["Hindi", "Marathi", "Sanskrit", "Konkani", "Nepali"], lang: "hi", pattern: /[ऀ-ॿ꣠-ꣿ]/, fontVar: "--font-deva", glyphWidth: 0.72, lineGap: 1.6, minRaisedCm: 2.5, sample: "शर्मा निवास" },
  { id: "bengali", name: "Bengali", languages: ["Bengali", "Assamese"], lang: "bn", pattern: /[ঀ-৿]/, fontVar: "--font-beng", glyphWidth: 0.72, lineGap: 1.6, minRaisedCm: 2.5, sample: "শর্মা নিবাস" },
  { id: "gurmukhi", name: "Gurmukhi", languages: ["Punjabi"], lang: "pa", pattern: /[਀-੿]/, fontVar: "--font-guru", glyphWidth: 0.7, lineGap: 1.6, minRaisedCm: 2.5, sample: "ਸ਼ਰਮਾ ਨਿਵਾਸ" },
  { id: "gujarati", name: "Gujarati", languages: ["Gujarati"], lang: "gu", pattern: /[઀-૿]/, fontVar: "--font-gujr", glyphWidth: 0.7, lineGap: 1.6, minRaisedCm: 2.5, sample: "શર્મા નિવાસ" },
  { id: "odia", name: "Odia", languages: ["Odia"], lang: "or", pattern: /[଀-୿]/, fontVar: "--font-orya", glyphWidth: 0.78, lineGap: 1.65, minRaisedCm: 3, sample: "ଶର୍ମା ନିବାସ" },
  { id: "tamil", name: "Tamil", languages: ["Tamil"], lang: "ta", pattern: /[஀-௿]/, fontVar: "--font-taml", glyphWidth: 0.85, lineGap: 1.5, minRaisedCm: 2.5, sample: "சர்மா இல்லம்" },
  { id: "telugu", name: "Telugu", languages: ["Telugu"], lang: "te", pattern: /[ఀ-౿]/, fontVar: "--font-telu", glyphWidth: 0.78, lineGap: 1.7, minRaisedCm: 3, sample: "శర్మ నివాసం" },
  { id: "kannada", name: "Kannada", languages: ["Kannada"], lang: "kn", pattern: /[ಀ-೿]/, fontVar: "--font-knda", glyphWidth: 0.78, lineGap: 1.7, minRaisedCm: 3, sample: "ಶರ್ಮ ನಿವಾಸ" },
  { id: "malayalam", name: "Malayalam", languages: ["Malayalam"], lang: "ml", pattern: /[ഀ-ൿ]/, fontVar: "--font-mlym", glyphWidth: 0.85, lineGap: 1.6, minRaisedCm: 3, sample: "ശർമ്മ നിവാസ്" },
];

const latin = signScripts[0];

/** Every font face, for SVG and CSS font stacks: each script falls through to its own face. */
export const scriptFontStack = signScripts
  .filter((s) => s.id !== "latin")
  .map((s) => `var(${s.fontVar})`)
  .join(", ");

/** Characters any script may use: digits, spaces, punctuation, arrows, ₹, joiners and the danda. */
const neutral = /[\s0-9.,:;'’"“”()&/@#+\-–—!?|·×₹%\u2190-\u21FF\u200C\u200D\u0964\u0965]/;

export function scriptsIn(text: string): SignScript[] {
  const found = new Set<SignScript>();
  for (const ch of text) {
    const script = signScripts.find((s) => s.pattern.test(ch));
    if (script) found.add(script);
  }
  return [...found];
}

/** The script that sets the size of a line: the widest one present. */
export function dominantScript(text: string): SignScript {
  const scripts = scriptsIn(text);
  if (scripts.length === 0) return latin;
  return scripts.reduce((a, b) => (b.glyphWidth > a.glyphWidth ? b : a));
}

/** Characters we can't letter (emoji, other scripts, symbols). */
export function unsupportedCharacters(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text) {
    // Combining marks belong to the letter before them, which was checked already.
    if (/\p{M}/u.test(ch)) continue;
    if (neutral.test(ch) || signScripts.some((s) => s.pattern.test(ch))) continue;
    bad.add(ch);
  }
  return [...bad];
}

/** Visible letters, counting a conjunct with its vowel signs as one. */
export function graphemeCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].length;
  }
  return [...text].filter((ch) => !/\p{M}/u.test(ch)).length;
}

/** Languages a customer can ask us to typeset a line in. */
export const typesetLanguages = signScripts
  .filter((s) => s.id !== "latin")
  .flatMap((s) => s.languages.map((language) => ({ language, script: s })));

export const getTypesetLanguage = (language: string) => typesetLanguages.find((l) => l.language === language);
