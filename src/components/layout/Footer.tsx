import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NextLink from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/products", label: "Collections" },
      { href: "/solutions", label: "Spaces" },
      { href: "/customize", label: "Customise" },
      { href: "/visualize", label: "Visualise" },
      { href: "/about#studio", label: "Studio" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About OBASIX" },
      { href: "/smart-space", label: "Smart Space" },
      { href: "/quote", label: "Start a Project" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/orders/track", label: "Track an Order" },
      { href: "/account/wishlist", label: "Wishlist" },
      { href: "/cart", label: "Cart" },
      { href: "/account", label: "Account" },
    ],
  },
];

const footerLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 38,
  color: "rgba(247,245,240,0.6)",
  fontSize: 12.5,
  lineHeight: 1.4,
  transition: "color 0.2s ease, transform 0.2s ease",
  "&:hover": { color: brand.ivory, transform: "translateX(3px)" },
  "&:focus-visible": { outline: `1px solid ${brand.oak}`, outlineOffset: 2 },
} as const;

const contactLinkSx = {
  display: "inline-block",
  color: "rgba(247,245,240,0.72)",
  fontSize: 13.5,
  lineHeight: 1.6,
  transition: "color 0.2s ease",
  "&:hover": { color: brand.oak },
  "&:focus-visible": { outline: `1px solid ${brand.oak}`, outlineOffset: 2 },
} as const;

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        position: "relative",
        overflow: "hidden",
        bgcolor: brand.charcoal,
        color: brand.ivory,
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
          pt: { xs: 7, md: 10 },
          pb: { xs: 4, md: 5 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
            gap: { xs: 6, md: 4 },
            pb: { xs: 6, md: 8 },
            borderBottom: "1px solid rgba(247,245,240,0.12)",
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 5" }, maxWidth: 390 }}>
            <Box
              component={NextLink}
              href="/"
              aria-label="OBASIX home"
              sx={{
                display: "inline-flex",
                "&:focus-visible": { outline: `2px solid ${brand.oak}`, outlineOffset: 4 },
              }}
            >
              <Image
                src="/assets/obasix-logo-official.png"
                alt="OBASIX"
                width={550}
                height={182}
                sizes="210px"
                style={{ display: "block", width: 210, height: "auto" }}
              />
            </Box>
            <Typography
              sx={{
                mt: 2.5,
                maxWidth: 330,
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: 23,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: brand.ivory,
              }}
            >
              Boards for Working Spaces.
            </Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 320, fontSize: 13, lineHeight: 1.75, color: "rgba(247,245,240,0.52)" }}>
              Thoughtfully designed writing surfaces and workspace solutions for environments where people
              work, learn, collaborate and create.
            </Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 320, fontSize: 11.5, lineHeight: 1.7, color: "rgba(247,245,240,0.42)" }}>
              Designed in India. Made to your requirements.
            </Typography>

            <Box sx={{ mt: 3.5 }}>
              <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(247,245,240,0.38)" }}>
                Talk to us
              </Typography>
              <Stack spacing={0.35} sx={{ mt: 1.5 }}>
                <Box component="a" href="tel:+919999044222" sx={contactLinkSx}>
                  +91 9999 044 222
                </Box>
                <Box component="a" href="mailto:info@obasix.com" sx={contactLinkSx}>
                  info@obasix.com
                </Box>
                <Typography sx={{ pt: 0.75, fontSize: 11.5, lineHeight: 1.65, color: "rgba(247,245,240,0.38)", maxWidth: 280 }}>
                  1105, 11th Floor, Ansal Bhawan, 16 KG Marg, New Delhi 110001
                </Typography>
              </Stack>
            </Box>

            <Box
              component={NextLink}
              href="/quote"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                mt: 3,
                pb: 0.75,
                minHeight: 44,
                borderBottom: `1px solid ${brand.oak}`,
                color: brand.oak,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                transition: "color 0.2s ease, gap 0.2s ease",
                "&:hover": { color: brand.ivory, gap: 1.5 },
                "&:focus-visible": { outline: `2px solid ${brand.oak}`, outlineOffset: 3 },
              }}
            >
              Start a project
              <ArrowForwardIcon sx={{ fontSize: 15 }} aria-hidden />
            </Box>
          </Box>

          <Box
            sx={{
              gridColumn: { md: "6 / 13" },
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
              gap: { xs: 4, sm: 3 },
            }}
          >
            {columns.map((column) => (
              <Box key={column.title}>
                <Typography
                  sx={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(247,245,240,0.4)",
                  }}
                >
                  {column.title}
                </Typography>
                <Stack component="nav" aria-label={column.title} spacing={0.1} sx={{ mt: 1.5 }}>
                  {column.links.map((link) => (
                    <Box key={link.href} component={NextLink} href={link.href} sx={footerLinkSx}>
                      {link.label}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            pt: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 10.5, letterSpacing: "0.06em", color: "rgba(247,245,240,0.38)" }}>
            © 2026 OBASIX Industries Pvt. Ltd. All Rights Reserved.
          </Typography>
          <Typography sx={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(247,245,240,0.34)" }}>
            A HSN Group company
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}
