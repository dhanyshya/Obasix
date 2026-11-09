"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { images } from "@/data/images";

const whyPoints = [
  {
    title: "Catalogue-first",
    text: "Every product shown is drawn from the OBASIX catalogue — real SKUs, sizes and listed pricing where available.",
  },
  {
    title: "Configurable where supported",
    text: "Customize size, frame, colour and accessories only when the selected product supports those options.",
  },
  {
    title: "Quote when needed",
    text: "Custom dimensions and unpriced configurations route to a quote request instead of inventing a price.",
  },
];

export function CustomProjectsSection() {
  return (
    <Box component="section" sx={{ py: { xs: 10, md: 14 }, bgcolor: "background.default" }}>
      <Container>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0,0.95fr) minmax(0,1.05fr)" },
            alignItems: "center",
          }}
        >
          <Reveal>
            <Box sx={{ position: "relative", aspectRatio: "4 / 3", border: 1, borderColor: "divider", overflow: "hidden" }}>
              <Image src={images.projectOffice} alt="Custom board project" fill className="object-cover" sizes="50vw" />
            </Box>
          </Reveal>
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
              Custom projects
            </Typography>
            <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "2rem", md: "2.5rem" }, maxWidth: 420 }}>
              Unusual dimensions. Branding. Project-specific boards.
            </Typography>
            <Typography sx={{ mt: 2, color: "text.secondary", maxWidth: 460 }}>
              When a listed size is not enough, request a quote for custom dimensions, branding and layout options.
              Our team confirms feasibility against the catalogue configuration rules.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5 }}>
              <Button component={Link} href="/quote" variant="contained" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}>
                Request a project quote
              </Button>
              <Button component={Link} href="/customize" variant="outlined">
                Start in the configurator
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export function WhyObasixSection() {
  return (
    <Box component="section" sx={{ py: { xs: 10, md: 12 }, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
      <Container>
        <Reveal>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
            Why OBASIX
          </Typography>
          <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "2rem", md: "2.5rem" }, maxWidth: 520 }}>
            Boards, accessories and customized solutions.
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 560, color: "text.secondary" }}>
            OBASIX Industries Pvt. Ltd. manufactures whiteboards, notice boards, magnetic boards, pinboards, marker
            holders, stands and office accessories — with ready sizes and customized solutions including branding and
            special features.
          </Typography>
        </Reveal>

        <Box
          sx={{
            mt: 5,
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          }}
        >
          {whyPoints.map((point, index) => (
            <Box key={point.title} sx={{ borderTop: 1, borderColor: "divider", pt: 2.5 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.05em" }}>
                {String(index + 1).padStart(2, "0")}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1, fontSize: "1.1rem" }}>
                {point.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                {point.text}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button component={Link} href="/about" variant="text" color="primary" sx={{ mt: 4 }}>
          About OBASIX
        </Button>
      </Container>
    </Box>
  );
}

export function SupportCTASection() {
  return (
    <Box component="section" sx={{ py: { xs: 10, md: 12 }, bgcolor: "background.default" }}>
      <Container>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 7 },
            display: "grid",
            gap: 4,
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.05em" }}>
              Support
            </Typography>
            <Typography variant="h3" sx={{ mt: 1.5, fontSize: { xs: "1.75rem", md: "2.25rem" }, maxWidth: 480 }}>
              Explore, customize, and request a quote with confidence.
            </Typography>
            <Typography sx={{ mt: 2, color: "text.secondary", maxWidth: 480 }}>
              Browse the catalogue, configure supported options in Design Your Board, preview boards on wall models, or
              contact us when your project needs a tailored response.
            </Typography>
          </Box>
          <Stack spacing={1.5} sx={{ alignItems: { md: "flex-end" } }}>
            <Button component={Link} href="/products" variant="contained" fullWidth sx={{ maxWidth: { md: 280 } }}>
              Explore products
            </Button>
            <Button component={Link} href="/customize" variant="outlined" fullWidth sx={{ maxWidth: { md: 280 } }}>
              Design Your Board
            </Button>
            <Button component={Link} href="/quote" variant="text" fullWidth sx={{ maxWidth: { md: 280 } }}>
              Contact / Request a quote
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary", pt: 1 }}>
              +91-9999044222 · www.obasix.com
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
