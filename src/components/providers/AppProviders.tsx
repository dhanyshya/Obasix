"use client";

import { useEffect, type ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { obasixTheme } from "@/theme/obasixTheme";
import { CartProvider } from "@/context/CartContext";
import { CheckoutDraftProvider } from "@/context/CheckoutDraftContext";
import { AIChatProvider } from "@/context/AIChatContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { CompareProvider } from "@/context/CompareContext";
import { CompareTray } from "@/components/compare/CompareTray";
import { watchOrphanedSegments } from "@/lib/streamOrphans";

/**
 * Marks the page as interactive (`<html data-hydrated>`) once React has hydrated it; end-to-end tests
 * wait on it. Also clears streamed copies of the page that React will never swap in (see streamOrphans).
 */
function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
    return watchOrphanedSegments();
  }, []);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={obasixTheme}>
        <CssBaseline />
        <HydrationMarker />
        <CartProvider>
          <CheckoutDraftProvider>
            <WishlistProvider>
              <AuthProvider>
                <CompareProvider>
                  <AIChatProvider>
                    {children}
                    <CompareTray />
                  </AIChatProvider>
                </CompareProvider>
              </AuthProvider>
            </WishlistProvider>
          </CheckoutDraftProvider>
        </CartProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
