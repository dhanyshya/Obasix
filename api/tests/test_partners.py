from app.channels.partners import client_key, js_date_ok
from app.core import db
from tests.test_admin import signed_in

APPLY = {"action": "apply", "companyName": "Fitout Co", "partnerType": "Fit-out or interior contractor", "gstin": "27AAPFU0939F1ZV",
         "city": "Mumbai", "state": "Maharashtra", "sectors": ["School or college", "Hotel", "School or college", "Moon base"], "accept": True}  # fmt: skip
PROJECT = {"action": "register-project", "clientName": "ABC Public School", "city": "Pune", "sector": "School or college",
           "scope": "40 classrooms with combination boards", "expectedValue": 250000, "expectedDate": "2027-01-15"}  # fmt: skip


async def approved_partner(email):
    ctx = signed_in(email)
    client = await ctx.__aenter__()
    assert (await client.post("/api/partners", json=APPLY)).json() == {"ok": True}
    user_id = (await client.get("/api/auth")).json()["user"]["id"]
    async with signed_in("boss@example.com") as boss:
        assert (
            await boss.post("/api/admin/partners", json={"action": "decide", "status": "approved", "userId": user_id})
        ).json() == {"ok": True}
    return ctx, client


def test_client_names_and_dates():
    assert (
        client_key("ABC Public School.", " Pune ")
        == client_key("abc public  school", "PUNE")
        == "abc public school|pune"
    )
    assert [
        js_date_ok(d) for d in ("2027-02-30", "2027-04-31", "2027-02-32", "2027-13-01", "2027-00-10", "27-01-01")
    ] == [True, True, False, False, False, False]


async def test_application_rules():
    async with signed_in("p@example.com") as p:
        for change, message in [
            ({"companyName": "F"}, "Enter your registered company name."),
            ({"partnerType": "Wizard"}, "Choose your type of business."),
            ({"gstin": "nope"}, "Enter a valid 15-character GSTIN."),
            ({"city": "M"}, "Enter your city and state."),
            ({"sectors": ["Moon base"]}, "Choose at least one sector you work in."),
            ({"accept": False}, "Accept the partner terms to apply."),
        ]:
            assert (await p.post("/api/partners", json={**APPLY, **change})).json()["message"] == message
        assert (await p.post("/api/partners", json=APPLY)).json() == {"ok": True}
        me = (await p.get("/api/partners/me")).json()["partner"]
        assert me["sectors"] == ["School or college", "Hotel"] and me["status"] == "pending"
        assert (await p.post("/api/partners", json=PROJECT)).json()[
            "message"
        ] == "Only approved partners can register projects."
        assert (await p.post("/api/partners", json={"action": "fly"})).json()["message"] == "Unknown action."


async def test_registration_rules_protection_and_conflicts():
    ctx, first = await approved_partner("first@example.com")
    for change, message in [
        ({"clientName": "A"}, "Enter the client's name."),
        ({"sector": "Mars"}, "Choose the project's sector."),
        ({"scope": "boards"}, "Describe the scope: rooms, boards, signage and quantities."),
        ({"expectedValue": "lots"}, "Enter the expected project value in rupees."),
        ({"expectedDate": "2027-02-32"}, "Enter the expected order date."),
    ]:
        assert (await first.post("/api/partners", json={**PROJECT, **change})).json()["message"] == message
    small = await first.post("/api/partners", json={**PROJECT, "expectedValue": 50000})
    assert (
        small.status_code == 409
        and small.json()["message"]
        == "Projects start at ₹1,00,000. Smaller orders can go through the website or the associate programme."
    )
    one = (await first.post("/api/partners", json=PROJECT)).json()
    assert one["ok"] and one["id"].startswith("PRJ-")
    resent = (await first.post("/api/partners", json={**PROJECT, "clientName": "abc public school."})).json()
    assert resent["id"] == one["id"]  # the same form within two minutes
    async with db.connection() as conn:
        await conn.execute(
            "UPDATE partner_projects SET created_at = '2026-01-01T00:00:00.000Z' WHERE id = %s", (one["id"],)
        )
    later = await first.post("/api/partners", json=PROJECT)
    assert later.status_code == 409 and later.json()["message"] == f"You already registered this client ({one['id']})."

    ctx2, second = await approved_partner("second@example.com")
    held = (await second.post("/api/partners", json=PROJECT)).json()
    assert held["ok"] and held["id"] != one["id"] and set(held) == {"ok", "id"}
    mine = (await second.get("/api/partners/me")).json()["projects"][0]
    assert mine["conflictWith"] == "held"  # never the other partner's project id
    async with signed_in("boss@example.com") as boss:
        quote = await boss.post(
            "/api/admin/partners",
            json={"action": "quote", "projectId": held["id"], "quotedValue": 300000, "marginPercent": 8},
        )
        assert (
            quote.status_code == 409
            and quote.json()["message"]
            == f"This client was registered first in {one['id']}. Resolve that before quoting."
        )
    await ctx.__aexit__(None, None, None)
    await ctx2.__aexit__(None, None, None)


