"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { AIChatProvider } from "@/context/AIChatContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AIChatProvider>{children}</AIChatProvider>
    </CartProvider>
  );
}
