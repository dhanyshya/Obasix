"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CheckoutDetails } from "@/lib/commerce/types";

type Draft = {
  details: CheckoutDetails;
  idempotencyKey: string;
};

type CheckoutDraftValue = {
  draft: Draft | null;
  saveDraft: (details: CheckoutDetails) => void;
};

const CheckoutDraftContext = createContext<CheckoutDraftValue | null>(null);

export function CheckoutDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const value = useMemo<CheckoutDraftValue>(
    () => ({
      draft,
      saveDraft: (details) =>
        setDraft((current) => ({
          details,
          idempotencyKey: current?.idempotencyKey ?? crypto.randomUUID(),
        })),
    }),
    [draft],
  );

  return <CheckoutDraftContext.Provider value={value}>{children}</CheckoutDraftContext.Provider>;
}

export function useCheckoutDraft() {
  const context = useContext(CheckoutDraftContext);
  if (!context) throw new Error("useCheckoutDraft must be used within CheckoutDraftProvider");
  return context;
}
