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
import { images } from "@/data/images";
import { getSolution, getSolutionProducts } from "@/data/solutions";
import { buildCustomizeHref, formatPrice } from "@/lib/format";

const spaces = [
  { id: "office", label: "Office", href: "/solutions/office", image: images.wallModernOffice },
  {
    id: "meeting-room",
    label: "Meeting Room",
    href: "/solutions/meeting-room",
    image: images.wallMeetingRoom,
  },
  { id: "classroom", label: "Classroom", href: "/solutions/classroom", image: images.classroom },
  { id: "home", label: "Home Workspace", href: "/solutions/home", image: images.homeStudy },
] as const;

export function YourSpaceYourBoard() {
  const [active, setActive] = useState<(typeof spaces)[number]["id"]>("office");
  const selected = spaces.find((space) => space.id === active) ?? spaces[0];
  const solution = getSolution(selected.id);

  const products = useMemo(() => getSolutionProducts(selected.id).slice(0, 3), [selected.id]);

  return (
    <Box
      component="section"
      aria-labelledby="your-space-heading"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: "background.paper",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Container>
        <Reveal>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.16em" }}>
            SPACE STUDIO
          </Typography>
          <Typography
            id="your-space-heading"
            variant="h2"
            sx={{ mt: 1.25, fontSize: { xs: "1.75rem", md: "2.35rem" }, letterSpacing: "-0.025em" }}
          >
            Your Space. Your Board.
          </Typography>
          <Typography sx={{ mt: 1.5, maxWidth: 480, color: "text.secondary" }}>
            Begin with how the room is used. We surface real catalogue boards for that environment —
            then open the product-specific customizer.
          </Typography>
        </Reveal>

        <Stack
          direction="row"
          useFlexGap
          spacing={0}
          sx={{
            mt: 4,
            flexWrap: "wrap",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {spaces.map((space) => {
            const isActive = space.id === active;
            return (
              <Button
                key={space.id}
                onClick={() => setActive(space.id)}
                aria-pressed={isActive}
                sx={{
                  borderRadius: 0,
                  px: { xs: 1.5, md: 2.25 },
                  py: 1.5,
                  minWidth: 0,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13.5,
                  color: isActive ? "primary.main" : "text.secondary",
                  borderBottom: "2px solid",
                  borderColor: isActive ? "primary.main" : "transparent",
                  mb: "-1px",
                  "&:hover": { bgcolor: "transparent", color: "primary.main" },
                }}
              >
                {space.label}
              </Button>
            );
          })}
        </Stack>

        <Box
          sx={{
            mt: 4,
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,0.9fr) minmax(0,1.1fr)" },
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 220, md: 340 },
              bgcolor: "#2A302C",
              overflow: "hidden",
            }}
          >
            <Image
              key={selected.image}
              src={selected.image}
              alt={`${selected.label} workspace context`}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 45vw"
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 50%, rgba(31,36,33,0.55) 100%)",
              }}
            />
            <Box sx={{ position: "absolute", left: 20, bottom: 20, right: 20 }}>
              <Typography
                sx={{ color: "rgba(255,255,255,0.7)", fontSize: 11, letterSpacing: "0.16em", fontWeight: 600 }}
              >
                {selected.label.toUpperCase()}
              </Typography>
              <Typography sx={{ mt: 0.75, color: "#fff", fontSize: 18, fontWeight: 600, maxWidth: 320 }}>
                {solution?.headline ?? selected.label}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {solution?.summary ?? "Catalogue boards matched to this space."}
            </Typography>

            <Stack spacing={0}>
              {products.length === 0 ? (
                <Typography color="text.secondary">No catalogue matches for this space yet.</Typography>
              ) : (
                products.map((product, index) => (
                  <Box
                    key={product.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "88px 1fr",
                      gap: 2,
                      py: 2,
                      borderTop: 1,
                      borderColor: "divider",
                      borderBottom: index === products.length - 1 ? 1 : 0,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        height: 88,
                        bgcolor: "#FFFFFF",
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="88px"
                        style={{ padding: 8 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
                        {product.shortName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {product.sku}
                        {product.price > 0 ? ` · ${formatPrice(product.price)}` : ""}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ mt: "auto", pt: 1.25 }}>
                        <Button
                          component={Link}
                          href={`/products/${product.id}`}
                          size="small"
                          sx={{ px: 0, minWidth: 0 }}
                        >
                          View
                        </Button>
                        {product.customizable ? (
                          <Button
                            component={Link}
                            href={buildCustomizeHref({
                              productId: product.id,
                              application: selected.id,
                            })}
                            size="small"
                            sx={{ px: 0, minWidth: 0, color: "primary.main" }}
                          >
                            Customize
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  </Box>
                ))
              )}
            </Stack>

            <Button
              component={Link}
              href={selected.href}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{ mt: 3, px: 0, fontWeight: 600 }}
            >
              Open {selected.label} solution
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
