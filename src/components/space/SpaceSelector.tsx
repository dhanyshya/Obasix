"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { SpaceSetup } from "@/lib/types";

export function SpaceSelector({
  spaces,
  value,
  onChange,
}: {
  spaces: SpaceSetup[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <Grid container spacing={2}>
      {spaces.map((space) => {
        const selected = value === space.id;
        return (
          <Grid key={space.id} size={{ xs: 6, md: 4, xl: 3 }}>
            <ButtonBase
              type="button"
              onClick={() => onChange(space.id)}
              aria-pressed={selected}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                textAlign: "left",
                borderRadius: "20px",
                bgcolor: "#FFFFFF",
                border: "1px solid",
                borderColor: selected ? "#1B1D1C" : "#E5E5E0",
                boxShadow: selected ? "0 0 0 1px #1B1D1C" : "none",
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                "&:hover": { borderColor: selected ? "#1B1D1C" : "#B5B5AE" },
                "&:hover .space-img": { transform: "scale(1.04)" },
                "&.Mui-focusVisible": { outline: "2px solid #164E3B", outlineOffset: 3 },
              }}
            >
              <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "#FFFFFF" }}>
                <Image
                  src={space.image}
                  alt={space.name}
                  fill
                  className="space-img transition duration-500"
                  style={{ objectFit: "contain", padding: "10%" }}
                  sizes="(max-width: 900px) 50vw, 25vw"
                />
              </Box>
              <Box component="span" sx={{ display: "block", px: 2, pb: 2, pt: 0.5 }}>
                <Typography component="span" sx={{ display: "flex", alignItems: "center", gap: 1, fontFamily: "var(--font-display), sans-serif", fontWeight: 600, fontSize: { xs: 16, md: 18 }, letterSpacing: "-0.015em", color: "#1B1D1C" }}>
                  {space.name}
                  {selected ? <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#164E3B" }} /> : null}
                </Typography>
                <Typography variant="body2" component="span" sx={{ display: { xs: "none", sm: "block" }, mt: 0.5, color: "text.secondary" }}>
                  {space.description}
                </Typography>
              </Box>
            </ButtonBase>
          </Grid>
        );
      })}
    </Grid>
  );
}
