"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { getAccessoryProducts, getProductById } from "@/data/catalogue";
import { CartItem } from "@/components/cart/CartItem";
import { RecommendationCard } from "@/components/product/RecommendationCard";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

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
    <Box sx={{ bgcolor: brand.ivory }}>
      <PageMasthead
        code="Cart"
        title="Your OBASIX setup"
        lede="Review your configured boards, adjust quantities and add the accessories that go with them."
        crumbs={[{ href: "/", label: "Home" }, { label: "Cart" }]}
        compact
      />

      <Box
        sx={{
          ...pageMax,
          ...pagePad,
          py: { xs: 4, md: 7 },
          display: "grid",
          gap: { xs: 4, lg: 6 },
          gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0, 1fr) 380px" },
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {items.length === 0 ? (
            <Box sx={{ bgcolor: brand.white, borderTop: `6px solid ${brand.forest}`, px: { xs: 3, md: 6 }, py: { xs: 6, md: 8 } }}>
              <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>00 ITEMS</Typography>
              <Typography component="p" sx={{ ...signType.title, fontSize: { xs: "1.9rem", md: "2.4rem" }, mt: 1, color: brand.charcoal }}>
                Your setup is empty
              </Typography>
              <Typography sx={{ mt: 1.5, maxWidth: 460 }}>
                Browse the collections, or design a board to your exact size, frame and finish.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 3.5 }}>
                <Button component={Link} href="/products" variant="contained" endIcon={<SignArrow size={18} />}>
                  Explore Products
                </Button>
                <Button component={Link} href="/customize" variant="outlined">
                  Customize
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ bgcolor: brand.white, px: { xs: 2, md: 3.5 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: 2.25, borderBottom: `2px solid ${brand.charcoal}` }}>
                <Typography component="h2" sx={{ ...signType.plate, fontSize: 20, color: brand.charcoal }}>
                  Items
                </Typography>
                <Typography sx={{ ...signType.code, fontSize: 13, color: brand.muted }}>
                  {String(itemCount).padStart(2, "0")} {itemCount === 1 ? "PIECE" : "PIECES"}
                </Typography>
              </Box>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </Box>
          )}

          {(hasBoard || items.length === 0) && (
            <Box component="section" sx={{ pt: { xs: 5, md: 7 } }}>
              <Typography component="h2" sx={{ ...signType.plate, fontSize: { xs: 24, md: 28 }, color: brand.charcoal }}>
                Complete your setup
              </Typography>
              <Typography sx={{ mt: 0.75, color: brand.body }}>Stands and accessories that work with OBASIX boards.</Typography>
              <Box sx={{ mt: 2.5, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                {recommended.map((item) => (
                  <RecommendationCard key={item.id} item={item} />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        <Box component="aside" aria-label="Setup summary" sx={{ position: { lg: "sticky" }, top: { lg: 112 }, bgcolor: brand.forestDeep, color: brand.white }}>
          <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
            <Typography component="h2" sx={{ ...signType.plate, fontSize: 22, color: brand.white }}>
              Setup summary
            </Typography>
            <Box component="dl" sx={{ m: 0, mt: 2.5, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1.25, "& dt": { color: "rgba(255,255,255,0.75)", fontSize: 14.5 }, "& dd": { m: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" } }}>
              <dt>Items</dt>
              <dd>{itemCount}</dd>
              <dt>Delivery</dt>
              <dd style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>Confirmed at checkout</dd>
            </Box>
            <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>Subtotal</Typography>
              <Typography component="p" sx={{ ...signType.plate, fontSize: 32, fontVariantNumeric: "tabular-nums", color: brand.white }}>
                {formatPrice(subtotal)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ px: 3, pb: 3, display: "grid", gap: 1.25 }}>
            {items.length === 0 ? (
              <Button variant="contained" fullWidth disabled size="large">
                Proceed to Checkout
              </Button>
            ) : (
              <Button component={Link} href="/checkout" variant="contained" fullWidth size="large" endIcon={<SignArrow size={18} />}>
                Proceed to Checkout
              </Button>
            )}
            <Button
              component={Link}
              href="/quote"
              variant="outlined"
              fullWidth
              sx={{ "&&": { color: brand.white, borderColor: "rgba(255,255,255,0.5)", bgcolor: "transparent" }, "&&:hover": { borderColor: brand.white, bgcolor: "rgba(255,255,255,0.08)" } }}
            >
              Request Custom Quote
            </Button>
            <Box component={Link} href="/products" sx={{ justifySelf: "center", mt: 0.5, py: 1, color: "#FFC59E", fontWeight: 600, fontSize: 14.5, textDecoration: "underline", textUnderlineOffset: 4 }}>
              Continue shopping
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
