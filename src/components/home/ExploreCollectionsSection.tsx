"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { products } from "@/data/catalogue";
import { getProductImages, images } from "@/data/images";
import { home } from "./homeRhythm";

type Collection = { id: string; name: string; image: string; href: string };

function buildCollections(): Collection[] {
  const items: Collection[] = [];
  if (products.some((p) => p.category === "magnetic-whiteboard")) {
    items.push({
      id: "magnetic",
      name: "Magnetic Whiteboards",
      image: images.magneticWhiteboard,
      href: "/products?category=magnetic-whiteboard",
    });
  }
  if (products.some((p) => p.category === "non-magnetic-whiteboard")) {
    items.push({
      id: "non-magnetic",
      name: "Non-Magnetic Whiteboards",
      image: images.nonMagneticWhiteboard,
      href: "/products?category=non-magnetic-whiteboard",
    });
  }
  if (products.some((p) => p.surface === "ceramic-steel" || p.id === "scuv90120")) {
    items.push({
      id: "glass",
      name: "Glass Boards",
      image: getProductImages("scuv90120", [images.heroWhiteboard])[0],
      href: "/products?surface=ceramic-steel",
    });
  }
  if (products.some((p) => p.category === "notice-board" || p.category === "pin-up-board")) {
    items.push({
      id: "notice-pinup",
      name: "Notice & Pin-up Boards",
      image: images.noticeBoard,
      href: "/products?family=notice-pinup",
    });
  }
  if (products.some((p) => p.category === "chalk-board")) {
    items.push({
      id: "chalk",
      name: "Chalk Boards",
      image: images.chalkBoard,
      href: "/products?category=chalk-board",
    });
  }
  if (products.some((p) => p.category === "combination-board")) {
    items.push({
      id: "combination",
      name: "Combination Boards",
      image: images.combinationBoard,
      href: "/products?category=combination-board",
    });
  }
  if (products.some((p) => p.category === "stand")) {
    items.push({
      id: "stands",
      name: "Whiteboard Stands",
      image: images.whiteboardStand,
      href: "/products?category=stand",
    });
  }
  return items;
}

export function ExploreCollectionsSection() {
  const collections = buildCollections();

  return (
    <Box
      component="section"
      aria-labelledby="collections-heading"
      sx={{
        py: home.sectionPy,
        bgcolor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: { xs: 3.5, md: 4 },
            alignItems: { sm: "flex-end" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography id="collections-heading" variant="h2" sx={home.heading}>
              Board Collections
            </Typography>
            <Typography sx={home.lede}>Purpose-built surfaces for every workspace.</Typography>
          </Box>
          <Button
            component={Link}
            href="/products"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            sx={{ ...home.linkBtn, alignSelf: { xs: "flex-start", sm: "auto" } }}
          >
            View all
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.75, md: 2 },
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "repeat(3, 1fr)",
              lg: `repeat(${Math.min(collections.length, 7)}, 1fr)`,
            },
            alignItems: "stretch",
          }}
        >
          {collections.map((item) => (
            <Box
              key={item.id}
              component={Link}
              href={item.href}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                textDecoration: "none",
                color: "inherit",
                border: `1px solid ${home.line}`,
                bgcolor: home.white,
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  borderColor: home.green,
                  boxShadow: "0 6px 20px rgba(34,41,35,0.05)",
                },
                "&:hover .col-img": { transform: "scale(1.03)" },
                "&:hover .col-name": { color: home.green },
                "&:focus-visible": {
                  outline: `2px solid ${home.green}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  bgcolor: home.surface,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="col-img object-contain"
                  sizes="(max-width: 900px) 50vw, 14vw"
                  style={{ padding: 14, transition: "transform 0.4s ease" }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 0.75,
                  px: 1.25,
                  py: 1.35,
                  mt: "auto",
                  minHeight: 56,
                }}
              >
                <Typography
                  className="col-name"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: 12.5, md: 13 },
                    lineHeight: 1.35,
                    color: home.charcoal,
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.name}
                </Typography>
                <ArrowForwardIcon
                  sx={{ fontSize: 14, color: home.muted, mt: 0.25, flexShrink: 0 }}
                  aria-hidden
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
