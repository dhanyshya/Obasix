import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { images } from "@/data/images";
import { home } from "../homeRhythm";
import { Shell } from "./shared";

export function PremiumHero() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-heading"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        minHeight: {
          xs: "min(700px, 92svh)",
          sm: "min(720px, 88svh)",
          md: "min(820px, calc(100svh - 108px))",
        },
        maxHeight: 920,
        overflow: "hidden",
        bgcolor: home.charcoal,
        color: home.ivory,
        isolation: "isolate",
      }}
    >
      <Image
        src={images.heroCampaign}
        alt="Sunlit contemporary workspace with a meeting table and wall-mounted board"
        fill
        priority
        quality={90}
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center 58%" }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: {
            xs: "linear-gradient(180deg, rgba(11,44,31,0.5) 0%, rgba(11,44,31,0.58) 55%, rgba(11,44,31,0.78) 100%)",
            md: "linear-gradient(90deg, rgba(11,44,31,0.82) 0%, rgba(11,44,31,0.56) 40%, rgba(11,44,31,0.16) 72%, rgba(11,44,31,0.04) 100%), linear-gradient(0deg, rgba(11,44,31,0.34) 0%, transparent 52%)",
          },
        }}
      />

      <Shell sx={{ position: "relative", py: { xs: 7, sm: 9, md: 10 }, width: "100%" }}>
        <Box sx={{ maxWidth: 820 }}>
          <Typography
            id="hero-heading"
            component="h1"
            sx={{
              ...home.display,
              maxWidth: "12ch",
              color: "#FFFFFF !important",
              fontSize: { xs: "2.65rem", sm: "3.7rem", md: "4.65rem", lg: "5.35rem" },
              lineHeight: 1,
              textShadow: "0 2px 28px rgba(11,44,31,0.26)",
              textWrap: "balance",
            }}
          >
            Surfaces That Bring
            <Box component="span" sx={{ display: "block" }}>
              Your Ideas{" "}
              <Box component="span" sx={{ fontStyle: "normal" }}>
                to Life.
              </Box>
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: { xs: 2.5, md: 3 },
              maxWidth: 560,
              color: "rgba(255,255,255,0.9)",
              fontSize: { xs: 15.5, md: 17 },
              lineHeight: 1.8,
              textShadow: "0 1px 18px rgba(11,44,31,0.18)",
            }}
          >
            Discover premium boards, explore inspiring spaces, and create surfaces that reflect
            your style.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.25, sm: 1.5 }}
            useFlexGap
            sx={{ mt: { xs: 3.5, md: 4.5 }, flexWrap: "wrap", alignItems: "stretch" }}
          >
            <Button
              component={Link}
              href="/products"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={home.primaryBtn}
            >
              Explore Products
            </Button>
            <Button
              component={Link}
              href="/solutions"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={home.secondaryBtn}
            >
              Design Your Space
            </Button>
            <Button
              component={Link}
              href="/customize"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={home.secondaryBtn}
            >
              Make a Board Better
            </Button>
          </Stack>
        </Box>
      </Shell>
    </Box>
  );
}
