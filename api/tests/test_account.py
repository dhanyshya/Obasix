import json

import httpx
import pytest

from app.core import db
from app.main import app
from tests.conftest import ORIGIN

PASSWORD = "correct horse"


async def sign_up(client: httpx.AsyncClient, email: str = "acct@example.com") -> str:
    response = await client.post(
        "/api/auth?action=register", json={"name": "Acct Person", "email": email, "password": PASSWORD}
    )
    assert response.status_code == 200
    return response.json()["user"]["id"]


@pytest.fixture
async def other_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", headers=ORIGIN) as c:
        yield c


async def act(client, action, body):
    return await client.post(f"/api/account?action={action}", json=body)


async def test_signed_out_is_refused(client):
    assert (await client.get("/api/account")).json() == {"ok": False, "message": "Sign in to view this account."}
    assert (await act(client, "profile", {"name": "X Y"})).status_code == 401
    assert (await client.delete("/api/account?kind=address&id=x")).status_code == 401


async def test_overview_of_a_new_account(client):
    await sign_up(client)
    body = (await client.get("/api/account")).json()
    assert body["user"]["email"] == "acct@example.com"
    assert {k: body[k] for k in ("addresses", "wishlist", "configurations", "quotes", "cart", "orders")} == {
        "addresses": [],
        "wishlist": [],
        "configurations": [],
        "quotes": [],
        "cart": [],
        "orders": [],
    }
    # APP_ENV=test with no payment keys and no flag: orders are not available.
    assert body["ordersAvailable"] is False and body["ordersMode"] == "unconfigured"


async def test_profile_rules_and_save(client):
    await sign_up(client)
    assert (await act(client, "profile", {"name": "A"})).json()["errors"] == {"name": "Enter your name."}
    bad_phone = await act(client, "profile", {"name": "New Name", "phone": "12-34"})
    assert bad_phone.json()["errors"] == {"phone": "Enter a phone number with 8 to 15 digits."}
    ok = await act(client, "profile", {"name": " New\u0000 Name ", "phone": "+91 99990 44222", "company": "Acme"})
    assert ok.json() == {"ok": True}
    user = (await client.get("/api/account")).json()["user"]
    assert (user["name"], user["phone"], user["company"]) == ("New Name", "+91 99990 44222", "Acme")


async def test_password_change_keeps_this_device_and_signs_out_others(client, other_client):
    await sign_up(client)
    login = {"email": "acct@example.com", "password": PASSWORD}
    assert (await other_client.post("/api/auth?action=login", json=login)).status_code == 200
    wrong = await act(client, "password", {"current": "nope", "next": "a new password"})
    assert wrong.json()["errors"] == {"current": "The current password is incorrect."}
    short = await act(client, "password", {"current": PASSWORD, "next": "short"})
    assert short.json()["errors"] == {"next": "Use 8 to 72 characters."}
    ok = await act(client, "password", {"current": PASSWORD, "next": "a new password"})
    assert ok.status_code == 200 and "obasix_session=" in ok.headers["set-cookie"]
    assert (await client.get("/api/account")).status_code == 200
    assert (await other_client.get("/api/account")).status_code == 401


async def test_password_guessing_is_limited(client):
    await sign_up(client)
    statuses = [
        (await act(client, "password", {"current": f"guess-{i}", "next": "whatever1"})).status_code for i in range(9)
    ]
    assert statuses[:8] == [400] * 8 and statuses[8] == 429


async def test_addresses_add_and_remove_only_your_own(client, other_client):
    await sign_up(client)
    await sign_up(other_client, "other@example.com")
    incomplete = await act(client, "address", {"line": "1 Road", "city": "Delhi", "state": "DL", "postal": "!"})
    assert incomplete.json() == {"ok": False, "message": "Enter a complete address."}
    full = {"line": "1105 Ansal Bhawan", "city": "New Delhi", "state": "Delhi", "postal": "110001", "country": "India"}
    assert (await act(client, "address", full)).json() == {"ok": True}
    [saved] = (await client.get("/api/account")).json()["addresses"]
    assert saved["postal"] == "110001"
    # Another customer can't remove it.
    assert (await other_client.delete(f"/api/account?kind=address&id={saved['id']}")).json() == {"ok": True}
    assert len((await client.get("/api/account")).json()["addresses"]) == 1
    assert (await client.delete(f"/api/account?kind=address&id={saved['id']}")).json() == {"ok": True}
    assert (await client.get("/api/account")).json()["addresses"] == []
    assert (await client.delete("/api/account?kind=car&id=1")).json() == {"ok": False, "message": "Nothing to remove."}


