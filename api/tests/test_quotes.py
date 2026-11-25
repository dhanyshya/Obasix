import json
import shutil
import subprocess

import pytest

from app.core import db
from app.core.config import get_settings
from app.quotes.access import sign
from tests.test_admin import signed_in

SECRET = "test-only-auth-secret-0123456789abcdef"


@pytest.fixture(autouse=True)
def auth_secret(monkeypatch):
    monkeypatch.setattr(get_settings(), "auth_secret", SECRET)


def quote(reference="OBX-QUOTE-DEMO-AAAAAA", *, email="buyer@example.com", created="2026-11-20T10:00:00.000Z", **extra):
    base = {
        "reference": reference,
        "idempotencyKey": f"key-{reference}",
        "createdAt": created,
        "mode": "demo",
        "name": "Meera Iyer",
        "company": "Iyer Schools",
        "phone": "9876543210",
        "email": email,
        "location": "Pune",
        "boardType": "Glass Board",
        "dimensions": "6 × 4 ft",
        "quantity": 2,
        "product": "Glass board",
        "productId": "",
        "frame": "",
        "colour": "",
        "surface": "",
        "features": "",
        "accessories": "",
        "branding": "",
        "notes": "For two classrooms",
        "configurationSummary": "",
        "lines": [
            {
                "productId": "cmwb6090",
                "name": "Board",
                "sku": "CMWB6090",
                "quantity": 2,
                "catalogueUnitPrice": 1825,
                "detail": "",
            }
        ],
        "catalogueListSubtotal": 3650,
        "attachment": None,
        "notified": False,
    }
    return {**base, **extra}


async def save(*quotes):
    async with db.connection() as conn:
        for q in quotes:
            await conn.execute(
                "INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) "
                "VALUES (%s, %s, %s, %s, %s)",
                (q["reference"], q["idempotencyKey"], q["email"], q["createdAt"], json.dumps(q)),
            )


# ---------- Customer lookup: same rules as the site ----------


async def test_unknown_and_non_demo_references(client):
    assert (await client.get("/api/quotes/OBX-ORDER-1")).json() == {
        "ok": False,
        "message": "This reference is not a demo quote. No quote database is connected.",
    }
    missing = await client.get("/api/quotes/OBX-QUOTE-DEMO-NOPE")
    assert missing.status_code == 404
    assert missing.json()["message"] == "No saved demo quote matches that reference."


async def test_someone_else_gets_the_same_404_as_a_missing_quote(client):
    await save(quote())
    stranger = await client.get("/api/quotes/OBX-QUOTE-DEMO-AAAAAA")
    assert stranger.status_code == 404
    assert stranger.json()["message"] == "No saved demo quote matches that reference."


async def test_the_submitting_browser_can_read_it_with_a_signed_cookie(client):
    await save(quote())
    token = f"OBX-QUOTE-DEMO-AAAAAA.{sign('OBX-QUOTE-DEMO-AAAAAA')}"
    client.cookies.set("obasix_quotes", f"OBX-QUOTE-DEMO-OTHER.bad,{token}")
    body = (await client.get("/api/quotes/OBX-QUOTE-DEMO-AAAAAA")).json()
    assert body["ok"] is True and body["mode"] == "demo"
    assert body["quote"]["reference"] == "OBX-QUOTE-DEMO-AAAAAA"
    assert body["quote"]["lines"][0] == {
        "productId": "cmwb6090",
        "name": "Board",
        "sku": "CMWB6090",
        "quantity": 2,
        "catalogueUnitPrice": 1825,
        "detail": "",
    }
    # Customer view: no contact details or internal fields.
    assert "email" not in body["quote"] and "phone" not in body["quote"] and "idempotencyKey" not in body["quote"]


async def test_a_forged_cookie_is_ignored(client):
    await save(quote())
    client.cookies.set("obasix_quotes", "OBX-QUOTE-DEMO-AAAAAA.forged-signature")
    assert (await client.get("/api/quotes/OBX-QUOTE-DEMO-AAAAAA")).status_code == 404


async def test_the_matching_account_or_a_linked_account_can_read_it():
    await save(quote(), quote("OBX-QUOTE-DEMO-BBBBBB", email="someone@else.com"))
    async with signed_in("Buyer@Example.com") as buyer:
        assert (await buyer.get("/api/quotes/OBX-QUOTE-DEMO-AAAAAA")).json()["ok"] is True
        assert (await buyer.get("/api/quotes/OBX-QUOTE-DEMO-BBBBBB")).status_code == 404
        me = (await buyer.get("/api/auth")).json()["user"]
        async with db.connection() as conn:
            await conn.execute(
                "INSERT INTO customer_quotes (reference, user_id, summary, created_at) VALUES (%s, %s, 's', 'now')",
                ("OBX-QUOTE-DEMO-BBBBBB", me["id"]),
            )
        assert (await buyer.get("/api/quotes/OBX-QUOTE-DEMO-BBBBBB")).json()["ok"] is True


