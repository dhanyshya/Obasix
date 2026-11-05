"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { useMemo, useState } from "react";
import { products } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type FilterId =
  | "all"
  | "magnetic"
  | "non-magnetic"
  | "ceramic"
  | "notice"
  | "chalk"
  | "combination"
  | "wood"
  | "stands"
  | "accessories"
  | "desk"
  | "display";

const filters: { id: FilterId; label: string; match: (product: Product) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  {
    id: "magnetic",
    label: "Magnetic Whiteboards",
    match: (product) => product.category === "magnetic-whiteboard" && product.surface !== "ceramic-steel",
  },
  {
    id: "non-magnetic",
    label: "Non-Magnetic Whiteboards",
    match: (product) => product.category === "non-magnetic-whiteboard",
  },
  { id: "ceramic", label: "Ceramic Steel", match: (product) => product.surface === "ceramic-steel" },
  {
    id: "notice",
    label: "Notice & Pin-up",
    match: (product) => product.category === "notice-board" || product.category === "pin-up-board",
  },
  { id: "chalk", label: "Chalk Boards", match: (product) => product.category === "chalk-board" },
  {
    id: "combination",
    label: "Combination Boards",
    match: (product) => product.category === "combination-board",
  },
  { id: "wood", label: "Wooden Products", match: (product) => product.category === "wooden-product" },
  {
    id: "stands",
    label: "Stands",
    match: (product) => product.category === "stand" && product.id !== "easel-5ft",
  },
  { id: "accessories", label: "Accessories", match: (product) => product.category === "accessory" },
  { id: "desk", label: "Desk Accessories", match: (product) => product.category === "desk-accessory" },
  { id: "display", label: "Display Stands", match: (product) => product.id === "easel-5ft" },
];

export function ExploreProductsSection() {
  const [filter, setFilter] = useState<FilterId>("all");
  const available = filters.filter((item) => item.id === "all" || products.some(item.match));
  const visible = useMemo(() => {
    const current = available.find((item) => item.id === filter) ?? available[0];
    const matched = products.filter(current.match);
    if (filter !== "all") return matched;
    const featured = matched.filter((product) => product.featured);
    return featured.length ? featured : matched.slice(0, 8);
  }, [available, filter]);

  return (
    <Box component="section" sx={{ bgcolor: "background.paper", py: { xs: 6, md: 8 } }}>
      <Container>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "flex-end" }, justifyContent: { md: "space-between" } }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.18em" }}>
              Catalogue
            </Typography>
            <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.875rem", md: "2.35rem" }, letterSpacing: "-0.03em" }}>
              Featured Products
            </Typography>
          </Box>
          <Button component={Link} href="/products" color="primary" sx={{ fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}>
            View All Products
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 3, overflowX: "auto", pb: 0.5 }}>
          {available.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="small"
              color="primary"
              variant={filter === item.id ? "contained" : "outlined"}
              onClick={() => setFilter(item.id)}
              sx={{
                flexShrink: 0,
                px: 1.5,
                py: 1,
                fontSize: 12,
                whiteSpace: "nowrap",
                ...(filter !== item.id && { color: "text.primary", "&:hover": { borderColor: "primary.main" } }),
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          {visible.map((product) => (
            <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card
                component="article"
                sx={{
                  height: "100%",
                  borderRadius: 0.5,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 3 },
                  "&:hover .product-img": { transform: "scale(1.03)" },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                    "&:hover .product-img": { transform: "none" },
                  },
                }}
              >
                <CardActionArea component={Link} href={`/products/${product.id}`} sx={{ display: "block", height: "100%" }}>
                  <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "background.default" }}>
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="product-img object-contain p-6 transition duration-500"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography component="h3" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                      {product.shortName}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: "primary.main" }}>
                      {formatPrice(product.price)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1.5, display: "inline-block", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}
                    >
                      View Product
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
