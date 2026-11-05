"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface WishlistContextValue {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  count: number;
  setIds: (ids: string[]) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>([]);

  const toggle = useCallback((productId: string) => {
    setIdsState((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const setIds = useCallback((next: string[]) => {
    setIdsState(Array.from(new Set(next.filter(Boolean))));
  }, []);

  const value = useMemo(
    () => ({ ids, toggle, has, count: ids.length, setIds }),
    [ids, toggle, has, setIds],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
