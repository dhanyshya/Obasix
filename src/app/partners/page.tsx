import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { formatPrice } from "@/lib/format";
import { minimumProjectValue, partnerTypes, projectProtectionDays, projectSectors } from "@/lib/partners/program";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Project Partners",
  description: "Contractors, facility managers and developers deliver OBASIX boards and signage across whole institutions, with a negotiated margin on every project.",
};

const steps = [
  { title: "Register the project", body: `Tell us the client, site, scope and expected value. The project is reserved for you for ${projectProtectionDays} days.` },
  { title: "We quote together", body: "Our projects team prices the scope, from classroom boards to building signage, and agrees your margin for that project." },
  { title: "You manage the client", body: "You lead the client relationship and the site. We manufacture at Kharkhoda and deliver to schedule." },
  { title: "Get paid on delivery", body: "Your negotiated margin on the final project value becomes payable once the project is delivered." },
];

const terms = [
  `Projects start at ${formatPrice(minimumProjectValue)} before GST, freight and installation. Smaller orders go through the website or the associate programme.`,
  `The first partner to register a client in a city is protected for ${projectProtectionDays} days. Later registrations for the same client are held for review.`,
  "Your margin is negotiated per project and confirmed in writing with the quote. It's earned on the final quoted value.",
  "Margin becomes payable when the project is delivered. Lost or cancelled projects earn nothing.",
  "Each order earns one payout only. A project can't also earn associate commission, and partner projects aren't bought at distributor trade price.",
  "OBASIX invoices the client directly unless agreed otherwise in the quote.",
  "These are pilot terms and may be revised at quarterly review.",
];

export default function PartnersPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Project partners"
        title="Deliver whole institutions with OBASIX"
        lede="For partners who bring bulk orders and manage the customer's project: schools, hospitals, hotels, co-working floors and residential towers."
        crumbs={[{ href: "/", label: "Home" }, { label: "Project Partners" }]}
      >
        <Box
          component={Link}
          href="/account/partner"
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
          Apply or open your projects
          <SignArrow size={18} />
        </Box>
      </PageMasthead>

      <Box component="section" aria-labelledby="how" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
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

      <Box component="section" aria-labelledby="who" sx={{ bgcolor: brand.ivory }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Box>
            <Typography id="who" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>Who partners with us</Typography>
            <Box component="ul" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1, color: brand.body }}>
              {partnerTypes.filter((t) => t !== "Other").map((t) => <li key={t}>{t}</li>)}
            </Box>
          </Box>
          <Box>
            <Typography component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>Projects we deliver</Typography>
            <Box component="ul" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1, color: brand.body }}>
              {projectSectors.filter((s) => s !== "Other").map((s) => <li key={s}>{s}</li>)}
            </Box>
            <Typography sx={{ color: brand.muted, mt: 2, fontSize: 14 }}>
              Start from a <Link href="/kits">solution kit</Link> and scale it to the whole site.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box component="section" id="terms" aria-labelledby="terms-heading" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="terms-heading" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>Partner terms</Typography>
        <Box component="ol" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1.25, maxWidth: 760, color: brand.body, lineHeight: 1.6 }}>
          {terms.map((term) => <li key={term}>{term}</li>)}
        </Box>
        <Typography sx={{ color: brand.muted, mt: 3, fontSize: 14, maxWidth: 760 }}>
          Referring individual clients instead? <Link href="/associates">Join the associate programme</Link>. Stocking boards to resell?{" "}
          <Link href="/distributors">Become a distributor</Link>.
        </Typography>
      </Box>
    </Box>
  );
}
