import asyncio
import hashlib
import hmac
import json
import shutil
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from app.commerce import router as commerce_router
from app.commerce import store
from app.core import db
from app.core.config import get_settings
from app.core.money import format_inr
from tests.conftest import ORIGIN
from tests.test_admin import signed_in

DETAILS = {
    "name": "Ravi Kumar",
    "email": "Ravi@Example.com",
    "phone": "+91 98765 43210",
    "shipping": {"line": "12 MG Road", "city": "Bengaluru", "state": "KA", "postal": "560001"},
}
LINES = [{"productId": "cmwb6090", "quantity": 2}]
KEY_SECRET, WEBHOOK_SECRET = "rzp_test_secret", "whsec_test"


@pytest.fixture
def sent(monkeypatch):
    log: list[tuple] = []

    async def fake(to, message):
        log.append((to, message["subject"]))
        return True

    monkeypatch.setattr(store, "send_email", fake)
    monkeypatch.setattr(commerce_router, "send_email", fake)
    return log


@pytest.fixture
def demo(monkeypatch):
    monkeypatch.setattr(get_settings(), "commerce_mode_flag", "demo")


class FakeRazorpay:
    def __init__(self, fail=False):
        self.orders: list[dict] = []
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_POST(self):  # noqa: N802
                body = json.loads(self.rfile.read(int(self.headers["content-length"])))
                outer.orders.append({"path": self.path, "auth": self.headers["authorization"], **body})
                status = 500 if fail else 200
                reply = {
                    "id": f"order_rzp{len(outer.orders)}",
                    "amount": body["amount"],
                    "currency": "INR",
                    "receipt": body["receipt"],
                    "status": "created",
                }
                self.send_response(status)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(reply).encode())

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()


@pytest.fixture
def live(monkeypatch):
    fake = FakeRazorpay()
    s = get_settings()
    for k, v in {
        "razorpay_key_id": "rzp_test_key",
        "razorpay_key_secret": KEY_SECRET,
        "razorpay_webhook_secret": WEBHOOK_SECRET,
        "razorpay_api_base": fake.url,
    }.items():
        monkeypatch.setattr(s, k, v)
    yield fake
    fake.server.shutdown()


async def order(client, key="order-key-0001", lines=LINES, method="upi", details=DETAILS):
    return await client.post(
        "/api/commerce/orders",
        json={"details": details, "lines": lines, "method": method},
        headers={**ORIGIN, "idempotency-key": key},
    )


