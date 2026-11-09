import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { images } from "@/data/images";
import { home } from "../homeRhythm";
import { ArrowLink, SectionHeading, Shell } from "./shared";

const spaces = [
  {
    title: "Office",
    label: "Focused work",
    href: "/solutions/office",
    image: images.wallModernOffice,
  },
  {
    title: "Meeting Room",
    label: "Shared decisions",
    href: "/solutions/meeting-room",
    image: images.wallMeetingRoom,
  },
  {
    title: "Classroom",
    label: "Everyday learning",
    href: "/solutions/classroom",
    image: images.wallClassroom,
  },
  {
    title: "Training Room",
    label: "Workshops and coaching",
    href: "/solutions/training-room",
    image: images.wallTrainingRoom,
  },
  {
    title: "Collaboration",
    label: "Ideas in progress",
    href: "/solutions/collaboration",
    image: images.wallStartup,
  },
  {
    title: "Home",
    label: "Study and planning",
    href: "/solutions/home",
    image: images.wallHomeOffice,
  },
  {
    title: "Reception",
    label: "First impressions",
    href: "/solutions/reception",
    image: images.wallReception,
  },
  {
    title: "Retail",
    label: "Clear communication",
    href: "/solutions/retail",
    image: images.retail,
  },
  {
    title: "Studio",
    label: "Creative work",
    href: "/solutions/studio",
    image: images.wallLivingRoom,
  },
  {
    title: "Commercial",
    label: "High-use environments",
    href: "/solutions/commercial",
    image: images.wallCommercial,
  },
];

export function Spaces() {
  return (
    <Box
      component="section"
      aria-labelledby="spaces-heading"
      sx={{ bgcolor: home.white, py: home.sectionPy }}
    >
      <Shell>
        <SectionHeading
          eyebrow="Shop by space"
          title={
            <Box component="span" id="spaces-heading">
              Find the right surface for the room.
            </Box>
          }
          lede="Choose the setting and we will show you the boards, stands and accessories that suit it."
          action={{ href: "/solutions", label: "Explore all spaces" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: { xs: 1.5, sm: 2, md: 2.25 },
          }}
        >
          {spaces.map((space, index) => (
            <Reveal key={space.href} delay={index * 35} sx={{ display: "flex" }}>
              <Box
                component={Link}
                href={space.href}
                className="group"
                sx={{
                  position: "relative",
                  display: "block",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  overflow: "hidden",
                  bgcolor: home.beige,
                  color: home.white,
                  "&:hover .space-image": { transform: "scale(1.055)" },
                  "&:hover .space-arrow": { transform: "translate(3px, -3px)" },
                  "&:focus-visible": {
                    outline: `2px solid ${home.forest}`,
                    outlineOffset: 3,
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    "&:hover .space-image": { transform: "none" },
                    "&:hover .space-arrow": { transform: "none" },
                  },
                }}
              >
                <Image
                  src={space.image}
                  alt={`${space.title} — ${space.label}`}
                  fill
                  sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
                  className="space-image"
                  style={{ objectFit: "cover", transition: "transform 0.55s ease" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(18,20,17,0.02) 28%, rgba(18,20,17,0.72) 100%)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: { xs: 14, md: 18 },
                    right: { xs: 14, md: 18 },
                    bottom: { xs: 14, md: 18 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {space.label}
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.75,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      component="h3"
                      sx={{
                        fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                        fontSize: { xs: 19, md: 23 },
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        color: home.white,
                      }}
                    >
                      {space.title}
                    </Typography>
                    <ArrowOutwardIcon
                      className="space-arrow"
                      sx={{ fontSize: 17, transition: "transform 0.25s ease" }}
                      aria-hidden
                    />
                  </Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>

        <Box
          sx={{
            mt: { xs: 5, md: 7 },
            pt: 3,
            borderTop: `1px solid ${home.line}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
              fontStyle: "normal",
              fontSize: { xs: 21, md: 25 },
              color: home.charcoal,
            }}
          >
            Planning a whole room? We can help you specify it.
          </Typography>
          <ArrowLink href="/quote">Talk to our team</ArrowLink>
        </Box>
      </Shell>
    </Box>
  );
}
