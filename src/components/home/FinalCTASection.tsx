"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { useAIChat } from "@/context/AIChatContext";
import { Reveal } from "@/components/motion/Reveal";

export function FinalCTASection() {
  const { openChat } = useAIChat();

  return (
    <Box component="section" sx={{ borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
      <Container sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ mx: "auto", maxWidth: 672, textAlign: "center" }}>
          <Reveal>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.85rem" }, lineHeight: { md: 1.1 }, letterSpacing: "-0.03em" }}
            >
              Have a space in mind?
            </Typography>
          </Reveal>
          <Reveal delay={100}>
            <Typography
              sx={{ mx: "auto", mt: 2.5, maxWidth: 512, fontSize: { xs: 16, md: 18 }, lineHeight: 1.7, color: "text.secondary" }}
            >
              Tell us what you&apos;re building. We&apos;ll help you choose the right board, size and setup.
            </Typography>
          </Reveal>
          <Reveal delay={180}>
            <Stack direction="row" useFlexGap spacing={1.5} sx={{ mt: 5, flexWrap: "wrap", justifyContent: "center" }}>
              <Button
                component={Link}
                href="/quote"
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon fontSize="small" />}
              >
                Get a Custom Quote
              </Button>
              <Button
                type="button"
                onClick={openChat}
                variant="outlined"
                color="primary"
                size="large"
                endIcon={<ArrowForwardIcon fontSize="small" />}
              >
                Talk to OBASIX
              </Button>
            </Stack>
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
