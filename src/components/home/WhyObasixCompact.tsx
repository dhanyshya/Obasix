"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Reveal } from "@/components/motion/Reveal";

const points = [
  {
    title: "Board solutions for every space",
    text: "Whiteboards, notice boards, stands and accessories drawn from the OBASIX catalogue.",
  },
  {
    title: "Customize where supported",
    text: "Configure size, frame, colour and accessories only when the selected product allows it.",
  },
  {
    title: "Quote for special requirements",
    text: "Custom dimensions and project options can be requested through the existing quote flow.",
  },
  {
    title: "Compatible accessories",
    text: "Complete Your Board recommendations use catalogue relationships for each product.",
  },
] as const;

export function WhyObasixCompact() {
  return (
    <Box
      component="section"
      aria-labelledby="why-obasix-heading"
      sx={{ py: { xs: 6, md: 8 }, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}
    >
      <Container>
        <Reveal>
          <Typography
            id="why-obasix-heading"
            variant="h2"
            sx={{ fontSize: { xs: "1.45rem", md: "1.75rem" }, letterSpacing: "-0.02em" }}
          >
            Why OBASIX
          </Typography>
        </Reveal>
        <Box
          sx={{
            mt: 3.5,
            display: "grid",
            gap: { xs: 2.5, md: 3 },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
          }}
        >
          {points.map((point, index) => (
            <Box key={point.title} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.12em" }}>
                0{index + 1}
              </Typography>
              <Typography sx={{ mt: 1, fontWeight: 600, fontSize: 15 }}>{point.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                {point.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
