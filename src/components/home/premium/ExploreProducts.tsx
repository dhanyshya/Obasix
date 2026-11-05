import Box from "@mui/material/Box";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { home } from "../homeRhythm";
import { availableProducts } from "./homeProducts";
import { Shell, ShopSectionHeading } from "./shared";

export function ExploreProducts() {
  return (
    <Box
      component="section"
      aria-labelledby="products-heading"
      sx={{
        bgcolor: home.ivory,
        py: { xs: 6, md: 8 },
        borderTop: `1px solid ${home.line}`,
        borderBottom: `1px solid ${home.line}`,
      }}
    >
      <Shell>
        <ShopSectionHeading
          id="products-heading"
          title="FEATURED PRODUCTS"
          action={{ href: "/products", label: "View all products" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: { xs: 2, md: 2.25 },
            "& > *": { minWidth: 0 },
          }}
        >
          {availableProducts.map((product, index) => (
            <Reveal key={product.id} delay={index * 35} sx={{ display: "flex" }}>
              <Box sx={{ display: "flex", width: "100%" }}>
                <ProductCard product={product} />
              </Box>
            </Reveal>
          ))}
        </Box>
      </Shell>
    </Box>
  );
}
