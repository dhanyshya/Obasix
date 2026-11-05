"use client";

import type { ReactNode } from "react";

/** Subtle route enter transition — opacity + slight vertical move */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
