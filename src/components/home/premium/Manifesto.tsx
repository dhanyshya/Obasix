import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Reveal } from "@/components/motion/Reveal";
import { home } from "../homeRhythm";
import { ArrowLink, Eyebrow, Shell } from "./shared";

const principles = [
  {
    number: "01",
    title: "Purpose first",
    body: "Every frame, tray and surface has a job to do.",
  },
  {
    number: "02",
    title: "Materials that last",
    body: "Aluminium, oak and ceramic steel, chosen for year ten.",
  },
  {
    number: "03",
    title: "Scaled for real rooms",
    body: "From a home study to a full teaching wall.",
  },
];

export function Manifesto() {
  return (
    <Box
      component="section"
      aria-labelledby="manifesto-heading"
      sx={{ bgcolor: home.white, py: { xs: 7, sm: 9, md: 10 } }}
    >
      <Shell>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            columnGap: 5,
            rowGap: { xs: 3, md: 0 },
            alignItems: "start",
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 7" } }}>
            <Reveal>
              <Eyebrow>Our point of view</Eyebrow>
              <Typography
                id="manifesto-heading"
                component="h2"
                sx={{
                  ...home.display,
                  mt: { xs: 2, md: 2.5 },
                  maxWidth: "16ch",
                  fontSize: { xs: "2.15rem", sm: "2.65rem", md: "3.35rem" },
                  lineHeight: 1.06,
                }}
              >
                Not more objects.
                <Box component="span" sx={{ display: "block", fontStyle: "normal", color: home.forest }}>
                  Better surfaces.
                </Box>
              </Typography>
              <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
                <ArrowLink href="/about">About OBASIX</ArrowLink>
              </Box>
            </Reveal>
          </Box>

          <Box sx={{ gridColumn: { md: "7 / 13" }, pt: { md: 0.75 } }}>
            <Reveal delay={0.08}>
              <Typography sx={{ maxWidth: 490, fontSize: { xs: 15, md: 16 }, lineHeight: 1.75, color: home.body }}>
                A plan, a lesson, a decision, a first draft. We make the surfaces that keep ideas
                in view, and the rooms around them a little more considered.
              </Typography>

              <Box
                sx={{
                  mt: { xs: 4, md: 4.5 },
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                  gap: { xs: 2.5, sm: 2 },
                }}
              >
                {principles.map((item) => (
                  <Box
                    key={item.number}
                    sx={{ pt: 1.5, borderTop: `1px solid ${home.line}` }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                        fontSize: 15,
                        color: home.forest,
                      }}
                    >
                      {item.number}
                    </Typography>
                    <Typography
                      component="h3"
                      sx={{
                        mt: 0.85,
                        fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                        fontSize: { xs: 18, md: 20 },
                        lineHeight: 1.18,
                        color: home.charcoal,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography sx={{ mt: 0.85, fontSize: 11.5, lineHeight: 1.55, color: home.body }}>
                      {item.body}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Reveal>
          </Box>
        </Box>
      </Shell>
    </Box>
  );
}
