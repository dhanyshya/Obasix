import asyncio

from app.core import db
from tests.conftest import ORIGIN

NEW = {"name": "Asha Rao", "email": "Asha@Example.com", "password": "correct horse"}


async def register(client, **overrides):
    return await client.post("/api/auth?action=register", json={**NEW, **overrides})


async def test_register_signs_in_and_reports_the_user(client):
    response = await register(client)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["user"]["email"] == "asha@example.com"
    assert body["cart"] == [] and body["wishlist"] == []
    cookie = response.headers["set-cookie"]
    assert "obasix_session=" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
    me = await client.get("/api/auth")
    assert me.json()["user"]["name"] == "Asha Rao"


async def test_register_rejects_bad_fields_with_the_sites_messages(client):
    assert (await register(client, name="A")).json() == {"ok": False, "errors": {"name": "Enter your name."}}
    assert (await register(client, email="nope")).json()["errors"] == {"email": "Enter a valid email address."}
    assert (await register(client, password="short")).json()["errors"] == {"password": "Use 8 to 72 characters."}


async def test_one_account_per_email_even_when_two_requests_race(client):
    first, second = await asyncio.gather(register(client), register(client))
    assert sorted([first.status_code, second.status_code]) == [200, 409]
    async with db.connection() as conn:
        row = await (await conn.execute("SELECT COUNT(*) AS n FROM users")).fetchone()
    assert row["n"] == 1


async def test_login_logout_round_trip(client):
    await register(client)
    await client.post("/api/auth?action=logout")
    assert (await client.get("/api/auth")).json() == {"user": None}
    wrong = await client.post("/api/auth?action=login", json={"email": NEW["email"], "password": "wrong password"})
    assert wrong.status_code == 401
    assert wrong.json() == {"ok": False, "message": "Email or password is incorrect."}
    good = await client.post("/api/auth?action=login", json={"email": NEW["email"], "password": NEW["password"]})
    assert good.status_code == 200
    assert (await client.get("/api/auth")).json()["user"]["email"] == "asha@example.com"


async def test_unknown_email_gets_the_same_answer_as_a_wrong_password(client):
    response = await client.post("/api/auth?action=login", json={"email": "who@example.com", "password": "whatever1"})
    assert response.status_code == 401
    assert response.json()["message"] == "Email or password is incorrect."


async def test_guest_cart_and_wishlist_are_saved_on_sign_in(client):
    guest = [{"productId": "cmwb6090", "quantity": 2}, {"productId": "not-a-product", "quantity": 1}]
    body = (await register(client, cart=guest, wishlist=["cmwb6090", "nope"])).json()
    assert [(i["productId"], i["quantity"]) for i in body["cart"]] == [("cmwb6090", 2)]
    assert body["cart"][0]["unitPrice"] == 1825
    assert body["wishlist"] == ["cmwb6090"]
    await client.post("/api/auth?action=logout")
    again = await client.post(
        "/api/auth?action=login", json={"email": NEW["email"], "password": NEW["password"], "cart": guest[:1]}
    )
    assert again.json()["cart"][0]["quantity"] == 4


async def test_cross_site_posts_are_rejected(client):
    response = await client.post("/api/auth?action=register", json=NEW, headers={"origin": "https://evil.example"})
    assert response.status_code == 403
    assert response.json() == {"ok": False, "message": "The account request was rejected."}


async def test_attempts_are_rate_limited(client):
    statuses = [
        (await client.post("/api/auth?action=login", json={"email": "a@b.co", "password": "x" * 8})).status_code
        for _ in range(9)
    ]
    assert statuses[:8] == [401] * 8 and statuses[8] == 429


async def test_unreadable_body_and_unknown_action(client):
    bad = await client.post(
        "/api/auth?action=login", content=b"{", headers={**ORIGIN, "content-type": "application/json"}
    )
    assert bad.status_code == 400
    assert (await client.post("/api/auth?action=dance", json={"a": 1})).status_code == 404


async def test_password_reset_works_once_and_signs_out_everywhere(client):
    await register(client)
    forgot = (await client.post("/api/auth?action=forgot", json={"email": NEW["email"]})).json()
    # APP_ENV=test with no email service: no link is handed out.
    assert forgot["delivered"] is False and "resetPath" not in forgot

    from app.auth import service

    async with db.connection() as conn:
        user = await (await conn.execute("SELECT id FROM users")).fetchone()
    token = await service._store_reset(user["id"])
    first, second = await asyncio.gather(
        client.post("/api/auth?action=reset", json={"token": token, "password": "a new password"}),
        client.post("/api/auth?action=reset", json={"token": token, "password": "another password"}),
    )
    assert sorted([first.status_code, second.status_code]) == [200, 400]
    assert (await client.get("/api/auth")).json() == {"user": None}


async def test_health(client):
    assert (await client.get("/health")).json() == {"ok": True, "database": "ok"}


async def test_visitor_ip_is_trusted_only_with_the_proxy_secret(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "proxy_secret", "s" * 40)
    login = {"email": "a@b.co", "password": "x" * 8}
    forged = {"x-obasix-client-ip": "203.0.113.9", "x-obasix-proxy-secret": "wrong"}
    real = {"x-obasix-client-ip": "198.51.100.7", "x-obasix-proxy-secret": "s" * 40}
    await client.post("/api/auth?action=login", json=login, headers={**ORIGIN, **forged})
    await client.post("/api/auth?action=login", json=login, headers={**ORIGIN, **real})
    async with db.connection() as conn:
        rows = await (await conn.execute("SELECT DISTINCT bucket FROM rate_limit_hits ORDER BY bucket")).fetchall()
    assert [r["bucket"] for r in rows] == ["auth:198.51.100.7:login", "auth:local:login"]


async def test_security_headers_and_cors(client):
    response = await client.get("/health")
    for header, value in {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "same-origin",
    }.items():
        assert response.headers[header] == value
    assert "cache-control" not in response.headers
    allowed = await client.options(
        "/api/admin/me",
        headers={"origin": "http://localhost:3000", "access-control-request-method": "GET"},
    )
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert allowed.headers["access-control-allow-credentials"] == "true"
    other = await client.options(
        "/api/admin/me", headers={"origin": "https://evil.example", "access-control-request-method": "GET"}
    )
    assert "access-control-allow-origin" not in other.headers
