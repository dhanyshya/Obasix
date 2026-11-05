import type { Metadata } from "next";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { PurchaseSteps } from "@/components/checkout/PurchaseSteps";
import { TrackOrder } from "@/components/checkout/TrackOrder";

export const metadata: Metadata = {
  title: "Track order",
};

export default function TrackOrderPage() {
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Box component="section" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", py: { xs: 4, md: 5 } }}>
        <Container maxWidth="sm">
          <Typography variant="overline" color="primary">
            Orders
          </Typography>
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 34, md: 46 } }}>
            Track Order
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Look up an order with its number and the email or phone from checkout. A number by itself is not enough.
          </Typography>
          <PurchaseSteps current={3} />
        </Container>
      </Box>
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <Suspense fallback={<Typography variant="body2" color="text.secondary">Loading tracking…</Typography>}>
          <TrackOrder />
        </Suspense>
      </Container>
    </Box>
  );
}
