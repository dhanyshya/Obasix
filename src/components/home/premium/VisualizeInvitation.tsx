import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { getProductById } from "@/data/catalogue";
import { wallModels } from "@/data/wallModels";
import { home } from "../homeRhythm";
import { Eyebrow, Shell } from "./shared";

const steps = ["Choose a room", "Set your wall", "Place the board"];

export function VisualizeInvitation() {
  const wall = wallModels.find((model) => model.id === "modern-office") ?? wallModels[0];
  const board = wall ? getProductById(wall.recommendedBoards[0]) : undefined;

  if (!wall) return null;

  return (
    <Box
      component="section"
      aria-labelledby="visualise-heading"
      sx={{ bgcolor: home.white, py: home.sectionPy }}
    >
      <Shell>
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            bgcolor: home.charcoal,
            minHeight: { xs: 560, sm: 620, md: 700 },
            aspectRatio: { xs: "4 / 5", sm: "16 / 11", md: "16 / 9" },
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <Image
            src={wall.image}
            alt="A modern workspace used for a wall visualization preview"
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />

          {board?.images[0] ? (
            <Box
              aria-hidden
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
                filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.24))",
              }}
            >
              <Box sx={{ position: "relative", width: "80%", height: "74%" }}>
                <Image src={board.images[0]} alt="" fill sizes="420px" style={{ objectFit: "contain" }} />
              </Box>
            </Box>
          ) : null}

          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(16,29,23,0.46) 0%, rgba(16,29,23,0.12) 52%, rgba(16,29,23,0.04) 100%), linear-gradient(0deg, rgba(16,29,23,0.32), transparent 52%)",
            }}
          />

          <Box
            sx={{
              position: "relative",
              m: { xs: 1.5, sm: 2.5, md: 3.5 },
              p: { xs: 2.75, sm: 3.5, md: 4.5 },
              width: { xs: "auto", md: 390 },
              maxWidth: "100%",
              bgcolor: "rgba(247,245,240,0.97)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Eyebrow>In your room</Eyebrow>
            <Typography
              id="visualise-heading"
              component="h2"
              sx={{
                ...home.h2,
                mt: 2,
                fontSize: { xs: "2.3rem", sm: "2.7rem", md: "3rem" },
                lineHeight: 1,
                maxWidth: "10ch",
              }}
            >
              See it on your wall before it arrives.
            </Typography>
            <Typography sx={{ mt: 2, fontSize: 14, lineHeight: 1.75, color: home.body }}>
              Place a board in a sample room, or upload a photo of your own space and judge the
              scale, frame and finish in context.
            </Typography>

            <Box sx={{ mt: 3, borderTop: `1px solid ${home.line}` }}>
              {steps.map((step, index) => (
                <Box
                  key={step}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1,
                    borderBottom: `1px solid ${home.line}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontSize: 14,
                      color: home.forest,
                      width: 22,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: home.charcoal }}>
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 3 }}>
              <Button
                component={Link}
                href="/visualize"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={home.primaryBtn}
              >
                Visualise your space
              </Button>
              <Button
                component={Link}
                href={`/visualize/${wall.id}`}
                sx={home.secondaryBtn}
              >
                Try a sample room
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              position: "absolute",
              right: { md: 34 },
              top: { md: 34 },
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              color: home.ivory,
              bgcolor: "rgba(16,29,23,0.32)",
              border: "1px solid rgba(247,245,240,0.3)",
              px: 1.5,
              py: 0.75,
              backdropFilter: "blur(6px)",
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: home.oak }} />
            <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Live preview
            </Typography>
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}
