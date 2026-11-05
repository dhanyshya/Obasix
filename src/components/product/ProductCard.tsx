"use client";

import Image from "next/image";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Link from "@/components/Link";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "./ProductActions";
import { productCardDetailsButtonSx } from "./productCardButtonStyles";

const categoryLabel: Record<string, string> = {
  "magnetic-whiteboard": "Magnetic Whiteboard",
  "non-magnetic-whiteboard": "Non-Magnetic Whiteboard",
  "notice-board": "Notice Board",
  "pin-up-board": "Pin-up Board",
  "chalk-board": "Chalk Board",
  "combination-board": "Combination Board",
  "wooden-product": "Wooden Product",
  stand: "Stand",
  accessory: "Accessory",
  "desk-accessory": "Desk Accessory",
};

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  detailsLabel?: string;
  /** @deprecated Actions now always include Add to Cart when priced; kept for callers. */
  showAddToCart?: boolean;
}

export function ProductCard({
  product,
  onQuickView,
  detailsLabel = "View Details",
}: ProductCardProps) {
  const { toggle, has } = useWishlist();
  const wished = has(product.id);
  const [imgFailed, setImgFailed] = useState(false);
  const label =
    product.surface === "ceramic-steel"
      ? "Ceramic Steel"
      : categoryLabel[product.category] ?? product.category.replace(/-/g, " ");

  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: 1,
        overflow: "hidden",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 10px 28px rgba(37,42,38,0.06)",
          transform: "translateY(-2px)",
        },
        "&:hover .pc-image": { transform: "scale(1.02)" },
        "&:hover .pc-quick": { opacity: 1 },
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {product.images[0] && !imgFailed ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="pc-image object-contain"
            style={{ transition: "transform 0.35s ease", padding: 18 }}
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 33vw, 25vw"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              px: 2,
              textAlign: "center",
              bgcolor: "primary.light",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Image unavailable
            </Typography>
          </Box>
        )}

        <IconButton
          onClick={() => toggle(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          size="small"
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            bgcolor: "rgba(255,255,255,0.96)",
            color: wished ? "secondary.main" : "text.secondary",
            boxShadow: "0 1px 4px rgba(37,42,38,0.08)",
            "&:hover": { bgcolor: "#FFFFFF" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 1,
            },
          }}
        >
          {wished ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>

        {onQuickView ? (
          <IconButton
            className="pc-quick"
            aria-label="Quick view"
            onClick={() => onQuickView(product)}
            size="small"
            sx={{
              position: "absolute",
              left: 8,
              top: 8,
              opacity: { xs: 1, md: 0 },
              transition: "opacity 0.2s ease",
              bgcolor: "rgba(255,255,255,0.96)",
              boxShadow: "0 1px 4px rgba(37,42,38,0.08)",
              "&:hover": { bgcolor: "#FFFFFF" },
              "&:focus-visible": {
                opacity: 1,
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 1,
              },
            }}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Box>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          px: { xs: 1.6, md: 1.85 },
          pt: 1.6,
          pb: 1.75,
          minWidth: 0,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "primary.main", letterSpacing: "0.12em", fontSize: 10, lineHeight: 1.4 }}
        >
          {label}
        </Typography>
        <Typography
          component={Link}
          href={`/products/${product.id}`}
          variant="h6"
          sx={{
            mt: 0.4,
            minHeight: { xs: "2.5em", md: "2.55em" },
            fontSize: { xs: "0.92rem", md: "1rem" },
            lineHeight: 1.3,
            fontWeight: 600,
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
            "&:hover": { color: "primary.main" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
        >
          {product.shortName}
        </Typography>
        {product.sku ? (
          <Typography
            variant="caption"
            sx={{
              mt: 0.45,
              color: "text.secondary",
              letterSpacing: "0.03em",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.sku}
          </Typography>
        ) : null}
        <Typography sx={{ mt: 1.1, fontWeight: 700, fontSize: "0.98rem", color: "text.primary" }}>
          {product.price > 0 ? formatPrice(product.price) : "Quote on request"}
        </Typography>

        <Stack spacing={0.75} sx={{ mt: "auto", pt: 1.6 }}>
          <Button
            component={Link}
            href={`/products/${product.id}`}
            size="small"
            variant="outlined"
            fullWidth
            sx={productCardDetailsButtonSx}
          >
            {detailsLabel}
          </Button>
          <ProductActions product={product} variant="card" />
        </Stack>
      </Box>
    </Box>
  );
}