async def test_staff_quote_win_link_deliver_pay_with_one_payout_per_order():
    ctx, p = await approved_partner("partner@example.com")
    pid = (await p.post("/api/partners", json=PROJECT)).json()["id"]
    async with db.connection() as conn:
        for oid in ("OBX-LINKED", "OBX-COMMISSIONED"):
            await conn.execute(
                "INSERT INTO demo_orders (id, idempotency_key, email, phone, customer_name, method, items, subtotal, status, shipping, created_at) "
                "VALUES (%s, %s, 'c@x.com', '9', 'C', 'online', '[]', 300000, 'Payment Confirmed', '{}', 'now')",
                (oid, f"k-{oid}"),
            )
        await conn.execute(
            "INSERT INTO associate_commissions (id, code, source_type, source_id, base_amount, rate, amount, created_at) VALUES ('COM-1', 'X', 'order', 'OBX-COMMISSIONED', 1, 0.05, 1, 'now')"
        )
    async with signed_in("boss@example.com") as boss:
        act = lambda **b: boss.post("/api/admin/partners", json={"projectId": pid, **b})  # noqa: E731
        assert (await act(action="quote", quotedValue="x", marginPercent=8)).json()[
            "message"
        ] == "Enter the quoted value in rupees."
        assert (await act(action="quote", quotedValue=300000, marginPercent="x")).json()[
            "message"
        ] == "Enter the negotiated margin as a percentage."
        assert (await act(action="quote", quotedValue=300000, marginPercent=31)).json()[
            "message"
        ] == "Set a margin between 0 and 30%."
        quoted = (await act(action="quote", quotedValue=300000.4, marginPercent=7.55, note="Net of freight")).json()[
            "project"
        ]
        assert (quoted["status"], quoted["quotedValue"], quoted["marginRate"], quoted["earning"]) == (
            "Quoted",
            300000,
            0.076,
            22800,
        )
        commissioned = await act(action="advance", linkedOrderId="OBX-COMMISSIONED")
        assert (
            commissioned.json()["message"]
            == "Order OBX-COMMISSIONED already earns an associate commission. Void it first: one order earns one payout."
        )
        assert (await act(action="advance", linkedOrderId="OBX-NONE")).json()[
            "message"
        ] == "No website order OBX-NONE was found."
        assert (await act(action="pay", payoutRef="UTR1")).json()[
            "message"
        ] == "Partner margin is paid only after the project is delivered."
        won = (await act(action="advance", linkedOrderId="OBX-LINKED")).json()["project"]
        assert won["status"] == "Won" and won["linkedOrderId"] == "OBX-LINKED" and won["staffNote"] == "Net of freight"
        assert (await act(action="quote", quotedValue=1, marginPercent=1)).json()[
            "message"
        ] == "A won project can't be re-quoted."
        await act(action="advance")
        assert (await act(action="advance")).json()["project"]["status"] == "Delivered"
        assert (await act(action="lose", note="Client walked")).json()[
            "message"
        ] == "A delivered project can't be marked lost."
        assert (await act(action="pay", payoutRef="U")).json()["message"] == "Enter the payment or UTR reference."
        paid = (await act(action="pay", payoutRef="UTR556677")).json()["project"]
        assert paid["status"] == "Paid" and paid["payoutRef"] == "UTR556677"
        [summary] = (await boss.get("/api/admin/partners")).json()["items"]
        assert (summary["projects"], summary["wonValue"], summary["earned"]) == (1, 300000, 22800)
        await boss.post("/api/admin/staff", json={"email": "clerk@example.com", "role": "staff"})
    async with signed_in("clerk@example.com") as clerk:  # staff: no margins, no payouts, no approvals
        assert (
            await clerk.post(
                "/api/admin/partners", json={"action": "quote", "projectId": pid, "quotedValue": 1, "marginPercent": 1}
            )
        ).status_code == 403
        assert (
            await clerk.post("/api/admin/partners", json={"action": "lose", "projectId": pid, "note": "x"})
        ).status_code == 409  # allowed, but paid
        assert (await clerk.get("/api/admin/projects")).status_code == 200
    async with db.connection() as conn:
        actions = [
            r["action"]
            for r in await (
                await conn.execute("SELECT action FROM audit_log WHERE target_type = 'project' ORDER BY id")
            ).fetchall()
        ]
    assert actions == ["project.quote", "project.advance", "project.advance", "project.advance", "project.pay"]
    await ctx.__aexit__(None, None, None)
