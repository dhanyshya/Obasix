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
import { getProductById } from "@/data/products";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (
    productId: string,
    configuration: CartConfiguration,
    quantity?: number,
    unitPrice?: number,
  ) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function buildId(productId: string, configuration: CartConfiguration): string {
  return [
    productId,
    configuration.colourId,
    configuration.finishId,
    configuration.thickness,
    configuration.sizeId,
  ].join("-");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      productId: string,
      configuration: CartConfiguration,
      quantity = 1,
      unitPrice?: number,
    ) => {
      const product = getProductById(productId);
      if (!product) return;

      const id = buildId(productId, configuration);
      const price = unitPrice ?? product.startingPrice;

      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [
          ...prev,
          {
            id,
            productId,
            quantity,
            configuration,
            unitPrice: price,
          },
        ];
      });
    },
    [],
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
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
