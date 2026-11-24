import { connection } from "next/server";
import type { Metadata } from "next";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ConfirmationExperience } from "@/components/checkout/ConfirmationExperience";

export const metadata: Metadata = {
  title: "Order confirmation",
};

export default async function ConfirmationPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <HydratingSuspense
      fallback={
        <Container sx={{ py: 10 }}>
          <Typography color="text.secondary">Loading confirmation…</Typography>
        </Container>
      }
    >
      <ConfirmationExperience />
    </HydratingSuspense>
  );
}
