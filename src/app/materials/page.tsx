import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { materialRanges } from "@/data/materials";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Glass, Cork, Felt and Fabric Boards",
  description: "Made-to-order glass writing boards and cork, felt and multicolour fabric pin-up boards, sized and coloured for your space.",
};

export default function MaterialsPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Made to order"
        title="Glass, cork, felt and fabric."
        lede="Writing and pin-up surfaces made to your size and colour. Choose the size, colour and finish, and we'll quote it and send a proof before we make it."
        crumbs={[{ href: "/", label: "Home" }, { label: "Glass, Cork, Felt & Fabric" }]}
      />
      <Box component="section" aria-label="Ranges" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" } }}>
        {materialRanges.map((range) => (
          <Box
            key={range.slug}
            component={Link}
            href={`/materials/${range.slug}`}
            sx={{
              display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit",
              border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, overflow: "hidden",
              transition: "border-color 200ms ease",
              "&:hover": { borderColor: brand.charcoal },
              "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
            }}
          >
            <Box aria-hidden sx={{ display: "flex", height: 120 }}>
              {range.colours.slice(0, 6).map((c) => <Box key={c.id} sx={{ flex: 1, bgcolor: c.hex }} />)}
            </Box>
            <Box sx={{ p: 2.5, display: "grid", gap: 1, flex: 1, alignContent: "start" }}>
              <Typography sx={{ ...signType.code, fontSize: 12, color: brand.signalInk }}>{range.tagline}</Typography>
              <Typography component="h2" sx={{ ...signType.plate, fontSize: 24 }}>{range.name}</Typography>
              <Typography sx={{ color: brand.body, fontSize: 15, lineHeight: 1.6 }}>{range.summary}</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto", pt: 1.5 }}>
                <Typography sx={{ fontSize: 14, color: brand.muted }}>{range.colours.length} colours · priced on quote</Typography>
                <SignArrow size={20} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ ...pageMax, ...pagePad, pb: { xs: 6, md: 8 } }}>
        <Typography sx={{ color: brand.muted, fontSize: 14, maxWidth: 760 }}>
          Looking for a board you can order today? Our <Link href="/products">whiteboards, ceramic and pin-up boards</Link> ship from stock.
        </Typography>
      </Box>
    </Box>
  );
}
