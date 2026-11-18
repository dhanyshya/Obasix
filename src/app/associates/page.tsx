import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { associateCommissionRate, associateProfessions, referralWindowDays } from "@/lib/associates/program";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Associate Programme",
  description: "Architects, interior designers, brokers and contractors earn commission on OBASIX boards and signage they refer.",
};

const rate = `${associateCommissionRate * 100}%`;

const steps = [
  { title: "Register", body: "Sign in with an OBASIX account and get a personal referral code in a minute." },
  { title: "Share or prepare", body: "Send a client a referral link, or design their board or sign yourself and request the quote on their behalf." },
  { title: "Track", body: "See every referred quote and order, and where each order is in production, from your dashboard." },
  { title: "Earn", body: `${rate} of the order value (before GST and freight) becomes payable once the order is delivered.` },
];

const terms = [
  `Commission is ${rate} of the product value of each referred order, excluding GST, freight and installation.`,
  `A referral link credits you for ${referralWindowDays} days from the client's first visit. If two associates refer the same client, the first referral stands.`,
  "Each order earns one commission only. It is never shared or paid twice across associates, distributors or project partners.",
  "Orders you place for yourself, from your own account or email address, do not earn commission.",
  "Commission becomes payable when the order is delivered. Cancelled or returned orders earn nothing.",
  "Associates do not hold stock or collect payment. OBASIX invoices and ships to the client directly.",
  "Bank and tax details are collected before your first payout. Terms may be revised for the pilot after quarterly review.",
];

export default function AssociatesPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Associates"
        title={`Refer clients. Earn ${rate}.`}
        lede="For architects, interior designers, brokers, fit-out contractors and facility managers who specify boards and signage for their clients. No stock, no paperwork: we make, deliver and invoice."
        crumbs={[{ href: "/", label: "Home" }, { label: "Associate Programme" }]}
      >
        <Box
          component={Link}
          href="/account/associate"
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
          Join or open your dashboard
          <SignArrow size={18} />
        </Box>
      </PageMasthead>

      <Box component="section" aria-labelledby="how" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="how" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
          How it works
        </Typography>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mt: 3, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
          {steps.map((step, i) => (
            <Box component="li" key={step.title} sx={{ borderTop: `2px solid ${brand.charcoal}`, pt: 2 }}>
              <Typography sx={{ ...signType.code, color: brand.signalInk, fontSize: 13 }}>0{i + 1}</Typography>
              <Typography component="h3" sx={{ ...signType.plate, fontSize: "1.2rem", mt: 0.5 }}>
                {step.title}
              </Typography>
              <Typography sx={{ color: brand.body, mt: 0.75, lineHeight: 1.6, fontSize: 15 }}>{step.body}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="who" sx={{ bgcolor: brand.ivory }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1.4fr" } }}>
          <Typography id="who" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
            Who it&apos;s for
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1, color: brand.body, fontSize: 16 }}>
            {associateProfessions.map((profession) => (
              <li key={profession}>{profession}</li>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" id="terms" aria-labelledby="terms-heading" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <Typography id="terms-heading" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
          Programme terms
        </Typography>
        <Box component="ol" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1.25, maxWidth: 760, color: brand.body, lineHeight: 1.6 }}>
          {terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </Box>
        <Typography sx={{ color: brand.muted, mt: 3, fontSize: 14, maxWidth: 760 }}>
          Looking to buy and resell OBASIX stock in your city instead?{" "}
          <Link href="/quote?config=Distributor%20enquiry">Enquire about becoming a distributor</Link>.
        </Typography>
      </Box>
    </Box>
  );
}
