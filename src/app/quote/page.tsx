"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { quoteTheme } from "@/components/quote/quoteTheme";

function QuoteContent() {
  const searchParams = useSearchParams();
  return (
    <Box sx={{ bgcolor: quoteTheme.ivory, pb: { xs: 10, md: 8 } }}>
      <PageMasthead
        code="Custom quote"
        title="Let's create the right solution for your space"
        lede="Share your board configuration and contact details. Our team will review your requirements and send you a personalised quotation."
        crumbs={[{ href: "/", label: "Home" }, { label: "Request a Quote" }]}
      />

      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <QuoteForm
          initial={{
            boardType: searchParams.get("boardType") ?? "",
            customSize: searchParams.get("customSize") ?? "",
            quantity: searchParams.get("quantity") ?? "",
            colour: searchParams.get("colour") ?? "",
            surface: searchParams.get("surface") ?? "",
            features: searchParams.get("features") ?? "",
            branding: searchParams.get("branding") ?? "",
            configurationSummary: searchParams.get("config") ?? "",
            requirements: searchParams.get("notes") ?? "",
            product: searchParams.get("product") ?? "",
            productId: searchParams.get("productId") ?? "",
            frame: searchParams.get("frame") ?? "",
            accessories: searchParams.get("accessories") ?? "",
            dimensionsRequired:
              searchParams.get("custom") === "1" || searchParams.get("combination") === "1",
          }}
        />
      </Container>
    </Box>
  );
}

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ bgcolor: quoteTheme.ivory, py: 10 }}>
          <Container>
            <Typography sx={{ color: quoteTheme.muted }}>Loading quote form...</Typography>
          </Container>
        </Box>
      }
    >
      <QuoteContent />
    </Suspense>
  );
}
