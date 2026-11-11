"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NextLink from "@/components/Link";
import { images } from "@/data/images";

const columns = [
  {
    title: "Writing Surfaces",
    links: [
      { href: "/products?category=magnetic-whiteboard", label: "Magnetic Whiteboards", image: images.magneticWhiteboard },
      { href: "/products?category=non-magnetic-whiteboard", label: "Non-Magnetic Whiteboards", image: images.nonMagneticWhiteboard },
      { href: "/products?q=ceramic", label: "Ceramic Steel Whiteboards", image: images.magneticWhiteboardAlt },
      { href: "/products?category=combination-board", label: "Combination Boards", image: images.combinationBoard },
    ],
  },
  {
    title: "Boards & Display",
    links: [
      { href: "/products?category=notice-board", label: "Notice Boards", image: images.noticeBoard },
      { href: "/products?category=pin-up-board", label: "Pin-up Boards", image: images.pinBoard },
      { href: "/products?category=chalk-board", label: "Chalk Boards", image: images.chalkBoard },
      { href: "/products?category=wooden-product", label: "Wooden Products", image: images.woodenBoard },
    ],
  },
  {
    title: "Stands & Accessories",
    links: [
      { href: "/products?category=stand", label: "Whiteboard Stands", image: images.whiteboardStand },
      { href: "/products?q=easel", label: "Display & Advertisement Stands", image: images.easelStand },
      { href: "/products?category=accessory", label: "Whiteboard Accessories", image: images.markers },
      { href: "/products?category=desk-accessory", label: "Desk Accessories", image: images.deskAccessory },
    ],
  },
];

export function MegaMenu({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Stack spacing={2}>
        {columns.map((col) => (
          <Box key={col.title}>
            <Typography
              variant="overline"
              sx={{ display: "block", mb: 0.75, color: "secondary.main", letterSpacing: "0.06em" }}
            >
              {col.title}
            </Typography>
            <Stack spacing={0.25}>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  component={NextLink}
                  href={link.href}
                  onClick={onNavigate}
                  sx={{
                    display: "block",
                    py: 0.75,
                    px: 1,
                    fontSize: 14,
                    color: "text.primary",
                    borderRadius: "16px",
                    "&:hover": { bgcolor: "primary.light", color: "primary.main" },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Box>
        ))}
        <Link
          component={NextLink}
          href="/solutions"
          onClick={onNavigate}
          sx={{
            display: "block",
            mt: 0.5,
            border: 1,
            borderColor: "divider",
            px: 1.5,
            py: 1.5,
            fontSize: 13,
            fontWeight: 600,
            color: "primary.main",
          }}
        >
          Browse applications by space
        </Link>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        boxShadow: "0 18px 40px rgba(31,36,33,0.08)",
        p: { xs: 2.5, md: 3 },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(220px,0.9fr)",
          },
        }}
      >
        {columns.map((col) => (
          <Box key={col.title}>
            <Typography
              variant="overline"
              sx={{ display: "block", mb: 1.5, pb: 1, color: "secondary.main", letterSpacing: "0.06em", borderBottom: "2px solid #141917" }}
            >
              {col.title}
            </Typography>
            <Stack spacing={1}>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  component={NextLink}
                  href={link.href}
                  onClick={onNavigate}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr",
                    gap: 1.25,
                    alignItems: "center",
                    p: 0.75,
                    borderRadius: "16px",
                    color: "text.primary",
                    transition: "background-color 0.2s ease",
                    "&:hover": { bgcolor: "primary.light" },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: 44,
                      height: 44,
                      bgcolor: "background.default",
                      border: 1,
                      borderColor: "divider",
                      overflow: "hidden",
                    }}
                  >
                    <Image src={link.image} alt="" fill className="object-contain p-1" sizes="44px" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                    {link.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Box>
        ))}

        <Link
          component={NextLink}
          href="/visualize"
          onClick={onNavigate}
          sx={{
            position: "relative",
            display: "block",
            minHeight: 260,
            overflow: "hidden",
            bgcolor: "primary.light",
          }}
        >
          <Image
            src={images.wallModernOffice}
            alt="Visualize Your Space"
            fill
            className="object-cover"
            sizes="280px"
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(11,46,34,0.92) 0%, rgba(11,46,34,0.1) 72%)",
            }}
          />
          <Box sx={{ position: "absolute", insetInline: 0, bottom: 0, p: 2.5, color: "#fff" }}>
            <Typography variant="overline" sx={{ color: "#164E3B", letterSpacing: "0.06em" }}>
              01 / Experience
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.75, fontSize: 18, color: "#fff", lineHeight: 1.25 }}>
              Visualize Your Space
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "rgba(255,255,255,0.88)" }}>
              Place a board on a real wall model before you choose.
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 1.5, fontSize: 12, fontWeight: 600 }}>
              <span>Open studio</span>
              <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Stack>
          </Box>
        </Link>
      </Box>
    </Box>
  );
}
