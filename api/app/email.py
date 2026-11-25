"""Transactional email through Resend. Best effort: it never raises, as on the site."""

import html
import logging

import httpx

from app.catalogue import company
from app.core.config import get_settings

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


async def send_email(to: str, message: dict[str, str]) -> bool:
    settings = get_settings()
    if not settings.email_configured or not to:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{settings.resend_api_base}/emails",
                headers={"authorization": f"Bearer {settings.resend_api_key}"},
                json={"from": settings.email_from, "to": [to], **message},
            )
        if response.is_error:
            log.error('Email "%s" failed: %s', message["subject"], response.status_code)
        return response.is_success
    except httpx.HTTPError as error:
        log.error('Email "%s" failed: %s', message["subject"], error)
        return False
