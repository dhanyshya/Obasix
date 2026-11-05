import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { QuoteConfirmation } from "@/components/quote/QuoteConfirmation";

export default function QuoteConfirmationPage() {
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ py: 6, maxWidth: 768 }}>
        <Suspense fallback={<Typography variant="body2">Loading confirmation...</Typography>}>
          <QuoteConfirmation />
        </Suspense>
      </Container>
    </Box>
  );
}
