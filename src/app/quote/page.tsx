"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Link from "@/components/Link";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { quoteTheme } from "@/components/quote/quoteTheme";

function QuoteContent() {
  const searchParams = useSearchParams();
  return (
    <Box sx={{ bgcolor: quoteTheme.ivory, pb: { xs: 10, md: 8 } }}>
      <Box
        component="section"
        sx={{
          borderBottom: `1px solid ${quoteTheme.line}`,
          bgcolor: quoteTheme.ivory,
          pt: { xs: 4, md: 5.5 },
          pb: { xs: 4, md: 5 },
        }}
      >
        <Container sx={{ maxWidth: 1200 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14, color: quoteTheme.muted }} />}
            aria-label="Breadcrumb"
            sx={{
              mb: 2.5,
              "& .MuiBreadcrumbs-li": { fontSize: 13, color: quoteTheme.muted },
              "& a": { color: quoteTheme.forest, fontWeight: 600, textDecoration: "none" },
              "& a:hover": { textDecoration: "underline" },
            }}
          >
            <Link href="/">Home</Link>
            <Typography component="span" sx={{ fontSize: 13, color: quoteTheme.charcoal, fontWeight: 600 }}>
              Request a Quote
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="overline"
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.35,
              borderRadius: 0.5,
              bgcolor: "rgba(23, 77, 56, 0.08)",
              color: quoteTheme.forest,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            Custom quote
          </Typography>
          <Typography
            variant="h1"
            sx={{
              mt: 1.5,
              maxWidth: 720,
              fontSize: { xs: "1.85rem", md: "2.55rem" },
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: quoteTheme.charcoal,
            }}
          >
            Let&apos;s Create the Right Solution for Your Space
          </Typography>
          <Box
            aria-hidden
            sx={{
              mt: 2,
              width: 44,
              height: 3,
              borderRadius: 1,
              bgcolor: quoteTheme.forest,
            }}
          />
          <Typography
            sx={{
              mt: 2,
              maxWidth: 560,
              fontSize: { xs: 15, md: 16.5 },
              lineHeight: 1.7,
              color: quoteTheme.muted,
            }}
          >
            Share your board configuration and contact details. Our team will review your
            requirements and send you a personalised quotation.
          </Typography>
        </Container>
      </Box>

      <Container sx={{ maxWidth: 1200, py: { xs: 4, md: 5.5 } }}>
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
          <Container sx={{ maxWidth: 1200 }}>
            <Typography sx={{ color: quoteTheme.muted }}>Loading quote form...</Typography>
          </Container>
        </Box>
      }
    >
      <QuoteContent />
    </Suspense>
  );
}
