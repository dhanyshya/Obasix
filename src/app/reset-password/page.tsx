import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@mui/material/Container";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Container sx={{ py: 8 }}>Loading reset...</Container>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
