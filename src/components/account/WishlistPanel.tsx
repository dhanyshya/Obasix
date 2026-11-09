"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/Link";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/context/WishlistContext";

export function WishlistPanel() {
  const { ids, toggle } = useWishlist();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/account")
      .then((response) => response.json())
      .then(() => setLoaded(true));
  }, []);

  return (
    <Box>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>
        Wishlist
      </Typography>
      {!loaded ? (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Loading saved products...
        </Typography>
      ) : null}
      {loaded && ids.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No saved products yet.
        </Typography>
      ) : null}
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {ids.map((id) => {
          const product = getProductById(id);
          if (!product) return null;
          return (
            <Paper key={id} variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
              <Box>
                <MuiLink component={NextLink} href={`/products/${product.id}`} underline="always" variant="body2" sx={{ fontWeight: 600 }}>
                  {product.shortName}
                </MuiLink>
                <Typography variant="body2">{formatPrice(product.price)}</Typography>
              </Box>
              <Button size="small" color="inherit" onClick={() => toggle(id)}>
                Remove
              </Button>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
