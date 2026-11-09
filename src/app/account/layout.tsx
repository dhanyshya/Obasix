import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AccountNav } from "@/components/account/AccountNav";
import { pageMax, pagePad, signType, StripeSpine } from "@/components/home/directory/sign";
import { readSession } from "@/lib/auth/session";
import { brandTokens as brand } from "@/theme/brandTokens";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login?next=/account");
  return (
    <Box sx={{ bgcolor: brand.ivory }}>
      <Box sx={{ bgcolor: brand.forestDeep, color: brand.white }}>
        <Box sx={{ ...pageMax, ...pagePad, pt: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
            <Box aria-hidden sx={{ width: 10, height: 10, bgcolor: brand.signal }} />
            <Typography sx={{ ...signType.code, fontSize: 13, color: "#FFC59E" }}>YOUR ACCOUNT</Typography>
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <AccountNav />
          </Box>
        </Box>
        <StripeSpine height={4} />
      </Box>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 4, md: 6 }, minHeight: "50vh" }}>
        <Box sx={{ maxWidth: 1080, minWidth: 0 }}>{children}</Box>
      </Box>
    </Box>
  );
}
