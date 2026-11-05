"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { getAccessoryProducts, getProductById } from "@/data/catalogue";
import { CartItem } from "@/components/cart/CartItem";
import { RecommendationCard } from "@/components/product/RecommendationCard";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, itemCount } = useCart();
  const hasBoard = items.some((item) => {
    const p = getProductById(item.productId);
    return p && !["accessory", "desk-accessory"].includes(p.category);
  });
  const recommended = getAccessoryProducts()
    .filter((p) => p.category === "accessory" || p.category === "stand")
    .slice(0, 4);

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Box component="section" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", py: 6 }}>
        <Container>
          <Typography
            variant="overline"
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.35,
              borderRadius: 0.5,
              bgcolor: "primary.light",
              color: "primary.main",
            }}
          >
            Cart
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{ mt: 1, fontSize: { xs: 34, md: 46 }, color: "text.primary" }}
          >
            Your OBASIX Setup
          </Typography>
          <Box sx={{ width: 40, height: 3, borderRadius: 1, bgcolor: "primary.main", mt: 1.5 }} />
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 672 }}>
            Review configured boards and complete your setup with matching accessories.
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 5 }}>
        <Grid container spacing={{ xs: 4, lg: 5 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            {items.length === 0 ? (
              <Box
                sx={{
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: "background.paper",
                  px: 3,
                  py: 8,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6" component="p">
                  Your setup is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Explore whiteboards or open the customizer to start building.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center", mt: 3 }}>
                  <Button component={Link} href="/products" variant="outlined">
                    Explore Products
                  </Button>
                  <Button component={Link} href="/customize" variant="contained">
                    Customize
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </Box>
            )}

            {(hasBoard || items.length === 0) && (
              <Box component="section" sx={{ pt: 5 }}>
                <Typography variant="h5" component="h2">
                  Complete Your Setup
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Recommended: Magnetic Buttons · Marker Holder · Duster · Stand
                </Typography>
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {recommended.map((item) => (
                    <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                      <RecommendationCard item={item} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              component="aside"
              variant="outlined"
              sx={{ p: 3, borderRadius: 1.5, position: { lg: "sticky" }, top: { lg: 96 } }}
            >
              <Typography variant="h6" component="h2">
                Setup summary
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Items
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {itemCount}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
                    {formatPrice(subtotal)}
                  </Typography>
                </Stack>
              </Stack>
              <Stack spacing={1} sx={{ mt: 3 }}>
                {items.length === 0 ? (
                  <Button variant="contained" fullWidth disabled>
                    Proceed to Checkout
                  </Button>
                ) : (
                  <Button component={Link} href="/checkout" variant="contained" fullWidth>
                    Proceed to Checkout
                  </Button>
                )}
                <Button component={Link} href="/quote" variant="outlined" fullWidth>
                  Request Custom Quote
                </Button>
                <Button component={Link} href="/products" color="inherit" fullWidth>
                  Continue Shopping
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
