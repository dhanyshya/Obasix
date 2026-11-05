"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartConfiguration, CartItem } from "@/lib/types";
import { getProductById } from "@/data/catalogue";
import { cartLineId } from "@/lib/auth/cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (
    productId: string,
    configuration?: Partial<CartConfiguration>,
    quantity?: number,
    unitPrice?: number,
  ) => void;
  addSetup: (productIds: string[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  replaceItems: (next: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function buildId(productId: string, configuration: CartConfiguration): string {
  return cartLineId(productId, configuration);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      productId: string,
      configuration: Partial<CartConfiguration> = {},
      quantity = 1,
      unitPrice?: number,
    ) => {
      const product = getProductById(productId);
      if (!product) return;

      const config: CartConfiguration = {
        sizeId: configuration.sizeId ?? product.sizes[0]?.id ?? "standard",
        frameId: configuration.frameId ?? product.frame,
        colourId: configuration.colourId ?? product.colours[0],
        features: configuration.features ?? [],
        customWidthFt: configuration.customWidthFt,
        customHeightFt: configuration.customHeightFt,
        branding: configuration.branding,
        logoDataUrl: configuration.logoDataUrl,
        application: configuration.application,
      };

      const id = buildId(productId, config);
      const price = unitPrice ?? product.price;

      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [...prev, { id, productId, quantity, configuration: config, unitPrice: price }];
      });
    },
    [],
  );

  const addSetup = useCallback(
    (productIds: string[]) => {
      productIds.forEach((id) => addItem(id, {}, 1));
    },
    [addItem],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const replaceItems = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    return {
      items,
      itemCount,
      subtotal,
      addItem,
      addSetup,
      updateQuantity,
      removeItem,
      clearCart,
      replaceItems,
    };
  }, [items, addItem, addSetup, updateQuantity, removeItem, clearCart, replaceItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
