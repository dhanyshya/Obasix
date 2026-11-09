"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { SignArrow, StripeSpine, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box sx={{ bgcolor: brand.forestDeep, color: brand.white }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 7, md: 12 } }}>
        <Typography sx={{ ...signType.code, fontSize: 14, color: "#FFC59E" }}>SOMETHING WENT WRONG</Typography>
        <Typography component="h1" sx={{ ...signType.title, mt: 2, color: brand.white, maxWidth: "16ch" }}>
          This page didn&apos;t load.
        </Typography>
        <Typography sx={{ mt: 2.5, maxWidth: 520, color: "rgba(255,255,255,0.82)", fontSize: 17 }}>
          Nothing in your cart has changed. Try again, or go back to the collections.
          {error.digest ? ` Reference: ${error.digest}.` : ""}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
          <Button variant="contained" onClick={reset}>
            Try again
          </Button>
          <Button component={Link} href="/products" variant="outlined" endIcon={<SignArrow size={18} />} sx={{ "&&": { color: brand.white, borderColor: "rgba(255,255,255,0.5)", bgcolor: "transparent" } }}>
            Browse products
          </Button>
        </Box>
      </Box>
      <StripeSpine height={4} />
    </Box>
  );
}
