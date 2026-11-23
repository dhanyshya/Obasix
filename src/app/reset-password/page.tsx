import type { Metadata } from "next";
import { HydratingSuspense } from "@/components/HydratingSuspense";
import Container from "@mui/material/Container";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <HydratingSuspense fallback={<Container sx={{ py: 8 }}>Loading reset...</Container>}>
      <ResetPasswordForm />
    </HydratingSuspense>
  );
}
