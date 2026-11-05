import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@mui/material/Container";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<Container sx={{ py: 8 }}>Loading sign in...</Container>}>
      <LoginForm />
    </Suspense>
  );
}
