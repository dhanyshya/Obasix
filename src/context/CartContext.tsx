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

export type CartEdit =
  | { op: "add"; item: CartItem }
  | { op: "set"; id: string; quantity: number }
  | { op: "remove"; id: string }
  | { op: "clear" };

/** Applies recorded edits to a list of cart lines, the same way the cart itself applies them. */
export function replayCartEdits(start: CartItem[], edits: CartEdit[]): CartItem[] {
  let lines = start.map((line) => ({ ...line }));
  for (const edit of edits) {
    if (edit.op === "add") {
      const existing = lines.find((line) => line.id === edit.item.id);
      lines = existing
        ? lines.map((line) => (line.id === edit.item.id ? { ...line, quantity: clampQty(line.quantity + edit.item.quantity) } : line))
        : [...lines, { ...edit.item }];
    } else if (edit.op === "set") {
      lines = lines.map((line) => (line.id === edit.id ? { ...line, quantity: clampQty(edit.quantity) } : line)).filter((line) => line.quantity > 0);
    } else if (edit.op === "remove") {
      lines = lines.filter((line) => line.id !== edit.id);
    } else {
      lines = [];
    }
  }
  return lines;
}

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
  /**
   * The customer's own changes (add, quantity, remove, clear) since the page loaded, in order.
   * Loading from browser storage and replaceItems() aren't recorded. AuthContext replays the
   * changes made while the saved account was loading, so they aren't lost when it arrives.
   */
  editCount: () => number;
  editsSince: (mark: number) => CartEdit[];
}

const CartContext = createContext<CartContextValue | null>(null);

function buildId(productId: string, configuration: CartConfiguration): string {
  return cartLineId(productId, configuration);
}

const GUEST_CART_KEY = "obasix-cart-v1";
const MAX_LINE_QTY = 99;

function saveGuestCart(items: CartItem[]) {
  try {
    // Logo data URLs can be large; keep them out of browser storage.
    const slim = items.map((item) => ({ ...item, configuration: { ...item.configuration, logoDataUrl: undefined } }));
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(slim));
  } catch {
    // Storage may be blocked or full; the in-memory cart still works.
  }
}

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
  const edits = useRef<CartEdit[]>([]);
  const editCount = useCallback(() => edits.current.length, []);
  const editsSince = useCallback((mark: number) => edits.current.slice(mark), []);

  // Guest cart persistence (signed-in carts are also saved server-side by AuthContext).
  useEffect(() => {
    const saved = readGuestCart();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    if (saved.length) setItems((prev) => (prev.length ? prev : saved));
  }, []);

  /**
   * Applies a change and saves it to browser storage in the same step. Saving from an effect
   * ran after the next paint, so an item added just before a reload or typed URL was lost.
   * (React may call this twice in development; writing the same value twice is harmless.)
   */
  const commit = useCallback((change: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = change(prev);
      saveGuestCart(next);
      return next;
    });
  }, []);

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
      if (clampQty(quantity) >= 1) {
        edits.current.push({ op: "add", item: { id, productId, quantity: clampQty(quantity), configuration: config, unitPrice: price } });
      }

      commit((prev) => {
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
    [commit],
  );

  const addSetup = useCallback(
    (productIds: string[]) => {
      productIds.forEach((id) => addItem(id, {}, 1));
    },
    [addItem],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    edits.current.push({ op: "set", id, quantity });
    commit((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: clampQty(quantity) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, [commit]);

  const removeItem = useCallback((id: string) => {
    edits.current.push({ op: "remove", id });
    commit((prev) => prev.filter((item) => item.id !== id));
  }, [commit]);

  const clearCart = useCallback(() => {
    edits.current.push({ op: "clear" });
    commit(() => []);
  }, [commit]);
  const replaceItems = useCallback((next: CartItem[]) => commit(() => next), [commit]);

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
      editCount,
      editsSince,
    };
  }, [items, addItem, addSetup, updateQuantity, removeItem, clearCart, replaceItems, editCount, editsSince]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
