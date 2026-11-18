import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { getProductById } from "@/data/catalogue";
import { kits, lineQuantity } from "@/data/kits";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Solution Kits",
  description: "Workplace, Education and Residential Identity kits: boards, accessories and signage planned per room or home, in one order.",
};

function fromPrice(kitId: string) {
  const kit = kits.find((k) => k.id === kitId)!;
  return kit.products
    .filter((line) => !line.optional && line.per === "unit")
    .reduce((sum, line) => sum + getProductById(line.productId)!.price * lineQuantity(line, 1), 0);
}

export default function KitsPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Kits"
        title="One order for the whole space."
        lede="Boards, accessories and signage planned together for each meeting room, classroom or home. Set how many you're fitting out and we'll size the kit."
        crumbs={[{ href: "/", label: "Home" }, { label: "Solution Kits" }]}
      />
      <Box component="section" aria-label="Kits" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {kits.map((kit) => (
          <Box
            key={kit.id}
            component={Link}
            href={`/kits/${kit.id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              textDecoration: "none",
              color: "inherit",
              border: `1px solid ${brand.line}`,
              borderRadius: `${brand.radius}px`,
              overflow: "hidden",
              transition: "border-color 200ms ease",
              "&:hover": { borderColor: brand.charcoal },
              "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
            }}
          >
            <Box component="img" src={kit.image} alt="" sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
            <Box sx={{ p: 2.5, display: "grid", gap: 1, flex: 1, alignContent: "start" }}>
              <Typography sx={{ ...signType.code, fontSize: 12, color: brand.signalInk }}>{kit.audience}</Typography>
              <Typography component="h2" sx={{ ...signType.plate, fontSize: 24 }}>{kit.name}</Typography>
              <Typography sx={{ color: brand.body, fontSize: 15, lineHeight: 1.6 }}>{kit.summary}</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto", pt: 1.5 }}>
                <Typography sx={{ fontSize: 14, color: brand.muted }}>
                  Boards from {formatPrice(fromPrice(kit.id))} per {kit.unit.singular}
                </Typography>
                <SignArrow size={20} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ ...pageMax, ...pagePad, pb: { xs: 6, md: 8 } }}>
        <Typography sx={{ color: brand.muted, fontSize: 14, maxWidth: 760 }}>
          Fitting out ten or more rooms or homes? Kits of that size are quoted with project pricing and one delivery schedule. Architects and
          contractors specifying kits for clients can <Link href="/associates">join the associate programme</Link>.
        </Typography>
      </Box>
    </Box>
  );
}
