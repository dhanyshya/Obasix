import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { SignArrow, StripeSpine, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { brandTokens as brand } from "@/theme/brandTokens";

const routes = [
  { href: "/products", label: "Collections" },
  { href: "/solutions", label: "Spaces" },
  { href: "/customize", label: "Design your board" },
  { href: "/quote", label: "Start a project" },
];

export default function NotFound() {
  return (
    <Box sx={{ bgcolor: brand.white, color: brand.charcoal }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 7, md: 12 }, display: "grid", gap: { xs: 5, md: 8 }, gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, alignItems: "end" }}>
        <Box>
          <Typography sx={{ ...signType.code, fontSize: 14, color: "#164E3B" }}>ERROR 404</Typography>
          <Typography component="h1" sx={{ ...signType.mega, mt: 2, color: brand.charcoal, maxWidth: "10ch" }}>
            This way is closed.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 460, color: "#4A4F4C", fontSize: 17 }}>
            The board or page you&apos;re looking for isn&apos;t available. Pick a direction below or return home.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
            <Button component={Link} href="/products" variant="contained" endIcon={<SignArrow size={18} />}>
              Browse products
            </Button>
            <Button component={Link} href="/" variant="outlined" sx={{ "&&": { color: brand.charcoal, borderColor: "#4A4F4C", bgcolor: "transparent" } }}>
              Home
            </Button>
          </Box>
        </Box>
        <Box component="nav" aria-label="Popular destinations" sx={{ borderTop: "2px solid #E5E5E0" }}>
          {routes.map((r, i) => (
            <Box
              key={r.href}
              component={Link}
              href={r.href}
              sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.75, borderBottom: "1px solid #E5E5E0", color: "#4A4F4C", "&:hover": { color: brand.charcoal }, "&:hover svg": { transform: "translateX(4px)" } }}
            >
              <Box component="span" sx={{ ...signType.code, fontSize: 13, color: "#4A4F4C" }}>{String(i + 1).padStart(2, "0")}</Box>
              <Box component="span" sx={{ ...signType.plate, fontSize: 21, flex: 1 }}>{r.label}</Box>
              <SignArrow size={20} color={brand.forest} sx={{ transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" }} />
            </Box>
          ))}
        </Box>
      </Box>
      <StripeSpine height={4} />
    </Box>
  );
}
