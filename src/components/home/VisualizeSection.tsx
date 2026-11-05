"use client";

import Image from "next/image";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { getProductById } from "@/data/catalogue";
import { wallModels } from "@/data/wallModels";
import { home } from "./homeRhythm";

export function VisualizeSection() {
  const wall = useMemo(
    () => wallModels.find((model) => model.id === "modern-office") ?? wallModels[0],
    [],
  );
  const previewProduct = wall ? getProductById(wall.recommendedBoards[0]) : undefined;

  if (!wall) return null;

  return (
    <Box
      component="section"
      aria-labelledby="visualize-heading"
      sx={{ py: home.sectionPy, bgcolor: "#FFFFFF", borderTop: `1px solid ${home.line}` }}
    >
      <Container>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3.5, md: 5 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.85fr) minmax(0, 1.15fr)" },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography id="visualize-heading" variant="h2" sx={{ ...home.heading, maxWidth: "12ch" }}>
              Visualize Your Space
            </Typography>
            <Typography sx={home.lede}>
              Upload a photo of your own wall, place a catalogue board, and preview before you buy. Sample
              rooms are optional.
            </Typography>

            <Stack direction="row" useFlexGap spacing={1.25} sx={{ mt: 3.25, flexWrap: "wrap" }}>
              <Button
                component={Link}
                href="/visualize"
                variant="contained"
                color="primary"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                sx={home.primaryBtn}
              >
                Visualize Your Space
              </Button>
              <Button
                component={Link}
                href={`/visualize/${wall.id}`}
                variant="outlined"
                color="inherit"
                sx={{
                  ...home.primaryBtn,
                  bgcolor: "transparent",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                Optional: try a sample room
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              position: "relative",
              aspectRatio: "16 / 11",
              overflow: "hidden",
              bgcolor: home.charcoal,
            }}
          >
            <Image
              key={wall.image}
              src={wall.image}
              alt="Example wall visualization"
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 55vw"
            />
            {previewProduct?.images[0] ? (
              <Box
                sx={{
                  position: "absolute",
                  left: `${wall.wallArea.left * 100}%`,
                  top: `${wall.wallArea.top * 100}%`,
                  width: `${wall.wallArea.width * 100}%`,
                  height: `${wall.wallArea.height * 100}%`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Box sx={{ position: "relative", width: "78%", height: "72%" }}>
                  <Image
                    src={previewProduct.images[0]}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="320px"
                  />
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