def sign(order_id: str, payment_id: str) -> str:
    return hmac.new(KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


# ---------- Demo checkout ----------


async def test_mode_and_unconfigured(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "commerce_mode_flag", "live")
    assert (await client.get("/api/commerce/mode")).json() == {"mode": "unconfigured"}
    off = await order(client)
    assert off.status_code == 503
    assert off.json() == {
        "ok": False,
        "code": "provider_not_configured",
        "charged": False,
        "orderCreated": False,
        "message": "An order was not created. Online payment isn't set up on the server yet.",
        "required": ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
    }


async def test_demo_order_is_priced_on_the_server_and_idempotent(client, demo, sent):
    body = (
        await order(client, lines=[{"productId": "cmwb6090", "quantity": 2}, {"productId": "nope", "quantity": 1}])
    ).json()
    assert body["ok"] and body["mode"] == "demo" and body["charged"] is False and body["orderCreated"] is True
    o = body["order"]
    assert o["id"].startswith("OBX-DEMO-") and o["status"] == "Payment Confirmed" and o["paymentStatus"] == "paid"
    assert o["subtotal"] == 3650 and o["items"][0]["lineTotal"] == 3650 and o["email"] == "ravi@example.com"
    assert o["shippingAddress"]["country"] == "India"
    again = (await order(client)).json()
    assert again["order"]["id"] == o["id"]
    assert sent == []  # demo orders send no emails


async def test_two_identical_checkouts_at_once_make_one_order(client, demo):
    a, b = await asyncio.gather(order(client, key="same-key-0001"), order(client, key="same-key-0001"))
    assert a.json()["order"]["id"] == b.json()["order"]["id"]
    async with db.connection() as conn:
        assert (await (await conn.execute("SELECT COUNT(*) AS n FROM demo_orders")).fetchone())["n"] == 1


@pytest.mark.parametrize(
    ("change", "message", "status"),
    [
        ({"details": {**DETAILS, "name": "R"}}, "Enter the customer name.", 400),
        ({"details": {**DETAILS, "email": "x"}}, "Enter a valid email address.", 400),
        ({"details": {**DETAILS, "phone": "123"}}, "Enter a valid phone number.", 400),
        (
            {"details": {**DETAILS, "shipping": {"line": "1", "city": "B", "postal": "5"}}},
            "Enter a complete shipping address.",
            400,
        ),
        ({"method": "cash"}, "Choose UPI, Card, or Cash on Delivery.", 400),
        ({"lines": []}, "The cart is empty or contains products that are no longer in the catalogue.", 422),
        (
            {
                "lines": [
                    {"productId": "cmwb6090", "quantity": 1, "configuration": {"customWidthFt": 5, "customHeightFt": 4}}
                ]
            },
            "Custom-size boards need a quote. Remove them from the cart or request a quote.",
            422,
        ),
    ],
)
async def test_checkout_refusals_match_the_site(client, demo, change, message, status):
    response = await order(client, **change)
    assert response.status_code == status and response.json()["message"] == message
    assert response.json()["code"] == "invalid_request"


async def test_request_refusals(client, demo):
    short = await client.post("/api/commerce/orders", json={}, headers={**ORIGIN, "idempotency-key": "x"})
    assert short.json()["message"] == "An order needs an idempotency key so a retry cannot create a second order."
    forged = await client.post(
        "/api/commerce/orders", json={}, headers={"origin": "https://evil.example", "idempotency-key": "k-12345678"}
    )
    assert forged.status_code == 403
    unreadable = await client.post(
        "/api/commerce/orders",
        content=b"null",
        headers={**ORIGIN, "idempotency-key": "k-12345678", "content-type": "application/json"},
    )
    assert unreadable.json()["message"] == "The order could not be read."


async def test_referral_commission_but_never_for_your_own_order(client, demo):
    async with signed_in("assoc@example.com") as associate:
        me = (await associate.get("/api/auth")).json()["user"]
        async with db.connection() as conn:
            await conn.execute(
                "INSERT INTO associates (user_id, code, profession, city, created_at) VALUES (%s, 'ASHA2345', 'architect', 'Pune', 'now')",
                (me["id"],),
            )
        associate.cookies.set("obasix_ref", "ASHA2345")
        await order(associate, key="own-order-001", details={**DETAILS, "email": "other@example.com"})
    client.cookies.set("obasix_ref", "asha2345")
    referred = (await order(client, key="ref-order-001")).json()["order"]
    async with db.connection() as conn:
        rows = await (
            await conn.execute("SELECT source_id, amount, rate, base_amount FROM associate_commissions")
        ).fetchall()
    assert [dict(r) for r in rows] == [{"source_id": referred["id"], "amount": 183, "rate": 0.05, "base_amount": 3650}]


# ---------- Live payments ----------


async def test_live_checkout_opens_a_razorpay_order_for_the_server_price(client, live):
    body = (await order(client, key="live-order-01")).json()
    o = body["order"]
    assert body["mode"] == "real" and o["id"].startswith("OBX-") and not o["id"].startswith("OBX-DEMO-")
    assert o["status"] == "Pending Payment" and o["paymentStatus"] == "pending"
    assert body["razorpay"] == {
        "keyId": "rzp_test_key",
        "orderId": "order_rzp1",
        "amount": 365000,
        "currency": "INR",
        "prefill": {"name": "Ravi Kumar", "email": "ravi@example.com", "contact": "+91 98765 43210"},
    }
    [sent_order] = live.orders
    assert (
        sent_order["path"] == "/v1/orders"
        and sent_order["receipt"] == o["id"]
        and sent_order["notes"] == {"obasix_order": o["id"]}
    )
    assert sent_order["auth"].startswith("Basic ")
    # A retry reuses the same Razorpay order.
    assert (await order(client, key="live-order-01")).json()["razorpay"]["orderId"] == "order_rzp1"
    assert len(live.orders) == 1


async def test_razorpay_down_means_nothing_charged(client, monkeypatch):
    fake = FakeRazorpay(fail=True)
    for k, v in {
        "razorpay_key_id": "k",
        "razorpay_key_secret": KEY_SECRET,
        "razorpay_webhook_secret": WEBHOOK_SECRET,
        "razorpay_api_base": fake.url,
    }.items():
        monkeypatch.setattr(get_settings(), k, v)
    response = await order(client, key="down-order-01")
    assert response.status_code == 502 and response.json()["code"] == "payment_failed"
    fake.server.shutdown()


async def test_callback_and_webhook_mark_it_paid_exactly_once(client, live, sent):
    async with db.connection() as conn:
        await conn.execute("INSERT INTO product_stock VALUES ('cmwb6090', 5, 'boss@example.com', 'now')")
    o = (await order(client, key="pay-order-001")).json()["order"]
    bad = await client.post(
        "/api/commerce/payment",
        json={
            "orderId": o["id"],
            "razorpay_order_id": "order_rzp1",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": "nope",
        },
    )
    assert bad.status_code == 400 and bad.json()["code"] == "payment_failed"
    wrong = await client.post(
        "/api/commerce/payment",
        json={
            "orderId": o["id"],
            "razorpay_order_id": "order_other",
            "razorpay_payment_id": "pay_1",
            "razorpay_signature": sign("order_other", "pay_1"),
        },
    )
    assert wrong.status_code == 404
    good = {
        "orderId": o["id"],
        "razorpay_order_id": "order_rzp1",
        "razorpay_payment_id": "pay_1",
        "razorpay_signature": sign("order_rzp1", "pay_1"),
    }
    paid = (await client.post("/api/commerce/payment", json=good)).json()
    assert paid["ok"] and paid["order"]["paymentStatus"] == "paid" and paid["order"]["status"] == "Payment Confirmed"
    event = json.dumps(
        {"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_1", "order_id": "order_rzp1"}}}}
    ).encode()
    unsigned = await client.post(
        "/api/commerce/payment/webhook", content=event, headers={"x-razorpay-signature": "bad"}
    )
    assert unsigned.status_code == 401 and unsigned.text == "Invalid signature"
    signature = hmac.new(WEBHOOK_SECRET.encode(), event, hashlib.sha256).hexdigest()
    hooked = await client.post(
        "/api/commerce/payment/webhook", content=event, headers={"x-razorpay-signature": signature}
    )
    assert hooked.json() == {"ok": True}
    assert [s[1] for s in sent] == [f"Order {o['id']} confirmed", f"New paid order {o['id']} · ₹3,650"]
    async with db.connection() as conn:
        assert (await (await conn.execute("SELECT on_hand FROM product_stock")).fetchone())[
            "on_hand"
        ] == 3  # deducted once


