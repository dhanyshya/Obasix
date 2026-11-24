import { connection } from "next/server";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { QuoteConfirmation } from "@/components/quote/QuoteConfirmation";

export default async function QuoteConfirmationPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ py: 6, maxWidth: 768 }}>
        <HydratingSuspense fallback={<Typography variant="body2">Loading confirmation...</Typography>}>
          <QuoteConfirmation />
        </HydratingSuspense>
      </Container>
    </Box>
  );
}
