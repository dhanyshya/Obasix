import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { distributorTiers, minimumTradeOrder, territoryReviewMonths } from "@/lib/distributors/program";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Become a Distributor",
  description: "Stock and resell OBASIX boards in your city at trade price, with credit terms and quarterly territory reviews.",
};

const terms = [
  "Trade prices are a fixed discount off the OBASIX list price, set by your tier. GST and freight are added on the invoice.",
  `The minimum trade order is ${formatPrice(minimumTradeOrder)} at trade price.`,
  "Credit limits are set at approval and reviewed with your account. Orders beyond available credit are paid in advance against a proforma invoice.",
  `Territories are assigned on performance and reviewed every ${territoryReviewMonths} months against an agreed purchase target. No territory is permanently exclusive.`,
  "Trade orders don't carry associate commission. Each sale is paid out through one channel only.",
  "Distributors may resell at any price up to the OBASIX list price.",
  "These are pilot terms and may be revised at quarterly review.",
];

export default function DistributorsPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Distributors"
        title="Stock OBASIX in your city"
        lede="Buy boards at trade price, supply schools, offices and institutions in your area, and grow your territory quarter by quarter."
        crumbs={[{ href: "/", label: "Home" }, { label: "Become a Distributor" }]}
      >
        <Box
          component={Link}
          href="/account/distributor"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 3,
            py: 1.5,
            borderRadius: 999,
            bgcolor: brand.forest,
            color: `${brand.white} !important`,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { bgcolor: brand.forestDark },
            "&:focus-visible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
          }}
        >
          Apply or open your trade account
          <SignArrow size={18} />
        </Box>
      </PageMasthead>

      <Box component="section" aria-labelledby="tiers" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="tiers" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
          Trade tiers
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 3, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
          {distributorTiers.map((tier) => (
            <Box component="li" key={tier.id} sx={{ border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 3 }}>
              <Typography sx={{ ...signType.code, color: brand.signalInk, fontSize: 13, textTransform: "uppercase" }}>{tier.name}</Typography>
              <Typography sx={{ ...signType.plate, fontSize: "2.4rem", mt: 0.5 }}>{Math.round(tier.discount * 100)}%</Typography>
              <Typography sx={{ color: brand.muted, fontSize: 14 }}>off list price</Typography>
              <Typography sx={{ color: brand.body, mt: 1.5, fontSize: 15 }}>{tier.description}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="section" id="terms" aria-labelledby="terms-heading" sx={{ bgcolor: brand.ivory }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
          <Typography id="terms-heading" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
            Distributor terms
          </Typography>
          <Box component="ol" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1.25, maxWidth: 760, color: brand.body, lineHeight: 1.6 }}>
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </Box>
          <Typography sx={{ color: brand.muted, mt: 3, fontSize: 14, maxWidth: 760 }}>
            Don&apos;t want to hold stock? <Link href="/associates">Join the associate programme</Link> and earn commission on referrals instead.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
