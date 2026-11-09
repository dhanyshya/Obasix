"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { Reveal } from "@/components/motion/Reveal";
import { home } from "@/components/home/homeRhythm";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
  accent = true,
  className,
  sx,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  /** Subtle forest-green accent line under the title */
  accent?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}) {
  const centered = align === "center";

  return (
    <Box
      className={className}
      sx={[
        { maxWidth: 672 },
        centered && { mx: "auto", textAlign: "center" },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {eyebrow ? (
        <Reveal delay={0}>
          <Typography
            variant="overline"
            component="p"
            sx={{
              mb: 1.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.4,
              borderRadius: 0,
              fontSize: 11,
              letterSpacing: "0.2em",
              bgcolor: light ? "rgba(255,255,255,0.12)" : home.pale,
              color: light ? "rgba(255,255,255,0.85)" : home.green,
            }}
          >
            {eyebrow}
          </Typography>
        </Reveal>
      ) : null}
      <Reveal delay={80}>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
            lineHeight: { md: 1.1 },
            letterSpacing: "-0.03em",
            color: light ? "common.white" : home.green,
          }}
        >
          {title}
        </Typography>
      </Reveal>
      {accent && !light ? (
        <Box
          aria-hidden
          sx={{
            ...home.titleAccent,
            ...(centered && { mx: "auto" }),
          }}
        />
      ) : null}
      {description ? (
        <Reveal delay={160}>
          <Typography
            sx={{
              mt: 2,
              maxWidth: 576,
              fontSize: { xs: 16, md: 18 },
              lineHeight: 1.7,
              color: light ? "rgba(255,255,255,0.7)" : home.muted,
              ...(centered && { mx: "auto" }),
            }}
          >
            {description}
          </Typography>
        </Reveal>
      ) : null}
    </Box>
  );
}
