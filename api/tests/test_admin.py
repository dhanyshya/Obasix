from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
import pytest

from app.core import db
from app.main import app
from tests.conftest import ORIGIN

PASSWORD = "correct horse"


def new_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver", headers=ORIGIN)


@asynccontextmanager
async def signed_in(email: str) -> AsyncIterator[httpx.AsyncClient]:
    async with new_client() as client:
        response = await client.post(
            "/api/auth?action=register", json={"name": "Person", "email": email, "password": PASSWORD}
        )
        assert response.status_code == 200, response.text
        yield client


@pytest.fixture
async def boss():
    """Admin through OBASIX_ADMIN_EMAILS (set in conftest)."""
    async with signed_in("boss@example.com") as c:
        yield c


@pytest.fixture
async def customer():
    async with signed_in("customer@example.com") as c:
        yield c


async def grant(boss, email, role):
    response = await boss.post("/api/admin/staff", json={"email": email, "role": role})
    assert response.status_code == 200, response.text


async def audit_rows():
    async with db.connection() as conn:
        return await (await conn.execute("SELECT * FROM audit_log ORDER BY id")).fetchall()


# ---------- Access ----------


async def test_visitors_and_customers_get_404_everywhere(client, customer):
    for c in (client, customer):
        for method, url in [
            ("GET", "/api/admin/me"),
            ("GET", "/api/admin/stock"),
            ("POST", "/api/admin/stock"),
            ("GET", "/api/admin/audit"),
            ("GET", "/api/admin/staff"),
            ("POST", "/api/admin/staff"),
            ("DELETE", "/api/admin/staff?email=a@b.co"),
        ]:
            response = await c.request(
                method, url, json={"email": "a@b.co", "role": "staff"} if method == "POST" else None
            )
            assert response.status_code == 404, (method, url, response.status_code)
            assert response.json() == {"ok": False, "message": "Not found."}


async def test_config_admin_has_every_permission(boss):
    me = (await boss.get("/api/admin/me")).json()
    assert me["role"] == "admin" and me["source"] == "config"
    assert set(me["permissions"]) == {
        "stock:read",
        "stock:write",
        "audit:read",
        "staff:manage",
        "quotes:read",
        "proofs:read",
        "proofs:write",
    }


async def test_staff_role_can_work_stock_but_not_audit_or_staff(boss):
    await grant(boss, "clerk@example.com", "staff")
    async with signed_in("clerk@example.com") as clerk:
        me = (await clerk.get("/api/admin/me")).json()
        assert me["role"] == "staff" and me["permissions"] == [
            "proofs:read",
            "proofs:write",
            "quotes:read",
            "stock:read",
            "stock:write",
        ]
        assert (await clerk.get("/api/admin/stock")).status_code == 200
        assert (await clerk.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": 3})).json() == {
            "ok": True
        }
        for url in ("/api/admin/audit", "/api/admin/staff"):
            denied = await clerk.get(url)
            assert denied.status_code == 403
            assert denied.json() == {"ok": False, "message": "You don't have permission to do that."}
        # Revoked: back to an ordinary customer at once.
        assert (await boss.delete("/api/admin/staff?email=clerk@example.com")).status_code == 200
        assert (await clerk.get("/api/admin/me")).status_code == 404


async def test_cross_site_changes_are_refused(boss):
    evil = {"origin": "https://evil.example"}
    stock = await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": 1}, headers=evil)
    assert stock.status_code == 403 and stock.json() == {"ok": False, "message": "The request was rejected."}
    staff = await boss.post("/api/admin/staff", json={"email": "x@y.co", "role": "admin"}, headers=evil)
    assert staff.status_code == 403
    assert await audit_rows() == []


# ---------- Stock: same rules as the site ----------


async def test_stock_set_validate_and_untrack(boss):
    set_ = lambda body: boss.post("/api/admin/stock", json=body)  # noqa: E731
    assert (await set_({"productId": "nope", "onHand": 1})).json() == {
        "ok": False,
        "message": "That product isn't in the catalogue.",
    }
    for bad in (-1, 2.5, 100001, "abc"):
        response = await set_({"productId": "cmwb6090", "onHand": bad})
        assert response.status_code == 400
        assert response.json()["message"] == "Enter a whole number from 0 to 100,000."
    missing = await set_({"productId": "cmwb6090"})
    assert missing.json()["message"] == "Enter a whole number from 0 to 100,000."
    assert (await set_({"productId": "cmwb6090", "onHand": "7"})).json() == {"ok": True}
    async with db.connection() as conn:
        row = await (await conn.execute("SELECT * FROM product_stock")).fetchone()
    assert (row["product_id"], row["on_hand"], row["updated_by"]) == ("cmwb6090", 7, "boss@example.com")
    assert row["updated_at"].endswith("Z")
    assert (await set_({"productId": "cmwb6090", "onHand": None})).json() == {"ok": True}
    async with db.connection() as conn:
        assert await (await conn.execute("SELECT * FROM product_stock")).fetchall() == []


