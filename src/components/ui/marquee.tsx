import { type ComponentPropsWithoutRef } from "react";
import Box from "@mui/material/Box";
import { cn } from "@/lib/format";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <Box
      {...props}
      className={cn(
        "group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        !vertical && "flex-row",
        vertical && "flex-col",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <Box
          key={i}
          aria-hidden={i > 0 ? true : undefined}
          className={cn(
            "flex shrink-0 justify-around gap-(--gap)",
            !vertical && "animate-marquee flex-row",
            vertical && "animate-marquee-vertical flex-col",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </Box>
      ))}
    </Box>
  );
}
