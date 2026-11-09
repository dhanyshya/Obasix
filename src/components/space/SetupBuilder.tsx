"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import type { Product, SpaceSetup } from "@/lib/types";
import { formatPricePlaceholder, formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export function SetupBuilder({
  space,
  products,
}: {
  space: SpaceSetup;
  products: Product[];
}) {
  const { addSetup } = useCart();
  const total = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ borderRadius: "16px", p: { xs: 2.5, md: 4 }, boxShadow: 1 }}
    >
      <Typography variant="overline" sx={{ color: "warning.main", fontWeight: 700, letterSpacing: "0.05em" }}>
        Build Your Setup
      </Typography>
      <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.5rem", md: "1.875rem" }, fontWeight: 700 }}>
        Your {space.name} Setup
      </Typography>
      <Stack spacing={1.5} sx={{ mt: 3 }}>
        {products.map((product, index) => (
          <Box key={product.id}>
            {index > 0 && (
              <Typography
                variant="caption"
                component="p"
                sx={{ mb: 1, textAlign: "center", fontWeight: 700, color: "warning.main" }}
              >
                +
              </Typography>
            )}
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: "16px", p: 1.5 }}
            >
              <Box sx={{ position: "relative", height: 64, width: 64, flexShrink: 0, overflow: "hidden", borderRadius: "16px" }}>
                <Image src={product.images[0]} alt="" fill className="object-cover" sizes="64px" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{product.shortName}</Typography>
                <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
                  {product.shortDescription}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 700 }}>{formatPrice(product.price)}</Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: 1,
          borderColor: "divider",
          justifyContent: "space-between",
          alignItems: { sm: "center" },
        }}
      >
        <Box>
          <Typography
            variant="caption"
            component="p"
            sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary" }}
          >
            Estimated total
          </Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{formatPricePlaceholder(total)}</Typography>
        </Box>
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={() => addSetup(products.map((p) => p.id))}
          >
            Add Complete Setup to Cart
          </Button>
          <Button
            component={Link}
            href={`/customize?productId=${products[0]?.id}&application=${space.id}`}
            variant="outlined"
            color="primary"
          >
            Customize Setup
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
