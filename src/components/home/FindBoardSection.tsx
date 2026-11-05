import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { getVisibleSolutions } from "@/data/solutions";

export function FindBoardSection() {
  const spaces = getVisibleSolutions();
  return (
    <Box component="section" sx={{ bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
      <Container>
        <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.18em" }}>
          Solutions
        </Typography>
        <Typography
          variant="h2"
          sx={{ mt: 1, maxWidth: 576, fontSize: { xs: "1.875rem", md: "2.35rem" }, letterSpacing: "-0.03em" }}
        >
          Find the Right Board for Your Space
        </Typography>
        <Grid container spacing={2} sx={{ mt: 4 }}>
          {spaces.map((space) => (
            <Grid key={space.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Box
                component={Link}
                href={`/solutions/${space.id}`}
                sx={{
                  position: "relative",
                  display: "block",
                  minHeight: 220,
                  height: "100%",
                  overflow: "hidden",
                  bgcolor: "primary.main",
                  "&:hover .solution-img": { transform: "scale(1.03)" },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  "@media (prefers-reduced-motion: reduce)": { "&:hover .solution-img": { transform: "none" } },
                }}
              >
                <Image
                  src={space.image}
                  alt=""
                  fill
                  className="solution-img object-cover transition duration-500"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(24,91,56,0.84), rgba(24,91,56,0.18))",
                  }}
                />
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    height: "100%",
                    minHeight: 220,
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    p: 2.5,
                    color: "common.white",
                  }}
                >
                  <Typography variant="h5" component="h3" sx={{ fontSize: 24 }}>
                    {space.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: "rgba(255,255,255,0.85)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {space.summary}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}
                  >
                    Explore Solution
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
