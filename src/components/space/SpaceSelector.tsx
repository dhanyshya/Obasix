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
          <Grid key={space.id} size={{ xs: 12, sm: 6, xl: 3 }}>
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
                borderRadius: 0,
                border: 1,
                borderColor: selected ? "primary.main" : "divider",
                boxShadow: selected ? 3 : 0,
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                "&:hover": { borderColor: selected ? "primary.main" : "primary.dark" },
                "&:hover .space-img": { transform: "scale(1.05)" },
              }}
            >
              <Box sx={{ position: "relative", aspectRatio: "16 / 10" }}>
                <Image
                  src={space.image}
                  alt={space.name}
                  fill
                  className="space-img object-cover transition duration-500"
                  sizes="25vw"
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
                  }}
                />
                <Typography
                  variant="h6"
                  component="p"
                  sx={{ position: "absolute", bottom: 12, left: 12, fontSize: 18, color: "common.white" }}
                >
                  {space.name}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                component="span"
                sx={{ display: "block", bgcolor: "background.paper", p: 2, color: "text.secondary" }}
              >
                {space.description}
              </Typography>
            </ButtonBase>
          </Grid>
        );
      })}
    </Grid>
  );
}
