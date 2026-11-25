import json

import pytest

from app.core import db
from app.core.config import get_settings
from app.quotes import submit as submit_module
from tests.conftest import ORIGIN
from tests.test_admin import signed_in

PDF = b"%PDF-1.4 tiny"
FIELDS = {
    "name": "Meera Iyer",
    "phone": "98765 43210",
    "email": "meera@example.com",
    "location": "Pune",
    "boardType": "Glass Board",
    "quantity": "3",
    "dimensions": "6 x 4 ft",
}


@pytest.fixture(autouse=True)
def setup(monkeypatch, tmp_path):
    settings = get_settings()
    monkeypatch.setattr(settings, "auth_secret", "test-only-auth-secret-0123456789abcdef")
    monkeypatch.setattr(settings, "commerce_mode_flag", "demo")
    monkeypatch.setattr(settings, "files_dir", str(tmp_path))
    monkeypatch.setattr(settings, "blob_token", "")
    sent: list[tuple] = []

    async def fake_send(to, message):
        sent.append((to, message["subject"]))
        return True

    monkeypatch.setattr(submit_module, "send_email", fake_send)
    return sent


async def post(client, data=None, files=None, key="key-12345678", headers=None):
    return await client.post(
        "/api/quotes",
        data={**FIELDS, **(data or {})},
        files=files,
        headers={**ORIGIN, **({"idempotency-key": key} if key else {}), **(headers or {})},
    )


async def stored(reference):
    async with db.connection() as conn:
        row = await (
            await conn.execute("SELECT payload FROM quote_requests WHERE reference = %s", (reference,))
        ).fetchone()
    return json.loads(row["payload"])


async def test_saves_a_quote_with_lines_and_a_file(client, setup, tmp_path):
    lines = json.dumps([{"productId": "cmwb6090", "quantity": 2, "detail": "Room 1"}, {"productId": ""}])
    response = await post(
        client, {"lines": lines, "notes": "Two\x00rooms  please"}, {"file": ("plan.pdf", PDF, "application/pdf")}
    )
    body = response.json()
    assert response.status_code == 200 and body["ok"] and body["saved"] and body["mode"] == "demo"
    assert body["message"] == "Quote saved. We've emailed you a copy." and body["notified"] is True
    quote = await stored(body["reference"])
    assert body["reference"].startswith("OBX-QUOTE-DEMO-") and len(body["reference"]) == 27
    assert quote["lines"] == [
        {
            "productId": "cmwb6090",
            "name": "Classic Magnetic Whiteboard 2×3",
            "sku": "CMWB6090",
            "quantity": 2,
            "catalogueUnitPrice": 1825,
            "detail": "Room 1",
        }
    ]
    assert quote["catalogueListSubtotal"] == 3650 and quote["notes"] == "Two rooms please"
    assert quote["attachment"] == {
        "name": "plan.pdf",
        "type": "application/pdf",
        "size": len(PDF),
        "storedAs": f"{body['reference']}.pdf",
    }
    assert (tmp_path / "quote-files" / f"{body['reference']}.pdf").read_bytes() == PDF
    assert [s[1] for s in setup] == [
        f"We've received your quote request {body['reference']}",
        f"New quote request {body['reference']}",
    ]
    # The submitting browser may now read it.
    assert "obasix_quotes=" in response.headers["set-cookie"]
    assert (await client.get(f"/api/quotes/{body['reference']}")).json()["ok"] is True


async def test_the_same_idempotency_key_returns_the_first_quote_and_emails_once(client, setup):
    first = (await post(client)).json()
    again = (await post(client, {"name": "Someone Else"})).json()
    assert again["reference"] == first["reference"] and again["message"] == "We already have this request."
    assert len(setup) == 2