async def test_the_webhook_alone_confirms_payment(client, live, sent):
    o = (await order(client, key="hook-order-01")).json()["order"]
    event = json.dumps(
        {"event": "order.paid", "payload": {"payment": {"entity": {"id": "pay_9", "order_id": "order_rzp1"}}}}
    ).encode()
    signature = hmac.new(WEBHOOK_SECRET.encode(), event, hashlib.sha256).hexdigest()
    assert (
        await client.post("/api/commerce/payment/webhook", content=event, headers={"x-razorpay-signature": signature})
    ).json() == {"ok": True}
    assert (await store.find(o["id"]))["paymentStatus"] == "paid"
    other = json.dumps({"event": "refund.created"}).encode()
    signed = hmac.new(WEBHOOK_SECRET.encode(), other, hashlib.sha256).hexdigest()
    assert (
        await client.post("/api/commerce/payment/webhook", content=other, headers={"x-razorpay-signature": signed})
    ).json() == {"ok": True}


# ---------- Tracking and the account's own orders ----------


async def test_tracking_by_email_or_phone_and_the_same_answer_for_wrong_contact(client, demo):
    o = (await order(client, key="track-order-1")).json()["order"]
    for contact in ("ravi@example.com", "9876543210", "+91-98765-43210"):
        found = (
            await client.post("/api/commerce/track", json={"orderNumber": o["id"].lower(), "contact": contact})
        ).json()
        assert found["found"] is True and found["order"]["id"] == o["id"], contact
    nope = await client.post("/api/commerce/track", json={"orderNumber": o["id"], "contact": "someone@else.com"})
    missing = await client.post(
        "/api/commerce/track", json={"orderNumber": "OBX-DEMO-NONE", "contact": "ravi@example.com"}
    )
    assert nope.status_code == missing.status_code == 404 and nope.json() == missing.json()
    short = await client.post("/api/commerce/track", json={"orderNumber": "OB", "contact": "x"})
    assert short.json()["message"] == "Enter an order number and the email or phone used at checkout."
    stepped = (
        await client.post(
            "/api/commerce/track", json={"orderNumber": o["id"], "contact": "ravi@example.com", "advance": True}
        )
    ).json()
    assert stepped["order"]["status"] == "Processing"


