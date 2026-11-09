"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import {
  colours,
  frames,
  getProductById,
  getRelatedProducts,
} from "@/data/catalogue";
import { CompleteYourBoard } from "@/components/product/CompleteYourBoard";
import { ProductActions } from "@/components/product/ProductActions";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { ProductGallery } from "@/components/product/ProductGallery";
import { RecommendationCard } from "@/components/product/RecommendationCard";
import { formatPrice } from "@/lib/format";
import { quoteBoardLabel } from "@/lib/quotes/schema";

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <Typography variant="body2">
      <Box component="span" sx={{ color: "text.secondary" }}>
        {label}:
      </Box>{" "}
      <Box component="span" sx={{ fontWeight: 500, textTransform: "capitalize" }}>
        {value}
      </Box>
    </Typography>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const [sizeId, setSizeId] = useState(() => product?.sizes[0]?.id ?? "standard");
  const [quantity, setQuantity] = useState(1);

  if (!product) notFound();

  const related = getRelatedProducts(product);

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={{ xs: 4, lg: 6 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <ProductGallery images={product.images} alt={product.name} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", pb: 1.5, borderBottom: "3px solid", borderColor: "text.primary" }}>
              <Typography sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em", bgcolor: "#164E3B", color: "#FFFFFF", px: 1.25, py: 0.4 }}>
                {product.sku}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", textTransform: "capitalize" }}>
                {product.series ? `${product.series} series` : product.category.replace(/-/g, " ")}
              </Typography>
            </Box>
            <Typography
              component="h1"
              sx={{
                mt: 2,
                fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                fontWeight: 800,
                fontVariationSettings: '"wdth" 90',
                fontSize: { xs: 32, md: 44 },
                letterSpacing: "-0.035em",
                lineHeight: 1,
                color: "text.primary",
                textWrap: "balance",
              }}
            >
              {product.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.7 }}>
              {product.description}
            </Typography>
            <Typography component="p" sx={{ mt: 3, fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 800, fontSize: { xs: 34, md: 42 }, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: "text.primary" }}>
              {formatPrice(product.price)}
              {product.compareAtPrice && (
                <Box
                  component="span"
                  sx={{
                    ml: 1.5,
                    fontSize: 16,
                    fontWeight: 500,
                    color: "text.secondary",
                    textDecoration: "line-through",
                  }}
                >
                  {formatPrice(product.compareAtPrice)}
                </Box>
              )}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Attribute label="Surface" value={product.surface.replace(/-/g, " ")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Attribute label="Frame" value={product.frame.replace(/-/g, " ")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Attribute label="Colour" value={product.colours.join(", ")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Attribute label="Magnetic" value={product.magnetic ? "Yes" : "No"} />
              </Grid>
            </Grid>

            {product.sizes.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Size
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  color="primary"
                  sx={{
                    flexWrap: "wrap",
                    gap: 1,
                    "& .MuiToggleButtonGroup-grouped": { borderRadius: 0, "&:not(:first-of-type)": { ml: 0, borderLeft: "2px solid" } },
                    "& .MuiToggleButton-root": {
                      minWidth: 88,
                      minHeight: 48,
                      fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      textTransform: "none",
                      color: "text.primary",
                      borderColor: "text.primary",
                      borderWidth: 2,
                    },
                    "& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover": {
                      bgcolor: "text.primary",
                      color: "#FFFFFF",
                      boxShadow: "inset 0 -4px 0 #EE6A1F",
                    },
                  }}
                  value={sizeId}
                  onChange={(_, next: string | null) => {
                    if (next) setSizeId(next);
                  }}
                  aria-label="Size"
                >
                  {product.sizes.map((size) => (
                    <ToggleButton key={size.id} value={size.id} sx={{ px: 2 }}>
                      {size.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Quantity
              </Typography>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                slotProps={{ htmlInput: { min: 1, "aria-label": "Quantity" } }}
                sx={{ width: 112 }}
              />
            </Box>

            <Box sx={{ mt: 4 }}>
              <ProductActions product={product} sizeId={sizeId} quantity={quantity} variant="detail" />
              <Box sx={{ mt: 1 }}>
                <CompareToggle productId={product.id} size="medium" />
              </Box>
              <Button
                component={Link}
                variant="text"
                color="inherit"
                href={`/quote?${new URLSearchParams({
                  boardType: quoteBoardLabel(product),
                  quantity: String(quantity),
                  product: product.shortName,
                  productId: product.id,
                  customSize: product.sizes.find((size) => size.id === sizeId)?.label ?? "",
                  frame: frames.find((frame) => frame.id === product.frame)?.name ?? "",
                  colour: colours.find((colour) => colour.id === product.colours[0])?.name ?? "",
                  config: `${product.shortName} · ${product.sku}`,
                }).toString()}`}
                sx={{ mt: 1.5, px: 0, fontWeight: 600 }}
              >
                Request Custom Quote
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={{ xs: 4, lg: 6 }} sx={{ mt: { xs: 6, md: 8 } }}>
          <Grid size={{ xs: 12, lg: 4 }} component="section">
            <Typography variant="h6" component="h2" sx={{ pb: 1.5, borderBottom: 2, borderColor: "primary.main" }}>
              Specifications
            </Typography>
            <Table size="small" aria-label="Specifications">
              <TableBody>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <TableRow key={key} sx={{ "&:last-child td, &:last-child th": { borderBottom: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ pl: 0, color: "text.secondary", fontWeight: 400 }}>
                      {key}
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0, fontWeight: 500 }}>
                      {value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} component="section">
            <Typography variant="h6" component="h2" sx={{ pb: 1.5, borderBottom: 2, borderColor: "primary.main" }}>
              Features
            </Typography>
            <Stack component="ul" spacing={1} sx={{ m: 0, mt: 2, p: 0, listStyle: "none" }}>
              {product.features.map((f) => (
                <Stack key={f} component="li" direction="row" spacing={1.25}>
                  <Box
                    component="span"
                    sx={{ mt: "8px", width: 6, height: 6, flexShrink: 0, borderRadius: "50%", bgcolor: "warning.main" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {f}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            <Typography variant="subtitle2" component="h3" sx={{ mt: 3, fontWeight: 600 }}>
              Applications
            </Typography>
            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {product.applications.map((a) => (
                <Chip
                  key={a}
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={a.replace("-", " ")}
                  sx={{ textTransform: "capitalize", fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} component="section">
            <Typography variant="h6" component="h2" sx={{ pb: 1.5, borderBottom: 2, borderColor: "primary.main" }}>
              What&apos;s Included
            </Typography>
            <Stack component="ul" spacing={1} sx={{ m: 0, mt: 2, p: 0, listStyle: "none" }}>
              {product.whatsIncluded.map((item) => (
                <Typography key={item} component="li" variant="body2" color="text.secondary">
                  • {item}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <CompleteYourBoard product={product} />

        <Box component="section" sx={{ mt: { xs: 6, md: 8 } }}>
          <Typography variant="h5" component="h2">
            Related Products
          </Typography>
          <Grid container spacing={1.5} sx={{ mt: 2.5 }}>
            {related.map((item) => (
              <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                <RecommendationCard item={item} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
