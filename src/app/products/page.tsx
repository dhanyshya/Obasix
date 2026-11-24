import { connection } from "next/server";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ProductShowroom } from "@/components/product/ProductShowroom";

export const metadata = {
  title: "Products",
  description: "Explore OBASIX boards, stands and accessories for working spaces.",
};

export default async function ProductsPage() {
  // Rendered per request so the part that reads the address bar (useSearchParams) is in the
  // server HTML; prerendered, it was a loading placeholder until JavaScript arrived.
  await connection();
  return (
    <HydratingSuspense
      fallback={
        <Container sx={{ py: 10 }}>
          <Typography color="text.secondary">Loading catalogue...</Typography>
        </Container>
      }
    >
      <ProductShowroom />
    </HydratingSuspense>
  );
}
