import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";
import { SignArrow } from "@/components/home/directory/sign";

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
  color: brand.body,
  fontSize: 14.5,
  lineHeight: 1.4,
  transition: "color 180ms ease, box-shadow 220ms cubic-bezier(0.16,1,0.3,1)",
  boxShadow: "inset 0 -1px 0 transparent",
  "&:hover": { color: brand.charcoal, textDecoration: "underline", textUnderlineOffset: 3 },
  "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 2 },
} as const;

const contactLinkSx = {
  display: "inline-block",
  color: brand.charcoal,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.7,
  transition: "color 180ms ease",
  "&:hover": { color: brand.forest },
  "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 2 },
} as const;

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        position: "relative",
        overflow: "hidden",
        bgcolor: brand.ivory,
        color: brand.charcoal,
        borderTop: `1px solid ${brand.line}`,
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
            borderBottom: `1px solid ${brand.line}`,
          }}
        >
          <Box sx={{ gridColumn: { md: "1 / 5" }, maxWidth: 390 }}>
            <Box
              component={NextLink}
              href="/"
              aria-label="OBASIX home"
              sx={{
                display: "inline-flex",
                "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 4 },
              }}
            >
              <Image
                src="/assets/obasix-logo-official.png"
                alt="OBASIX"
                width={550}
                height={182}
                sizes="150px"
                style={{ display: "block", width: 150, height: "auto" }}
              />
            </Box>
            <Typography
              sx={{
                mt: 2.5,
                maxWidth: 330,
                fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                fontSize: 24,
                fontWeight: 600,
                                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: brand.charcoal,
              }}
            >
              Boards for Working Spaces.
            </Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 320, fontSize: 14.5, lineHeight: 1.7, color: brand.body }}>
              Whiteboards, notice boards, stands and accessories, made at our factory in Bawana, Delhi.
            </Typography>
            <Typography sx={{ mt: 1.25, maxWidth: 320, fontSize: 14, lineHeight: 1.7, color: brand.body }}>
              Custom sizes, logos and bulk orders quoted on request.
            </Typography>

            <Box sx={{ mt: 3.5 }}>
              <Typography sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: brand.body }}>
                Talk to us
              </Typography>
              <Stack spacing={0.35} sx={{ mt: 1.5 }}>
                <Box component="a" href="tel:+919999044222" sx={contactLinkSx}>
                  +91 9999 044 222
                </Box>
                <Box component="a" href="mailto:info@obasix.com" sx={contactLinkSx}>
                  info@obasix.com
                </Box>
                <Typography sx={{ pt: 0.75, fontSize: 13.5, lineHeight: 1.65, color: brand.body, maxWidth: 280 }}>
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
                
                color: brand.charcoal,
                fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                transition: "color 180ms ease",
                "&:hover": { color: brand.forest },
                "&:hover svg": { transform: "translateX(4px)" },
                "& svg": { transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" },
                "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
              }}
            >
              Start a project
              <SignArrow size={16} color={brand.forest} />
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
                  component="h2"
                  sx={{ fontSize: 14, fontWeight: 600, color: brand.charcoal, pb: 0.5 }}
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
          <Typography sx={{ fontSize: 12.5, color: brand.body }}>
            © 2026 OBASIX Industries Pvt. Ltd. All Rights Reserved.
          </Typography>
          <Typography sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: brand.body }}>
            A HSN Group company
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}
