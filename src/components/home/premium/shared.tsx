"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { home } from "../homeRhythm";

export function Shell({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return <Box sx={{ ...home.shell, ...sx }}>{children}</Box>;
}

export function Eyebrow({
  children,
  tone = "dark",
  sx,
}: {
  children: ReactNode;
  tone?: "dark" | "light" | "oak";
  sx?: SxProps<Theme>;
}) {
  const color =
    tone === "light" ? "rgba(247,245,240,0.7)" : tone === "oak" ? home.oak : home.forest;

  return (
    <Typography
      component="p"
      sx={{
        ...home.eyebrow,
        color,
        ...sx,
      }}
    >
      <Box component="span" sx={{ ...home.eyebrowRule, bgcolor: color }} aria-hidden />
      {children}
    </Typography>
  );
}

export function ArrowLink({
  href,
  children,
  tone = "green",
  sx,
}: {
  href: string;
  children: ReactNode;
  tone?: "green" | "light" | "charcoal";
  sx?: SxProps<Theme>;
}) {
  const color = tone === "light" ? home.ivory : tone === "charcoal" ? home.charcoal : home.forest;

  return (
    <Box
      component={Link}
      href={href}
      className="premium-link"
      sx={{
        color,
        minHeight: 44,
        alignItems: "center",
        "&:hover": { color: tone === "light" ? home.white : home.forestDark },
        ...sx,
      }}
    >
      {children}
      <ArrowForwardIcon sx={{ fontSize: 15 }} aria-hidden />
    </Box>
  );
}

export function ShopSectionHeading({
  id,
  title,
  action,
}: {
  id?: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <Reveal>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 3, md: 4 },
        }}
      >
        <Typography
          component="h2"
          id={id}
          sx={{
            fontFamily: 'var(--font-body), "Segoe UI", sans-serif !important',
            fontSize: { xs: 11.5, md: 12 },
            fontWeight: 700,
            letterSpacing: "0.22em !important",
            lineHeight: 1.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: home.charcoal,
          }}
        >
          {title}
        </Typography>
        {action ? (
          <ArrowLink href={action.href} sx={{ minHeight: { xs: 30, sm: 44 } }}>
            {action.label}
          </ArrowLink>
        ) : null}
      </Box>
    </Reveal>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  action,
  tone = "dark",
  maxWidth = 620,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  action?: { href: string; label: string };
  tone?: "dark" | "light";
  maxWidth?: number;
}) {
  const light = tone === "light";

  return (
    <Reveal>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "flex-end" },
          justifyContent: "space-between",
          gap: { xs: 2.5, md: 5 },
          mb: { xs: 5, md: 7 },
        }}
      >
        <Box sx={{ maxWidth }}>
          <Eyebrow tone={light ? "light" : "dark"}>{eyebrow}</Eyebrow>
          <Typography
            component="h2"
            sx={{
              ...home.h2,
              mt: { xs: 2, md: 2.5 },
              color: light ? home.ivory : home.charcoal,
              maxWidth: "13ch",
            }}
          >
            {title}
          </Typography>
          {lede ? (
            <Typography
              sx={{
                ...home.lede,
                mt: { xs: 2, md: 2.5 },
                color: light ? "rgba(247,245,240,0.68)" : home.body,
              }}
            >
              {lede}
            </Typography>
          ) : null}
        </Box>
        {action ? (
          <ArrowLink
            href={action.href}
            tone={light ? "light" : "green"}
            sx={{ alignSelf: { xs: "flex-start", md: "auto" }, mb: { md: 1.5 } }}
          >
            {action.label}
          </ArrowLink>
        ) : null}
      </Box>
    </Reveal>
  );
}
