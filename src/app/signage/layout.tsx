import {
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";

/*
 * Lettering faces for Indian-language inscriptions in sign previews. Only
 * Devanagari (the most used) is preloaded; the others are declared with their
 * script's unicode-range, so a browser downloads a face only when text in that
 * script appears on the page. (next/font needs literal options, hence the repetition.)
 */
const devanagari = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "700"], display: "swap" });
const bengali = Noto_Sans_Bengali({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-beng", subsets: ["bengali"] });
const gurmukhi = Noto_Sans_Gurmukhi({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-guru", subsets: ["gurmukhi"] });
const gujarati = Noto_Sans_Gujarati({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-gujr", subsets: ["gujarati"] });
const odia = Noto_Sans_Oriya({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-orya", subsets: ["oriya"] });
const tamil = Noto_Sans_Tamil({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-taml", subsets: ["tamil"] });
const telugu = Noto_Sans_Telugu({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-telu", subsets: ["telugu"] });
const kannada = Noto_Sans_Kannada({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-knda", subsets: ["kannada"] });
const malayalam = Noto_Sans_Malayalam({ weight: ["400", "500", "700"], display: "swap", preload: false, variable: "--font-mlym", subsets: ["malayalam"] });

const fontVars = [devanagari, bengali, gurmukhi, gujarati, odia, tamil, telugu, kannada, malayalam].map((f) => f.variable).join(" ");

export default function SignageLayout({ children }: LayoutProps<"/signage">) {
  return <div className={fontVars}>{children}</div>;
}
