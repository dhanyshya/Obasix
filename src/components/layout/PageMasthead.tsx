import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";
import { pageMax, pagePad, signType } from "@/components/home/directory/sign";

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
  void tone;
  const fg = brand.charcoal;
  const soft = brand.body;

  return (
    <Box component="section" sx={{ bgcolor: brand.white, color: fg, borderBottom: `1px solid ${brand.line}` }}>
      <Box
        sx={{
          ...pageMax,
          ...pagePad,
          pt: compact ? { xs: 4, md: 6 } : { xs: 5, md: 9 },
          pb: compact ? { xs: 4, md: 6 } : { xs: 5, md: 9 },
          display: "grid",
          gap: { xs: 3.5, md: 8 },
          gridTemplateColumns: children ? { xs: "1fr", md: "minmax(0, 1.25fr) minmax(0, 1fr)" } : "1fr",
          alignItems: "end",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {crumbs?.length ? (
            <Box component="nav" aria-label="Breadcrumb" sx={{ mb: { xs: 2.5, md: 3.5 } }}>
              <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                {crumbs.map((crumb, i) => (
                  <Box component="li" key={crumb.label} sx={{ display: "inline-flex", alignItems: "center", gap: 1, fontSize: 13.5, color: brand.muted }}>
                    {crumb.href ? (
                      <Box component={Link} href={crumb.href} sx={{ color: brand.muted, transition: "color 160ms", "&:hover": { color: fg } }}>
                        {crumb.label}
                      </Box>
                    ) : (
                      <Box component="span" aria-current="page" sx={{ color: fg }}>
                        {crumb.label}
                      </Box>
                    )}
                    {i < crumbs.length - 1 ? <Box component="span" aria-hidden sx={{ color: "#B5B5AE" }}>/</Box> : null}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          {code ? (
            <Typography component="p" sx={{ fontSize: 14, fontWeight: 500, color: brand.forest, mb: 1.5 }}>
              {code}
            </Typography>
          ) : null}

          <Typography component="h1" sx={{ ...signType.title, fontSize: compact ? { xs: "2.1rem", sm: "2.6rem", md: "3.25rem" } : { xs: "2.4rem", sm: "3.2rem", md: "4.25rem" }, color: fg, maxWidth: "20ch", textWrap: "balance" }}>
            {title}
          </Typography>
          {lede ? (
            <Typography component="div" sx={{ mt: 2, maxWidth: 620, color: soft, fontSize: { xs: 16, md: 18 }, lineHeight: 1.6 }}>
              {lede}
            </Typography>
          ) : null}
        </Box>
        {children ? <Box sx={{ minWidth: 0 }}>{children}</Box> : null}
      </Box>
    </Box>
  );
}
