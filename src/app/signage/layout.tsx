import { Noto_Sans_Devanagari } from "next/font/google";

/** Devanagari lettering for Hindi and Marathi inscriptions in sign previews. */
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function SignageLayout({ children }: LayoutProps<"/signage">) {
  return <div className={devanagari.variable}>{children}</div>;
}
