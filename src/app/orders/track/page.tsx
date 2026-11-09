import type { Metadata } from "next";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PurchaseSteps } from "@/components/checkout/PurchaseSteps";
import { TrackOrder } from "@/components/checkout/TrackOrder";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = {
  title: "Track order",
};

export default function TrackOrderPage() {
  return (
    <Box sx={{ bgcolor: brand.ivory }}>
      <PageMasthead
        code="Orders"
        title="Track Order"
        lede="Look up an order with its number and the email or phone from checkout. A number by itself is not enough."
        crumbs={[{ href: "/", label: "Home" }, { label: "Track order" }]}
        compact
      />
      <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 4 }, py: { xs: 4, md: 7 } }}>
        <PurchaseSteps current={3} />
        <Box sx={{ mt: 3, bgcolor: brand.white, borderTop: `6px solid ${brand.forest}`, p: { xs: 2.5, md: 4 } }}>
          <Suspense fallback={<Typography variant="body2" color="text.secondary">Loading tracking…</Typography>}>
            <TrackOrder />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
