"use client";

import { Suspense, type ReactNode } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";

/**
 * Hidden while the boundary's content is still hydrating; removed once it's interactive.
 * The early-submit guard (root layout) and the end-to-end tests wait for none to remain.
 */
function PendingMark() {
  return useHydrated() ? null : <span hidden data-hydration-pending="" />;
}

/**
 * A Suspense boundary that says when its content is interactive. Content inside a boundary
 * hydrates after the rest of the page, so a form there can be typed into, or submitted,
 * before React is handling it; use this instead of Suspense around anything interactive.
 */
export function HydratingSuspense({ fallback, children }: { fallback?: ReactNode; children: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <PendingMark />
      {children}
    </Suspense>
  );
}