async def test_stock_changes_are_audited_with_before_and_after(boss):
    await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": 4})
    await boss.post(
        "/api/admin/stock", json={"productId": "cmwb6090", "onHand": 9}, headers={**ORIGIN, "x-request-id": "req-abc"}
    )
    await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": None})
    again = await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": None})
    assert again.json() == {"ok": True}  # already untracked: fine, but nothing to log
    await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": -5})  # refused: not logged
    rows = await audit_rows()
    assert [(r["action"], r["detail"]) for r in rows] == [
        ("stock.set", {"before": None, "after": 4}),
        ("stock.set", {"before": 4, "after": 9}),
        ("stock.untrack", {"before": 9, "after": None}),
    ]
    assert {(r["actor_email"], r["actor_role"], r["target_type"], r["target_id"]) for r in rows} == {
        ("boss@example.com", "admin", "product", "cmwb6090")
    }
    assert rows[1]["request_id"] == "req-abc"


async def test_audit_log_cannot_be_edited_or_deleted(boss):
    await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": 4})
    for sql in ("UPDATE audit_log SET actor_email = 'someone@else.com'", "DELETE FROM audit_log"):
        with pytest.raises(Exception, match="append-only"):
            async with db.connection() as conn:
                await conn.execute(sql)
    assert len(await audit_rows()) == 1


async def test_stock_list_search_filter_sort_paginate(boss):
    for product_id, count in (("cmwb6090", 0), ("cmwb90120", 3), ("spbpcbg6090", 40)):
        await boss.post("/api/admin/stock", json={"productId": product_id, "onHand": count})
    everything = (await boss.get("/api/admin/stock?pageSize=100")).json()
    assert everything["total"] == 24 and len(everything["items"]) == 24
    states = {i["productId"]: i["state"] for i in everything["items"]}
    assert (states["cmwb6090"], states["cmwb90120"], states["spbpcbg6090"]) == ("made-to-order", "low", "in-stock")
    assert list(states.values()).count("untracked") == 21

    tracked = (await boss.get("/api/admin/stock?state=tracked&sort=onHand&order=desc")).json()
    assert [i["onHand"] for i in tracked["items"]] == [40, 3, 0]
    low = (await boss.get("/api/admin/stock?state=low")).json()
    assert [i["productId"] for i in low["items"]] == ["cmwb90120"]
    search = (await boss.get("/api/admin/stock?q=CMWB90")).json()
    assert {i["sku"] for i in search["items"]} >= {"CMWB90120"} and all("CMWB90" in i["sku"] for i in search["items"])

    page1 = (await boss.get("/api/admin/stock?pageSize=10&page=1")).json()
    page3 = (await boss.get("/api/admin/stock?pageSize=10&page=3")).json()
    assert (len(page1["items"]), len(page3["items"]), page3["total"], page3["pageSize"]) == (10, 4, 24, 10)
    names = [i["name"] for i in page1["items"]]
    assert names == sorted(names)
    assert (await boss.get("/api/admin/stock?pageSize=500")).status_code == 400
    assert (await boss.get("/api/admin/stock?sort=price")).status_code == 400


# ---------- Audit and staff ----------


async def test_audit_filters_and_pagination(boss):
    await grant(boss, "clerk@example.com", "staff")
    for n in range(3):
        await boss.post("/api/admin/stock", json={"productId": "cmwb6090", "onHand": n + 1})
    everything = (await boss.get("/api/admin/audit")).json()
    assert everything["total"] == 4
    assert everything["items"][0]["detail"] == {"before": 2, "after": 3}  # newest first
    only_stock = (await boss.get("/api/admin/audit?action=stock.")).json()
    assert only_stock["total"] == 3
    grants = (await boss.get("/api/admin/audit?action=staff.grant&targetId=clerk@example.com")).json()
    assert grants["total"] == 1 and grants["items"][0]["detail"] == {"before": None, "after": "staff"}
    paged = (await boss.get("/api/admin/audit?pageSize=2&page=2")).json()
    assert len(paged["items"]) == 2 and paged["page"] == 2
    assert (await boss.get("/api/admin/audit?actor=nobody@example.com")).json()["total"] == 0


async def test_staff_list_grant_change_revoke(boss):
    await grant(boss, "Clerk@Example.com", "staff")
    await grant(boss, "clerk@example.com", "admin")
    items = (await boss.get("/api/admin/staff")).json()["items"]
    assert [(i["email"], i["role"], i["source"]) for i in items] == [
        ("boss@example.com", "admin", "config"),
        ("clerk@example.com", "admin", "granted"),
    ]
    assert items[1]["grantedBy"] == "boss@example.com"
    config_admin = await boss.post("/api/admin/staff", json={"email": "boss@example.com", "role": "staff"})
    assert config_admin.status_code == 409
    assert (await boss.delete("/api/admin/staff?email=boss@example.com")).status_code == 409
    assert (await boss.post("/api/admin/staff", json={"email": "not-an-email", "role": "staff"})).status_code == 400
    assert (await boss.post("/api/admin/staff", json={"email": "a@b.co", "role": "owner"})).status_code == 400
    assert (await boss.delete("/api/admin/staff?email=clerk@example.com")).status_code == 200
    assert (await boss.delete("/api/admin/staff?email=clerk@example.com")).status_code == 404
    actions = [r["action"] for r in await audit_rows()]
    assert actions == ["staff.grant", "staff.grant", "staff.revoke"]
