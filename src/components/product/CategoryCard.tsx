"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import type { CategoryCard as CategoryCardType } from "@/lib/types";

export function CategoryCard({ category }: { category: CategoryCardType }) {
  return (
    <Box
      component={Link}
      href={category.href}
      sx={{
        display: "block",
        position: "relative",
        overflow: "hidden",
        borderRadius: 1.5,
        "&:hover img": { transform: "scale(1.05)" },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 5", sm: "3 / 4" } }}>
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
          style={{ transition: "transform 0.5s" }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,45,28,0.92), rgba(18,74,46,0.35) 55%, transparent)",
          }}
        />
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: { xs: 2.5, md: 3 }, color: "#fff" }}>
          <Typography variant="h5" component="h3" sx={{ fontSize: { xs: 20, md: 24 } }}>
            {category.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.8)" }}>
            {category.description}
          </Typography>
          <Typography
            component="span"
            variant="body2"
            sx={{ mt: 2, display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 600, color: "warning.main" }}
          >
            Explore <ArrowForwardIcon sx={{ fontSize: 16 }} />
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
