"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "@/components/Link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductActions } from "./ProductActions";

export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="product-quick-view-title"
      slotProps={{
        paper: {
          sx: { borderRadius: 0, bgcolor: "background.paper" },
        },
      }}
    >
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) minmax(0,1fr)" },
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              aspectRatio: "1 / 1",
              bgcolor: "#FFFFFF",
              border: 1,
              borderColor: "divider",
            }}
          >
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 900px) 100vw, 420px"
              />
            ) : null}
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
              {product.series ?? product.category.replace(/-/g, " ")}
            </Typography>
            <Typography id="product-quick-view-title" variant="h4" sx={{ mt: 1, fontSize: { xs: "1.4rem", md: "1.75rem" } }}>
              {product.shortName}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary" }}>
              SKU {product.sku}
            </Typography>
            <Typography sx={{ mt: 2, fontWeight: 600, fontSize: "1.15rem" }}>
              {product.price > 0 ? formatPrice(product.price) : "Quote on request"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", lineHeight: 1.7 }}>
              {product.shortDescription}
            </Typography>
            {product.sizes.length > 0 ? (
              <Typography variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary" }}>
                Sizes: {product.sizes.map((size) => size.label).join(" · ")}
              </Typography>
            ) : null}
            <Stack spacing={1.5} sx={{ mt: 3.5 }}>
              <Button component={Link} href={`/products/${product.id}`} variant="text" onClick={onClose} sx={{ alignSelf: "flex-start", px: 0 }}>
                View Product
              </Button>
              <ProductActions product={product} variant="detail" onNavigating={onClose} />
            </Stack>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
