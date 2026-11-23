import type { Metadata } from "next";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ConfirmationExperience } from "@/components/checkout/ConfirmationExperience";

export const metadata: Metadata = {
  title: "Order confirmation",
};

export default function ConfirmationPage() {
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
