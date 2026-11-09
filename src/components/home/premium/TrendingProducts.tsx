import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { formatPrice } from "@/lib/format";
import { home } from "../homeRhythm";
import { trendingProducts } from "./homeProducts";
import { Shell, ShopSectionHeading } from "./shared";

export function TrendingProducts() {
  return (
    <Box
      component="section"
      aria-labelledby="trending-heading"
      sx={{ bgcolor: home.white, py: { xs: 6, md: 8 } }}
    >
      <Shell>
        <ShopSectionHeading
          id="trending-heading"
          title="TRENDING PRODUCTS"
          action={{ href: "/products", label: "View all products" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
          }}
        >
          {trendingProducts.map((product, index) => (
            <Reveal key={product.id} delay={index * 45} sx={{ display: "flex" }}>
              <Box
                component={Link}
                href={`/products/${product.id}`}
                className="group"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  bgcolor: home.white,
                  border: `1px solid ${home.line}`,
                  borderRadius: 0,
                  overflow: "hidden",
                  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    borderColor: home.forest,
                    boxShadow: "0 16px 36px rgba(23,77,56,0.08)",
                  },
                  "&:hover .trending-image": { transform: "scale(1.045)" },
                  "&:hover .trending-arrow": { transform: "translateX(4px)" },
                  "&:focus-visible": {
                    outline: `2px solid ${home.forest}`,
                    outlineOffset: 3,
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover .trending-image": { transform: "none" },
                    "&:hover .trending-arrow": { transform: "none" },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    bgcolor: home.ivory,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={product.images[0] ?? "/hero-workspace-photo.jpg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 600px) 50vw, (max-width: 900px) 50vw, 25vw"
                    className="trending-image"
                    style={{
                      objectFit: "contain",
                      padding: "clamp(18px, 3.5vw, 38px)",
                      transition: "transform 0.45s ease",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      bgcolor: "rgba(255,255,255,0.94)",
                      color: home.forest,
                      px: 1,
                      py: 0.45,
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Trending
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    p: { xs: 1.75, md: 2.25 },
                    borderTop: `1px solid ${home.line}`,
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                      fontSize: { xs: 17, md: 21 },
                      lineHeight: 1.15,
                      color: home.charcoal,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.3em",
                    }}
                  >
                    {product.shortName}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      fontSize: { xs: 13, md: 14 },
                      color: home.charcoal,
                    }}
                  >
                    {product.price > 0 ? formatPrice(product.price) : "Price on request"}
                  </Typography>
                  <Box
                    sx={{
                      mt: "auto",
                      pt: 1.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      color: home.forest,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      View Product
                    </Typography>
                    <ArrowForwardIcon
                      className="trending-arrow"
                      sx={{ fontSize: 16, transition: "transform 0.25s ease" }}
                      aria-hidden
                    />
                  </Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Shell>
    </Box>
  );
}
