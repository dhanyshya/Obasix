import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The query is read here, on the server, so the form is in the page's first HTML rather than
// appearing only once JavaScript has loaded. The root layout's early-submit guard covers a
// submit made before then.
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <ResetPasswordForm token={first(query.token)} />;
}
