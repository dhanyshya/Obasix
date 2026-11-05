"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { ProductActions } from "@/components/product/ProductActions";
import { Reveal } from "@/components/motion/Reveal";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const FEATURED_ID = "smwbpcb90120";
const SUPPORT_IDS = ["cmwb90120", "whiteboard-stand"] as const;

function ProductMeta({ product }: { product: Product }) {
  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.08em" }}>
        {product.sku}
      </Typography>
      <Typography
        component={Link}
        href={`/products/${product.id}`}
        sx={{
          display: "block",
          mt: 0.5,
          fontWeight: 600,
          fontSize: { xs: "0.95rem", md: "1.05rem" },
          lineHeight: 1.3,
          color: "text.primary",
          "&:hover": { color: "primary.main" },
        }}
      >
        {product.shortName}
      </Typography>
      <Typography sx={{ mt: 1.25, fontWeight: 600, fontSize: 14 }}>
        {product.price > 0 ? formatPrice(product.price) : "Quote on request"}
      </Typography>
      <Box sx={{ mt: 1.25 }}>
        <ProductActions product={product} variant="compact" />
      </Box>
    </Box>
  );
}

export function IdeasInMotionSection() {
  const featured = getProductById(FEATURED_ID) ?? getProductById("cmwb90120");
  const supports = SUPPORT_IDS.map((id) => getProductById(id)).filter(Boolean);

  if (!featured) return null;

  return (
    <Box
      component="section"
      aria-labelledby="ideas-in-motion-heading"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: "background.default" }}
    >
      <Container>
        <Reveal>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between", mb: { xs: 4, md: 6 } }}
          >
            <Box sx={{ maxWidth: 520 }}>
              <Typography
                variant="overline"
                sx={{ color: "primary.main", letterSpacing: "0.16em" }}
              >
                COLLECTION STUDY
              </Typography>
              <Typography
                id="ideas-in-motion-heading"
                variant="h2"
                sx={{
                  mt: 1.25,
                  fontSize: { xs: "1.75rem", md: "2.35rem" },
                  letterSpacing: "-0.025em",
                }}
              >
                Designed for Ideas in Motion.
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/products"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{ alignSelf: { xs: "flex-start", md: "auto" }, px: 0, fontWeight: 600 }}
            >
              View all boards
            </Button>
          </Stack>
        </Reveal>

        {/* Asymmetric editorial composition — not a uniform card grid */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 3.5 },
            gridTemplateColumns: { xs: "1fr", md: "1.35fr 1fr" },
            gridTemplateRows: { md: "auto auto" },
            alignItems: "stretch",
          }}
        >
          <Reveal
            sx={{
              gridRow: { md: "1 / span 2" },
              display: "flex",
              flexDirection: "column",
              borderTop: 1,
              borderColor: "divider",
              pt: 2.5,
            }}
          >
            <Box
              sx={{
                position: "relative",
                flex: 1,
                minHeight: { xs: 280, md: 480 },
                bgcolor: "#FFFFFF",
                border: 1,
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Image
                src={featured.images[0]}
                alt={featured.name}
                fill
                className="object-contain"
                sizes="(max-width: 900px) 100vw, 55vw"
                style={{ padding: 28 }}
              />
            </Box>
            <ProductMeta product={featured} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 420 }}>
              {featured.shortDescription}
            </Typography>
          </Reveal>

          {supports.map((product, index) =>
            product ? (
              <Reveal
                key={product.id}
                delay={80 + index * 60}
                sx={{
                  borderTop: 1,
                  borderColor: "divider",
                  pt: 2.5,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    height: { xs: 200, md: index === 0 ? 200 : 180 },
                    bgcolor: "#FFFFFF",
                    border: 1,
                    borderColor: "divider",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 900px) 100vw, 40vw"
                    style={{ padding: 18 }}
                  />
                </Box>
                <ProductMeta product={product} />
              </Reveal>
            ) : null,
          )}
        </Box>
      </Container>
    </Box>
  );
}
