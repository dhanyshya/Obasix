"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Link from "@/components/Link";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/data/catalogue";
import {
  accessoriesViewAllHref,
  accessoryRequiresConfiguration,
  getRecommendedAccessories,
} from "@/lib/accessories";
import { buildCustomizeHref, formatPrice } from "@/lib/format";
import { home } from "./homeRhythm";

const ANCHOR_ID = "cmwb90120";

export function AccessoriesBandSection() {
  const { addItem } = useCart();
  const board = getProductById(ANCHOR_ID);
  const recommendations = useMemo(
    () => (board ? getRecommendedAccessories(board, { limit: 4 }).items : []),
    [board],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!board || recommendations.length === 0) return null;

  const handleAdd = (id: string, quantity: number) => {
    const product = getProductById(id);
    if (!product || accessoryRequiresConfiguration(product) || product.price <= 0) return;
    addItem(id, {}, quantity);
    setAddedIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 1600);
  };

  return (
    <Box
      component="section"
      aria-labelledby="setup-heading"
      sx={{ py: home.sectionPy, bgcolor: "#FFFFFF", borderTop: `1px solid ${home.line}` }}
    >
      <Container>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: { xs: 3.5, md: 4.5 },
            alignItems: { sm: "flex-end" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography id="setup-heading" variant="h2" sx={home.heading}>
              Complete Your Setup
            </Typography>
            <Typography sx={home.lede}>
              Compatible accessories for {board.shortName}, from catalogue relationships.
            </Typography>
          </Box>
          <Button
            component={Link}
            href={accessoriesViewAllHref()}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            sx={{ ...home.linkBtn, alignSelf: { xs: "flex-start", sm: "auto" } }}
          >
            View accessories
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          {recommendations.map(({ product }) => {
            const needsConfig = accessoryRequiresConfiguration(product);
            const canQuickAdd = !needsConfig && product.price > 0;
            const qty = quantities[product.id] ?? 1;
            const added = Boolean(addedIds[product.id]);

            return (
              <Box key={product.id} component="article">
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    bgcolor: home.surface,
                    mb: 1.5,
                  }}
                >
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 900px) 50vw, 22vw"
                      style={{ padding: 16 }}
                    />
                  ) : null}
                </Box>
                <Typography
                  component={Link}
                  href={`/products/${product.id}`}
                  sx={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "text.primary",
                    display: "block",
                    lineHeight: 1.3,
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {product.shortName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {product.sku}
                  {product.price > 0 ? ` · ${formatPrice(product.price)}` : ""}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                  {canQuickAdd ? (
                    <>
                      <TextField
                        type="number"
                        size="small"
                        value={qty}
                        onChange={(event) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                        slotProps={{ htmlInput: { min: 1, "aria-label": `Quantity for ${product.shortName}` } }}
                        sx={{ width: 64 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={added}
                        onClick={() => handleAdd(product.id, qty)}
                        startIcon={added ? <CheckIcon sx={{ fontSize: 14 }} /> : undefined}
                        sx={{ borderRadius: 0 }}
                      >
                        {added ? "Added" : "Add"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        component={Link}
                        href={`/products/${product.id}`}
                        size="small"
                        sx={{ px: 0, fontWeight: 600 }}
                      >
                        View
                      </Button>
                      {product.customizable ? (
                        <Button
                          component={Link}
                          href={buildCustomizeHref({ productId: product.id })}
                          size="small"
                          sx={{ px: 0, fontWeight: 600 }}
                        >
                          Configure
                        </Button>
                      ) : null}
                    </>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
