"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { brandTokens as brand } from "@/theme/brandTokens";

type Stock = { state: "in-stock" | "low" | "made-to-order"; onHand?: number };

/** Shows availability only for products staff are tracking; otherwise renders nothing. */
export function StockBadge({ productId }: { productId: string }) {
  const [stock, setStock] = useState<{ for: string; value: Stock | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/stock?ids=${encodeURIComponent(productId)}`)
      .then((response) => response.json())
      .then((data: { stock?: Record<string, Stock> }) => {
        if (active) setStock({ for: productId, value: data.stock?.[productId] ?? null });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId]);

  const value = stock?.for === productId ? stock.value : null;
  if (!value) return null;
  const text =
    value.state === "in-stock"
      ? "In stock · ships from our factory"
      : value.state === "low"
        ? `Only ${value.onHand} left in stock`
        : "Made to order · we'll confirm the dispatch date";
  const colour = value.state === "made-to-order" ? brand.signalInk : brand.forest;
  return (
    <Box component="p" role="status" sx={{ m: 0, mt: 1, display: "inline-flex", alignItems: "center", gap: 1, fontSize: 14, fontWeight: 600, color: colour }}>
      <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colour }} />
      {text}
    </Box>
  );
}
