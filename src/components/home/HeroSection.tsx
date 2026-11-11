"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import Link from "@/components/Link";
import { images } from "@/data/images";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { home } from "./homeRhythm";

function Enter({
  children,
  delay = 0,
  reduced,
}: {
  children: ReactNode;
  delay?: number;
  reduced: boolean;
}) {
  return (
    <Box
      sx={{
        animation: reduced ? "none" : "heroEnter 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        animationDelay: reduced ? 0 : `${delay}ms`,
        "@keyframes heroEnter": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      {children}
    </Box>
  );
}

/** Premium white hero — ~40% copy / ~60% photography with caption card. */
export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <Box
      component="section"
      aria-labelledby="hero-heading"
      sx={{
        bgcolor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 0.4fr) minmax(0, 0.6fr)",
            },
            gap: { xs: 3.5, md: 5, lg: 6 },
            alignItems: "center",
            py: { xs: 4.5, sm: 5.5, md: 6.5, lg: 7.5 },
          }}
        >
          <Box
            sx={{
              order: { xs: 1, md: 1 },
              minWidth: 0,
              maxWidth: { md: 480 },
              py: { md: 0.5 },
            }}
          >
            <Enter reduced={reduced}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 22,
                    height: 2,
                    bgcolor: home.green,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="overline"
                  sx={{
                    color: home.green,
                    letterSpacing: "0.05em",
                    fontSize: { xs: 11, md: 12 },
                    fontWeight: 700,
                    lineHeight: 1.45,
                    textTransform: "uppercase",
                  }}
                >
                  Thoughtfully Made for Better Spaces
                </Typography>
              </Stack>
            </Enter>

            <Enter delay={50} reduced={reduced}>
              <Typography
                id="hero-heading"
                variant="h1"
                sx={{
                  mt: { xs: 1.75, md: 2.25 },
                  fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
                  fontSize: {
                    xs: "clamp(2.15rem, 8vw, 2.75rem)",
                    sm: "3.15rem",
                    md: "3.75rem",
                    lg: "4.35rem",
                  },
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  fontWeight: 700,
                  color: home.charcoal,
                  maxWidth: { xs: "12ch", md: "9ch" },
                }}
              >
                <Box component="span" sx={{ display: "block" }}>
                  Make Space
                </Box>
                <Box component="span" sx={{ display: "block" }}>
                  for Better
                </Box>
                <Box component="span" sx={{ display: "block" }}>
                  Ideas.
                </Box>
              </Typography>
            </Enter>

            <Enter delay={100} reduced={reduced}>
              <Typography
                sx={{
                  mt: { xs: 2, md: 2.5 },
                  maxWidth: 420,
                  color: home.body,
                  fontSize: { xs: 16.5, md: 17.5 },
                  lineHeight: 1.7,
                }}
              >
                Thoughtfully designed boards and workspace solutions that bring ideas, people, and
                possibilities together.
              </Typography>
            </Enter>

            <Enter delay={150} reduced={reduced}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1.5, sm: 2.25 }}
                sx={{ mt: { xs: 3, md: 3.5 }, alignItems: { sm: "center" } }}
              >
                <Button
                  component={Link}
                  href="/products"
                  variant="contained"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    ...home.primaryBtn,
                    borderRadius: "16px",
                    px: 2.75,
                    py: 1.4,
                    fontSize: 15,
                    alignSelf: { xs: "stretch", sm: "flex-start" },
                  }}
                >
                  Explore Our Boards
                </Button>
                <Button
                  component={Link}
                  href="/customize"
                  variant="text"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    ...home.linkBtn,
                    px: 0.25,
                    borderRadius: "16px",
                    alignSelf: { xs: "flex-start", sm: "center" },
                    "& .MuiButton-endIcon": { ml: 0.5 },
                  }}
                >
                  Create Your Own Board
                </Button>
              </Stack>
            </Enter>

            <Enter delay={200} reduced={reduced}>
              <Stack spacing={1.25} sx={{ mt: 2.75 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 36,
                    height: 2,
                    bgcolor: home.green,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13.5,
                    letterSpacing: "0.02em",
                    color: home.muted,
                  }}
                >
                  Considered design. Everyday possibility.
                </Typography>
              </Stack>
            </Enter>
          </Box>

          <Box
            sx={{
              order: { xs: 2, md: 2 },
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "4 / 3", md: "5 / 4", lg: "1.15 / 1" },
              bgcolor: "#FFFFFF",
              overflow: "hidden",
              minWidth: 0,
              animation: reduced
                ? "none"
                : "heroMediaIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both",
              "@keyframes heroMediaIn": {
                from: { opacity: 0, transform: "scale(1.015)" },
                to: { opacity: 1, transform: "scale(1)" },
              },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            <Image
              src={images.heroWorkspace}
              alt="Modern office meeting room with a wall-mounted whiteboard, oak table, chairs, and natural daylight"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 60vw"
              style={{ objectPosition: "center center" }}
            />

            <Box
              sx={{
                position: "absolute",
                left: { xs: 12, md: 16 },
                bottom: { xs: 12, md: 16 },
                right: { xs: "auto", md: "auto" },
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                maxWidth: { xs: "calc(100% - 24px)", sm: 300 },
                px: { xs: 1.5, md: 1.75 },
                py: { xs: 1.2, md: 1.35 },
                bgcolor: "#FFFFFF",
                border: `1px solid ${home.line}`,
                boxShadow: "0 2px 10px rgba(37, 42, 38, 0.06)",
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: home.green,
                  }}
                >
                  Designed to Belong
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: { xs: 13, md: 13.5 },
                    lineHeight: 1.4,
                    color: home.charcoal,
                    fontWeight: 500,
                  }}
                >
                  A clearer way to work together.
                </Typography>
              </Box>
              <NorthEastIcon
                aria-hidden
                sx={{ fontSize: 18, color: home.green, flexShrink: 0 }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
