import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { getSolutionProducts, getVisibleSolutions } from "@/data/solutions";

export const metadata = { title: "Solutions" };

export default function SolutionsPage() {
  const solutions = getVisibleSolutions();

  return (
    <Box sx={{ overflowX: "hidden", bgcolor: "background.paper" }}>
      <Box component="section" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Container sx={{ py: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.35,
              borderRadius: 0.5,
              bgcolor: "primary.light",
              color: "primary.main",
              fontSize: 11,
              letterSpacing: "0.2em",
            }}
          >
            Solutions
          </Typography>
          <Typography
            variant="h1"
            sx={{
              mt: 2,
              maxWidth: 768,
              fontSize: { xs: "2.25rem", md: "3rem" },
              letterSpacing: "-0.03em",
              color: "text.primary",
            }}
          >
            What do you need for this space?
          </Typography>
          <Box sx={{ width: 40, height: 3, borderRadius: 1, bgcolor: "primary.main", mt: 1.5 }} />
          <Typography sx={{ mt: 2, maxWidth: 576, fontSize: { xs: 16, md: 18 }, lineHeight: 1.7, color: "text.secondary" }}>
            Choose a space. See the OBASIX boards and accessories listed for it.
          </Typography>
        </Container>
      </Box>

      <Box component="section" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
        <Container sx={{ py: { xs: 4, md: 6 } }}>
          <Grid container spacing={2}>
            {solutions.map((solution) => {
              const count = getSolutionProducts(solution.id).length;
              return (
                <Grid key={solution.id} size={{ xs: 12, sm: 6, xl: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 0.5,
                      transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: "primary.main",
                        boxShadow: "0 10px 24px rgba(15,61,38,0.06)",
                      },
                      "&:hover .solution-card-img": { transform: "scale(1.03)" },
                      "&:hover .solution-card-arrow": { transform: "translateX(4px)" },
                      "@media (prefers-reduced-motion: reduce)": {
                        transition: "none",
                        "&:hover": { transform: "none" },
                        "&:hover .solution-card-img": { transform: "none" },
                        "&:hover .solution-card-arrow": { transform: "none" },
                      },
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      href={`/solutions/${solution.id}`}
                      sx={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "stretch" }}
                    >
                      <Box sx={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden", bgcolor: "background.default" }}>
                        <Image
                          src={solution.image}
                          alt=""
                          fill
                          className="solution-card-img object-cover transition duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      </Box>
                      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", p: 2.5 }}>
                        <Typography variant="h5" component="h2" sx={{ fontSize: 20, letterSpacing: "-0.02em" }}>
                          {solution.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            lineHeight: 1.7,
                            color: "text.secondary",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {solution.summary}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ mt: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "text.secondary" }}
                        >
                          {count} {count === 1 ? "product" : "products"}
                        </Typography>
                        <Box
                          sx={{ mt: 2, display: "inline-flex", alignItems: "center", gap: 0.75, color: "secondary.main" }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Explore Solution
                          </Typography>
                          <ArrowForwardIcon className="solution-card-arrow" sx={{ fontSize: 14, transition: "transform 0.3s ease" }} />
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
