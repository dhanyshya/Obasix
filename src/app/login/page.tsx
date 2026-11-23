import type { Metadata } from "next";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <HydratingSuspense fallback={<Container sx={{ py: 8 }}>Loading sign in...</Container>}>
      <LoginForm />
    </HydratingSuspense>
  );
}
