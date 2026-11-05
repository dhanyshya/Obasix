"use client";

import { useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/context/CartContext";
import {
  canCustomizeProduct,
  defaultCartConfiguration,
  productCustomizeHref,
} from "@/lib/productActions";
import {
  getProductById,
  getProductCategoryLabel,
} from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { home } from "../homeRhythm";
import { Eyebrow, SectionHeading, Shell } from "./shared";

const selectionIds = ["smwbpcb90120", "cmwb90120", "pwmwb90120", "scuv90120"];

const selection = selectionIds
  .map((id) => getProductById(id))
  .filter((product): product is Product => Boolean(product));

export function SignatureSelection() {
  const { addItem } = useCart();
  const [activeId, setActiveId] = useState(selection[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const active = selection.find((product) => product.id === activeId) ?? selection[0];

  if (!active) return null;

  const activeIndex = selection.findIndex((product) => product.id === active.id) + 1;

  const handleAdd = () => {
    addItem(active.id, defaultCartConfiguration(active), 1);
    setAdded(true);
  };

  return (
    <Box
      component="section"
      aria-labelledby="signature-heading"
      sx={{
        bgcolor: home.ivory,
        py: home.sectionPy,
        borderTop: `1px solid ${home.line}`,
        borderBottom: `1px solid ${home.line}`,
      }}
    >
      <Shell>
        <SectionHeading
          eyebrow="The signature selection"
          title={
            <Box component="span" id="signature-heading">
              Four boards. One clear point of view.
            </Box>
          }
          lede="A small, considered edit of the pieces that define an OBASIX room — from everyday essentials to ceramic steel for the busiest walls."
          action={{ href: "/products", label: "Browse the full range" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            gap: { xs: 4, md: 5 },
            alignItems: "stretch",
          }}
        >
          <Reveal sx={{ gridColumn: { md: "1 / 8" } }}>
            <Box sx={{ bgcolor: home.white, border: `1px solid ${home.line}` }}>
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: { xs: "4 / 3", md: "1.14 / 1" },
                  bgcolor: "#F1EEE7",
                  overflow: "hidden",
                }}
              >
                <Image
                  key={active.id}
                  src={active.images[0] ?? imagesFallback}
                  alt={active.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                  style={{ objectFit: "contain", padding: "clamp(28px, 5vw, 72px)" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: { xs: 16, md: 24 },
                    top: { xs: 16, md: 24 },
                    ...home.softLabel,
                    bgcolor: "rgba(255,255,255,0.88)",
                  }}
                >
                  {String(activeIndex).padStart(2, "0")} / {String(selection.length).padStart(2, "0")}
                </Box>
                {active.customizable ? (
                  <Box
                    sx={{
                      position: "absolute",
                      right: { xs: 16, md: 24 },
                      top: { xs: 16, md: 24 },
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.17em",
                      textTransform: "uppercase",
                      color: home.forest,
                    }}
                  >
                    Made to measure
                  </Box>
                ) : null}
              </Box>

              <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 2, sm: 3 }}
                  sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
                >
                  <Box>
                    <Typography sx={{ ...home.small, color: home.forest }}>
                      {getProductCategoryLabel(active)}
                    </Typography>
                    <Typography
                      component="h3"
                      sx={{
                        mt: 1,
                        fontFamily: "var(--font-display), Georgia, serif",
                        fontSize: { xs: "2rem", md: "2.5rem" },
                        lineHeight: 1.02,
                        letterSpacing: "-0.025em",
                        color: home.charcoal,
                      }}
                    >
                      {active.shortName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: { sm: "right" } }}>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-display), Georgia, serif",
                        fontSize: 26,
                        color: home.charcoal,
                      }}
                    >
                      {active.price > 0 ? formatPrice(active.price) : "On request"}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 11, color: home.body }}>
                      Inclusive of standard frame
                    </Typography>
                  </Box>
                </Stack>

                <Typography sx={{ ...home.lede, mt: 2.5, maxWidth: 560 }}>
                  {active.shortDescription}
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  sx={{ mt: 3.5 }}
                >
                  <Button
                    onClick={handleAdd}
                    startIcon={added ? <CheckIcon sx={{ fontSize: 17 }} /> : <AddIcon sx={{ fontSize: 17 }} />}
                    sx={home.primaryBtn}
                  >
                    {added ? "Added to bag" : "Add to bag"}
                  </Button>
                  {canCustomizeProduct(active) ? (
                    <Button
                      component={Link}
                      href={productCustomizeHref(active)}
                      endIcon={<ArrowOutwardIcon sx={{ fontSize: 16 }} />}
                      sx={home.secondaryBtn}
                    >
                      Configure
                    </Button>
                  ) : null}
                  <Button
                    component={Link}
                    href={`/products/${active.id}`}
                    endIcon={<ArrowOutwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      ...home.linkBtn,
                      alignSelf: { xs: "flex-start", sm: "center" },
                      ml: { sm: 1 },
                    }}
                  >
                    View details
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Reveal>

          <Box sx={{ gridColumn: { md: "8 / 13" }, display: "flex", flexDirection: "column" }}>
            <Eyebrow>Explore the edit</Eyebrow>
            <Box sx={{ mt: { xs: 2.5, md: 3 }, borderTop: `1px solid ${home.line}` }}>
              {selection.map((product, index) => {
                const isActive = product.id === active.id;
                return (
                  <Box
                    key={product.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      setActiveId(product.id);
                      setAdded(false);
                    }}
                    aria-pressed={isActive}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr auto",
                      alignItems: "center",
                      gap: 1.5,
                      width: "100%",
                      minHeight: 82,
                      py: 2,
                      px: { xs: 0, md: 1 },
                      border: 0,
                      borderBottom: `1px solid ${home.line}`,
                      bgcolor: "transparent",
                      color: isActive ? home.forest : home.charcoal,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "color 0.2s ease, padding 0.2s ease",
                      "&:hover": { color: home.forest, pl: { md: 1.5 } },
                      "&:focus-visible": {
                        outline: `2px solid ${home.forest}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "var(--font-display), Georgia, serif",
                        fontSize: 18,
                        color: isActive ? home.forest : home.oak,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </Typography>
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: "var(--font-display), Georgia, serif",
                          fontSize: { xs: 20, md: 23 },
                          lineHeight: 1.1,
                        }}
                      >
                        {product.name}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: 11.5, color: home.body }}>
                        {product.price > 0 ? `From ${formatPrice(product.price)}` : "Price on request"}
                      </Typography>
                    </Box>
                    <ArrowOutwardIcon
                      sx={{
                        fontSize: 19,
                        opacity: isActive ? 1 : 0.35,
                        transition: "opacity 0.2s ease",
                      }}
                      aria-hidden
                    />
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                mt: { xs: 3, md: "auto" },
                pt: { md: 4 },
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={{ ...home.small, color: home.forest }}>Surfaces</Typography>
                <Typography sx={{ mt: 0.75, fontSize: 13, color: home.body, lineHeight: 1.65 }}>
                  Resin-coated, melamine and ceramic steel.
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ ...home.small, color: home.forest }}>Frames</Typography>
                <Typography sx={{ mt: 0.75, fontSize: 13, color: home.body, lineHeight: 1.65 }}>
                  Aluminium and natural pine, six finishes.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}

const imagesFallback = "/hero-workspace-photo.jpg";
