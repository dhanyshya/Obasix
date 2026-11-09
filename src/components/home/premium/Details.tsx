import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { home } from "../homeRhythm";
import { ArrowLink, Eyebrow, Shell } from "./shared";

const large = getProductById("mobile-3x4");
const small = [getProductById("magnets-40mm"), getProductById("marker-holder-black")].filter(
  (product): product is Product => Boolean(product),
);

const materials = ["Natural aluminium", "Solid oak", "Ceramic steel", "Powder coat"];

function ProductMini({ product }: { product: Product }) {
  return (
    <Box
      component={Link}
      href={`/products/${product.id}`}
      className="group"
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: home.white,
        border: `1px solid ${home.line}`,
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: { xs: 160, sm: 180 },
          bgcolor: home.ivory,
          overflow: "hidden",
        }}
      >
        <Image
          src={product.images[0] ?? "/hero-workspace-photo.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 900px) 50vw, 20vw"
          className="image-zoom"
          style={{ objectFit: "contain", padding: "clamp(16px, 3vw, 30px)" }}
        />
      </Box>
      <Box sx={{ p: 2, borderTop: `1px solid ${home.line}` }}>
        <Typography
          sx={{
            fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
            fontSize: 19,
            lineHeight: 1.15,
            color: home.charcoal,
          }}
        >
          {product.shortName}
        </Typography>
        <Box sx={{ mt: 0.75, display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontSize: 11.5, color: home.body }}>
            {formatPrice(product.price)}
          </Typography>
          <ArrowOutwardIcon
            sx={{
              fontSize: 16,
              color: home.forest,
              transition: "transform 0.3s ease",
              ".group:hover &": { transform: "translate(3px, -3px)" },
            }}
            aria-hidden
          />
        </Box>
      </Box>
    </Box>
  );
}

export function DetailsSection() {
  return (
    <Box
      component="section"
      aria-labelledby="details-heading"
      sx={{
        bgcolor: home.ivory,
        py: home.sectionPy,
        borderTop: `1px solid ${home.line}`,
      }}
    >
      <Shell>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            pb: 2.5,
            mb: { xs: 5, md: 7 },
            borderBottom: `1px solid ${home.line}`,
          }}
        >
          <Eyebrow>Finishing touches</Eyebrow>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, md: 3 } }}>
            {materials.map((material) => (
              <Typography
                key={material}
                sx={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: home.body,
                }}
              >
                {material}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            columnGap: { md: 6 },
            rowGap: { xs: 5, md: 0 },
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 6" }, display: "flex", flexDirection: "column" }}>
            <Reveal>
              <Typography
                id="details-heading"
                component="h2"
                sx={{
                  ...home.h2,
                  color: home.charcoal,
                  maxWidth: "10ch",
                  fontSize: { xs: "2.8rem", sm: "3.4rem", md: "4rem", lg: "4.5rem" },
                }}
              >
                The details that finish the room.
              </Typography>
              <Typography sx={{ ...home.lede, mt: { xs: 2.5, md: 3.5 }, maxWidth: 400 }}>
                A tray in the right place. A magnet that feels good in the hand. The small objects
                that turn a writing surface into a working system.
              </Typography>
            </Reveal>

            <Reveal delay={120}>
              <Box sx={{ mt: { xs: 4, md: 5 }, pt: 2, borderTop: `1px solid ${home.line}` }}>
                <Typography
                  sx={{
                    fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                    fontStyle: "normal",
                    fontSize: { xs: 24, md: 28 },
                    lineHeight: 1.3,
                    color: home.forest,
                    maxWidth: "17ch",
                  }}
                >
                  Accessories are not an afterthought. They are how the room works.
                </Typography>
              </Box>
            </Reveal>

            <Box sx={{ mt: { xs: 3.5, md: "auto" }, pt: { md: 5 } }}>
              <ArrowLink href="/products?category=accessory">Shop all accessories</ArrowLink>
            </Box>
          </Box>

          <Box sx={{ gridColumn: { md: "6 / 13" } }}>
            <Reveal>
              <Box
                component={Link}
                href={large ? `/products/${large.id}` : "/products"}
                className="group"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: home.white,
                  border: `1px solid ${home.line}`,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: { xs: "4 / 3", md: "16 / 9" },
                    bgcolor: home.beige,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={large?.images[0] ?? "/hero-workspace-photo.jpg"}
                    alt={large?.name ?? "Mobile whiteboard with stand"}
                    fill
                    sizes="(max-width: 900px) 100vw, 54vw"
                    className="image-zoom"
                    style={{ objectFit: "contain", padding: "clamp(20px, 4vw, 44px)" }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      left: 18,
                      top: 18,
                      ...home.softLabel,
                      bgcolor: "rgba(255,255,255,0.9)",
                    }}
                  >
                    With stand
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 2,
                    borderTop: `1px solid ${home.line}`,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                        fontSize: { xs: 22, md: 27 },
                        lineHeight: 1.1,
                        color: home.charcoal,
                      }}
                    >
                      {large?.shortName ?? "Mobile double-sided board"}
                    </Typography>
                    <Typography sx={{ mt: 0.75, fontSize: 12, color: home.body }}>
                      {large ? formatPrice(large.price) : "Price on request"}
                    </Typography>
                  </Box>
                  <ArrowOutwardIcon
                    sx={{
                      fontSize: 20,
                      color: home.forest,
                      transition: "transform 0.3s ease",
                      ".group:hover &": { transform: "translate(4px, -4px)" },
                    }}
                    aria-hidden
                  />
                </Box>
              </Box>
            </Reveal>

            <Box
              sx={{
                mt: 2,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 2,
              }}
            >
              {small.map((product, index) => (
                <Reveal key={product.id} delay={80 * (index + 1)} sx={{ display: "flex" }}>
                  <Box sx={{ width: "100%" }}>
                    <ProductMini product={product} />
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}
