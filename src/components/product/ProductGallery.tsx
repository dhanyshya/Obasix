"use client";

import Image from "next/image";
import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <Stack spacing={1.5}>
      <Box
        onClick={() => setZoomed((v) => !v)}
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          borderRadius: 0,
          bgcolor: "background.paper",
          cursor: zoomed ? "zoom-out" : "zoom-in",
        }}
      >
        <Image
          src={images[active]}
          alt={alt}
          fill
          className={zoomed ? "object-cover" : "object-contain p-4"}
          style={{
            transition: "transform 0.5s",
            transform: zoomed ? "scale(1.5)" : "scale(1)",
          }}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <Chip
          size="small"
          icon={<ZoomInIcon />}
          label="Click to zoom"
          sx={{
            position: "absolute",
            bottom: 12,
            left: 12,
            bgcolor: "rgba(255,255,255,0.92)",
            fontWeight: 600,
            fontSize: 12,
          }}
        />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
        {images.map((image, index) => (
          <ButtonBase
            key={image + index}
            onClick={() => setActive(index)}
            aria-label={`Show image ${index + 1}`}
            aria-current={active === index}
            sx={{
              position: "relative",
              aspectRatio: "1 / 1",
              overflow: "hidden",
              borderRadius: 0,
              border: 2,
              borderColor: active === index ? "primary.main" : "transparent",
            }}
          >
            <Image src={image} alt="" fill className="object-cover" sizes="120px" />
          </ButtonBase>
        ))}
      </Box>
    </Stack>
  );
}
