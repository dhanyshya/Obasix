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
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("obasix-wishlist-v1") ?? "[]") as unknown;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
      if (Array.isArray(saved) && saved.length) setIdsState((prev) => (prev.length ? prev : saved.map(String).slice(0, 40)));
    } catch {
      // Storage unavailable.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem("obasix-wishlist-v1", JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [ids]);

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
