import asyncio
import json

from app.core import db
from tests.test_admin import signed_in

CART = [{"productId": "cmwb6090", "quantity": 3}, {"productId": "retired-x", "quantity": 1}]


async def test_company_people_and_owner_rules():
    async with signed_in("owner@example.com") as owner:
        assert (await owner.post("/api/company", json={"action": "add-member", "email": "x@y.co"})).json()[
            "message"
        ] == "You're not part of a company account."
        assert (await owner.post("/api/company", json={"action": "create", "name": "A"})).json()[
            "message"
        ] == "Enter your company name."
        assert (await owner.post("/api/company", json={"action": "create", "name": "Acme", "gstin": "bad"})).json()[
            "message"
        ] == "Enter a valid 15-character GSTIN, or leave it blank."
        assert (await owner.post("/api/company", json={"action": "create", "name": "Acme Schools"})).json() == {
            "ok": True
        }
        again = await owner.post("/api/company", json={"action": "create", "name": "Second Co"})
        assert again.status_code == 409 and again.json()["message"] == "You're already part of Acme Schools."
        act = lambda **b: owner.post("/api/company", json=b)  # noqa: E731
        assert (await act(action="add-member", email="nope")).json()["message"] == "Enter a valid email address."
        assert (await act(action="add-member", email="Buyer@Example.com")).json() == {"ok": True}
        assert (await act(action="add-member", email="buyer@example.com")).json()[
            "message"
        ] == "buyer@example.com is already in your company."
        assert (await act(action="set-role", email="buyer@example.com", role="chief")).json()[
            "message"
        ] == "Choose owner or buyer."
        assert (await act(action="set-role", email="owner@example.com", role="buyer")).json()[
            "message"
        ] == "A company needs at least one owner."
        assert (await act(action="remove-member", email="owner@example.com")).json()[
            "message"
        ] == "A company needs at least one owner. Make someone else an owner first."
        assert (await act(action="remove-member", email="ghost@example.com")).json()[
            "message"
        ] == "That person isn't in your company."
        view = (await owner.get("/api/company")).json()
        assert view["membership"]["role"] == "owner" and [m["email"] for m in view["members"]] == [
            "owner@example.com",
            "buyer@example.com",
        ]
    async with signed_in("buyer@example.com") as buyer:
        assert (await buyer.post("/api/company", json={"action": "add-member", "email": "z@y.co"})).json()[
            "message"
        ] == "Only company owners can manage people."
    async with signed_in("rival@example.com") as rival:
        await rival.post("/api/company", json={"action": "create", "name": "Rival Ltd"})
        taken = await rival.post("/api/company", json={"action": "add-member", "email": "buyer@example.com"})
        assert taken.json()["message"] == "buyer@example.com already belongs to another company account."


async def test_two_owners_adding_the_same_person_at_once():
    async with signed_in("o1@example.com") as o1, signed_in("o2@example.com") as o2:
        await o1.post("/api/company", json={"action": "create", "name": "One"})
        await o2.post("/api/company", json={"action": "create", "name": "Two"})
        a, b = await asyncio.gather(
            o1.post("/api/company", json={"action": "add-member", "email": "shared@example.com"}),
            o2.post("/api/company", json={"action": "add-member", "email": "shared@example.com"}),
        )
        assert sorted([a.status_code, b.status_code]) == [200, 409]


async def test_reorder_lists_from_the_cart_and_own_orders_repriced_on_read():
    async with signed_in("owner@example.com") as owner:
        await owner.post("/api/company", json={"action": "create", "name": "Acme"})
        assert (await owner.post("/api/company", json={"action": "save-list", "name": "B", "lines": CART})).json()[
            "message"
        ] == 'Give the list a name, such as "Branch office standard".'
        assert (
            await owner.post(
                "/api/company", json={"action": "save-list", "name": "Empty", "lines": [{"productId": "x"}]}
            )
        ).json()["message"] == "There's nothing to save: the list has no catalogue products."
        saved = (
            await owner.post("/api/company", json={"action": "save-list", "name": "Branch standard", "lines": CART})
        ).json()
        me = (await owner.get("/api/auth")).json()["user"]
        async with db.connection() as conn:
            await conn.execute(
                "INSERT INTO demo_orders (id, idempotency_key, user_id, email, phone, customer_name, method, items, subtotal, status, shipping, created_at) "
                "VALUES ('OBX-MINE', 'k1', %s, 'owner@example.com', '9', 'O', 'upi', %s, 1, 'Delivered', '{}', 'now'), "
                "('OBX-GUEST', 'k2', NULL, 'owner@example.com', '9', 'O', 'upi', %s, 1, 'Delivered', '{}', 'now')",
                (
                    me["id"],
                    json.dumps([{"productId": "cmwb90120", "quantity": 120}]),
                    json.dumps([{"productId": "cmwb6090", "quantity": 1}]),
                ),
            )
        assert (
            await owner.post("/api/company", json={"action": "save-list", "name": "From guest", "orderId": "OBX-GUEST"})
        ).status_code == 404
        from_order = (
            await owner.post("/api/company", json={"action": "save-list", "name": "From order", "orderId": "OBX-MINE"})
        ).json()
        lists = {item["id"]: item for item in (await owner.get("/api/company")).json()["lists"]}
        cart_list, order_list = lists[saved["id"]], lists[from_order["id"]]
        assert (cart_list["total"], cart_list["droppedLines"], cart_list["lines"][0]["unitPrice"]) == (5475, 0, 1825)
        assert order_list["source"] == "Saved from order OBX-MINE" and order_list["lines"][0]["quantity"] == 99
        assert (
            await owner.post("/api/company", json={"action": "delete-list", "listId": "RL-NONE"})
        ).status_code == 404
        assert (
            await owner.post("/api/company", json={"action": "add-member", "email": "buyer@example.com"})
        ).json() == {"ok": True}
    async with signed_in("buyer@example.com") as buyer:
        refused = await buyer.post("/api/company", json={"action": "delete-list", "listId": saved["id"]})
        assert refused.json()["message"] == "Only company owners can delete shared lists."
        assert (
            await buyer.post("/api/company", json={"action": "save-list", "name": "Mine too", "lines": CART})
        ).json()["ok"] is True
