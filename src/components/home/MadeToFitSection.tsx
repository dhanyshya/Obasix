"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getBoardProducts, getProductById } from "@/data/catalogue";
import { buildCustomizeHref, formatPrice } from "@/lib/format";

const steps = [
  "Select a board model",
  "Choose the board size",
  "Select frame or finish where supported",
  "Choose colours and accessories",
  "Add logo options where supported",
  "Preview the configured board",
  "Review price when listed",
  "Add to cart or request a quote",
];

export function MadeToFitSection() {
  const customizable = useMemo(
    () => getBoardProducts().filter((product) => product.customizable).slice(0, 4),
    [],
  );
  const [selectedId, setSelectedId] = useState(customizable[0]?.id ?? "");
  const product = getProductById(selectedId) ?? customizable[0];
  const size = product?.sizes[0];

  if (!product) return null;

  return (
    <Box component="section" sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.default" }}>
      <Container>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 5, lg: 8 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.05fr) minmax(0,0.95fr)" },
            alignItems: "center",
          }}
        >
          <Reveal>
            <Box
              sx={{
                position: "relative",
                aspectRatio: "5 / 4",
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
              }}
            >
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1200px) 100vw, 50vw"
                />
              ) : null}
              <Box
                sx={{
                  position: "absolute",
                  left: 16,
                  bottom: 16,
                  right: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: "rgba(255,255,255,0.92)",
                  px: 1.5,
                  py: 1.25,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Preview
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {product.shortName}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, alignSelf: "end" }}>
                  {product.price > 0 ? formatPrice(product.price) : "Quote"}
                </Typography>
              </Box>
            </Box>
          </Reveal>

          <Box>
            <Reveal>
              <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
                Customization
              </Typography>
              <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "2rem", md: "2.75rem" }, maxWidth: 420 }}>
                Made to Fit Your Space.
              </Typography>
              <Typography sx={{ mt: 2, color: "text.secondary", maxWidth: 440 }}>
                Configure a real catalogue board — size, frame, colour and supported accessories — then add to cart or
                request a quote when pricing requires confirmation.
              </Typography>
            </Reveal>

            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 3, flexWrap: "wrap" }}>
              {customizable.map((item) => {
                const active = item.id === product.id;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={active ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setSelectedId(item.id)}
                    sx={{ borderRadius: "16px" }}
                  >
                    {item.shortName}
                  </Button>
                );
              })}
            </Stack>

            <Box
              component="ol"
              sx={{
                mt: 3.5,
                m: 0,
                pl: 0,
                listStyle: "none",
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              {steps.map((step, index) => (
                <Typography
                  key={step}
                  component="li"
                  variant="body2"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr",
                    gap: 1,
                    color: "text.secondary",
                    py: 0.5,
                  }}
                >
                  <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
                    {String(index + 1).padStart(2, "0")}
                  </Box>
                  <span>{step}</span>
                </Typography>
              ))}
            </Box>

            <Typography variant="body2" sx={{ mt: 2.5, color: "text.secondary" }}>
              Active model: <strong>{product.shortName}</strong>
              {size ? ` · Starting size ${size.label}` : null}
              {product.frame ? ` · ${product.frame.replace(/-/g, " ")} frame` : null}
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5 }}>
              <Button
                component={Link}
                href={buildCustomizeHref({ productId: product.id })}
                variant="contained"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
              >
                Customize this board
              </Button>
              <Button component={Link} href={`/products/${product.id}`} variant="outlined">
                Product details
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
