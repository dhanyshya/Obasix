import asyncio
import json
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.channels.distributors import financial_quarter, trade_price
from app.core import db
from tests.conftest import ORIGIN
from tests.test_admin import signed_in

ROOT = Path(__file__).parent.parent.parent
APPLY = {"businessName": "Sharma Traders", "businessType": "Regional wholesaler", "gstin": "27aapfu0939f1zv",
         "city": "Pune", "state": "Maharashtra", "territoryRequest": "Pune district", "accept": True}  # fmt: skip
APPROVE = {"action": "decide", "status": "approved", "tier": "silver", "territory": "Pune district", "creditLimit": 50000,
           "quarterlyTarget": 200000, "reviewDate": "2027-03-31"}  # fmt: skip


async def approved_distributor(email="dealer@example.com", **decision):
    """A signed-in, approved distributor (as a context manager's client)."""
    ctx = signed_in(email)
    dealer = await ctx.__aenter__()
    await dealer.post("/api/distributors", json=APPLY)
    user_id = (await dealer.get("/api/auth")).json()["user"]["id"]
    async with signed_in("boss@example.com") as boss:
        assert (await boss.post("/api/admin/distributors", json={**APPROVE, **decision, "userId": user_id})).json() == {
            "ok": True
        }
    return ctx, dealer


async def trade(client, key, lines, terms="credit"):
    return await client.post("/api/distributors/orders", json={"paymentTerms": terms, "lines": lines, "reference": "PO-1"},
                             headers={**ORIGIN, "idempotency-key": key})  # fmt: skip


async def test_application_rules_and_reapplying_after_rejection():
    async with signed_in("dealer@example.com") as dealer:
        for change, message in [
            ({"businessName": "S"}, "Enter your registered business name."),
            ({"businessType": "Pirate"}, "Choose your type of business."),
            ({"gstin": "27AAPFU0939F1Z"}, "Enter a valid 15-character GSTIN."),
            ({"state": "M"}, "Enter your city and state."),
            ({"territoryRequest": "x"}, "Tell us which area you want to cover."),
            ({"accept": False}, "Accept the distributor terms to apply."),
        ]:
            assert (await dealer.post("/api/distributors", json={**APPLY, **change})).json()["message"] == message
        body = (await dealer.post("/api/distributors", json=APPLY)).json()
        assert body["distributor"]["gstin"] == "27AAPFU0939F1ZV" and body["distributor"]["status"] == "pending"
        again = (await dealer.post("/api/distributors", json={**APPLY, "businessName": "Changed"})).json()
        assert again["distributor"]["businessName"] == "Sharma Traders"  # pending: not replaced
        user_id = (await dealer.get("/api/auth")).json()["user"]["id"]
        async with signed_in("boss@example.com") as boss:
            reject = {
                "action": "decide",
                "status": "rejected",
                "tier": "silver",
                "creditLimit": 0,
                "quarterlyTarget": 0,
                "userId": user_id,
            }
            assert (await boss.post("/api/admin/distributors", json=reject)).json()[
                "message"
            ] == "Add a note explaining the decision."
            assert (await boss.post("/api/admin/distributors", json={**reject, "note": "No GST history"})).json() == {
                "ok": True
            }
        fresh = (await dealer.post("/api/distributors", json={**APPLY, "businessName": "New Name"})).json()[
            "distributor"
        ]
        assert fresh["status"] == "pending" and fresh["businessName"] == "New Name" and fresh["decisionNote"] == ""


async def test_decisions_need_an_admin_and_complete_terms():
    async with signed_in("dealer@example.com") as dealer:
        await dealer.post("/api/distributors", json=APPLY)
        user_id = (await dealer.get("/api/auth")).json()["user"]["id"]
    async with signed_in("boss@example.com") as boss:
        act = lambda **b: boss.post("/api/admin/distributors", json={**APPROVE, "userId": user_id, **b})  # noqa: E731
        assert (await act(status="maybe")).json()["message"] == "Choose a decision."
        assert (await act(tier="diamond")).json()["message"] == "Choose a tier."
        assert (await act(creditLimit=-5)).json()["message"] == "Credit limit and target must be amounts in rupees."
        assert (await act(territory="")).json()["message"] == "Assign a territory before approving."
        assert (await act(reviewDate="31/03/2027")).json()["message"] == "Set the next territory review date."
        assert (await act(userId="nobody")).status_code == 404
        await boss.post("/api/admin/staff", json={"email": "clerk@example.com", "role": "staff"})
    async with signed_in("clerk@example.com") as clerk:
        assert (await clerk.post("/api/admin/distributors", json={**APPROVE, "userId": user_id})).status_code == 403
        assert (await clerk.get("/api/admin/distributors")).status_code == 200  # staff may see them


