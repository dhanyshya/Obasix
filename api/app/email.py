"""Transactional email through Resend. Best effort: it never raises, as on the site."""

import html
import logging
from typing import Any
from urllib.parse import quote

import httpx

from app.catalogue import company
from app.core.config import get_settings
from app.core.money import format_inr

log = logging.getLogger(__name__)


def _layout(title: str, paragraphs: list[str], action: tuple[str, str] | None = None) -> tuple[str, str]:
    """Same layout as src/lib/email/templates.ts."""
    e = lambda value: html.escape(value, quote=True).replace("&#x27;", "&#39;")  # noqa: E731
    body = "".join(f'<p style="margin:0 0 14px;line-height:1.6">{e(p)}</p>' for p in paragraphs)
    button = (
        f'<p style="margin:20px 0"><a href="{e(action[1])}" style="background:#164E3B;color:#fff;padding:12px 20px;'
        f'border-radius:999px;text-decoration:none;font-weight:600">{e(action[0])}</a></p>'
        if action
        else ""
    )
    info = company()
    footer = e(f"{info['legalName']} · {info['email']} · {info['phoneDisplay']}")
    page = f"""<!doctype html><html><body style="margin:0;background:#F4F2EC;font-family:Helvetica,Arial,sans-serif;color:#1F2421">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="font-weight:800;letter-spacing:0.04em;color:#164E3B;margin:0 0 18px">OBASIX</p>
<div style="background:#fff;border-radius:12px;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">{e(title)}</h1>{body}{button}
</div>
<p style="font-size:12px;color:#6B706D;margin:16px 0 0">{footer}</p>
</div></body></html>"""  # noqa: E501
    text = "\n".join([title, "", *paragraphs, *(["", f"{action[0]}: {action[1]}"] if action else [])])
    return page, text


def password_reset_email(link: str) -> dict[str, str]:
    page, text = _layout(
        "Reset your password",
        [
            "Someone asked to reset the password for this account. The link works once and expires in 30 minutes.",
            "If it wasn't you, ignore this email; your password stays the same.",
        ],
        ("Choose a new password", link),
    )
    return {"subject": "Reset your OBASIX password", "html": page, "text": text}


def _summary_line(*parts: str) -> str:
    return " · ".join(p for p in parts if p)


def quote_received_email(reference: str, name: str, summary: str) -> dict[str, str]:
    page, text = _layout(
        f"Thank you, {name}. We've received your request.",
        [
            f"Reference: {reference}",
            summary,
            "Our team will reply with a price and lead time. For custom work we'll send a design proof for your "
            "approval before anything is made.",
        ],
    )
    return {
        "subject": f"We've received your quote request {reference}",
        "html": page,
        "text": text,
        "reply_to": company()["email"],
    }


def staff_new_quote_email(
    reference: str, name: str, company_name: str, email: str, phone: str, summary: str
) -> dict[str, str]:
    site = get_settings().site_url
    page, text = _layout(
        f"New quote request {reference}",
        [f"{name}{f' · {company_name}' if company_name else ''} · {email} · {phone}", summary],
        ("Open quotes", f"{site}/admin/quotes?q={quote(reference, safe='')}"),
    )
    return {"subject": f"New quote request {reference}", "html": page, "text": text, "reply_to": email}


def proof_ready_email(reference: str, version: int, note: str) -> dict[str, str]:
    site = get_settings().site_url
    page, text = _layout(
        f"Proof version {version} is ready for your review",
        [
            f"Quote {reference}",
            *([f"From our team: {note}"] if note else []),
            "Check every word, size and colour. We make it exactly as the version you approve.",
        ],
        ("Review the proof", f"{site}/account/proofs"),
    )
    return {
        "subject": f"Your design proof for {reference} is ready",
        "html": page,
        "text": text,
        "reply_to": company()["email"],
    }


def staff_proof_decision_email(
    reference: str, version: int, decision: str, comment: str, customer: str
) -> dict[str, str]:
    site = get_settings().site_url
    approved = decision == "approved"
    page, text = _layout(
        f"{reference} version {version} is approved for production"
        if approved
        else f"{reference} version {version}: changes requested",
        [f"By {customer}", *([f"“{comment}”"] if comment else [])],
        ("Open proofs", f"{site}/admin/proofs"),
    )
    subject = f"Proof approved: {reference} v{version}" if approved else f"Changes requested: {reference} v{version}"
    return {"subject": subject, "html": page, "text": text}


def _items(order: dict[str, Any]) -> list[str]:
    return [f"{i['quantity']} × {i['name']} — {format_inr(i['lineTotal'])}" for i in order["items"]]


def _address(order: dict[str, Any]) -> str:
    a = order.get("shippingAddress") or {}
    return ", ".join(p for p in [a.get("line"), a.get("city"), a.get("state"), a.get("postal")] if p)


def order_confirmation_email(order: dict[str, Any]) -> dict[str, str]:
    site = get_settings().site_url
    page, text = _layout(
        f"Thank you, {order.get('customerName', '')}. Your order is confirmed.",
        [
            f"Order {order['id']} · paid {format_inr(order['subtotal'])}",
            *_items(order),
            f"Delivering to: {_address(order)}",
            "We'll email you the courier and tracking number when it's dispatched.",
        ],
        ("Track your order", f"{site}/orders/track"),
    )
    return {"subject": f"Order {order['id']} confirmed", "html": page, "text": text, "reply_to": company()["email"]}


def order_dispatched_email(order: dict[str, Any]) -> dict[str, str]:
    site = get_settings().site_url
    page, text = _layout(
        f"Your order {order['id']} has been dispatched.",
        [
            f"Courier: {order.get('courier') or '—'}",
            f"Tracking number: {order.get('trackingNumber') or '—'}",
            *_items(order),
        ],
        ("Track your order", f"{site}/orders/track"),
    )
    return {"subject": f"Order {order['id']} is on its way", "html": page, "text": text, "reply_to": company()["email"]}


def staff_new_order_email(order: dict[str, Any]) -> dict[str, str]:
    site = get_settings().site_url
    page, text = _layout(
        f"New paid order {order['id']}",
        [
            f"{order.get('customerName', '')} · {order['email']} · {order['phone']}",
            *_items(order),
            f"Ship to: {_address(order)}",
        ],
        ("Open orders", f"{site}/admin/orders"),
    )
    return {"subject": f"New paid order {order['id']} · {format_inr(order['subtotal'])}", "html": page, "text": text}


def staff_alert_emails() -> list[str]:
    settings = get_settings()
    return settings.staff_alert_emails or settings.admin_emails


async def send_email(to: str | list[str], message: dict[str, str]) -> bool:
    """Best effort, as on the site: never raises, so an email outage can't block a quote or a proof."""
    settings = get_settings()
    recipients = [r for r in ([to] if isinstance(to, str) else to) if r]
    if not settings.email_configured or not recipients:
        return False
    body = {
        "from": settings.email_from,
        "to": recipients,
        "subject": message["subject"],
        "html": message["html"],
        "text": message["text"],
    }
    if message.get("reply_to"):
        body["reply_to"] = message["reply_to"]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{settings.resend_api_base}/emails",
                headers={"authorization": f"Bearer {settings.resend_api_key}"},
                json=body,
            )
        if response.is_error:
            log.error('Email "%s" failed: %s', message["subject"], response.status_code)
        return response.is_success
    except httpx.HTTPError as error:
        log.error('Email "%s" failed: %s', message["subject"], error)
        return False
