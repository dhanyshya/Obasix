"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getFeaturedProducts } from "@/data/catalogue";
import { images } from "@/data/images";
import { buildCustomizeHref, formatPrice } from "@/lib/format";

const categories = [
  { label: "Magnetic Whiteboards", href: "/products?category=magnetic-whiteboard", image: images.magneticWhiteboard, span: "lg" },
  { label: "Non-Magnetic Whiteboards", href: "/products?category=non-magnetic-whiteboard", image: images.nonMagneticWhiteboard, span: "sm" },
  { label: "Ceramic Steel Whiteboards", href: "/products?q=ceramic", image: images.magneticWhiteboardAlt, span: "sm" },
  { label: "Notice and Pin-up Boards", href: "/products?category=pin-up-board", image: images.pinBoard, span: "md" },
  { label: "Chalk Boards", href: "/products?category=chalk-board", image: images.chalkBoard, span: "sm" },
  { label: "Combination Boards", href: "/products?category=combination-board", image: images.combinationBoard, span: "sm" },
  { label: "Wooden Products", href: "/products?category=wooden-product", image: images.woodenBoard, span: "sm" },
  { label: "Whiteboard Stands", href: "/products?category=stand", image: images.whiteboardStand, span: "md" },
  { label: "Whiteboard Accessories", href: "/products?category=accessory", image: images.magnets, span: "sm" },
  { label: "Desk Accessories", href: "/products?category=desk-accessory", image: images.deskAccessory, span: "sm" },
  { label: "Display and Advertisement Stands", href: "/products?q=easel", image: images.easelStand, span: "md" },
];

export function ObjectsShowcaseSection() {
  const featured = getFeaturedProducts().slice(0, 5);

  return (
    <Box component="section" sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
      <Container>
        <Reveal>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between", mb: { xs: 5, md: 7 } }}
          >
            <Box>
              <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
                Catalogue
              </Typography>
              <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "2rem", md: "2.75rem" }, maxWidth: 480 }}>
                Objects for Better Work.
              </Typography>
            </Box>
            <Button component={Link} href="/products" variant="text" color="primary" sx={{ alignSelf: { xs: "flex-start", md: "auto" } }}>
              View full catalogue
            </Button>
          </Stack>
        </Reveal>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            gridAutoRows: { md: "220px" },
          }}
        >
          {categories.map((category, index) => {
            const colSpan =
              category.span === "lg" ? { xs: "span 1", md: "span 7" } : category.span === "md" ? { xs: "span 1", md: "span 6" } : { xs: "span 1", md: "span 5" };
            const rowSpan = category.span === "lg" ? { md: "span 2" } : { md: "span 1" };
            return (
              <Box
                key={category.label}
                component={Link}
                href={category.href}
                sx={{
                  position: "relative",
                  gridColumn: colSpan,
                  gridRow: rowSpan,
                  minHeight: { xs: 200, md: "auto" },
                  overflow: "hidden",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  display: "block",
                  "&:hover img": { transform: "scale(1.03)" },
                }}
              >
                <Image
                  src={category.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ transition: "transform 0.5s ease" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(20,24,22,0.78) 0%, rgba(20,24,22,0.08) 55%)",
                  }}
                />
                <Box sx={{ position: "absolute", left: 18, right: 18, bottom: 18, color: "#fff" }}>
                  <Typography variant="caption" sx={{ opacity: 0.65, letterSpacing: "0.05em" }}>
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontWeight: 600, fontSize: { xs: 16, md: category.span === "lg" ? 22 : 17 } }}>
                    {category.label}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ mt: { xs: 8, md: 10 } }}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.05em" }}>
            Featured pieces
          </Typography>
          <Box
            sx={{
              mt: 3,
              display: "grid",
              gap: { xs: 4, md: 5 },
              gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            }}
          >
            {featured.map((product, index) => {
              const wide = index === 0 || index === 3;
              return (
                <Box
                  key={product.id}
                  sx={{
                    gridColumn: { xs: "span 1", md: wide ? "span 7" : "span 5" },
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 3,
                  }}
                >
                  <Reveal delay={index * 40}>
                    <Box
                      component={Link}
                      href={`/products/${product.id}`}
                      sx={{
                        position: "relative",
                        display: "block",
                        aspectRatio: wide ? "16 / 10" : "5 / 4",
                        bgcolor: "background.default",
                        border: 1,
                        borderColor: "divider",
                        mb: 2,
                        overflow: "hidden",
                      }}
                    >
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain p-6"
                          sizes="(max-width: 900px) 100vw, 50vw"
                        />
                      ) : null}
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.08em" }}>
                      {product.sku}
                    </Typography>
                    <Typography
                      component={Link}
                      href={`/products/${product.id}`}
                      variant="h5"
                      sx={{
                        display: "block",
                        mt: 0.75,
                        fontSize: { xs: "1.15rem", md: wide ? "1.45rem" : "1.2rem" },
                        color: "text.primary",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      {product.shortName}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary", maxWidth: 420 }}>
                      {product.shortDescription}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 2, justifyContent: "space-between", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {product.price > 0 ? formatPrice(product.price) : "Quote on request"}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button component={Link} href={`/products/${product.id}`} size="small" variant="text">
                          Details
                        </Button>
                        {product.customizable ? (
                          <Button
                            component={Link}
                            href={buildCustomizeHref({ productId: product.id })}
                            size="small"
                            variant="outlined"
                          >
                            Customize
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Reveal>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
