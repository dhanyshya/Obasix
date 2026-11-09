"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { frames, getBoardProducts, getProductById } from "@/data/catalogue";
import { ProductActions } from "@/components/product/ProductActions";
import { formatPrice } from "@/lib/format";
import { home } from "./homeRhythm";

/** Customization showcase — product selection carries into /customize. */
export function DesignYourBoardSection() {
  const customizable = useMemo(
    () => getBoardProducts().filter((product) => product.customizable).slice(0, 4),
    [],
  );
  const [selectedId, setSelectedId] = useState(customizable[0]?.id ?? "");
  const product = getProductById(selectedId) ?? customizable[0];

  if (!product) return null;

  const frameName = frames.find((frame) => frame.id === product.frame)?.name ?? product.frame;
  const sizeLabel = product.sizes[0]?.label;

  return (
    <Box
      component="section"
      aria-labelledby="design-heading"
      sx={{
        py: home.sectionPy,
        bgcolor: "#FFFFFF",
        color: home.charcoal,
        borderTop: `1px solid ${home.line}`,
        borderBottom: `1px solid ${home.line}`,
      }}
    >
      <Container>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, lg: 6 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)" },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              id="design-heading"
              variant="h2"
              sx={{ ...home.heading, maxWidth: "12ch" }}
            >
              Design Your Board
            </Typography>
            <Typography sx={{ ...home.lede, mt: 1.5, maxWidth: 380 }}>
              Choose a board, then continue into the configurator with that product selected.
            </Typography>

            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 3, flexWrap: "wrap" }}>
              {customizable.map((item) => {
                const active = item.id === product.id;
                return (
                  <Button
                    key={item.id}
                    size="small"
                    onClick={() => setSelectedId(item.id)}
                    aria-pressed={active}
                    sx={{
                      borderRadius: 0,
                      border: "1px solid",
                      borderColor: active ? home.green : home.line,
                      color: active ? home.green : home.muted,
                      bgcolor: active ? "rgba(21,92,64,0.06)" : "transparent",
                      fontSize: 12,
                      px: 1.25,
                      minHeight: 34,
                      "&:hover": {
                        borderColor: home.green,
                        color: home.green,
                        bgcolor: "rgba(21,92,64,0.04)",
                      },
                    }}
                  >
                    {item.shortName}
                  </Button>
                );
              })}
            </Stack>

            <Typography sx={{ mt: 2.5, fontSize: 13.5, color: home.muted }}>
              {[sizeLabel, frameName].filter(Boolean).join(" · ")}
              {product.price > 0 ? ` · from ${formatPrice(product.price)}` : ""}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <ProductActions product={product} variant="detail" />
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              aspectRatio: "5 / 4",
              bgcolor: "#FFFFFF",
              border: `1px solid ${home.line}`,
              boxShadow: "0 8px 24px rgba(34,41,35,0.04)",
              overflow: "hidden",
            }}
          >
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={`${product.name} preview`}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 48vw"
                style={{ padding: "10% 12%" }}
              />
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
