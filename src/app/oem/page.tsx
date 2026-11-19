import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "OEM & Private Label",
  description: "Whiteboards, pin-up boards and display products made by OBASIX under your brand, for retailers, office-supply brands and institutional suppliers.",
};

const enquiryHref = `/quote?${new URLSearchParams({
  boardType: "OEM / Private Label",
  config: "OEM / private-label enquiry",
  notes: "Products and sizes: \nYour brand and packaging: \nExpected yearly volume: \nMarkets or channels you sell in: ",
}).toString()}`;

const offer = [
  { title: "Your brand, our factory", body: "Writing boards, pin-up and notice boards, stands and accessories made at our factory and finished with your brand." },
  { title: "Branding and packaging", body: "Your logo on the frame or surface, your labels and your packaging. We send a proof of every branded element before production." },
  { title: "Built from our range", body: "Private-label lines are built from the materials, frames and sizes we already make, which keeps quality consistent and lead times short." },
];

const steps = [
  { title: "Send an enquiry", body: "Tell us the products, sizes, branding, yearly volume and where you sell." },
  { title: "Samples and pricing", body: "We quote per SKU and make branded samples for your approval." },
  { title: "Agreement", body: "Volumes, prices, payment and any exclusivity are set out in a written supply agreement." },
  { title: "Production", body: "We make to an agreed schedule, with a proof approved before each new design runs." },
];

const terms = [
  "OEM and private-label supply needs a minimum yearly volume, agreed per product line.",
  "Prices are agreed per SKU and hold for the term of the agreement. We don't price below agreed floors for any volume.",
  "Supply runs against advance payment or an agreed payment security, such as a letter of credit for export.",
  "Exclusivity, if any, is limited to named products and markets for a fixed term, and reviewed against volumes.",
  "Designs you supply remain yours. Our own designs, moulds and tooling remain ours unless the agreement says otherwise.",
  "Every agreement is reviewed by OBASIX management before signing. These are the starting terms, not an offer.",
];

export default function OemPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="OEM & private label"
        title="Made by OBASIX, sold under your brand"
        lede="For retailers, office-supply brands, e-commerce sellers and institutional suppliers who want reliable boards and display products with their own name on them."
        crumbs={[{ href: "/", label: "Home" }, { label: "OEM & Private Label" }]}
      >
        <Box
          component={Link}
          href={enquiryHref}
          sx={{
            display: "inline-flex", alignItems: "center", gap: 1, px: 3, py: 1.5, borderRadius: 999,
            bgcolor: brand.forest, color: `${brand.white} !important`, fontWeight: 600, textDecoration: "none",
            "&:hover": { bgcolor: brand.forestDark },
            "&:focus-visible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
          }}
        >
          Send an OEM enquiry
          <SignArrow size={18} />
        </Box>
      </PageMasthead>

      <Box component="section" aria-labelledby="offer" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="offer" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>What we make for you</Typography>
        <Box sx={{ mt: 3, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
          {offer.map((item) => (
            <Box key={item.title} sx={{ borderTop: `2px solid ${brand.charcoal}`, pt: 2 }}>
              <Typography component="h3" sx={{ ...signType.plate, fontSize: "1.2rem" }}>{item.title}</Typography>
              <Typography sx={{ color: brand.body, mt: 0.75, lineHeight: 1.6, fontSize: 15 }}>{item.body}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ color: brand.muted, mt: 3, fontSize: 14, maxWidth: 760 }}>
          OBASIX is also a registered OEM on the Government e-Marketplace (GeM).
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="how" sx={{ bgcolor: brand.ivory }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
          <Typography id="how" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>How it works</Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mt: 3, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
            {steps.map((step, i) => (
              <Box component="li" key={step.title} sx={{ borderTop: `2px solid ${brand.charcoal}`, pt: 2 }}>
                <Typography sx={{ ...signType.code, color: brand.signalInk, fontSize: 13 }}>0{i + 1}</Typography>
                <Typography component="h3" sx={{ ...signType.plate, fontSize: "1.2rem", mt: 0.5 }}>{step.title}</Typography>
                <Typography sx={{ color: brand.body, mt: 0.75, lineHeight: 1.6, fontSize: 15 }}>{step.body}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" id="terms" aria-labelledby="terms-heading" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="terms-heading" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>Supply terms</Typography>
        <Box component="ol" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1.25, maxWidth: 760, color: brand.body, lineHeight: 1.6 }}>
          {terms.map((term) => <li key={term}>{term}</li>)}
        </Box>
        <Typography sx={{ color: brand.muted, mt: 3, fontSize: 14, maxWidth: 760 }}>
          Reselling OBASIX-branded products instead? <Link href="/distributors">Become a distributor</Link>. Delivering a whole site?{" "}
          <Link href="/partners">Become a project partner</Link>.
        </Typography>
      </Box>
    </Box>
  );
}
