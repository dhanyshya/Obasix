import json

import pytest

from app.core import db
from app.core.config import get_settings
from app.proofs import router as proofs_module
from tests.test_admin import signed_in

PNG = b"\x89PNG\r\n\x1a\nproof"
REF = "OBX-QUOTE-DEMO-PRF001"


@pytest.fixture(autouse=True)
def setup(monkeypatch, tmp_path):
    settings = get_settings()
    monkeypatch.setattr(settings, "files_dir", str(tmp_path))
    monkeypatch.setattr(settings, "blob_token", "")
    sent: list[tuple] = []

    async def fake_send(to, message):
        sent.append((to, message["subject"]))
        return True

    monkeypatch.setattr(proofs_module, "send_email", fake_send)
    return sent


async def save_quote(reference=REF, email="buyer@example.com"):
    quote = {
        "reference": reference,
        "idempotencyKey": f"k-{reference}",
        "createdAt": "2026-11-20T10:00:00.000Z",
        "email": email,
    }
    async with db.connection() as conn:
        await conn.execute(
            "INSERT INTO quote_requests (reference, idempotency_key, email, created_at, payload) VALUES (%s, %s, %s, %s, %s)",
            (reference, quote["idempotencyKey"], email, quote["createdAt"], json.dumps(quote)),
        )


async def upload(client, reference=REF, data=PNG, note="Check the logo colour"):
    return await client.post(
        "/api/admin/proofs",
        data={"quoteReference": reference, "note": note},
        files={"file": ("logo.png", data, "image/png")},
    )


async def proofs():
    async with db.connection() as conn:
        return await (
            await conn.execute("SELECT id, version, status, uploaded_by, stored_as FROM design_proofs ORDER BY version")
        ).fetchall()


async def test_upload_rules(setup):
    await save_quote()
    async with signed_in("boss@example.com") as boss:
        assert (await boss.post("/api/admin/proofs", data={"note": "x"})).json()[
            "message"
        ] == "Enter the quote reference."
        assert (await boss.post("/api/admin/proofs", data={"quoteReference": REF})).json()[
            "message"
        ] == "Choose the proof file."
        too_big = await upload(boss, data=b"%PDF" + b"0" * (5 * 1024 * 1024))
        assert too_big.json()["message"] == "The proof must be 5 MB or smaller."
        assert (await upload(boss, data=b"GIF89a")).json()["message"] == "Upload the proof as a PNG, JPEG, WebP or PDF."
        missing = await upload(boss, reference="OBX-QUOTE-DEMO-NOPE")
        assert missing.status_code == 409 and missing.json()["message"] == "No quote matches that reference."
        assert (await upload(boss, reference=REF.lower())).json() == {"ok": True, "version": 1}
    assert setup == [("buyer@example.com", f"Your design proof for {REF} is ready")]


async def test_versions_supersede_and_an_approval_closes_the_thread(tmp_path):
    await save_quote()
    async with signed_in("boss@example.com") as boss:
        await upload(boss)
        await upload(boss)
        rows = await proofs()
        assert [(r["version"], r["status"]) for r in rows] == [(1, "superseded"), (2, "pending")]
        assert (tmp_path / "proof-files" / rows[1]["stored_as"]).read_bytes() == PNG
        async with signed_in("buyer@example.com") as buyer:
            no_confirm = await buyer.post("/api/proofs", json={"proofId": rows[1]["id"], "decision": "approved"})
            assert no_confirm.json()["message"] == "Confirm you've checked the wording, sizes and colours."
            old = await buyer.post(
                "/api/proofs", json={"proofId": rows[0]["id"], "decision": "approved", "confirm": True}
            )
            assert old.status_code == 409
            ok = await buyer.post(
                "/api/proofs", json={"proofId": rows[1]["id"], "decision": "approved", "confirm": True}
            )
            assert ok.json() == {"ok": True}
            twice = await buyer.post(
                "/api/proofs", json={"proofId": rows[1]["id"], "decision": "changes", "comment": "Too late now"}
            )
            assert twice.status_code == 409
        closed = await upload(boss)
        assert closed.status_code == 409 and "already approved" in closed.json()["message"]


async def test_customer_decisions_and_who_may_decide(setup):
    await save_quote()
    async with signed_in("boss@example.com") as boss:
        await upload(boss)
    [proof] = await proofs()
    async with signed_in("stranger@example.com") as stranger:
        assert (
            await stranger.post(
                "/api/proofs", json={"proofId": proof["id"], "decision": "changes", "comment": "Hello there"}
            )
        ).json() == {
            "ok": False,
            "message": "That proof wasn't found.",
        }
        assert (await stranger.post("/api/proofs", json={"decision": "maybe"})).json()[
            "message"
        ] == "Choose approve or request changes."
    async with signed_in("buyer@example.com") as buyer:
        short = await buyer.post("/api/proofs", json={"proofId": proof["id"], "decision": "changes", "comment": "no"})
        assert short.json()["message"] == "Tell us what to change."
        ok = await buyer.post(
            "/api/proofs", json={"proofId": proof["id"], "decision": "changes", "comment": "Logo should be larger"}
        )
        assert ok.json() == {"ok": True}
    async with db.connection() as conn:
        row = await (await conn.execute("SELECT status, decided_by, customer_comment FROM design_proofs")).fetchone()
    assert dict(row) == {
        "status": "changes",
        "decided_by": "buyer@example.com",
        "customer_comment": "Logo should be larger",
    }
    assert setup[-1][1] == f"Changes requested: {REF} v1"


