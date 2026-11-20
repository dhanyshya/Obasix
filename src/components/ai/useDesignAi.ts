"use client";

import { useEffect, useState } from "react";

/** True once the server reports Claude design help is configured. */
export function useDesignAi() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d: { design?: boolean }) => active && setEnabled(Boolean(d.design)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return enabled;
}
