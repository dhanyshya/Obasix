"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import Link from "@/components/Link";
import { OrderPlacedCelebration } from "@/components/checkout/OrderPlacedCelebration";
import { findDemoOrder, type DemoOrder } from "@/lib/commerce/demo-orders";
import { brandTokens } from "@/theme/brandTokens";

export function ConfirmationExperience() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const local = orderId.startsWith("OBX-DEMO-") ? findDemoOrder(orderId) : undefined;
    if (local) {
      setOrder(local);
      return;
    }
    if (!orderId.startsWith("OBX-DEMO-")) {
      setOrder(null);
      return;
    }
    // Another tab or device: the server only returns the order to the signed-in account that placed it.
    fetch(`/api/commerce/orders?id=${encodeURIComponent(orderId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { order?: DemoOrder } | null) => active && setOrder(body?.order ?? null))
      .catch(() => active && setOrder(null));
    return () => {
      active = false;
    };
  }, [orderId]);

  if (order === undefined) {
    return <Box sx={{ minHeight: "50vh" }} aria-busy="true" />;
  }

  if (order) {
    return <OrderPlacedCelebration order={order} />;
  }

  return (
    <Box
      component="section"
      sx={{ bgcolor: "background.default", display: "flex", alignItems: "center" }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 8, md: 12 }, textAlign: "center" }}>
        <EventBusyOutlinedIcon sx={{ fontSize: 56, color: brandTokens.muted }} />
        <Typography
          component="h1"
          sx={{
            mt: 2.5,
            fontFamily: 'var(--font-display), Helvetica Neue, sans-serif',
            fontWeight: 500,
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            letterSpacing: "-0.02em",
            color: brandTokens.charcoal,
          }}
        >
          {orderId ? "This reference is not confirmed" : "No order is confirmed"}
        </Typography>
        <Typography
          sx={{
            mt: 1.5,
            mx: "auto",
            maxWidth: 480,
            color: brandTokens.body,
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          {orderId
            ? "This reference was not found for this browser or account. Use Track Order with the email or phone from checkout."
            : "This page never treats an order number in the address as proof of payment. The cart stays unchanged until the order service confirms an order."}
        </Typography>
        <Box
          sx={{
            mt: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            justifyContent: "center",
          }}
        >
          <Button component={Link} href="/checkout" variant="contained" sx={{ height: 48, px: 3.5 }}>
            Return to checkout
          </Button>
          <Button component={Link} href="/orders/track" variant="outlined" sx={{ height: 48, px: 3.5 }}>
            Track Order
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
