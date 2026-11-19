import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { readAdminSession } from "@/lib/admin/auth";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readAdminSession();
  // Signed-out visitors and customers see a plain 404: the staff area isn't advertised.
  if (!session) notFound();
  return (
    <Box sx={{ bgcolor: brand.ivory, minHeight: "70vh" }}>
      <Box sx={{ bgcolor: brand.white, borderBottom: `1px solid ${brand.line}` }}>
        <Box sx={{ ...pageMax, ...pagePad, py: 2, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box component="nav" aria-label="Staff" sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>OBASIX STAFF</Typography>
            <Box component={Link} href="/admin/associates" sx={{ fontSize: 14, fontWeight: 600 }}>Associates</Box>
            <Box component={Link} href="/admin/distributors" sx={{ fontSize: 14, fontWeight: 600 }}>Distributors</Box>
            <Box component={Link} href="/admin/partners" sx={{ fontSize: 14, fontWeight: 600 }}>Partners</Box>
            <Box component={Link} href="/admin/proofs" sx={{ fontSize: 14, fontWeight: 600 }}>Proofs</Box>
          </Box>
          <Typography sx={{ fontSize: 13, color: brand.muted }}>Signed in as {session.user.email}</Typography>
        </Box>
      </Box>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 4, md: 6 } }}>{children}</Box>
    </Box>
  );
}
