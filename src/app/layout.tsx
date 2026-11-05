import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Box from "@mui/material/Box";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "OBASIX — Boards for Working Spaces",
    template: "%s | OBASIX",
  },
  description:
    "OBASIX designs boards and accessories for offices, classrooms, homes and commercial interiors. Explore, visualize and customize your setup.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <AppProviders>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              overflowX: "clip",
            }}
          >
            <Header />
            <Box
              component="main"
              sx={{
                flex: 1,
                bgcolor: "background.default",
                overflowX: "clip",
                /* Leave room for mobile tab bar + compact AI launcher */
                pb: { xs: "calc(var(--mobile-nav-h, 64px) + 0.5rem)", md: 3 },
              }}
            >
              {children}
            </Box>
            <Footer />
            <MobileNav />
            <AIChatbot />
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