async def test_tracking_is_rate_limited(client, demo):
    statuses = [
        (
            await client.post("/api/commerce/track", json={"orderNumber": "OBX-DEMO-XXXX", "contact": "a@b.co"})
        ).status_code
        for _ in range(31)
    ]
    assert statuses[:30] == [404] * 30 and statuses[30] == 429


async def test_an_account_reads_only_its_own_orders(demo):
    async with signed_in("ravi@example.com") as ravi:
        mine = (await order(ravi, key="mine-order-01")).json()["order"]
        assert (await ravi.get("/api/commerce/orders", params={"id": mine["id"]})).json()["order"]["id"] == mine["id"]
    async with signed_in("other@example.com") as other:
        response = await other.get("/api/commerce/orders", params={"id": mine["id"]})
        assert response.status_code == 404 and response.json()["message"] == "No order matches that reference."


async def test_public_stock(client):
    async with db.connection() as conn:
        await conn.execute(
            "INSERT INTO product_stock VALUES ('cmwb6090', 3, 's', 'now'), ('cmwb90120', 0, 's', 'now'), ('spbpcbg6090', 40, 's', 'now')"
        )
    body = (await client.get("/api/stock", params={"ids": "cmwb6090,cmwb90120,spbpcbg6090,nope,cmcb6090"})).json()
    assert body == {
        "stock": {
            "cmwb6090": {"state": "low", "onHand": 3},
            "cmwb90120": {"state": "made-to-order"},
            "spbpcbg6090": {"state": "in-stock"},
        }
    }


# ---------- Staff ----------


async def test_staff_move_an_order_to_delivery_dispatch_needs_tracking_and_it_is_audited(client, live, sent):
    o = (await order(client, key="staff-order-1")).json()["order"]
    async with signed_in("boss@example.com") as boss:
        act = lambda **b: boss.post("/api/admin/orders", json={"orderId": o["id"].lower(), **b})  # noqa: E731
        unpaid = await act(action="advance")
        assert unpaid.status_code == 409 and unpaid.json()["message"] == "This order hasn't been paid yet."
        await client.post(
            "/api/commerce/payment",
            json={
                "orderId": o["id"],
                "razorpay_order_id": "order_rzp1",
                "razorpay_payment_id": "pay_1",
                "razorpay_signature": sign("order_rzp1", "pay_1"),
            },
        )
        assert (await act(action="advance")).json() == {"ok": True}  # → Processing
        no_tracking = await act(action="advance", courier="Delhivery")
        assert no_tracking.json()["message"] == "Enter the courier and tracking number to mark the order dispatched."
        assert (await act(action="advance", courier="Delhivery", trackingNumber="DLV123")).json() == {"ok": True}
        assert (await act(action="cancel", note="Customer changed mind")).json()[
            "message"
        ] == "Orders can be cancelled only before dispatch."
        assert (await act(action="dance")).json() == {"ok": False, "message": "Unknown action."}
        listed = (await boss.get("/api/admin/orders", params={"q": o["id"]})).json()["items"][0]
        assert (
            listed["status"] == "Dispatched"
            and listed["courier"] == "Delhivery"
            and listed["nextStatus"] == "Out for Delivery"
        )
        assert listed["providerPaymentId"] == "pay_1" and listed["updatedBy"] == "boss@example.com"
    assert sent[-1] == ("ravi@example.com", f"Order {o['id']} is on its way")
    async with db.connection() as conn:
        rows = await (await conn.execute("SELECT action, detail FROM audit_log ORDER BY id")).fetchall()
    assert [(r["action"], r["detail"]["after"]) for r in rows] == [
        ("order.advance", "Processing"),
        ("order.advance", "Dispatched"),
    ]
    assert rows[1]["detail"]["trackingNumber"] == "DLV123"


