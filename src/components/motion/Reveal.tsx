"use client";

import type { CSSProperties, ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/format";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delay?: number;
  /** Animation variant */
  variant?: "up" | "fade" | "scale" | "clip";
  style?: CSSProperties;
  sx?: SxProps<Theme>;
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
  style,
  sx,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();

  return (
    <Box
      ref={ref}
      className={cn(
        "reveal",
        `reveal-${variant}`,
        inView && "is-visible",
        reduced && "reveal-reduced",
        className,
      )}
      sx={sx}
      style={{
        ...style,
        transitionDelay: reduced ? "0ms" : `${delay}ms`,
      }}
    >
      {children}
    </Box>
  );
}
