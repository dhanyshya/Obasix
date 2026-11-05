"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Link from "@/components/Link";
import { useCart } from "@/context/CartContext";
import {
  accessoriesViewAllHref,
  accessoryRequiresConfiguration,
  getRecommendedAccessories,
  type AccessoryRecommendation,
} from "@/lib/accessories";
import { buildCustomizeHref, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

function AccessoryCard({
  recommendation,
  selected,
  quantity,
  onToggle,
  onQuantityChange,
  onAdd,
  added,
  busy,
}: {
  recommendation: AccessoryRecommendation;
  selected: boolean;
  quantity: number;
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onAdd: (product: Product, quantity: number) => void;
  added: boolean;
  busy: boolean;
}) {
  const { product, compatibilityNote } = recommendation;
  const needsConfig = accessoryRequiresConfiguration(product);
  const canQuickAdd = !needsConfig && product.price > 0;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Box
      component="article"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: "5 / 4",
          bgcolor: "#FFFFFF",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {product.images[0] && !imgFailed ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain"
            style={{ padding: 14 }}
            sizes="(max-width: 600px) 50vw, 25vw"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Image unavailable
            </Typography>
          </Box>
        )}
        {canQuickAdd ? (
          <Checkbox
            checked={selected}
            onChange={() => onToggle(product.id)}
            slotProps={{ input: { "aria-label": `Select ${product.shortName}` } }}
            sx={{
              position: "absolute",
              top: 4,
              left: 4,
              bgcolor: "rgba(255,255,255,0.92)",
              borderRadius: 0.5,
              p: 0.5,
            }}
          />
        ) : null}
      </Box>

      <Stack spacing={1} sx={{ p: 2, flex: 1 }}>
        <Typography
          component={Link}
          href={`/products/${product.id}`}
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: "0.95rem",
            lineHeight: 1.3,
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "&:hover": { color: "primary.main" },
          }}
        >
          {product.shortName}
        </Typography>
        {product.sku ? (
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.04em" }}>
            {product.sku}
          </Typography>
        ) : null}
        {product.price > 0 ? (
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {formatPrice(product.price)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Quote on request
          </Typography>
        )}
        {compatibilityNote ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {compatibilityNote}
          </Typography>
        ) : product.shortDescription ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.shortDescription}
          </Typography>
        ) : null}

        <Stack spacing={1.25} sx={{ mt: "auto", pt: 1 }}>
          {canQuickAdd ? (
            <>
              <TextField
                type="number"
                size="small"
                label="Qty"
                value={quantity}
                onChange={(event) =>
                  onQuantityChange(product.id, Math.max(1, Number(event.target.value) || 1))
                }
                slotProps={{ htmlInput: { min: 1, "aria-label": `Quantity for ${product.shortName}` } }}
                sx={{ width: 96 }}
              />
              <Button
                variant="contained"
                size="small"
                disabled={busy || added}
                onClick={() => onAdd(product, quantity)}
                startIcon={added ? <CheckIcon /> : undefined}
              >
                {added ? "Added" : "Add to Cart"}
              </Button>
            </>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Button
                component={Link}
                href={`/products/${product.id}`}
                variant="outlined"
                size="small"
              >
                View Product
              </Button>
              {product.customizable ? (
                <Button
                  component={Link}
                  href={buildCustomizeHref({ productId: product.id })}
                  variant="contained"
                  size="small"
                >
                  Configure
                </Button>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export function CompleteYourBoard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { items, total, all } = useMemo(
    () => getRecommendedAccessories(product, { limit: 4 }),
    [product],
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bundleBusy, setBundleBusy] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  useEffect(() => {
    setQuantities({});
    setSelected({});
    setAddedIds({});
    setBusyId(null);
    setBundleBusy(false);
    setBundleAdded(false);
  }, [product.id]);

  if (items.length === 0) return null;

  const quickAddItems = items.filter(
    (item) => !accessoryRequiresConfiguration(item.product) && item.product.price > 0,
  );

  const selectedLines = quickAddItems.filter((item) => selected[item.product.id]);
  const bundleTotal = selectedLines.reduce((sum, item) => {
    const qty = quantities[item.product.id] ?? 1;
    return sum + item.product.price * qty;
  }, 0);
  const allSelectedHavePrices = selectedLines.every((item) => item.product.price > 0);

  const handleAdd = (accessory: Product, quantity: number) => {
    if (busyId || accessoryRequiresConfiguration(accessory) || accessory.price <= 0) return;
    setBusyId(accessory.id);
    addItem(accessory.id, {}, quantity);
    setAddedIds((prev) => ({ ...prev, [accessory.id]: true }));
    window.setTimeout(() => {
      setBusyId(null);
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[accessory.id];
        return next;
      });
    }, 1600);
  };

  const handleBundleAdd = () => {
    if (bundleBusy || selectedLines.length === 0 || !allSelectedHavePrices) return;
    setBundleBusy(true);
    for (const item of selectedLines) {
      addItem(item.product.id, {}, quantities[item.product.id] ?? 1);
    }
    setBundleAdded(true);
    setSelected({});
    window.setTimeout(() => {
      setBundleBusy(false);
      setBundleAdded(false);
    }, 1800);
  };

  return (
    <Box
      component="section"
      aria-labelledby="complete-your-board-heading"
      sx={{
        mt: { xs: 6, md: 8 },
        pt: { xs: 4, md: 5 },
        pb: { xs: 1, md: 2 },
        px: { xs: 2, md: 3 },
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "flex-end" }, justifyContent: "space-between", mb: 3 }}
      >
        <Box>
          <Typography
            id="complete-your-board-heading"
            variant="h5"
            component="h2"
            sx={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: { xs: "1.25rem", md: "1.45rem" } }}
          >
            Complete Your Board
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 480 }}>
            Everything you need to get more from your board.
          </Typography>
        </Box>
        {total > items.length ? (
          <Button
            component={Link}
            href={accessoriesViewAllHref()}
            endIcon={<ArrowForwardIcon />}
            sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, px: 0, fontWeight: 600 }}
          >
            View All Accessories
          </Button>
        ) : null}
      </Stack>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {items.map((recommendation) => (
          <Grid key={recommendation.product.id} size={{ xs: 6, md: 3 }}>
            <AccessoryCard
              recommendation={recommendation}
              selected={Boolean(selected[recommendation.product.id])}
              quantity={quantities[recommendation.product.id] ?? 1}
              onToggle={(id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }))}
              onQuantityChange={(id, quantity) =>
                setQuantities((prev) => ({ ...prev, [id]: quantity }))
              }
              onAdd={handleAdd}
              added={Boolean(addedIds[recommendation.product.id])}
              busy={busyId === recommendation.product.id}
            />
          </Grid>
        ))}
      </Grid>

      {quickAddItems.length > 1 ? (
        <Box
          sx={{
            mt: 3,
            pt: 2.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Add selected accessories
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Optional — choose what you need. Nothing is added automatically.
              </Typography>
              {selectedLines.length > 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {selectedLines.length} selected
                  {allSelectedHavePrices ? ` · ${formatPrice(bundleTotal)}` : ""}
                </Typography>
              ) : null}
            </Box>
            <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Button
                size="small"
                variant="text"
                disabled={selectedLines.length === 0}
                onClick={() => setSelected({})}
                sx={{ px: 0 }}
              >
                Clear selection
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={selectedLines.length === 0 || bundleBusy || !allSelectedHavePrices}
                onClick={handleBundleAdd}
                startIcon={bundleAdded ? <CheckIcon /> : undefined}
              >
                {bundleAdded
                  ? "Added to cart"
                  : selectedLines.length > 0
                    ? `Add Selected (${selectedLines.length})`
                    : "Add Selected Accessories"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {/* Keep full list available for potential expansion without inventing SKUs */}
      {all.length > items.length ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Showing {items.length} of {total} catalogue-linked accessories.
        </Typography>
      ) : null}
    </Box>
  );
}
