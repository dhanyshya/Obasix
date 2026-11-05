"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "./ProductActions";
import { productCardDetailsButtonSx } from "./productCardButtonStyles";

export function RecommendationCard({
  item,
  subtitle,
}: {
  item: Product;
  subtitle?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: 1.25,
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "primary.main" },
        "&:hover .rec-title": { color: "primary.main" },
      }}
    >
      <Box
        component={Link}
        href={`/products/${item.id}`}
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "flex-start",
          textDecoration: "none",
          color: "inherit",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 64,
            height: 64,
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: 0.5,
            bgcolor: "#FFFFFF",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Image src={item.images[0]} alt={item.name} fill className="object-contain p-1" sizes="64px" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="rec-title" variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {item.shortName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitle ?? item.shortDescription}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
            {item.price > 0 ? formatPrice(item.price) : "Quote on request"}
          </Typography>
        </Box>
      </Box>
      <Button
        component={Link}
        href={`/products/${item.id}`}
        size="small"
        variant="outlined"
        fullWidth
        sx={productCardDetailsButtonSx}
      >
        View Details
      </Button>
      <ProductActions product={item} variant="compact" />
    </Box>
  );
}
