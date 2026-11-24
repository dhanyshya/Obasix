import type { ReactNode } from "react";
import { connection } from "next/server";

// The page is a Client Component, so it's marked per-request here: that puts the part that reads
// the address bar (useSearchParams) in the server HTML instead of a loading placeholder.
export default async function Layout({ children }: { children: ReactNode }) {
  await connection();
  return children;
}
