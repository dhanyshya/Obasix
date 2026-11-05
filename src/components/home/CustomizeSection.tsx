"use client";

import Image from "next/image";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { images } from "@/data/images";
import { Reveal } from "@/components/motion/Reveal";

const controls = [
  {
    id: "size",
    label: "Size",
    hint: "2x3 to 6x4 ft",
    pad: { xs: 7, md: 8 },
    frame: "#1A1A1A",
    tint: "transparent",
  },
  {
    id: "frame",
    label: "Frame",
    hint: "Aluminium finishes",
    pad: { xs: 5, md: 6 },
    frame: "#C5C9CC",
    tint: "transparent",
  },
  {
    id: "colour",
    label: "Colour",
    hint: "Surface options",
    pad: { xs: 5, md: 6 },
    frame: "#1A1A1A",
    tint: "rgba(61,122,74,0.08)",
  },
  {
    id: "accessories",
    label: "Accessories",
    hint: "Holders & magnets",
    pad: { xs: 5, md: 6 },
    frame: "#1A1A1A",
    tint: "transparent",
  },
  {
    id: "features",
    label: "Features",
    hint: "Tray, logo, layout",
    pad: { xs: 5, md: 6 },
    frame: "#1A1A1A",
    tint: "rgba(227,28,35,0.04)",
  },
] as const;

export function CustomizeSection() {
  const [active, setActive] = useState<(typeof controls)[number]["id"]>("size");
  const current = controls.find((c) => c.id === active) ?? controls[0];

  return (
    <Box component="section" sx={{ bgcolor: "background.paper", py: { xs: 10, md: 14 } }}>
      <Container>
        <Grid container spacing={{ xs: 6, lg: 8 }} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, lg: 6.3 }}>
            <Reveal>
              <Typography variant="overline" sx={{ color: "primary.main", fontSize: 11, letterSpacing: "0.2em" }}>
                Customizer
              </Typography>
            </Reveal>
            <Reveal delay={80}>
              <Typography
                variant="h2"
                sx={{
                  mt: 1.5,
                  fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
                  lineHeight: { md: 1.1 },
                  letterSpacing: "-0.03em",
                }}
              >
                Your wall. Your board. Your way.
              </Typography>
            </Reveal>
            <Reveal delay={140}>
              <Typography sx={{ mt: 2, maxWidth: 448, lineHeight: 1.7, color: "text.secondary" }}>
                Configure size, frame, colour, accessories and features, then request a quote or build your setup.
              </Typography>
            </Reveal>

            <Reveal delay={200}>
              <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 4, flexWrap: "wrap" }}>
                {controls.map((control) => {
                  const selected = active === control.id;
                  return (
                    <Button
                      key={control.id}
                      type="button"
                      onMouseEnter={() => setActive(control.id)}
                      onFocus={() => setActive(control.id)}
                      onClick={() => setActive(control.id)}
                      variant="outlined"
                      sx={{
                        position: "relative",
                        borderRadius: 0.5,
                        px: 2,
                        py: 1.25,
                        fontSize: 14,
                        fontWeight: 500,
                        borderColor: selected ? "primary.main" : "divider",
                        bgcolor: selected ? "primary.light" : "transparent",
                        color: selected ? "primary.main" : "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: selected ? "primary.light" : "transparent",
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 12,
                          right: 12,
                          bottom: -1,
                          height: 2,
                          bgcolor: "primary.main",
                          transformOrigin: "left",
                          transform: selected ? "scaleX(1)" : "scaleX(0)",
                          transition: "transform 0.3s ease",
                        },
                      }}
                    >
                      {control.label}
                    </Button>
                  );
                })}
              </Stack>
            </Reveal>

            <Reveal delay={280}>
              <Button
                component={Link}
                href="/customize"
                color="secondary"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                sx={{ mt: 5, px: 0, fontSize: 14 }}
              >
                Customize a Board
              </Button>
            </Reveal>
          </Grid>

          <Grid size={{ xs: 12, lg: 5.7 }}>
            <Reveal delay={120} variant="scale">
              <Box sx={{ position: "relative" }}>
                <Typography
                  variant="overline"
                  component="p"
                  sx={{ mb: 1.5, display: "block", fontSize: 11, letterSpacing: "0.18em", color: "text.secondary" }}
                >
                  Make it yours.
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      p: current.pad,
                      transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        height: "100%",
                        width: "100%",
                        border: `6px solid ${current.frame}`,
                        transition: "border-color 0.5s ease",
                      }}
                    >
                      <Image
                        src={images.magneticWhiteboardAlt}
                        alt="OBASIX board ready for customization"
                        fill
                        className="object-cover transition duration-500"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: current.tint,
                          transition: "background-color 0.5s ease",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: 1,
                    borderTop: 0,
                    borderColor: "divider",
                    bgcolor: "background.default",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.03em" }}>
                    {current.hint}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "text.primary" }}
                  >
                    {current.label}
                  </Typography>
                </Stack>
              </Box>
            </Reveal>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
