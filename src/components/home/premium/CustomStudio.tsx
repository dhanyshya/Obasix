import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getProductById } from "@/data/catalogue";
import { images } from "@/data/images";
import { home } from "../homeRhythm";
import { Eyebrow, Shell } from "./shared";

const steps = [
  "Choose your board",
  "Select your size",
  "Choose your frame",
  "Select features",
  "Add your logo",
  "Preview your design",
  "Request a quote",
];

const finishes = [
  { name: "Natural oak", hex: "#C8AD89" },
  { name: "Warm ivory", hex: "#F7F5F0" },
  { name: "Soft black", hex: "#252A26" },
  { name: "Forest", hex: "#174D38" },
];

const board = getProductById("smwbpcb90120") ?? getProductById("cmwb90120");

export function CustomStudio() {
  return (
    <Box
      component="section"
      aria-labelledby="custom-heading"
      sx={{
        position: "relative",
        bgcolor: home.ivory,
        py: { xs: 8, sm: 10, md: 12 },
        borderTop: `1px solid ${home.line}`,
        borderBottom: `1px solid ${home.line}`,
      }}
    >
      <Shell>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            columnGap: { md: 7 },
            rowGap: { xs: 5, md: 0 },
            alignItems: "center",
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 7" } }}>
            <Reveal>
              <Eyebrow>Customise your board</Eyebrow>
              <Typography
                id="custom-heading"
                component="h2"
                sx={{
                  ...home.h2,
                  mt: { xs: 2, md: 2.5 },
                  fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem", lg: "4.5rem" },
                  maxWidth: "12ch",
                }}
              >
                Built for your space.
                <Box component="span" sx={{ display: "block", fontStyle: "italic", color: home.forest }}>
                  Finished by you.
                </Box>
              </Typography>
              <Typography sx={{ ...home.lede, mt: { xs: 2.5, md: 3 } }}>
                Specify the surface, size, frame and details around the way you work. Our studio
                takes it from first measurement to final installation.
              </Typography>
            </Reveal>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: { xs: 3.5, md: 4 } }}
            >
              <Button
                component={Link}
                href="/customize"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={home.primaryBtn}
              >
                Start customising
              </Button>
              <Button
                component={Link}
                href="/quote"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={home.secondaryBtn}
              >
                Request a quote
              </Button>
            </Stack>
          </Box>

          <Box sx={{ gridColumn: { md: "7 / 13" } }}>
            <Reveal variant="scale">
              <Box
                sx={{
                  position: "relative",
                  bgcolor: home.white,
                  border: `1px solid ${home.line}`,
                  p: { xs: 2, md: 2.5 },
                  boxShadow: "0 24px 60px rgba(37,42,38,0.08)",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "16 / 11",
                    overflow: "hidden",
                    bgcolor: "#F4F1EA",
                  }}
                >
                  <Image
                    src={board?.images[0] ?? images.magneticWhiteboardAlt}
                    alt={board?.name ?? "Custom magnetic whiteboard with a natural frame"}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    style={{ objectFit: "contain", padding: "clamp(20px, 4vw, 48px)" }}
                  />
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    left: { xs: 24, md: 34 },
                    top: { xs: 24, md: 34 },
                    bgcolor: "rgba(255,255,255,0.94)",
                    px: 1.1,
                    py: 0.55,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: home.forest,
                  }}
                >
                  Custom study no. 04
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { sm: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={{ ...home.small, color: home.body }}>Frame study</Typography>
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontFamily: "var(--font-display), Georgia, serif",
                        fontSize: 20,
                        color: home.charcoal,
                      }}
                    >
                      {board?.shortName ?? "Superior magnetic whiteboard"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {finishes.map((finish) => (
                      <Box
                        key={finish.name}
                        title={finish.name}
                        sx={{
                          width: 21,
                          height: 21,
                          borderRadius: "50%",
                          bgcolor: finish.hex,
                          border: `1px solid ${
                            finish.hex === "#F7F5F0" ? home.line : "rgba(37,42,38,0.18)"
                          }`,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Reveal>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 6, md: 8 } }}>
          <Typography
            sx={{
              mb: { xs: 2.5, md: 3 },
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: home.forest,
            }}
          >
            Seven steps to your board
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(7, minmax(0, 1fr))",
              },
              columnGap: { xs: 2, md: 2.5 },
              rowGap: { xs: 3, md: 3.5 },
            }}
          >
            {steps.map((step, index) => (
              <Reveal key={step} delay={index * 45}>
                <Box
                  sx={{
                    pt: 1.75,
                    borderTop: `1px solid ${index === 0 ? home.forest : home.line}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontSize: 15,
                      color: home.forest,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1.25,
                      fontSize: { xs: 13, lg: 13.5 },
                      lineHeight: 1.45,
                      fontWeight: 600,
                      color: home.charcoal,
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}
