"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  onQuickView,
}: {
  products: Product[];
  onQuickView?: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 0,
          bgcolor: "background.paper",
          px: 3,
          py: 8,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" component="p">
          No products match these filters
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try another category, size or clear filters to explore the OBASIX catalogue.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2.5}>
      {products.map((product) => (
        <Grid key={product.id} size={{ xs: 12, sm: 6, xl: 4 }}>
          <ProductCard product={product} onQuickView={onQuickView} />
        </Grid>
      ))}
    </Grid>
  );
}
