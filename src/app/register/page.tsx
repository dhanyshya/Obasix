import type { Metadata } from "next";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <HydratingSuspense fallback={<Container sx={{ py: 8 }}>Loading registration...</Container>}>
      <RegisterForm />
    </HydratingSuspense>
  );
}