async def test_lookups_are_rate_limited(client):
    statuses = [(await client.get(f"/api/quotes/OBX-QUOTE-DEMO-{n}")).status_code for n in range(61)]
    assert statuses[:60] == [404] * 60 and statuses[60] == 429


@pytest.mark.skipif(not shutil.which("node"), reason="needs node")
def test_cookie_signature_matches_the_site():
    script = (
        "const c=require('node:crypto');"
        f"process.stdout.write(c.createHmac('sha256','{SECRET}').update('quote:OBX-QUOTE-DEMO-AAAAAA').digest('base64url'))"
    )
    node_signature = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True).stdout
    assert sign("OBX-QUOTE-DEMO-AAAAAA") == node_signature


async def test_without_auth_secret_no_cookie_can_be_trusted(client, monkeypatch):
    await save(quote())
    token = f"OBX-QUOTE-DEMO-AAAAAA.{sign('OBX-QUOTE-DEMO-AAAAAA')}"
    monkeypatch.setattr(get_settings(), "auth_secret", "")
    client.cookies.set("obasix_quotes", token)
    assert (await client.get("/api/quotes/OBX-QUOTE-DEMO-AAAAAA")).status_code == 404


# ---------- Staff list ----------


async def test_staff_list_access(client):
    assert (await client.get("/api/admin/quotes")).status_code == 404
    async with signed_in("customer@example.com") as customer:
        assert (await customer.get("/api/admin/quotes")).status_code == 404
    async with signed_in("boss@example.com") as boss:
        await boss.post("/api/admin/staff", json={"email": "clerk@example.com", "role": "staff"})
        assert (await boss.get("/api/admin/quotes")).status_code == 200
    async with signed_in("clerk@example.com") as clerk:
        assert (await clerk.get("/api/admin/quotes")).status_code == 200  # staff prepare quotes


async def test_staff_list_search_filters_order_and_pages():
    await save(
        quote("OBX-QUOTE-DEMO-000001", created="2026-11-01T09:00:00.000Z", name="Asha Rao", boardType="Notice Board"),
        quote(
            "OBX-QUOTE-DEMO-000002",
            created="2026-11-10T09:00:00.000Z",
            company="Acme Interiors",
            attachment={"name": "plan.pdf", "type": "application/pdf", "size": 1200, "storedAs": "x.pdf"},
        ),
        quote(
            "OBX-QUOTE-DEMO-000003", created="2026-11-20T09:00:00.000Z", email="raj@school.in", phone="+91 99990 44222"
        ),
    )
    async with signed_in("boss@example.com") as boss:
        get = lambda **q: boss.get("/api/admin/quotes", params=q)  # noqa: E731
        everything = (await get()).json()
        assert [i["reference"][-1] for i in everything["items"]] == ["3", "2", "1"]
        assert everything["total"] == 3
        assert everything["items"][1]["attachment"] == {"name": "plan.pdf", "type": "application/pdf", "size": 1200}
        assert "storedAs" not in json.dumps(everything)
        assert [i["reference"][-1] for i in (await get(order="asc")).json()["items"]] == ["1", "2", "3"]
        for needle, expected in (("asha", "1"), ("ACME", "2"), ("raj@school", "3"), ("99990", "3"), ("000002", "2")):
            assert [i["reference"][-1] for i in (await get(q=needle)).json()["items"]] == [expected], needle
        assert [i["reference"][-1] for i in (await get(boardType="Notice Board")).json()["items"]] == ["1"]
        assert [i["reference"][-1] for i in (await get(attachment="true")).json()["items"]] == ["2"]
        assert (await get(attachment="false")).json()["total"] == 2
        window = (await get(since="2026-11-05T00:00:00Z", until="2026-11-15T00:00:00Z")).json()
        assert [i["reference"][-1] for i in window["items"]] == ["2"]
        local = (await get(since="2026-11-10T14:00:00+05:30")).json()  # = 08:30 UTC
        assert [i["reference"][-1] for i in local["items"]] == ["3", "2"]
        page2 = (await get(pageSize=2, page=2)).json()
        assert [i["reference"][-1] for i in page2["items"]] == ["1"] and page2["total"] == 3
        assert (await get(q="%")).json()["total"] == 0  # LIKE wildcards are literal
        assert (await get(pageSize=101)).status_code == 400
