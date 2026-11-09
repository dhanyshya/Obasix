"use client";

import Image from "next/image";
import { useState } from "react";
import Box from "@mui/material/Box";
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
import { CompareToggle } from "@/components/compare/CompareToggle";

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
        bgcolor: "transparent",
        "&:hover .pc-image": { transform: "scale(1.035)" },
        "&:hover .pc-quick": { opacity: 1 },
        "&:hover .pc-rule": { transform: "scaleX(1)" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E5E0",
          borderRadius: "20px",
          transition: "box-shadow 300ms cubic-bezier(0.16,1,0.3,1)",
          "article:hover &": { boxShadow: "0 24px 48px -28px rgba(20,25,23,0.3)" },
          flexShrink: 0,
        }}
      >
        {product.images[0] && !imgFailed ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="pc-image object-contain"
            style={{ transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)", padding: "9%" }}
            sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
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
            right: 12,
            top: 12,
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            color: wished ? "#C8282E" : "text.secondary",
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
              left: 12,
              top: 12,
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

      <Box sx={{ display: "none" }}>
        <Box
          className="pc-rule"
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "#EE6A1F",
            transform: "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 420ms cubic-bezier(0.16,1,0.3,1)",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        />
      </Box>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", pt: 2, px: 0.5, minWidth: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "baseline" }}>
          <Typography
            sx={{
              fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
              fontWeight: 500,
              fontSize: 12.5,
              letterSpacing: "0.01em",
              color: "#6B706D",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.sku}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            {product.sizes[0]?.label ?? label}
          </Typography>
        </Box>
        <Typography
          component={Link}
          href={`/products/${product.id}`}
          sx={{
            mt: 0.75,
            minHeight: "2.3em",
            fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
            fontWeight: 600,
            fontSize: { xs: "0.95rem", md: "1.1rem" },
            lineHeight: 1.25,
            letterSpacing: "-0.015em",
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "&:hover": { textDecoration: "underline", textUnderlineOffset: 4 },
            "&:focus-visible": { outline: "2px solid #164E3B", outlineOffset: 2 },
          }}
        >
          {product.shortName}
        </Typography>
                <Box sx={{ mt: 1.25, display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography
            sx={{
              fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
              fontWeight: 500,
              fontSize: { xs: "1.05rem", md: "1.2rem" },
              letterSpacing: "-0.015em",
              fontVariantNumeric: "tabular-nums",
              color: "text.primary",
            }}
          >
            {product.price > 0 ? formatPrice(product.price) : "On quote"}
          </Typography>
          {product.compareAtPrice && product.price > 0 ? (
            <Typography component="s" sx={{ fontSize: 13.5, color: "text.secondary" }}>
              {formatPrice(product.compareAtPrice)}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ mt: "auto", pt: 1.75 }}>
          <ProductActions product={product} variant="card" />
        </Box>
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: 1 }}>
          <Box component={Link} href={`/products/${product.id}`} sx={{ fontSize: 14, fontWeight: 500, color: "#164E3B", py: 0.75, "&:hover": { textDecoration: "underline", textUnderlineOffset: 3 } }}>
            {detailsLabel}
          </Box>
          <CompareToggle productId={product.id} />
        </Box>
      </Box>
    </Box>
  );
}
