"""Razorpay Standard Checkout: a port of src/lib/commerce/razorpay.ts."""

import hashlib
import hmac
from typing import Any

import httpx

from app.core.config import get_settings


class RazorpayError(RuntimeError):
    pass


async def create_order(amount_paise: int, receipt: str, notes: dict[str, str]) -> dict[str, Any]:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{settings.razorpay_api_base}/v1/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes},
        )
    if response.is_error:
        raise RazorpayError(f"Razorpay order creation failed ({response.status_code}): {response.text[:200]}")
    return response.json()


def _equal(expected: str, given: str) -> bool:
    return hmac.compare_digest(expected.encode(), str(given or "").encode())


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Checkout callback: HMAC-SHA256 of "order_id|payment_id" with the key secret."""
    secret = get_settings().razorpay_key_secret
    if not secret or not order_id or not payment_id:
        return False
    expected = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return _equal(expected, signature)


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    """Webhook: HMAC-SHA256 of the raw body with the webhook secret."""
    secret = get_settings().razorpay_webhook_secret
    if not secret or not signature:
        return False
    return _equal(hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest(), signature)
