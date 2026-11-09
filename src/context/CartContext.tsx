"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

const GUEST_CART_KEY = "obasix-cart-v1";
const MAX_LINE_QTY = 99;

function clampQty(quantity: number) {
  return Math.max(0, Math.min(MAX_LINE_QTY, Math.floor(quantity)));
}

/** Drop "custom" dimensions that equal a catalogue size, so a standard board is not treated as a quoted custom size. */
function normaliseCustomSize(productId: string, configuration: CartConfiguration): CartConfiguration {
  const product = getProductById(productId);
  const { customWidthFt: w, customHeightFt: h } = configuration;
  if (!product || w == null || h == null) return configuration;
  const match = product.sizes.find(
    (s) => (s.widthFt === w && s.heightFt === h) || (s.widthFt === h && s.heightFt === w),
  );
  if (!match) return configuration;
  return { ...configuration, sizeId: match.id, customWidthFt: undefined, customHeightFt: undefined };
}

function readGuestCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    // Re-price from the catalogue so stored prices can never drift or be edited.
    return parsed.flatMap((item) => {
      const product = getProductById(item?.productId);
      const quantity = clampQty(Number(item?.quantity));
      if (!product || quantity < 1 || !item.configuration) return [];
      return [{ ...item, quantity, unitPrice: product.price }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  // Guest cart persistence (signed-in carts are also saved server-side by AuthContext).
  useEffect(() => {
    const saved = readGuestCart();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    if (saved.length) setItems((prev) => (prev.length ? prev : saved));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      // Logo data URLs can be large; keep them out of browser storage.
      const slim = items.map((item) => ({
        ...item,
        configuration: { ...item.configuration, logoDataUrl: undefined },
      }));
      window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(slim));
    } catch {
      // Storage may be blocked or full; the in-memory cart still works.
    }
  }, [items]);

  const addItem = useCallback(
    (
      productId: string,
      configuration: Partial<CartConfiguration> = {},
      quantity = 1,
      unitPrice?: number,
    ) => {
      const product = getProductById(productId);
      if (!product) return;

      const config: CartConfiguration = normaliseCustomSize(productId, {
        sizeId: configuration.sizeId ?? product.sizes[0]?.id ?? "standard",
        frameId: configuration.frameId ?? product.frame,
        colourId: configuration.colourId ?? product.colours[0],
        features: configuration.features ?? [],
        customWidthFt: configuration.customWidthFt,
        customHeightFt: configuration.customHeightFt,
        branding: configuration.branding,
        logoDataUrl: configuration.logoDataUrl,
        application: configuration.application,
        combinationLayout: configuration.combinationLayout,
      });

      const id = buildId(productId, config);
      const price = unitPrice ?? product.price;

      setItems((prev) => {
        const existing = prev.find((item) => item.id === id);
        if (existing) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, quantity: clampQty(item.quantity + quantity) }
              : item,
          );
        }
        const qty = clampQty(quantity);
        if (qty < 1) return prev;
        return [...prev, { id, productId, quantity: qty, configuration: config, unitPrice: price }];
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
          item.id === id ? { ...item, quantity: clampQty(quantity) } : item,
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
