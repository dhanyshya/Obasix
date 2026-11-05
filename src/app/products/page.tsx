import { Suspense } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { ProductShowroom } from "@/components/product/ProductShowroom";

export const metadata = {
  title: "Products",
  description: "Explore OBASIX boards, stands and accessories for working spaces.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <Container sx={{ py: 10 }}>
          <Typography color="text.secondary">Loading catalogue...</Typography>
        </Container>
      }
    >
      <ProductShowroom />
    </Suspense>
  );
}
