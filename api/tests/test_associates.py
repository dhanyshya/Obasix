import pytest

from app.core import db
from app.core.config import get_settings
from tests.test_admin import signed_in

JOIN = {"profession": "Architect or interior designer", "city": "Pune", "firm": "Studio A", "accept": True}


async def make_order(order_id, status, email="buyer@example.com"):
    async with db.connection() as conn:
        await conn.execute(
            """INSERT INTO demo_orders (id, idempotency_key, email, phone, customer_name, method, items, subtotal,
               status, shipping, created_at) VALUES (%s, %s, %s, '9876543210', 'B', 'upi', '[]', 1000, %s, '{}', %s)""",
            (order_id, f"k-{order_id}", email, status, "2026-11-01T00:00:00.000Z"),
        )


async def commission(cid, code, order_id, amount=50):
    async with db.connection() as conn:
        await conn.execute(
            "INSERT INTO associate_commissions (id, code, source_type, source_id, base_amount, rate, amount, created_at) "
            "VALUES (%s, %s, 'order', %s, 1000, 0.05, %s, %s)",
            (cid, code, order_id, amount, f"2026-11-0{cid[-1]}T00:00:00.000Z"),
        )


async def test_joining_rules_and_a_readable_unique_code(client):
    assert (await client.post("/api/associates", json=JOIN)).status_code == 401
    async with signed_in("asha@example.com") as asha:
        assert (await asha.post("/api/associates", json={**JOIN, "profession": "Astronaut"})).json()[
            "message"
        ] == "Choose the work you do."
        assert (await asha.post("/api/associates", json={**JOIN, "city": "P"})).json()[
            "message"
        ] == "Enter the city you work in."
        assert (await asha.post("/api/associates", json={**JOIN, "accept": "yes"})).json()[
            "message"
        ] == "Accept the programme terms to continue."
        body = (await asha.post("/api/associates", json=JOIN)).json()
        code = body["associate"]["code"]
        assert body["ok"] and code.startswith("PERS") and len(code) == 8  # "Person" → PERS + 4
        assert all(ch in "ABCDEFGHJKMNPQRSTUVWXYZ23456789" for ch in code[4:])
        again = (await asha.post("/api/associates", json={**JOIN, "city": "Mumbai"})).json()
        assert again["associate"]["code"] == code and again["associate"]["city"] == "Pune"
        me = (await asha.get("/api/associates/me")).json()
        assert me["associate"]["code"] == code and me["commissions"] == [] and me["quotes"] == []
    async with signed_in("plain@example.com") as plain:
        assert (await plain.get("/api/associates/me")).status_code == 404


async def test_referral_cookie_first_valid_link_wins(client):
    async with signed_in("asha@example.com") as asha:
        first = (await asha.post("/api/associates", json=JOIN)).json()["associate"]["code"]
    async with signed_in("ravi@example.com") as ravi:
        second = (await ravi.post("/api/associates", json=JOIN)).json()["associate"]["code"]
    assert (await client.post("/api/associates/ref", json={"code": "NOPE1234"})).status_code == 404
    set_ = await client.post("/api/associates/ref", json={"code": first.lower()})
    assert set_.json() == {"ok": True, "kept": False}
    assert f"obasix_ref={first}" in set_.headers["set-cookie"] and "Max-Age=2592000" in set_.headers["set-cookie"]
    client.cookies.set("obasix_ref", first)
    assert (await client.post("/api/associates/ref", json={"code": second})).json() == {"ok": True, "kept": True}
    forged = await client.post("/api/associates/ref", json={"code": first}, headers={"origin": "https://evil.example"})
    assert forged.status_code == 403


async def test_paused_associates_get_no_new_referrals(client):
    async with signed_in("asha@example.com") as asha:
        code = (await asha.post("/api/associates", json=JOIN)).json()["associate"]["code"]
    async with signed_in("boss@example.com") as boss:
        assert (await boss.post("/api/admin/associates", json={"action": "pause", "code": code})).json() == {"ok": True}
        assert (
            await boss.post("/api/admin/associates", json={"action": "pause", "code": "NOPE1234"})
        ).status_code == 404
    assert (await client.post("/api/associates/ref", json={"code": code})).status_code == 404


async def test_commission_states_follow_the_order():
    await make_order("OBX-A", "Delivered")
    await make_order("OBX-B", "Processing")
    await make_order("OBX-C", "Cancelled")
    for cid, oid in (("COM-1", "OBX-A"), ("COM-2", "OBX-B"), ("COM-3", "OBX-C"), ("COM-4", "OBX-GONE")):
        await commission(cid, "ASHA2345", oid)
    async with signed_in("boss@example.com") as boss:
        states = {c["id"]: c["state"] for c in (await boss.get("/api/admin/commissions")).json()["items"]}
    assert states == {"COM-1": "Payable", "COM-2": "Awaiting delivery", "COM-3": "Void", "COM-4": "Void"}


