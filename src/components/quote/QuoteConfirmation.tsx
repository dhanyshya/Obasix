"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "@/components/Link";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import { quoteTheme } from "./quoteTheme";

type ConfirmedQuote = {
  reference: string;
  boardType: string;
  dimensions: string;
  quantity: number;
  product: string;
  productId?: string;
  frame: string;
  colour: string;
  surface?: string;
  location?: string;
  features: string;
  accessories: string;
  branding: string;
  configurationSummary: string;
  lines: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    catalogueUnitPrice: number;
    detail: string;
  }[];
  catalogueListSubtotal: number;
  attachmentName: string | null;
};

export function QuoteConfirmation() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref") ?? "";
  const [quote, setQuote] = useState<ConfirmedQuote | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const missing = !reference || lookupFailed;

  useEffect(() => {
    if (!reference) return;
    let active = true;
    fetch(`/api/quotes/${encodeURIComponent(reference)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        return response.json() as Promise<{ quote: ConfirmedQuote }>;
      })
      .then((result) => {
        if (active) setQuote(result.quote);
      })
      .catch(() => {
        if (active) setLookupFailed(true);
      });
    return () => {
      active = false;
    };
  }, [reference]);

  if (missing) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, md: 4 }, borderRadius: "16px", borderColor: quoteTheme.line }}
      >
        <Typography variant="h5" component="p" sx={{ fontWeight: 600, color: quoteTheme.charcoal }}>
          We could not find that quote
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This reference was not found in the quote store. Please submit a new request and we will be in touch.
        </Typography>
        <Button component={Link} href="/quote" variant="contained" sx={{ mt: 3 }}>
          Request a quote
        </Button>
      </Paper>
    );
  }

  if (!quote) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, md: 4 }, borderRadius: "16px", borderColor: quoteTheme.line }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <CircularProgress size={18} sx={{ color: quoteTheme.forest }} />
          <Typography variant="body2" color="text.secondary">
            Checking your quote request…
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const product =
    (quote.productId ? getProductById(quote.productId) : undefined) ??
    (quote.lines[0]?.productId ? getProductById(quote.lines[0].productId) : undefined);
  const image = product?.images?.[0];

  const details: { label: string; value: string }[] = [
    { label: "Board type", value: quote.boardType || "—" },
    { label: "Dimensions", value: quote.dimensions || product?.sizes[0]?.label || "—" },
    { label: "Frame", value: quote.frame || "—" },
    { label: "Colour", value: quote.colour || "—" },
    { label: "Surface", value: quote.surface || "—" },
    { label: "Quantity", value: String(quote.quantity) },
  ];

  const extras = [
    quote.features ? { label: "Features", value: quote.features } : null,
    quote.accessories ? { label: "Accessories", value: quote.accessories } : null,
    quote.branding ? { label: "Logo / customization", value: quote.branding } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3.5, md: 5 },
        borderRadius: "16px",
        borderColor: quoteTheme.line,
        bgcolor: quoteTheme.white,
      }}
    >
      <Stack spacing={{ xs: 3, md: 3.5 }}>
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: quoteTheme.beige,
            color: quoteTheme.charcoal,
            border: `1px solid ${quoteTheme.line}`,
            borderRadius: "16px",
          }}
        >
          Demo mode — this request is saved locally for this storefront. No email was sent.
        </Alert>

        <Box sx={{ textAlign: "center" }}>
          <CheckCircleIcon
            aria-hidden
            sx={{ fontSize: { xs: 48, md: 58 }, color: quoteTheme.forest }}
          />
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              fontFamily: 'var(--font-display), var(--font-body), sans-serif',
              fontWeight: 600,
              fontSize: { xs: "1.6rem", md: "2.1rem" },
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: quoteTheme.charcoal,
            }}
          >
            Your Quote Request Has Been Submitted!
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              mx: "auto",
              maxWidth: 560,
              fontSize: { xs: 14, md: 15 },
              lineHeight: 1.7,
              color: quoteTheme.muted,
            }}
          >
            Thank you for sharing your requirements. Our team will contact you shortly with a
            personalised quotation.
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              mt: 2,
              px: 2,
              py: 1,
              borderRadius: "16px",
              bgcolor: "rgba(23, 77, 56, 0.08)",
              color: quoteTheme.forest,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Quote reference:&nbsp;<Box component="span">{quote.reference}</Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: quoteTheme.line }} />

        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: quoteTheme.forest,
            }}
          >
            Your selected board
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 2, sm: 2.5 }}
            sx={{ mt: 1.75, alignItems: { sm: "flex-start" } }}
          >
            <Box
              sx={{
                position: "relative",
                width: { xs: "100%", sm: 160 },
                flexShrink: 0,
                aspectRatio: "5 / 4",
                borderRadius: "16px",
                overflow: "hidden",
                bgcolor: quoteTheme.beige,
                border: `1px solid ${quoteTheme.line}`,
              }}
            >
              {image ? (
                <Image
                  src={image}
                  alt={product?.shortName ?? quote.product ?? "Selected OBASIX board"}
                  fill
                  className="object-contain p-3"
                  sizes="160px"
                />
              ) : null}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: 'var(--font-display), var(--font-body), sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: "1.15rem", md: "1.3rem" },
                  lineHeight: 1.3,
                  color: quoteTheme.charcoal,
                }}
              >
                {quote.product || product?.shortName || "Board configuration"}
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: 12.5, color: quoteTheme.muted }}>
                {product?.sku ?? quote.lines[0]?.sku ?? "SKU on request"}
              </Typography>

              <Box
                component="dl"
                sx={{
                  display: "grid",
                  mt: 1.75,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  columnGap: 3,
                  rowGap: 0.9,
                  m: 0,
                }}
              >
                {details.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1.5,
                      pb: 0.75,
                      borderBottom: `1px solid ${quoteTheme.line}`,
                    }}
                  >
                    <Typography component="dt" sx={{ fontSize: 12.5, color: quoteTheme.muted }}>
                      {item.label}
                    </Typography>
                    <Typography
                      component="dd"
                      sx={{ m: 0, fontSize: 13, fontWeight: 600, color: quoteTheme.charcoal, textAlign: "right" }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {extras.length > 0 ? (
                <Stack component="dl" spacing={0.75} sx={{ m: 0, mt: 1.5 }}>
                  {extras.map((item) => (
                    <Box key={item.label} sx={{ display: "flex", gap: 1.5 }}>
                      <Typography component="dt" sx={{ minWidth: 110, fontSize: 12.5, color: quoteTheme.muted }}>
                        {item.label}
                      </Typography>
                      <Typography component="dd" sx={{ m: 0, fontSize: 13, color: quoteTheme.charcoal, lineHeight: 1.5 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : null}

              {quote.configurationSummary ? (
                <Typography sx={{ mt: 1.5, fontSize: 12.5, color: quoteTheme.muted, lineHeight: 1.6 }}>
                  {quote.configurationSummary}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>

        {quote.lines.length > 0 ? (
          <>
            <Divider sx={{ borderColor: quoteTheme.line }} />
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: quoteTheme.forest,
                }}
              >
                Items in this request
              </Typography>
              <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: "none" }}>
                {quote.lines.map((line) => (
                  <Box
                    key={`${line.productId}-${line.detail}`}
                    component="li"
                    sx={{ py: 1, borderBottom: `1px solid ${quoteTheme.line}`, fontSize: 13.5, color: quoteTheme.charcoal }}
                  >
                    {line.name} · {line.sku} · qty {line.quantity}
                    {line.detail ? ` · ${line.detail}` : ""} · catalogue {formatPrice(line.catalogueUnitPrice)}
                  </Box>
                ))}
              </Box>
              <Typography sx={{ mt: 1.5, fontSize: 12.5, color: quoteTheme.muted }}>
                Catalogue list subtotal {formatPrice(quote.catalogueListSubtotal)}. This is not a quoted
                price.
              </Typography>
            </Box>
          </>
        ) : null}

        {quote.attachmentName ? (
          <Typography sx={{ fontSize: 12.5, color: quoteTheme.muted }}>
            Reference file recorded: {quote.attachmentName}. The file contents were not stored.
          </Typography>
        ) : null}

        <Divider sx={{ borderColor: quoteTheme.line }} />

        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderRadius: "16px",
            bgcolor: quoteTheme.ivory,
            border: `1px solid ${quoteTheme.line}`,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: quoteTheme.charcoal }}>
            Our team will contact you shortly.
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 13, color: quoteTheme.muted, lineHeight: 1.6 }}>
            If you need to add anything, reply to our team with your quote reference so we can match it
            to this request.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          useFlexGap
          sx={{ flexWrap: "wrap", justifyContent: "center" }}
        >
          <Button
            component={Link}
            href="/products"
            variant="contained"
            sx={{
              minWidth: 200,
              bgcolor: quoteTheme.forest,
              color: quoteTheme.white,
              fontWeight: 700,
              "&:hover": { bgcolor: quoteTheme.forestDeep },
            }}
          >
            Continue Shopping
          </Button>
          <Button
            component={Link}
            href="/quote"
            variant="outlined"
            sx={{
              borderColor: quoteTheme.oak,
              color: quoteTheme.charcoal,
              "&:hover": { borderColor: quoteTheme.forest, bgcolor: quoteTheme.beige },
            }}
          >
            Submit another request
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
