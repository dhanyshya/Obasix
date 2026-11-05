import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@mui/material/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<Container sx={{ py: 8 }}>Loading registration...</Container>}>
      <RegisterForm />
    </Suspense>
  );
}
