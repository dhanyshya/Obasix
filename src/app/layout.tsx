import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Box from "@mui/material/Box";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { ReferralCapture } from "@/components/associates/ReferralCapture";
import { AppProviders } from "@/components/providers/AppProviders";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OBASIX — Boards for Working Spaces",
    template: "%s | OBASIX",
  },
  description:
    "OBASIX designs boards and accessories for offices, classrooms, homes and commercial interiors. Explore, visualize and customize your setup.",
};

/**
 * Until React has hydrated a form, its submit handler isn't attached, so a tap on Submit would be
 * a plain browser submission: the page reloads and everything typed is lost. This cancels those
 * early submissions. Forms with an explicit `method` (plain HTML forms such as a GET search) are
 * left alone. `data-hydrated` is set by AppProviders; `data-hydration-pending` marks parts still hydrating
 * (HydratingSuspense).
 */
const earlySubmitGuard = `document.addEventListener("submit",function(e){var f=e.target;if(!(f instanceof HTMLFormElement)||f.hasAttribute("method"))return;if(!document.documentElement.hasAttribute("data-hydrated")||document.querySelector("[data-hydration-pending]"))e.preventDefault();},true);`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: earlySubmitGuard }} />
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
            <ReferralCapture />
          </Box>
        </AppProviders>
      </body>
    </html>
  );
}
