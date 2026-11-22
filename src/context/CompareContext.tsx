"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProductById } from "@/data/catalogue";

export const MAX_COMPARE = 4;
const KEY = "obasix-compare-v1";

interface CompareContextValue {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
  full: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
      if (Array.isArray(saved)) {
        const valid = saved.map(String).filter((id) => getProductById(id)).slice(0, MAX_COMPARE);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
        if (valid.length) setIds(valid);
      }
    } catch {
      // Storage unavailable; comparison still works for this page view.
    }
  }, []);

  /**
   * Saves in the same step as the change. Saving from an effect ran after the next paint,
   * so a product added just before leaving the page was lost (and every page load briefly
   * wrote an empty list over the saved one).
   */
  const update = useCallback((next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable; comparison still works for this page view.
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      if (ids.includes(id)) {
        update(ids.filter((item) => item !== id));
        return "removed" as const;
      }
      if (ids.length >= MAX_COMPARE) return "full" as const;
      update([...ids, id]);
      return "added" as const;
    },
    [ids, update],
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle,
      remove: (id) => update(ids.filter((item) => item !== id)),
      clear: () => update([]),
      full: ids.length >= MAX_COMPARE,
    }),
    [ids, toggle, update],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