async def test_wishlist_add_remove_and_sync(client):
    await sign_up(client)
    unknown = await act(client, "wishlist", {"productId": "nope"})
    assert unknown.json() == {"ok": False, "message": "That product is not in the catalogue."}
    await act(client, "wishlist", {"productId": "cmwb6090"})
    await act(client, "wishlist", {"productId": "cmwb6090"})
    assert (await client.get("/api/account")).json()["wishlist"] == ["cmwb6090"]
    await act(client, "wishlist", {"productId": "cmwb6090", "remove": True})
    assert (await client.get("/api/account")).json()["wishlist"] == []
    # A repeated id is stored once (the old route failed with a 500 here).
    synced = await act(client, "wishlist-sync", {"ids": ["cmwb6090", "nope", "cmwb6090", "cmwb90120"]})
    assert synced.json() == {"ok": True, "wishlist": ["cmwb6090", "cmwb6090", "cmwb90120"]}
    assert sorted((await client.get("/api/account")).json()["wishlist"]) == ["cmwb6090", "cmwb90120"]


async def test_saved_configurations(client):
    await sign_up(client)
    assert (await act(client, "configuration", {"name": "A", "productId": "cmwb6090"})).json()["message"] == (
        "Name this configuration."
    )
    ok = await act(
        client,
        "configuration",
        {"name": "Boardroom", "productId": "cmwb6090", "quantity": "2", "configuration": {"branding": True}},
    )
    assert ok.json() == {"ok": True}
    [config] = (await client.get("/api/account")).json()["configurations"]
    assert config["name"] == "Boardroom" and config["product_id"] == "cmwb6090"
    payload = json.loads(config["payload"])
    assert payload["quantity"] == 2 and payload["configuration"]["branding"] is True
    assert config["created_at"].endswith("Z")
    assert (await client.delete(f"/api/account?kind=configuration&id={config['id']}")).json() == {"ok": True}
    assert (await client.get("/api/account")).json()["configurations"] == []


async def test_cart_save_and_read_back(client):
    await sign_up(client)
    saved = await act(client, "cart", {"lines": [{"productId": "cmwb6090", "quantity": 2}, {"productId": "x"}]})
    assert [(i["productId"], i["quantity"]) for i in saved.json()["cart"]] == [("cmwb6090", 2)]
    assert (await client.get("/api/account")).json()["cart"] == saved.json()["cart"]


async def test_orders_are_listed_in_demo_mode(client, monkeypatch):
    from app.core.config import get_settings

    user_id = await sign_up(client)
    async with db.connection() as conn:
        await conn.execute(
            """INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items,
               subtotal, status, shipping, created_at, courier)
               VALUES ('OBX-DEMO-1', 'k1', %s, 'acct@example.com', '9999044222', 'Acct', 'upi', '[]', 1825,
               'processing', '{"city":"Delhi"}', '2026-11-25T10:00:00.000Z', NULL)""",
            (user_id,),
        )
    monkeypatch.setattr(get_settings(), "commerce_mode_flag", "demo")
    body = (await client.get("/api/account")).json()
    assert body["ordersMode"] == "demo" and body["ordersAvailable"] is True
    [order] = body["orders"]
    assert order["id"] == "OBX-DEMO-1" and order["paymentStatus"] == "paid"
    assert order["shippingAddress"] == {"city": "Delhi"}
    assert "courier" not in order and "trackingNumber" not in order


async def test_cross_site_and_bad_requests(client):
    await sign_up(client)
    forged = await client.post(
        "/api/account?action=profile", json={"name": "Evil"}, headers={"origin": "https://evil.example"}
    )
    assert forged.status_code == 403
    assert (
        await client.delete("/api/account?kind=address&id=1", headers={"origin": "https://evil.example"})
    ).status_code == 403
    assert (await act(client, "dance", {"a": 1})).json() == {"ok": False, "message": "Unknown account action."}
    unreadable = await client.post(
        "/api/account?action=profile", content=b"[", headers={"content-type": "application/json"}
    )
    assert unreadable.status_code == 400
