"use client";

import type { ReactNode } from "react";
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

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={obasixTheme}>
        <CssBaseline />
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
