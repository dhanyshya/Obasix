"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement = HTMLDivElement>(options?: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once ?? true;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const fallback = window.setTimeout(() => setInView(true), 1500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setInView(false);
        }
      },
      {
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
        threshold: options?.threshold ?? 0.12,
      },
    );

    observer.observe(node);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [once, options?.rootMargin, options?.threshold]);

  return { ref, inView };
}