async def test_proof_files_for_staff_and_the_owning_customer_only(client):
    await save_quote()
    async with signed_in("boss@example.com") as boss:
        await upload(boss)
        [proof] = await proofs()
        staff_view = await boss.get(f"/api/proofs/{proof['id']}/file")
        assert staff_view.status_code == 200 and staff_view.content == PNG
        assert staff_view.headers["content-type"] == "image/png"
        assert staff_view.headers["content-disposition"] == f'inline; filename="{REF}-v1.png"'
        assert staff_view.headers["cache-control"] == "private, no-store"
    assert (await client.get(f"/api/proofs/{proof['id']}/file")).status_code == 404
    async with signed_in("buyer@example.com") as buyer:
        assert (await buyer.get(f"/api/proofs/{proof['id']}/file")).content == PNG
    async with signed_in("stranger@example.com") as stranger:
        assert (await stranger.get(f"/api/proofs/{proof['id']}/file")).status_code == 404


async def test_quote_attachment_download_is_staff_only_and_audited(tmp_path):
    quote = {
        "reference": REF,
        "idempotencyKey": "k",
        "createdAt": "2026-11-20T10:00:00.000Z",
        "email": "b@example.com",
        "attachment": {"name": "plan.pdf", "type": "application/pdf", "size": 8, "storedAs": f"{REF}.pdf"},
    }
    async with db.connection() as conn:
        await conn.execute(
            "INSERT INTO quote_requests VALUES (%s, 'k', 'b@example.com', %s, %s)",
            (REF, quote["createdAt"], json.dumps(quote)),
        )
    (tmp_path / "quote-files").mkdir()
    (tmp_path / "quote-files" / f"{REF}.pdf").write_bytes(b"%PDF-abc")
    async with signed_in("customer@example.com") as customer:
        assert (await customer.get(f"/api/admin/quotes/{REF}/file")).status_code == 404
    async with signed_in("boss@example.com") as boss:
        response = await boss.get(f"/api/admin/quotes/{REF}/file")
        assert response.content == b"%PDF-abc"
        assert response.headers["content-disposition"] == f'attachment; filename="{REF}.pdf"'
        assert (await boss.get("/api/admin/quotes/OBX-QUOTE-DEMO-NONE/file")).status_code == 404
    async with db.connection() as conn:
        actions = await (await conn.execute("SELECT action, target_id FROM audit_log")).fetchall()
    assert [(a["action"], a["target_id"]) for a in actions] == [("quote.file.download", REF)]


async def test_staff_list_filters_and_upload_audit():
    await save_quote()
    await save_quote("OBX-QUOTE-DEMO-PRF002", "other@example.com")
    async with signed_in("boss@example.com") as boss:
        await upload(boss)
        await upload(boss)
        await upload(boss, reference="OBX-QUOTE-DEMO-PRF002")
        everything = (await boss.get("/api/admin/proofs")).json()
        assert everything["total"] == 3
        pending = (await boss.get("/api/admin/proofs", params={"status": "pending"})).json()
        assert sorted((p["quoteReference"], p["version"]) for p in pending["items"]) == [
            (REF, 2),
            ("OBX-QUOTE-DEMO-PRF002", 1),
        ]
        one = (await boss.get("/api/admin/proofs", params={"quoteReference": REF.lower()})).json()
        assert [p["version"] for p in one["items"]] == [2, 1]
    async with signed_in("customer@example.com") as customer:
        assert (await customer.get("/api/admin/proofs")).status_code == 404
    async with db.connection() as conn:
        actions = await (await conn.execute("SELECT action, detail FROM audit_log ORDER BY id")).fetchall()
    assert [a["action"] for a in actions] == ["proof.upload"] * 3
    assert actions[1]["detail"]["version"] == 2


async def test_customer_lists_only_their_own_threads(client):
    await save_quote()
    await save_quote("OBX-QUOTE-DEMO-PRF002", email="other@example.com")
    async with signed_in("boss@example.com") as boss:
        await upload(boss)
        await upload(boss, note="Second version")
        await upload(boss, reference="OBX-QUOTE-DEMO-PRF002")
    assert (await client.get("/api/proofs")).status_code == 401
    async with signed_in("buyer@example.com") as buyer:
        threads = (await buyer.get("/api/proofs")).json()["threads"]
    assert [t["reference"] for t in threads] == [REF]
    assert [p["version"] for p in threads[0]["proofs"]] == [2, 1]
    assert threads[0]["proofs"][0]["status"] == "pending"
    async with signed_in("stranger@example.com") as stranger:
        assert (await stranger.get("/api/proofs")).json()["threads"] == []