async def test_paying_only_payable_commissions_with_a_reference_and_voiding():
    await make_order("OBX-A", "Delivered")
    await make_order("OBX-B", "Processing")
    await commission("COM-1", "ASHA2345", "OBX-A")
    await commission("COM-2", "ASHA2345", "OBX-B")
    async with signed_in("boss@example.com") as boss:
        act = lambda **b: boss.post("/api/admin/associates", json=b)  # noqa: E731
        assert (await act(action="pay", ids=[], payoutRef="UTR1")).json()[
            "message"
        ] == "Select at least one payable commission."
        assert (await act(action="pay", ids=["COM-1"], payoutRef="U")).json()[
            "message"
        ] == "Enter the bank transfer or UTR reference for this payout."
        paid = (await act(action="pay", ids=["COM-1", "COM-2", "COM-9"], payoutRef="UTR123456")).json()
        assert paid == {"ok": True, "paid": ["COM-1"], "skipped": ["COM-2", "COM-9"]}
        assert (await act(action="pay", ids=["COM-1"], payoutRef="UTR123456")).json()["paid"] == []  # not twice
        assert (await act(action="void", id="COM-2", reason="x")).json()[
            "message"
        ] == "Give a reason for voiding this commission."
        assert (await act(action="void", id="COM-2", reason="Customer returned it")).json() == {"ok": True}
        assert (await act(action="void", id="COM-1", reason="Too late")).status_code == 409
        assert (await act(action="dance")).json()["message"] == "Unknown action."
    async with db.connection() as conn:
        rows = {r["id"]: r for r in await (await conn.execute("SELECT * FROM associate_commissions")).fetchall()}
        audit = [r["action"] for r in await (await conn.execute("SELECT action FROM audit_log ORDER BY id")).fetchall()]
    assert rows["COM-1"]["status"] == "paid" and rows["COM-1"]["payout_ref"] == "UTR123456" and rows["COM-1"]["paid_at"]
    assert rows["COM-2"]["status"] == "void" and rows["COM-2"]["void_reason"] == "Customer returned it"
    assert audit == ["commission.pay", "commission.void"]


async def test_summaries_and_who_may_see_them():
    async with signed_in("asha@example.com") as asha:
        code = (await asha.post("/api/associates", json=JOIN)).json()["associate"]["code"]
    await make_order("OBX-A", "Delivered")
    await make_order("OBX-B", "Cancelled")
    await commission("COM-1", code, "OBX-A", 50)
    await commission("COM-2", code, "OBX-B", 70)
    async with signed_in("boss@example.com") as boss:
        [summary] = (await boss.get("/api/admin/associates")).json()["items"]
        await boss.post("/api/admin/staff", json={"email": "clerk@example.com", "role": "staff"})
    assert summary["code"] == code and summary["email"] == "asha@example.com"
    assert (summary["orders"], summary["referredSales"], summary["payable"], summary["awaiting"], summary["paid"]) == (
        1,
        1000,
        50,
        0,
        0,
    )
    async with signed_in("clerk@example.com") as clerk:  # payouts are admin-only
        assert (await clerk.get("/api/admin/associates")).status_code == 403
        assert (await clerk.post("/api/admin/associates", json={"action": "pause", "code": code})).status_code == 403


async def test_demo_order_stepping_only_in_demo_mode(monkeypatch):
    await make_order("OBX-DEMO-1", "Payment Confirmed")
    async with signed_in("boss@example.com") as boss:
        monkeypatch.setattr(get_settings(), "commerce_mode_flag", "live")
        assert (
            await boss.post("/api/admin/associates", json={"action": "advance-order", "orderId": "OBX-DEMO-1"})
        ).status_code == 409
        monkeypatch.setattr(get_settings(), "commerce_mode_flag", "demo")
        assert (
            await boss.post("/api/admin/associates", json={"action": "advance-order", "orderId": "OBX-DEMO-1"})
        ).json() == {"ok": True, "status": "Processing"}
        assert (
            await boss.post("/api/admin/associates", json={"action": "advance-order", "orderId": "NOPE"})
        ).status_code == 404


@pytest.mark.parametrize("value", ["asha-2345", " asha 2345!!", "ASHA2345XYZ0123"])
def test_normalize_code(value):
    from app.channels.associates import normalize_code

    assert normalize_code(value).startswith("ASHA2345") and len(normalize_code(value)) <= 12
