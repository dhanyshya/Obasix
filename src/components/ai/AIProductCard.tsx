"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { ProductActions } from "@/components/product/ProductActions";
import { productCardDetailsButtonSx } from "@/components/product/productCardButtonStyles";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { CustomizerState } from "@/lib/types";

export function AIProductCard({
  productId,
  reason,
  customizerPrefill,
  onNavigate,
}: {
  productId: string;
  reason?: string;
  customizerPrefill?: Partial<CustomizerState>;
  onNavigate?: () => void;
}) {
  const product = getProductById(productId);
  if (!product) return null;

  const size = product.sizes[0]?.label ?? "Standard";
  const featureLine = product.features.slice(0, 2).join(" · ");

  return (
    <Paper variant="outlined" sx={{ mt: 1.5, overflow: "hidden", borderRadius: "12px", boxShadow: 1 }}>
      <Box sx={{ position: "relative", aspectRatio: "16 / 10", bgcolor: "background.default" }}>
        <Image
          src={product.images[0]}
          alt={product.shortName}
          fill
          className="object-contain p-3"
          sizes="320px"
        />
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
          {product.shortName}
        </Typography>
        <Typography variant="caption" component="p" sx={{ mt: 0.5, color: "text.secondary" }}>
          {size}
          {featureLine ? ` · ${featureLine}` : ""}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 700 }}>
          {formatPrice(product.price)}
        </Typography>
        {reason && (
          <Typography
            component="p"
            sx={{ mt: 0.5, fontSize: 11, lineHeight: 1.6, color: "text.secondary" }}
          >
            {reason}
          </Typography>
        )}
      </Box>
      <Box sx={{ borderTop: 1, borderColor: "divider", p: 1 }}>
        <Button
          component={Link}
          href={`/products/${product.id}`}
          onClick={onNavigate}
          fullWidth
          sx={{ ...productCardDetailsButtonSx, mb: 0.75 }}
        >
          View Details
        </Button>
        <ProductActions
          product={product}
          variant="compact"
          onNavigating={onNavigate}
          sizeId={customizerPrefill?.sizeId}
        />
      </Box>
    </Paper>
  );
}
