"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { accessoryImages, images } from "@/data/images";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "./SectionHeading";

const accessories = [
  {
    name: "Magnets",
    image: accessoryImages.magnets,
    href: "/products?q=magnet",
  },
  {
    name: "Holders",
    image: accessoryImages.markerHolder,
    href: "/products?q=holder",
  },
  {
    name: "Stands",
    image: images.whiteboardStand,
    href: "/products?category=stand",
  },
  {
    name: "Desk accessories",
    image: accessoryImages.footRest,
    href: "/products?category=desk-accessory",
  },
  {
    name: "Board accessories",
    image: images.markers,
    href: "/products?category=accessory",
  },
];

export function AccessoriesSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || window.innerWidth >= 900) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: rail.scrollLeft,
    };
    rail.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    rail.scrollLeft = drag.current.scrollLeft - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  return (
    <Box
      component="section"
      sx={{ borderBlock: 1, borderColor: "divider", bgcolor: "background.paper", py: { xs: 10, md: 14 } }}
    >
      <Container>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 5, alignItems: { md: "flex-end" }, justifyContent: { md: "space-between" } }}
        >
          <SectionHeading
            eyebrow="Accessories"
            title="Everything around the board."
            description="Magnets, holders, stands and desk pieces from the OBASIX catalogue."
          />
          <Reveal delay={180}>
            <Button
              component={Link}
              href="/products?category=accessory"
              color="primary"
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{ px: 0, fontSize: 14 }}
            >
              Shop accessories
            </Button>
          </Reveal>
        </Stack>

        <Reveal delay={100} variant="fade">
          <Box
            ref={railRef}
            className="scrollbar-thin"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            sx={{
              display: { xs: "flex", md: "grid" },
              gridTemplateColumns: { md: "repeat(5, minmax(0, 1fr))" },
              gap: { xs: 1.5, md: 0 },
              mx: { xs: -2.5, md: 0 },
              px: { xs: 2.5, md: 0 },
              pb: { xs: 1, md: 0 },
              overflowX: { xs: "auto", md: "visible" },
              cursor: { xs: "grab", md: "default" },
              "&:active": { cursor: { xs: "grabbing", md: "default" } },
              border: { md: 1 },
              borderColor: { md: "divider" },
            }}
          >
            {accessories.map((item, index) => (
              <Box
                key={item.name}
                component={Link}
                href={item.href}
                draggable={false}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                  width: { xs: "70vw", md: "auto" },
                  maxWidth: { xs: 260, md: "none" },
                  border: { xs: 1, md: 0 },
                  borderColor: "divider",
                  borderLeft: { md: index > 0 ? 1 : 0 },
                  borderLeftColor: { md: "divider" },
                  transition: "all 0.3s ease",
                  "&:hover .accessory-img": { transform: "scale(1.05)" },
                  "&:hover .accessory-arrow": { opacity: 1, transform: "translateX(2px)" },
                }}
              >
                <Box sx={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", bgcolor: "background.default" }}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="accessory-img object-contain p-8 transition duration-500 ease-out"
                    sizes="220px"
                  />
                </Box>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", justifyContent: "space-between", borderTop: 1, borderColor: "divider", px: 2, py: 2 }}
                >
                  <Typography variant="body2" component="h3" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                    {item.name}
                  </Typography>
                  <ArrowForwardIcon
                    className="accessory-arrow"
                    sx={{ fontSize: 14, color: "text.secondary", opacity: 0, transition: "all 0.3s ease" }}
                  />
                </Stack>
              </Box>
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
