"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { getAllProducts } from "@/data/catalogue";
import {
  discoveryCategories,
  filterDiscoveryProducts,
  type DiscoveryCategoryId,
} from "@/lib/catalogueSearch";

const FEATURED_LIMIT = 8;

export function ProductDiscoverySection() {
  const catalogue = useMemo(() => getAllProducts(), []);
  const [categoryId, setCategoryId] = useState<DiscoveryCategoryId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterDiscoveryProducts(catalogue, categoryId, query),
    [catalogue, categoryId, query],
  );

  const visible = useMemo(() => {
    const featured = filtered.filter((p) => p.featured);
    const pool = featured.length >= 4 ? featured : filtered;
    return pool.slice(0, FEATURED_LIMIT);
  }, [filtered]);

  const activeCategory = discoveryCategories.find((c) => c.id === categoryId) ?? discoveryCategories[0];
  const viewAllHref =
    query.trim().length > 0
      ? `/products?q=${encodeURIComponent(query.trim())}`
      : activeCategory.href;

  return (
    <Box
      component="section"
      id="product-discovery"
      aria-labelledby="discovery-heading"
      sx={{
        py: { xs: 8, md: 11 },
        bgcolor: "background.default",
        scrollMarginTop: { xs: 64, md: 72 },
      }}
    >
      <Container>
        <Reveal>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              mb: { xs: 3.5, md: 4.5 },
              alignItems: { md: "flex-end" },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ maxWidth: 560 }}>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", letterSpacing: "0.18em", fontWeight: 600 }}
              >
                PRODUCT DISCOVERY
              </Typography>
              <Typography
                id="discovery-heading"
                variant="h2"
                sx={{
                  mt: 1.25,
                  fontSize: { xs: "1.85rem", md: "2.55rem" },
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                }}
              >
                Designed Around the Way You Work.
              </Typography>
              <Typography sx={{ mt: 1.25, color: "text.secondary", maxWidth: 440 }}>
                Browse the live OBASIX catalogue — real names, SKUs and prices. Filter by collection
                or search.
              </Typography>
            </Box>
            <Button
              component={Link}
              href={viewAllHref}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{ alignSelf: { xs: "flex-start", md: "auto" }, px: 0, fontWeight: 600 }}
            >
              View All Products
            </Button>
          </Stack>
        </Reveal>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 3,
            alignItems: { md: "center" },
            justifyContent: "space-between",
          }}
        >
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search boards, SKUs, accessories…"
            size="small"
            fullWidth
            sx={{ maxWidth: { md: 360 } }}
            slotProps={{
              htmlInput: { "aria-label": "Search catalogue on homepage" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
            {visible.length < filtered.length ? ` · showing ${visible.length}` : ""}
          </Typography>
        </Box>

        <Stack
          direction="row"
          useFlexGap
          spacing={1}
          sx={{
            flexWrap: "wrap",
            mb: { xs: 3.5, md: 4.5 },
            pb: 0.5,
          }}
        >
          {discoveryCategories.map((category) => {
            const active = category.id === categoryId;
            const count = catalogue.filter(category.match).length;
            if (category.id !== "all" && count === 0) return null;
            return (
              <Chip
                key={category.id}
                label={category.label}
                onClick={() => setCategoryId(category.id)}
                clickable
                variant={active ? "filled" : "outlined"}
                color={active ? "primary" : "default"}
                sx={{
                  borderRadius: 0.5,
                  fontWeight: active ? 600 : 500,
                  height: 34,
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            );
          })}
        </Stack>

        {visible.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 3,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 1 }}>No products match these filters</Typography>
            <Typography color="text.secondary" sx={{ mb: 2.5, maxWidth: 400, mx: "auto" }}>
              Try another collection, clear your search, or browse the full catalogue.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center", flexWrap: "wrap" }} useFlexGap>
              <Button
                variant="outlined"
                onClick={() => {
                  setCategoryId("all");
                  setQuery("");
                }}
                sx={{ borderRadius: 0.5 }}
              >
                Reset Filters
              </Button>
              <Button
                component={Link}
                href="/products"
                variant="contained"
                color="primary"
                sx={{ borderRadius: 0.5 }}
              >
                View All Products
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2.5, md: 3 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
            }}
          >
            {visible.map((product, index) => (
              <Reveal key={product.id} delay={Math.min(index * 35, 140)}>
                <ProductCard product={product} showAddToCart />
              </Reveal>
            ))}
          </Box>
        )}

        {filtered.length > visible.length ? (
          <Stack sx={{ mt: 4, alignItems: "center" }}>
            <Button
              component={Link}
              href={viewAllHref}
              variant="outlined"
              color="inherit"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{ borderRadius: 0.5, borderColor: "divider", minHeight: 44, px: 2.5 }}
            >
              View all {filtered.length} matching products
            </Button>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
