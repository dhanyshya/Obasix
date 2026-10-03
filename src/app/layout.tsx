import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "OBASIX — Better Boards. Better Spaces.",
    template: "%s | OBASIX",
  },
  description:
    "Discover, customize and buy OBASIX boards and material solutions for modern kitchens, wardrobes, offices and commercial spaces.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppProviders>
          <Header />
          <main className="flex-1 pb-mobile-nav">{children}</main>
          <Footer />
          <MobileNav />
          <AIChatbot />
        </AppProviders>
      </body>
    </html>
  );
}
