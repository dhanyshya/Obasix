"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import Link from "@/components/Link";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import {
  buildVisualizeHref,
  canAddProductToCart,
  canCustomizeProduct,
  canVisualizeProduct,
  defaultCartConfiguration,
  productCustomizeHref,
} from "@/lib/productActions";
import {
  productCardActionContainedSx,
  productCardActionOutlineSx,
} from "./productCardButtonStyles";

export type ProductActionsVariant = "card" | "detail" | "compact";

interface ProductActionsProps {
  product: Product;
  sizeId?: string;
  quantity?: number;
  variant?: ProductActionsVariant;
  /** Hide Add to Cart when a parent supplies its own (e.g. accessory quick-add). */
  hideAddToCart?: boolean;
  onNavigating?: () => void;
}

export function ProductActions({
  product,
  sizeId,
  quantity = 1,
  variant = "card",
  hideAddToCart = false,
  onNavigating,
}: ProductActionsProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const locking = useRef(false);

  const showCart = !hideAddToCart && canAddProductToCart(product);
  const showCustomize = canCustomizeProduct(product);
  const showVisualize = canVisualizeProduct(product);
  const selectedSize = sizeId ?? product.sizes[0]?.id;

  const handleAddToCart = () => {
    if (!showCart || locking.current) return;
    if (product.sizes.length > 0 && !selectedSize) {
      setFeedback("Select a size before adding to cart.");
      return;
    }
    locking.current = true;
    addItem(product.id, defaultCartConfiguration(product, selectedSize), quantity);
    setAdded(true);
    setFeedback("Added to cart");
    window.setTimeout(() => {
      setAdded(false);
      locking.current = false;
      setFeedback("");
    }, 1600);
  };

  if (!showCart && !showCustomize && !showVisualize) return null;

  if (variant === "detail") {
    return (
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
          {showCart ? (
            <Button
              variant="contained"
              onClick={handleAddToCart}
              disabled={added}
              startIcon={added ? <CheckIcon sx={{ fontSize: 16 }} /> : undefined}
            >
              {added ? "Added to Cart" : "Add to Cart"}
            </Button>
          ) : (
            <Button
              component={Link}
              href={`/quote?productId=${product.id}`}
              variant="contained"
            >
              Request a Quote
            </Button>
          )}
          {showCustomize ? (
            <Button
              component={Link}
              href={productCustomizeHref(product, selectedSize)}
              variant="outlined"
              onClick={onNavigating}
            >
              Customize This Board
            </Button>
          ) : null}
          {showVisualize ? (
            <Button
              component={Link}
              href={buildVisualizeHref({ productId: product.id, sizeId: selectedSize })}
              variant="outlined"
              onClick={onNavigating}
            >
              Visualize Your Space
            </Button>
          ) : null}
        </Stack>
        {feedback ? (
          <Typography sx={{ mt: 1, fontSize: 13, fontWeight: 600, color: "primary.main" }}>
            {feedback}
          </Typography>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.7fr",
          alignItems: "stretch",
          gap: { xs: 0.4, sm: 0.5 },
        }}
      >
        {showCart ? (
          <Button
            size="small"
            variant="contained"
            onClick={handleAddToCart}
            disabled={added}
            startIcon={added ? <CheckIcon sx={{ fontSize: 12 }} /> : undefined}
            sx={productCardActionContainedSx}
          >
            {added ? "Added" : "Add to Cart"}
          </Button>
        ) : (
          <Button size="small" variant="contained" disabled sx={productCardActionContainedSx}>
            Add to Cart
          </Button>
        )}
        {showCustomize ? (
          <Button
            component={Link}
            href={productCustomizeHref(product, selectedSize)}
            size="small"
            variant="outlined"
            onClick={onNavigating}
            sx={productCardActionOutlineSx}
          >
            Customise
          </Button>
        ) : (
          <Button size="small" variant="outlined" disabled sx={productCardActionOutlineSx}>
            Customise
          </Button>
        )}
        {showVisualize ? (
          <Button
            component={Link}
            href={buildVisualizeHref({ productId: product.id, sizeId: selectedSize })}
            size="small"
            variant="outlined"
            onClick={onNavigating}
            sx={productCardActionOutlineSx}
          >
            Visualise Your Space
          </Button>
        ) : (
          <Button size="small" variant="outlined" disabled sx={productCardActionOutlineSx}>
            Visualise Your Space
          </Button>
        )}
      </Box>
      {feedback ? (
        <Typography sx={{ mt: 0.75, fontSize: 11.5, fontWeight: 600, color: "primary.main" }}>
          {feedback}
        </Typography>
      ) : null}
    </Box>
  );
}
