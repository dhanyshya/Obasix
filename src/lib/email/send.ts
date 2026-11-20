import "server-only";

import { adminEmails } from "@/lib/admin/auth";

/**
 * Transactional email through Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Needs RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in Resend,
 * e.g. "OBASIX <orders@obasix.com>"). Staff alerts go to OBASIX_STAFF_ALERT_EMAILS,
 * or to the staff list in OBASIX_ADMIN_EMAILS when that isn't set.
 *
 * Sending is best-effort: it never throws, so an email outage can't block an
 * order, a payment or a quote.
 */
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Overridable only so tests can point at a local stand-in; never set in production. */
const apiBase = () => process.env.RESEND_API_BASE || "https://api.resend.com";

export type Email = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(email: Email): Promise<{ sent: boolean }> {
  if (!emailConfigured()) return { sent: false };
  const to = (Array.isArray(email.to) ? email.to : [email.to]).filter(Boolean);
  if (to.length === 0) return { sent: false };
  try {
    const response = await fetch(`${apiBase()}/emails`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) console.error(`Email "${email.subject}" failed: ${response.status}`);
    return { sent: response.ok };
  } catch (error) {
    console.error(`Email "${email.subject}" failed:`, error instanceof Error ? error.message : error);
    return { sent: false };
  }
}

export function staffAlertEmails() {
  const list = (process.env.OBASIX_STAFF_ALERT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : adminEmails();
}
