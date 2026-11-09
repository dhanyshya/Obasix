import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { categoryCards, products } from "@/data/catalogue";
import { images } from "@/data/images";

const extraCards = [
  {
    id: "ceramic",
    name: "Ceramic Steel Whiteboards",
    description: "Scratch-resistant ceramic steel surfaces from the OBASIX catalogue.",
    image: images.magneticWhiteboardAlt,
    href: "/products?q=ceramic",
  },
  {
    id: "stands",
    name: "Whiteboard Stands",
    description: "Mobile and fixed stands listed in the OBASIX catalogue.",
    image: images.whiteboardStand,
    href: "/products?category=stand",
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "Magnets, holders and desk pieces for everyday use.",
    image: images.magnets,
    href: "/products?category=accessory",
  },
].filter((card) => {
  if (card.id === "ceramic") return products.some((product) => product.surface === "ceramic-steel");
  if (card.id === "stands") return products.some((product) => product.category === "stand");
  return products.some((product) => product.category === "accessory" || product.category === "desk-accessory");
});

export function CategoryShowcase() {
  const base = categoryCards.filter((card) => products.some((product) => product.category === card.category));
  const cards = [...base, ...extraCards];

  return (
    <Box component="section" sx={{ bgcolor: "background.default", py: { xs: 6, md: 8 } }}>
      <Container>
        <Box sx={{ maxWidth: 672 }}>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
            Categories
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.875rem", md: "2.35rem" }, letterSpacing: "-0.03em" }}>
            Find Your Perfect Board
          </Typography>
          <Typography sx={{ mt: 1.5, color: "text.secondary", lineHeight: 1.7 }}>
            Explore practical solutions designed for your workspace.
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mt: 4 }}>
          {cards.map((card) => (
            <Grid key={card.id} size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card
                component="article"
                sx={{
                  height: "100%",
                  borderRadius: 0,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 3 },
                  "&:hover .category-img": { transform: "scale(1.04)" },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                    "&:hover .category-img": { transform: "none" },
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  href={card.href}
                  sx={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "stretch" }}
                >
                  <Box sx={{ position: "relative", aspectRatio: "5 / 4", overflow: "hidden", bgcolor: "background.default" }}>
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      className="category-img object-contain p-6 transition duration-500"
                      sizes="(max-width: 1280px) 50vw, 25vw"
                    />
                  </Box>
                  <Box sx={{ display: "flex", flex: 1, flexDirection: "column", px: 2.5, pb: 2.5, pt: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontSize: 18 }}>
                      {card.name}
                    </Typography>
                    {card.description ? (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          color: "text.secondary",
                          lineHeight: 1.7,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {card.description}
                      </Typography>
                    ) : null}
                    <Typography
                      variant="body2"
                      sx={{ mt: "auto", pt: 2, fontWeight: 600, color: "primary.main" }}
                    >
                      Explore Category
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
