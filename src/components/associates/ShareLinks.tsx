"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { brandTokens as brand } from "@/theme/brandTokens";

const destinations = [
  { path: "/", label: "OBASIX home page" },
  { path: "/signage/design", label: "Sign studio" },
  { path: "/customize", label: "Board customizer" },
  { path: "/products", label: "Board collections" },
  { path: "/quote", label: "Quote request" },
];

/** Ready-made referral links. Each one sets the associate's referral for 30 days. */
export function ShareLinks({ code, origin }: { code: string; origin: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
      {destinations.map((destination) => {
        const url = `${origin}${destination.path}?ref=${code}`;
        return (
          <Box
            component="li"
            key={destination.path}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.25,
              pl: 2,
              border: `1px solid ${brand.line}`,
              borderRadius: "12px",
              bgcolor: brand.white,
              minWidth: 0,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{destination.label}</Typography>
              <Typography sx={{ fontSize: 13, color: brand.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" color="inherit" startIcon={<ContentCopyIcon fontSize="small" />} onClick={() => copy(url)} sx={{ flexShrink: 0 }}>
              {copied === url ? "Copied" : "Copy"}
            </Button>
          </Box>
        );
      })}
    </Box>
  );
}
