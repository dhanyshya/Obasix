"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductById } from "@/data/catalogue";
import { home } from "./homeRhythm";

const FEATURED_IDS = ["cmwb90120", "scuv90120", "spbmgpcb3060", "whiteboard-stand"] as const;

export function FeaturedProductsSection() {
  const products = FEATURED_IDS.map((id) => getProductById(id)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item),
  );

  if (products.length === 0) return null;

  return (
    <Box
      component="section"
      aria-labelledby="featured-heading"
      sx={{ py: home.sectionPy, bgcolor: "#FFFFFF", borderTop: `1px solid ${home.line}` }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: { xs: 3.5, md: 4.5 },
            alignItems: { sm: "flex-end" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography id="featured-heading" variant="h2" sx={home.heading}>
              Featured Products
            </Typography>
            <Typography sx={home.lede}>A curated selection from the OBASIX catalogue.</Typography>
          </Box>
          <Button
            component={Link}
            href="/products"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            sx={{ ...home.linkBtn, alignSelf: { xs: "flex-start", sm: "auto" } }}
          >
            View all products
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 2.5 },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            alignItems: "stretch",
            overflow: "hidden",
          }}
        >
          {products.map((product) => (
            <Box key={product.id} sx={{ minWidth: 0, height: "100%" }}>
              <ProductCard product={product} showAddToCart />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
