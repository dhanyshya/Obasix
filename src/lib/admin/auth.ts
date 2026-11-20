import "server-only";

import { readSession } from "@/lib/auth/session";

/**
 * Staff access. A staff member signs in with an ordinary account whose email
 * is listed in OBASIX_ADMIN_EMAILS (comma-separated). Nothing on the client
 * decides who is staff.
 */
export function adminEmails(): string[] {
  return (process.env.OBASIX_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function readAdminSession() {
  const session = await readSession();
  if (!session) return null;
  return adminEmails().includes(session.user.email.trim().toLowerCase()) ? session : null;
}

/**
 * Call at the top of every admin page and route, before loading data.
 * A layout check alone is not enough: Next renders layouts and pages in
 * parallel, so a page's data can stream even when its layout calls notFound().
 */
export async function requireAdmin() {
  const session = await readAdminSession();
  if (!session) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return session;
}
