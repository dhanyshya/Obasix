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
import { getAllProducts } from "@/data/catalogue";
import { images } from "@/data/images";
import { getSolution, getSolutionProducts } from "@/data/solutions";
import { formatPrice } from "@/lib/format";

const spaces = [
  { id: "office", label: "Office", solutionId: "office", image: images.wallModernOffice, href: "/solutions/office" },
  {
    id: "meeting-room",
    label: "Meeting Room",
    solutionId: "meeting-room",
    image: images.wallMeetingRoom,
    href: "/solutions/meeting-room",
  },
  {
    id: "classroom",
    label: "Classroom",
    solutionId: "classroom",
    image: images.wallClassroom,
    href: "/solutions/classroom",
  },
  {
    id: "training-room",
    label: "Training Room",
    solutionId: "training-room",
    image: images.wallTrainingRoom,
    href: "/solutions/training-room",
  },
  {
    id: "home",
    label: "Home Workspace",
    solutionId: "home",
    image: images.wallHomeOffice,
    href: "/solutions/home",
  },
  {
    id: "retail",
    label: "Retail and Display",
    solutionId: "retail",
    image: images.wallCommercial,
    href: "/solutions/retail",
  },
] as const;

export function SpaceDiscoverySection() {
  const [active, setActive] = useState<(typeof spaces)[number]["id"]>(spaces[0].id);
  const selected = spaces.find((space) => space.id === active) ?? spaces[0];
  const solution = getSolution(selected.solutionId);

  const products = useMemo(() => {
    const fromSolution = getSolutionProducts(selected.solutionId);
    if (fromSolution.length > 0) return fromSolution.slice(0, 3);
    return getAllProducts().slice(0, 3);
  }, [selected.solutionId]);

  return (
    <Box component="section" sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.default" }}>
      <Container>
        <Reveal>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
            Discover
          </Typography>
          <Typography
            variant="h2"
            sx={{ mt: 1.5, maxWidth: 560, fontSize: { xs: "2rem", md: "2.75rem" } }}
          >
            Every Space Works Differently.
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 480, color: "text.secondary" }}>
            Choose how you work. We surface the catalogue boards and solutions that fit that environment.
          </Typography>
        </Reveal>

        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,0.95fr) minmax(0,1.05fr)" },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
            }}
          >
            {spaces.map((space, index) => {
              const selectedSpace = space.id === active;
              return (
                <Box
                  key={space.id}
                  component="button"
                  type="button"
                  onClick={() => setActive(space.id)}
                  aria-pressed={selectedSpace}
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    border: 1,
                    borderColor: selectedSpace ? "primary.main" : "divider",
                    bgcolor: "background.paper",
                    cursor: "pointer",
                    p: 0,
                    textAlign: "left",
                    transition: "border-color 0.2s ease, transform 0.25s ease",
                    "&:hover": { borderColor: "primary.main" },
                    "&:hover img": { transform: "scale(1.04)" },
                  }}
                >
                  <Image
                    src={space.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="220px"
                    style={{ transition: "transform 0.45s ease" }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: selectedSpace
                        ? "linear-gradient(to top, rgba(15,61,38,0.82), rgba(15,61,38,0.15))"
                        : "linear-gradient(to top, rgba(20,24,22,0.72), rgba(20,24,22,0.1))",
                    }}
                  />
                  <Box sx={{ position: "absolute", left: 12, right: 12, bottom: 12, color: "#fff" }}>
                    <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: "0.05em" }}>
                      {String(index + 1).padStart(2, "0")}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontWeight: 600, fontSize: 14 }}>{space.label}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Reveal delay={80}>
            <Box sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper", p: { xs: 2.5, md: 3.5 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.05em" }}>
                Selected space
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: "1.5rem", md: "1.85rem" } }}>
                {selected.label}
              </Typography>
              <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 420 }}>
                {solution?.summary ?? "Explore catalogue products suited to this environment."}
              </Typography>

              <Stack spacing={2} sx={{ mt: 3.5 }}>
                {products.length > 0 ? (
                  products.map((product) => (
                    <Stack
                      key={product.id}
                      direction="row"
                      spacing={2}
                      sx={{ alignItems: "center", borderTop: 1, borderColor: "divider", pt: 2 }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: 64,
                          height: 64,
                          flexShrink: 0,
                          bgcolor: "background.default",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt="" fill className="object-contain p-1" sizes="64px" />
                        ) : null}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.shortName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {product.price > 0 ? formatPrice(product.price) : "Quote on request"}
                        </Typography>
                      </Box>
                      <Button component={Link} href={`/products/${product.id}`} size="small" sx={{ flexShrink: 0 }}>
                        View
                      </Button>
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Browse the full catalogue for this space.
                  </Typography>
                )}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5 }}>
                <Button
                  component={Link}
                  href={selected.href}
                  variant="contained"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                >
                  Open solution
                </Button>
                <Button component={Link} href={`/products?application=${selected.id}`} variant="outlined">
                  Browse products
                </Button>
              </Stack>
            </Box>
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
