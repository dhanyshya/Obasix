import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";
import { SignArrow, StripeSpine, pageMax, pagePad, signType } from "@/components/home/directory/sign";

type Crumb = { href?: string; label: string };

/**
 * The inner-page masthead: a deep-green directory panel with a sign code,
 * a heavy title and an optional lede. One per page, carries the page's h1.
 */
export function PageMasthead({
  code,
  title,
  lede,
  crumbs,
  tone = "dark",
  children,
  compact,
}: {
  /** Short wayfinding label, e.g. "Cart" or "Account". */
  code?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  crumbs?: Crumb[];
  tone?: "dark" | "light";
  /** Optional right-hand slot: actions, stats, a summary. */
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const dark = tone === "dark";
  const fg = dark ? brand.white : brand.charcoal;
  const soft = dark ? "rgba(255,255,255,0.8)" : brand.body;

  return (
    <Box component="section" sx={{ bgcolor: dark ? brand.forestDeep : brand.ivory, color: fg, position: "relative", overflow: "hidden" }}>
      {/* Faint ruled grid, like a sign-shop layout board */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.045)" : "rgba(20,25,23,0.045)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.045)" : "rgba(20,25,23,0.045)"} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(90deg, transparent 0%, #000 55%, #000 100%)",
        }}
      />
      <Box
        sx={{
          ...pageMax,
          ...pagePad,
          position: "relative",
          pt: compact ? { xs: 3.5, md: 5 } : { xs: 4.5, md: 7 },
          pb: compact ? { xs: 3.5, md: 5 } : { xs: 5, md: 8 },
          display: "grid",
          gap: { xs: 3, md: 6 },
          gridTemplateColumns: children ? { xs: "1fr", md: "minmax(0, 1.4fr) minmax(0, 1fr)" } : "1fr",
          alignItems: "end",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {crumbs?.length ? (
            <Box component="nav" aria-label="Breadcrumb" sx={{ mb: 2.5 }}>
              <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                {crumbs.map((crumb, i) => (
                  <Box component="li" key={crumb.label} sx={{ display: "inline-flex", alignItems: "center", gap: 1, ...signType.code, fontSize: 12.5, color: soft }}>
                    {crumb.href ? (
                      <Box component={Link} href={crumb.href} sx={{ color: soft, "&:hover": { color: fg, textDecoration: "underline", textUnderlineOffset: 3 } }}>
                        {crumb.label}
                      </Box>
                    ) : (
                      <Box component="span" aria-current="page" sx={{ color: fg }}>
                        {crumb.label}
                      </Box>
                    )}
                    {i < crumbs.length - 1 ? <SignArrow size={12} color={dark ? "rgba(255,255,255,0.5)" : brand.muted} /> : null}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          {code ? (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, mb: 2 }}>
              <Box aria-hidden sx={{ width: 10, height: 10, bgcolor: brand.signal }} />
              <Typography component="p" sx={{ ...signType.code, fontSize: 13, color: dark ? "#FFC59E" : brand.signalInk, textTransform: "uppercase" }}>
                {code}
              </Typography>
            </Box>
          ) : null}

          <Typography component="h1" sx={{ ...signType.title, fontSize: compact ? { xs: "2rem", sm: "2.5rem", md: "3rem" } : signType.title.fontSize, color: fg, maxWidth: "18ch", textWrap: "balance" }}>
            {title}
          </Typography>
          {lede ? (
            <Typography component="div" sx={{ mt: 2, maxWidth: 600, color: soft, fontSize: { xs: 15.5, md: 17.5 }, lineHeight: 1.6 }}>
              {lede}
            </Typography>
          ) : null}
        </Box>
        {children ? <Box sx={{ minWidth: 0 }}>{children}</Box> : null}
      </Box>
      <StripeSpine height={4} />
    </Box>
  );
}
