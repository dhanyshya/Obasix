import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getProductImages, images } from "@/data/images";
import { home } from "../homeRhythm";
import { ShopSectionHeading, Shell } from "./shared";

const shopCategories = [
  {
    id: "whiteboards",
    name: "Whiteboards",
    image: images.magneticWhiteboard,
    href: "/products?category=magnetic-whiteboard",
  },
  {
    id: "glass",
    name: "Glass Boards",
    image: getProductImages("scuv90120", [images.heroWhiteboard])[0],
    href: "/products?surface=ceramic-steel",
  },
  {
    id: "notice",
    name: "Notice Boards",
    image: images.noticeBoard,
    href: "/products?category=notice-board",
  },
  {
    id: "pin",
    name: "Pin Boards",
    image: images.pinBoard,
    href: "/products?category=pin-up-board",
  },
  {
    id: "easels",
    name: "Easels",
    image: images.easelStand,
    href: "/products?family=stands-accessories",
  },
  {
    id: "display",
    name: "Display Boards",
    image: images.displayStand,
    href: "/products?category=stand",
  },
];

export function Collections() {
  return (
    <Box
      component="section"
      aria-labelledby="collections-heading"
      sx={{
        bgcolor: home.white,
        pt: { xs: 5, md: 6 },
        pb: { xs: 6, md: 8 },
      }}
    >
      <Shell>
        <ShopSectionHeading
          id="collections-heading"
          title="SHOP BY CATEGORY"
          action={{ href: "/products", label: "View all products" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(6, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, sm: 2, md: 2 },
          }}
        >
          {shopCategories.map((item, index) => (
            <Reveal key={item.id} delay={index * 35} sx={{ display: "flex" }}>
              <Box
                component={Link}
                href={item.href}
                className="group"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  bgcolor: home.white,
                  border: `1px solid ${home.line}`,
                  overflow: "hidden",
                  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    borderColor: home.forest,
                    boxShadow: "0 16px 36px rgba(23,77,56,0.08)",
                  },
                  "&:hover .category-image": { transform: "scale(1.045)" },
                  "&:hover .category-arrow": { transform: "translateX(4px)" },
                  "&:focus-visible": {
                    outline: `2px solid ${home.forest}`,
                    outlineOffset: 3,
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover .category-image": { transform: "none" },
                    "&:hover .category-arrow": { transform: "none" },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    bgcolor: home.ivory,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 16vw"
                    className="category-image"
                    style={{
                      objectFit: "contain",
                      padding: "clamp(16px, 2.5vw, 28px)",
                      transition: "transform 0.45s ease",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    p: { xs: 1.4, md: 1.75 },
                    borderTop: `1px solid ${home.line}`,
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                      fontSize: { xs: 14.5, md: 16.5 },
                      lineHeight: 1.2,
                      color: home.charcoal,
                    }}
                  >
                    {item.name}
                  </Typography>
                  <ArrowForwardIcon
                    className="category-arrow"
                    sx={{
                      fontSize: 15,
                      color: home.forest,
                      flexShrink: 0,
                      transition: "transform 0.25s ease",
                    }}
                    aria-hidden
                  />
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Shell>
    </Box>
  );
}
