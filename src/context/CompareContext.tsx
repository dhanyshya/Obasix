"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const hydrated = useRef(false);

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
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [ids]);

  const toggle = useCallback(
    (id: string) => {
      if (ids.includes(id)) {
        setIds((prev) => prev.filter((item) => item !== id));
        return "removed" as const;
      }
      if (ids.length >= MAX_COMPARE) return "full" as const;
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return "added" as const;
    },
    [ids],
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle,
      remove: (id) => setIds((prev) => prev.filter((item) => item !== id)),
      clear: () => setIds([]),
      full: ids.length >= MAX_COMPARE,
    }),
    [ids, toggle],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