async def test_staff_cancel_needs_a_note_and_customers_get_404(client, demo):
    o = (await order(client, key="cancel-order1")).json()["order"]
    async with signed_in("customer@example.com") as customer:
        assert (
            await customer.post("/api/admin/orders", json={"orderId": o["id"], "action": "cancel"})
        ).status_code == 404
        assert (await customer.get("/api/admin/orders")).status_code == 404
    async with signed_in("boss@example.com") as boss:
        short = await boss.post("/api/admin/orders", json={"orderId": o["id"], "action": "cancel", "note": "no"})
        assert short.json()["message"] == "Add a note explaining the cancellation."
        assert (
            await boss.post("/api/admin/orders", json={"orderId": o["id"], "action": "cancel", "note": "Out of stock"})
        ).json() == {"ok": True}
        assert (await boss.post("/api/admin/orders", json={"orderId": "OBX-NONE", "action": "advance"})).json()[
            "message"
        ] == "No order matches that number."


async def test_staff_list_filters(client, demo, monkeypatch):
    demo_order = (await order(client, key="list-demo-001")).json()["order"]
    fake = FakeRazorpay()
    for k, v in {
        "razorpay_key_id": "k",
        "razorpay_key_secret": KEY_SECRET,
        "razorpay_webhook_secret": WEBHOOK_SECRET,
        "razorpay_api_base": fake.url,
    }.items():
        monkeypatch.setattr(get_settings(), k, v)
    live_order = (
        await order(client, key="list-live-001", details={**DETAILS, "name": "Asha Rao", "email": "asha@example.com"})
    ).json()["order"]
    async with signed_in("boss@example.com") as boss:
        get = lambda **q: boss.get("/api/admin/orders", params=q)  # noqa: E731
        assert (await get()).json()["total"] == 2
        assert [i["id"] for i in (await get(kind="demo")).json()["items"]] == [demo_order["id"]]
        assert [i["id"] for i in (await get(kind="live")).json()["items"]] == [live_order["id"]]
        assert [i["id"] for i in (await get(payment="pending")).json()["items"]] == [live_order["id"]]
        assert [i["id"] for i in (await get(q="asha")).json()["items"]] == [live_order["id"]]
        assert [i["id"] for i in (await get(status="Payment Confirmed")).json()["items"]] == [demo_order["id"]]
        assert (await get(since="2099-01-01T00:00:00Z")).json()["total"] == 0
    fake.server.shutdown()


# ---------- Parity with the site ----------


@pytest.mark.skipif(not shutil.which("node"), reason="needs node")
def test_rupees_and_signatures_match_node():
    amounts = [0, 5, 999, 1000, 3650, 100000, 1234567, 99999999, 1825.5, 1824.5, -2.5]
    script = (
        "const c=require('node:crypto');const f=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});"
        f"const a={json.dumps(amounts)}.map(n=>f.format(n));"
        f"const p=c.createHmac('sha256','{KEY_SECRET}').update('order_1|pay_1').digest('hex');"
        f"const w=c.createHmac('sha256','{WEBHOOK_SECRET}').update('{{\"x\":1}}').digest('hex');"
        "process.stdout.write(JSON.stringify({a,p,w}))"
    )
    node = json.loads(subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True).stdout)
    assert [format_inr(n) for n in amounts] == node["a"]
    from app.core import js

    assert [js.round_half_up(x) for x in (182.5, 2.5, -2.5, 0.49)] == [183, 3, -2, 0]
    assert sign("order_1", "pay_1") == node["p"]
    assert hmac.new(WEBHOOK_SECRET.encode(), b'{"x":1}', hashlib.sha256).hexdigest() == node["w"]
