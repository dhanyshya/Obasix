import "server-only";

import { company } from "@/data/company";
import type { DemoOrder } from "@/lib/commerce/demo-orders";
import { formatPrice } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import type { Email } from "@/lib/email/send";

type Message = Omit<Email, "to">;

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One plain, readable layout for every message. Body lines are escaped here. */
function layout(title: string, paragraphs: string[], action?: { label: string; href: string }): { html: string; text: string } {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escape(p)}</p>`).join("");
  const button = action
    ? `<p style="margin:20px 0"><a href="${escape(action.href)}" style="background:#164E3B;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${escape(action.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#F4F2EC;font-family:Helvetica,Arial,sans-serif;color:#1F2421">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="font-weight:800;letter-spacing:0.04em;color:#164E3B;margin:0 0 18px">OBASIX</p>
<div style="background:#fff;border-radius:12px;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${escape(title)}</h1>${body}${button}
</div>
<p style="font-size:12px;color:#6B706D;margin:16px 0 0">${escape(`${company.legalName} · ${company.email} · ${company.phoneDisplay}`)}</p>
</div></body></html>`;
  const text = [title, "", ...paragraphs, ...(action ? ["", `${action.label}: ${action.href}`] : [])].join("\n");
  return { html, text };
}

const itemsList = (order: DemoOrder) => order.items.map((i) => `${i.quantity} × ${i.name} — ${formatPrice(i.lineTotal)}`);
const address = (order: DemoOrder) =>
  [order.shippingAddress?.line, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postal].filter(Boolean).join(", ");

export function orderConfirmationEmail(order: DemoOrder): Message {
  return {
    subject: `Order ${order.id} confirmed`,
    ...layout(
      `Thank you, ${order.customerName}. Your order is confirmed.`,
      [
        `Order ${order.id} · paid ${formatPrice(order.subtotal)}`,
        ...itemsList(order),
        `Delivering to: ${address(order)}`,
        "We'll email you the courier and tracking number when it's dispatched.",
      ],
      { label: "Track your order", href: `${siteUrl}/orders/track` },
    ),
    replyTo: company.email,
  };
}

export function orderDispatchedEmail(order: DemoOrder): Message {
  return {
    subject: `Order ${order.id} is on its way`,
    ...layout(
      `Your order ${order.id} has been dispatched.`,
      [`Courier: ${order.courier ?? "—"}`, `Tracking number: ${order.trackingNumber ?? "—"}`, ...itemsList(order)],
      { label: "Track your order", href: `${siteUrl}/orders/track` },
    ),
    replyTo: company.email,
  };
}

export function staffNewOrderEmail(order: DemoOrder): Message {
  return {
    subject: `New paid order ${order.id} · ${formatPrice(order.subtotal)}`,
    ...layout(
      `New paid order ${order.id}`,
      [`${order.customerName} · ${order.email} · ${order.phone}`, ...itemsList(order), `Ship to: ${address(order)}`],
      { label: "Open orders", href: `${siteUrl}/admin/orders` },
    ),
  };
}

export function passwordResetEmail(link: string): Message {
  return {
    subject: "Reset your OBASIX password",
    ...layout(
      "Reset your password",
      ["Someone asked to reset the password for this account. The link works once and expires in 30 minutes.", "If it wasn't you, ignore this email; your password stays the same."],
      { label: "Choose a new password", href: link },
    ),
  };
}

export function quoteReceivedEmail(input: { reference: string; name: string; summary: string }): Message {
  return {
    subject: `We've received your quote request ${input.reference}`,
    ...layout(
      `Thank you, ${input.name}. We've received your request.`,
      [`Reference: ${input.reference}`, input.summary, "Our team will reply with a price and lead time. For custom work we'll send a design proof for your approval before anything is made."],
    ),
    replyTo: company.email,
  };
}

export function staffNewQuoteEmail(input: { reference: string; name: string; company: string; email: string; phone: string; summary: string }): Message {
  return {
    subject: `New quote request ${input.reference}`,
    ...layout(
      `New quote request ${input.reference}`,
      [`${input.name}${input.company ? ` · ${input.company}` : ""} · ${input.email} · ${input.phone}`, input.summary],
      { label: "Open quotes", href: `${siteUrl}/admin/quotes?q=${encodeURIComponent(input.reference)}` },
    ),
    replyTo: input.email,
  };
}

export function proofReadyEmail(input: { reference: string; version: number; note: string }): Message {
  return {
    subject: `Your design proof for ${input.reference} is ready`,
    ...layout(
      `Proof version ${input.version} is ready for your review`,
      [
        `Quote ${input.reference}`,
        ...(input.note ? [`From our team: ${input.note}`] : []),
        "Check every word, size and colour. We make it exactly as the version you approve.",
      ],
      { label: "Review the proof", href: `${siteUrl}/account/proofs` },
    ),
    replyTo: company.email,
  };
}

export function staffProofDecisionEmail(input: { reference: string; version: number; decision: "approved" | "changes"; comment: string; customer: string }): Message {
  const approved = input.decision === "approved";
  return {
    subject: approved ? `Proof approved: ${input.reference} v${input.version}` : `Changes requested: ${input.reference} v${input.version}`,
    ...layout(
      approved ? `${input.reference} version ${input.version} is approved for production` : `${input.reference} version ${input.version}: changes requested`,
      [`By ${input.customer}`, ...(input.comment ? [`“${input.comment}”`] : [])],
      { label: "Open proofs", href: `${siteUrl}/admin/proofs` },
    ),
  };
}
