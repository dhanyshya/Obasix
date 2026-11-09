import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { home } from "../homeRhythm";
import { Eyebrow, Shell } from "./shared";

export function Closing() {
  return (
    <Box
      component="section"
      aria-labelledby="closing-heading"
      className="grain"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: home.charcoal,
        color: home.ivory,
        py: { xs: 8, sm: 10, md: 13 },
      }}
    >
      <Typography
        aria-hidden
        sx={{
          position: "absolute",
          left: "50%",
          bottom: { xs: "-0.26em", md: "-0.3em" },
          transform: "translateX(-50%)",
          fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
          fontSize: { xs: "6.6rem", sm: "11rem", md: "18rem", lg: "23rem" },
          lineHeight: 0.7,
          letterSpacing: "0.06em",
          color: "rgba(247,245,240,0.035)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        OBASIX
      </Typography>

      <Shell sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            columnGap: 5,
            rowGap: { xs: 4, md: 0 },
            alignItems: "end",
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 8" } }}>
            <Reveal>
              <Eyebrow tone="oak">Begin a project</Eyebrow>
              <Typography
                id="closing-heading"
                component="h2"
                sx={{
                  ...home.h2,
                  mt: { xs: 2.5, md: 3.5 },
                  color: home.ivory,
                  maxWidth: "12ch",
                  fontSize: { xs: "2.9rem", sm: "3.8rem", md: "4.8rem", lg: "5.6rem" },
                }}
              >
                Let&apos;s make your next space{" "}
                <Box component="span" sx={{ fontStyle: "normal", color: home.oak }}>
                  the best one yet.
                </Box>
              </Typography>
            </Reveal>
          </Box>

          <Box sx={{ gridColumn: { md: "9 / 13" } }}>
            <Reveal delay={120}>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.8, color: "rgba(247,245,240,0.66)" }}>
                Tell us about the room, the wall or the whole floor. We&apos;ll help you choose the
                right surface, scale and finish — for a single board or a complete fit-out.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5 }}>
                <Button
                  component={Link}
                  href="/quote"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={home.primaryBtn}
                >
                  Start a conversation
                </Button>
                <Button
                  component={Link}
                  href="/products"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={home.secondaryBtn}
                >
                  Browse products
                </Button>
              </Stack>
              <Box
                sx={{
                  mt: 3.5,
                  pt: 2,
                  borderTop: "1px solid rgba(247,245,240,0.16)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 1, sm: 3 },
                  justifyContent: "space-between",
                }}
              >
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(247,245,240,0.45)" }}>
                  Homes · Offices · Schools · Commercial
                </Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(247,245,240,0.45)" }}>
                  Studio consultations by appointment
                </Typography>
              </Box>
            </Reveal>
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}
