"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { MAX_COMPARE, useCompare } from "@/context/CompareContext";

export function CompareToggle({ productId, size = "small" }: { productId: string; size?: "small" | "medium" }) {
  const { has, toggle } = useCompare();
  const [note, setNote] = useState("");
  const active = has(productId);
  return (
    <Button
      size={size}
      color={active ? "primary" : "inherit"}
      variant={active ? "outlined" : "text"}
      startIcon={<CompareArrowsIcon fontSize="small" />}
      aria-pressed={active}
      onClick={() => {
        const result = toggle(productId);
        setNote(result === "full" ? `Compare up to ${MAX_COMPARE}` : "");
      }}
      sx={{ minHeight: 36, fontSize: 13 }}
    >
      {note || (active ? "Comparing" : "Compare")}
    </Button>
  );
}
