"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getVisibleSolutions } from "@/data/solutions";

const presentation: Record<string, string> = {
  office: "Corporate Offices",
  "meeting-room": "Meeting Rooms",
  classroom: "Education",
  "training-room": "Training Facilities",
  collaboration: "Collaboration Areas",
  reception: "Reception Areas",
  retail: "Retail and Display",
  home: "Home Workspaces",
  studio: "Studios",
  commercial: "Commercial Spaces",
};

export function SolutionsEditorialSection() {
  const solutions = getVisibleSolutions().filter((solution) => presentation[solution.id]);

  return (
    <Box component="section" sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
      <Container>
        <Reveal>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
            Applications
          </Typography>
          <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "2rem", md: "2.75rem" }, maxWidth: 520 }}>
            Designed Around the Way You Work.
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 480, color: "text.secondary" }}>
            Editorial guides to the spaces OBASIX serves — each route leads to real catalogue products for that
            environment.
          </Typography>
        </Reveal>

        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {solutions.map((solution, index) => {
            const large = index % 3 === 0;
            return (
              <Box
                key={solution.id}
                component={Link}
                href={`/solutions/${solution.id}`}
                sx={{
                  position: "relative",
                  gridColumn: { md: large ? "span 2" : "span 1" },
                  minHeight: { xs: 260, md: large ? 360 : 280 },
                  overflow: "hidden",
                  border: 1,
                  borderColor: "divider",
                  display: "block",
                  "&:hover img": { transform: "scale(1.03)" },
                }}
              >
                <Image
                  src={solution.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={large ? "100vw" : "50vw"}
                  style={{ transition: "transform 0.5s ease" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(15,20,18,0.86) 0%, rgba(15,20,18,0.2) 55%, rgba(15,20,18,0.08) 100%)",
                  }}
                />
                <Box sx={{ position: "absolute", left: 20, right: 20, bottom: 20, color: "#fff" }}>
                  <Typography variant="caption" sx={{ opacity: 0.65, letterSpacing: "0.05em" }}>
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.75, fontSize: { xs: "1.35rem", md: large ? "2rem" : "1.5rem" }, color: "#fff" }}>
                    {presentation[solution.id] ?? solution.name}
                  </Typography>
                  <Typography sx={{ mt: 1, maxWidth: 480, color: "rgba(255,255,255,0.78)", fontSize: 14 }}>
                    {solution.summary}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Explore solution
                    <ArrowForwardIcon sx={{ fontSize: 15 }} />
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Button component={Link} href="/solutions" variant="outlined" sx={{ mt: 4 }}>
          All applications
        </Button>
      </Container>
    </Box>
  );
}
