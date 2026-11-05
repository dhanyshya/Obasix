"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { images } from "@/data/images";
import { getSolution } from "@/data/solutions";
import { home } from "./homeRhythm";

const spaces = [
  { id: "office", label: "Office", image: images.wallModernOffice },
  { id: "meeting-room", label: "Meeting Room", image: images.wallExecutiveOffice },
  { id: "classroom", label: "Classroom", image: images.wallClassroom },
  { id: "home", label: "Home Workspace", image: images.wallHomeOffice },
] as const;

export function SpaceSolutionsSection() {
  return (
    <Box
      component="section"
      aria-labelledby="spaces-heading"
      sx={{ py: home.sectionPy, bgcolor: "#FFFFFF", borderTop: `1px solid ${home.line}` }}
    >
      <Container>
        <Typography id="spaces-heading" variant="h2" sx={home.heading}>
          Workspace Solutions
        </Typography>
        <Typography sx={{ ...home.lede, mb: { xs: 3.5, md: 4.5 } }}>
          Boards matched to the rooms where people plan, teach, and create.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 2 },
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          {spaces.map((space) => {
            const solution = getSolution(space.id);
            return (
              <Box
                key={space.id}
                component={Link}
                href={`/solutions/${space.id}`}
                sx={{
                  display: "block",
                  position: "relative",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "#FFFFFF",
                  aspectRatio: { xs: "4 / 5", md: "3 / 4" },
                  bgcolor: home.charcoal,
                  "&:hover .space-img": { transform: "scale(1.03)" },
                }}
              >
                <Image
                  src={space.image}
                  alt={`${space.label} solutions`}
                  fill
                  className="space-img object-cover"
                  sizes="(max-width: 900px) 50vw, 25vw"
                  style={{ transition: "transform 0.5s ease" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 45%, rgba(32,40,35,0.82) 100%)",
                  }}
                />
                <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: 2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: { xs: 15, md: 16 } }}>
                    {space.label}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      color: "rgba(248,246,240,0.75)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {solution?.summary ?? "Explore boards for this space."}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
