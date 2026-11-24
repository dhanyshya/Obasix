import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The query is read here, on the server, so the form is in the page's first HTML rather than
// appearing only once JavaScript has loaded. The root layout's early-submit guard covers a
// submit made before then.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <RegisterForm nextPath={first(query.next)} />;
}