@pytest.mark.parametrize(
    ("change", "files", "field", "message"),
    [
        ({"name": "M"}, None, "name", "Enter your name."),
        ({"phone": "123"}, None, "phone", "Enter a phone number with 8 to 15 digits."),
        ({"email": "nope"}, None, "email", "Enter a valid email address."),
        ({"location": "X"}, None, "location", "Enter your city or location."),
        ({"boardType": "Spaceship"}, None, "boardType", "Choose a board type."),
        ({"quantity": "1000"}, None, "quantity", "Enter a whole quantity from 1 to 999."),
        ({"dimensionsRequired": "1", "dimensions": ""}, None, "dimensions", "Enter the custom dimensions."),
        ({}, {"file": ("a.gif", b"GIF89a", "image/gif")}, "file", "Upload a PNG, JPEG, WebP, or PDF file."),
        (
            {},
            {"file": ("big.pdf", b"%PDF" + b"0" * (2 * 1024 * 1024), "application/pdf")},
            "file",
            "The file must be 2 MB or smaller.",
        ),
        (
            {},
            {"file": ("fake.pdf", b"not a pdf", "application/pdf")},
            "file",
            "The file content does not match a PNG, JPEG, WebP, or PDF file.",
        ),
    ],
)
async def test_field_errors_match_the_site(client, change, files, field, message):
    response = await post(client, change, files)
    assert response.status_code == 400
    body = response.json()
    assert body["message"] == "Check the highlighted fields." and body["errors"] == {field: message}
    assert body["saved"] is False


async def test_request_level_refusals(client, monkeypatch):
    assert (await post(client, key="short")).json()[
        "message"
    ] == "Submit the quote again. The request is missing an idempotency key."
    bad_lines = await post(client, {"lines": "{"})
    assert bad_lines.json()["message"] == "The product list could not be read."
    unknown = await post(client, {"lines": json.dumps([{"productId": "nope", "quantity": 1}])})
    assert unknown.json()["message"] == "A product in this quote is not in the catalogue."
    fraction = await post(client, {"lines": json.dumps([{"productId": "cmwb6090", "quantity": 2.5}])})
    assert fraction.json()["message"] == "A product in this quote is not in the catalogue."
    product = await post(client, {"productId": "nope"})
    assert product.json()["message"] == "The selected product is not in the catalogue."
    demo = await post(client, {"simulateFailure": "1"})
    assert demo.status_code == 503 and demo.json()["message"] == "Demo failure. The quote was not saved."
    monkeypatch.setattr(get_settings(), "commerce_mode_flag", "live")
    off = await post(client)
    assert off.status_code == 503 and off.json()["required"] == ["QUOTE_API_URL", "QUOTE_API_TOKEN"]
    monkeypatch.setattr(get_settings(), "quote_api_url", "https://q.example")
    monkeypatch.setattr(get_settings(), "quote_api_token", "t")
    assert (await post(client)).status_code == 501


async def test_attempts_are_rate_limited(client):
    statuses = [(await post(client, {"name": "M"}, key=f"key-{n:08d}")).status_code for n in range(13)]
    assert statuses[:12] == [400] * 12 and statuses[12] == 429


async def test_a_signed_in_customer_gets_the_quote_on_their_account():
    async with signed_in("account@example.com") as buyer:
        body = (await post(buyer, {"email": "account@example.com"})).json()
        async with db.connection() as conn:
            link = await (
                await conn.execute("SELECT summary FROM customer_quotes WHERE reference = %s", (body["reference"],))
            ).fetchone()
        assert link["summary"] == "Glass Board · 6 x 4 ft · qty 3"
        account = (await buyer.get("/api/account")).json()
        assert [q["reference"] for q in account["quotes"]] == [body["reference"]]


async def test_a_referral_credits_the_associate_but_not_their_own_quote(client):
    async with signed_in("assoc@example.com") as associate:
        me = (await associate.get("/api/auth")).json()["user"]
        async with db.connection() as conn:
            await conn.execute(
                "INSERT INTO associates (user_id, code, profession, city, created_at) VALUES (%s, 'ASHA2345', 'architect', 'Pune', 'now')",
                (me["id"],),
            )
        own = (await post(associate, {"email": "assoc@example.com"}, key="key-own-0001")).json()
    client.cookies.set("obasix_ref", "asha-2345")
    referred = (await post(client, key="key-ref-0001")).json()
    async with db.connection() as conn:
        rows = await (
            await conn.execute("SELECT reference, code, customer FROM associate_quotes ORDER BY reference")
        ).fetchall()
    assert [(r["reference"], r["code"], r["customer"]) for r in rows] == [
        (referred["reference"], "ASHA2345", "Meera Iyer")
    ]
    assert own["reference"] not in [r["reference"] for r in rows]