async def test_trade_pricing_minimum_and_credit():
    ctx, dealer = await approved_distributor()
    assert (await trade(dealer, "k", [])).json()[
        "message"
    ] == "A trade order needs an idempotency key so a retry can't create a second order."
    assert (await trade(dealer, "trade-0001", [{"productId": "cmwb6090", "quantity": 1}], terms="cash")).json()[
        "message"
    ] == "Choose credit or advance payment."
    small = await trade(dealer, "trade-0001", [{"productId": "cmwb6090", "quantity": 2}])
    assert small.status_code == 422 and small.json()["message"] == "The minimum trade order is ₹15,000 at trade price."
    nothing = await trade(
        dealer, "trade-0002", [{"productId": "nope", "quantity": 5}, {"productId": "cmwb6090", "quantity": 0.5}]
    )
    assert nothing.json()["message"] == "Add at least one catalogue product with a quantity."
    over = await trade(dealer, "trade-0003", [{"productId": "cmwb6090", "quantity": 40}])
    assert (
        over.json()["message"]
        == "This order is more than your available credit of ₹50,000. Choose advance payment or reduce the order."
    )
    ok = (
        await trade(
            dealer, "trade-0004", [{"productId": "cmwb6090", "quantity": 6}, {"productId": "CMWB6090", "quantity": 5}]
        )
    ).json()["order"]
    assert ok["items"] == [
        {
            "productId": "cmwb6090",
            "name": "Classic Magnetic Whiteboard 2×3",
            "sku": "CMWB6090",
            "quantity": 11,
            "listPrice": 1825,
            "tradePrice": 1497,
            "lineTotal": 16467,
        }
    ]
    assert (ok["status"], ok["netTotal"], ok["listSubtotal"], ok["discountRate"]) == ("Confirmed", 16467, 20075, 0.18)
    assert (await trade(dealer, "trade-0004", [])).json()["order"]["id"] == ok["id"]  # replay
    me = (await dealer.get("/api/distributors/me")).json()
    assert (me["creditUsed"], me["creditAvailable"], me["quarterPurchases"]) == (16467, 33533, 16467)
    advance = (await trade(dealer, "trade-0005", [{"productId": "cmwb6090", "quantity": 30}], terms="advance")).json()[
        "order"
    ]
    assert advance["status"] == "Awaiting payment"
    await ctx.__aexit__(None, None, None)


async def test_two_credit_orders_at_once_cannot_overspend():
    ctx, dealer = await approved_distributor(creditLimit=30000)
    lines = [{"productId": "cmwb6090", "quantity": 11}]  # 16,467 each
    a, b = await asyncio.gather(trade(dealer, "race-0001", lines), trade(dealer, "race-0002", lines))
    assert sorted([a.status_code, b.status_code]) == [200, 422]
    await ctx.__aexit__(None, None, None)


async def test_staff_handle_trade_orders_and_it_is_audited():
    ctx, dealer = await approved_distributor()
    order = (await trade(dealer, "staff-0001", [{"productId": "cmwb6090", "quantity": 30}], terms="advance")).json()[
        "order"
    ]
    async with signed_in("boss@example.com") as boss:
        act = lambda **b: boss.post("/api/admin/distributors", json={"orderId": order["id"], **b})  # noqa: E731
        assert (await act(action="advance")).json()["message"] == "Record the advance payment before dispatch."
        assert (await act(action="record-payment", paymentRef="U")).json()[
            "message"
        ] == "Enter the payment or UTR reference."
        paid = (await act(action="record-payment", paymentRef="UTR998877")).json()["order"]
        assert paid["status"] == "Confirmed" and paid["paymentRef"] == "UTR998877" and paid["paidAt"]
        assert (await act(action="record-payment", paymentRef="UTR998877")).json()[
            "message"
        ] == "Payment is already recorded for this order."
        assert (await act(action="advance")).json()["order"]["status"] == "Dispatched"
        assert (await act(action="cancel")).json()[
            "message"
        ] == "Dispatched orders can't be cancelled here. Raise a return instead."
        assert (await act(action="advance")).json()["order"]["status"] == "Delivered"
        assert (await act(action="advance")).json()["message"] == "This order can't move forward."
        listed = (await boss.get("/api/admin/trade-orders")).json()["items"]
        assert listed[0]["businessName"] == "Sharma Traders"
        [summary] = (await boss.get("/api/admin/distributors")).json()["items"]
        assert summary["orderCount"] == 1 and summary["creditUsed"] == 0
    async with db.connection() as conn:
        actions = [
            r["action"] for r in await (await conn.execute("SELECT action FROM audit_log ORDER BY id")).fetchall()
        ]
    assert actions == ["distributor.decide", "trade.record-payment", "trade.advance", "trade.advance"]
    await ctx.__aexit__(None, None, None)


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "node_modules/jiti").exists(), reason="needs node + jiti")
def test_quarters_and_trade_prices_match_the_site():
    dates = [
        "2026-04-01T00:00:00Z",
        "2026-06-30T12:00:00Z",
        "2026-07-01T00:00:00Z",
        "2026-12-31T23:00:00Z",
        "2027-01-01T05:00:00Z",
        "2027-03-31T10:00:00Z",
    ]
    prices = [[1825, 0.18], [1825, 0.23], [2999, 0.28], [4500, 0.18], [7499, 0.23]]
    script = f"""
      import {{ createJiti }} from "jiti"; import path from "node:path";
      const jiti = createJiti(import.meta.url, {{ alias: {{ "@": path.resolve("src") }} }});
      const p = await jiti.import(path.resolve("src/lib/distributors/program.ts"));
      const quarters = {json.dumps(dates)}.map((d) => {{ const q = p.financialQuarter(new Date(d)); return [q.label, q.start.toISOString(), q.end.toISOString()]; }});
      const prices = {json.dumps(prices)}.map(([l, d]) => Math.round(l * (1 - d)));
      console.log(JSON.stringify({{ quarters, prices }}));
    """
    node = json.loads(
        subprocess.run(
            ["node", "--input-type=module", "-e", script], capture_output=True, text=True, check=True, cwd=ROOT
        ).stdout
    )
    ours = []
    for d in dates:
        start, end, label = financial_quarter(datetime.fromisoformat(d.replace("Z", "+00:00")))
        ours.append(
            [
                label,
                start.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
                end.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            ]
        )
    assert ours == node["quarters"]
    assert [trade_price(lp, d) for lp, d in prices] == node["prices"]
