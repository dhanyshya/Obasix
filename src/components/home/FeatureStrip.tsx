"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import AspectRatioOutlinedIcon from "@mui/icons-material/AspectRatioOutlined";
import { home } from "./homeRhythm";

const items = [
  {
    title: "Room for every idea",
    Icon: LightbulbOutlinedIcon,
  },
  {
    title: "Materials with purpose",
    Icon: LayersOutlinedIcon,
  },
  {
    title: "Made to fit your space",
    Icon: AspectRatioOutlinedIcon,
  },
] as const;

/** Slim white benefits strip with green outline icons. */
export function FeatureStrip() {
  return (
    <Box
      component="section"
      aria-label="OBASIX benefits"
      sx={{
        bgcolor: "#FFFFFF",
        borderTop: `1px solid ${home.line}`,
        borderBottom: `1px solid ${home.line}`,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            columnGap: { sm: 2 },
          }}
        >
          {items.map(({ title, Icon }, index) => (
            <Stack
              key={title}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                justifyContent: { xs: "flex-start", sm: "center" },
                px: { xs: 0, sm: 1.5, md: 2 },
                py: { xs: 2.5, md: 3.25 },
                borderTop: {
                  xs: index === 0 ? 0 : `1px solid ${home.line}`,
                  sm: 0,
                },
                borderLeft: {
                  xs: 0,
                  sm: index === 0 ? 0 : `1px solid ${home.line}`,
                },
              }}
            >
              <Icon
                sx={{
                  fontSize: 24,
                  color: home.green,
                  flexShrink: 0,
                }}
                aria-hidden
              />
              <Typography
                component="h2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: 14.5, md: 15.5 },
                  letterSpacing: "-0.01em",
                  color: home.charcoal,
                  lineHeight: 1.35,
                }}
              >
                {title}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
