"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import type { CartItem as CartItemType } from "@/lib/types";
import { getProductById, frames, colours } from "@/data/catalogue";
import { layoutSummary } from "@/lib/combination";
import { featureName } from "@/lib/features";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { signType } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

function Detail({ label, children }: { label: string; children: string }) {
  return (
    <Typography variant="body2" component="div">
      <Box component="span" sx={{ color: "text.secondary" }}>
        {label}:{" "}
      </Box>
      <Box component="span" sx={{ fontWeight: 500 }}>
        {children}
      </Box>
    </Typography>
  );
}

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();
  const product = getProductById(item.productId);
  if (!product) return null;

  const frame = frames.find((f) => f.id === item.configuration.frameId);
  const colour = colours.find((c) => c.id === item.configuration.colourId);
  const size =
    product.sizes.find((s) => s.id === item.configuration.sizeId)?.label ??
    (item.configuration.customWidthFt
      ? `${item.configuration.customWidthFt} × ${item.configuration.customHeightFt} ft`
      : "Standard");

  return (
    <Box
      component="article"
      sx={{
        display: "grid",
        gap: 2,
        py: 3,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: 0 },
        gridTemplateColumns: { xs: "96px 1fr", md: "136px 1fr auto" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: { xs: 96, md: 136 },
          height: { xs: 96, md: 120 },
          overflow: "hidden",
          bgcolor: brand.ivory,
        }}
      >
        <Image src={product.images[0]} alt={product.name} fill sizes="136px" style={{ objectFit: "contain", padding: "8%" }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...signType.code, fontSize: 12, color: brand.forest }}>{product.sku}</Typography>
        <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 18, md: 21 }, color: brand.charcoal, mt: 0.5 }}>
          {product.shortName}
        </Typography>
        <Box sx={{ mt: 1.5, display: "grid", gap: 0.5, gridTemplateColumns: { sm: "1fr 1fr" } }}>
          <Detail label="Size">{size}</Detail>
          <Detail label="Frame">{frame?.name ?? "—"}</Detail>
          <Detail label="Colour">{colour?.name ?? "—"}</Detail>
          {item.configuration.combinationLayout ? (
            <Box sx={{ gridColumn: { sm: "span 2" } }}>
              <Detail label="Layout">{layoutSummary(item.configuration.combinationLayout)}</Detail>
            </Box>
          ) : null}
          <Detail label="Features">
            {item.configuration.features?.length
              ? item.configuration.features.map(featureName).join(", ")
              : "Standard"}
          </Detail>
        </Box>
      </Box>
      <Stack
        direction={{ xs: "row", md: "column" }}
        spacing={2}
       
       
        sx={{ alignItems: { xs: "center", md: "flex-end" }, justifyContent: "space-between", gridColumn: { xs: "1 / -1", md: "auto" } }}
      >
        <Typography component="p" sx={{ ...signType.plate, fontSize: 22, fontVariantNumeric: "tabular-nums", color: brand.charcoal }}>
          {formatPrice(item.unitPrice * item.quantity)}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <IconButton
            size="small"
            aria-label="Decrease quantity"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            sx={{ border: 1, borderColor: "divider", borderRadius: 0, width: 36, height: 36 }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography component="span" aria-live="polite" sx={{ width: 32, textAlign: "center", fontWeight: 600, fontSize: 14 }}>
            {item.quantity}
          </Typography>
          <IconButton
            size="small"
            aria-label="Increase quantity"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            sx={{ border: 1, borderColor: "divider", borderRadius: 0, width: 36, height: 36 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Remove item"
            onClick={() => removeItem(item.id)}
            sx={{ ml: 0.5, borderRadius: 0, width: 36, height: 36, color: brand.muted, "&:hover": { color: brand.actionDark, bgcolor: "#FBECEC" } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
