import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { AccountNav } from "@/components/account/AccountNav";
import { readSession } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/login?next=/account");
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Container sx={{ display: "grid", gap: 4, py: 5, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "200px minmax(0, 1fr)" } }}>
        <AccountNav />
        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </Container>
    </Box>
  );
}
