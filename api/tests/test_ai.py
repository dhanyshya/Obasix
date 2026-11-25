import json
import shutil
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

from app.ai import router as ai_router
from app.ai.catalogue import catalogue_assist, customizer_cta, filter_known_product_ids
from app.core.config import get_settings
from tests.conftest import ORIGIN

ROOT = Path(__file__).parent.parent.parent
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64


class StandIn:
    """A local chat-completions provider and Claude API, replying with whatever the test queues."""

    def __init__(self):
        self.calls: list[dict] = []
        self.replies: list[tuple[int, dict]] = []
        outer = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_POST(self):  # noqa: N802
                body = json.loads(self.rfile.read(int(self.headers["content-length"])))
                outer.calls.append({"path": self.path, "headers": dict(self.headers), "body": body})
                status, reply = outer.replies.pop(0)
                self.send_response(status)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(reply).encode())

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), H)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()


@pytest.fixture
def stand_in(monkeypatch):
    s = StandIn()
    settings = get_settings()
    monkeypatch.setattr(settings, "obasix_ai_api_key", "sk-test-key")
    monkeypatch.setattr(settings, "obasix_ai_base_url", f"{s.url}/v1")
    monkeypatch.setattr(settings, "obasix_ai_model", "stand-in-model")
    monkeypatch.setattr(settings, "anthropic_api_key", "sk-ant-test")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("ANTHROPIC_BASE_URL", s.url)
    monkeypatch.setattr(ai_router, "_client", None)
    yield s
    s.server.shutdown()


def chat_reply(content: str) -> tuple[int, dict]:
    return 200, {"choices": [{"message": {"content": content}}]}


async def ask(client, message="Which board for a meeting room?", history=None):
    return await client.post("/api/ai/chat", json={"message": message, "history": history or []})


# ---------- Chat ----------


async def test_a_grounded_answer_keeps_only_real_products(client, stand_in):
    model = {
        "message": "Try these  boards.",
        "productIds": ["cmwb6090", "made-up", "cmwb6090", "cmwb90120"],
        "customizerLabel": "Design it",
    }
    stand_in.replies.append(chat_reply(json.dumps(model)))
    history = [
        {"role": "user", "content": "hi"},
        {"role": "robot", "content": "x"},
        {"role": "assistant", "content": "  Hello!  "},
    ]
    body = (await ask(client, history=history)).json()
    assert (
        body["ok"]
        and body["mode"] == "ai"
        and body["message"] == "Try these boards."
        and body["model"] == "stand-in-model"
    )
    assert body["productIds"] == ["cmwb6090", "cmwb90120"]
    assert body["customizerCta"]["label"] == "Design it" and body["customizerCta"]["prefill"]["productId"] == "cmwb6090"
    sent = stand_in.calls[0]
    assert sent["path"] == "/v1/chat/completions" and sent["headers"]["authorization"] == "Bearer sk-test-key"
    assert sent["body"]["response_format"] == {"type": "json_object"} and sent["body"]["temperature"] == 0.4
    roles = [m["role"] for m in sent["body"]["messages"]]
    assert roles == ["system", "user", "assistant", "user"] and sent["body"]["messages"][2]["content"] == "Hello!"
    assert "OBASIX live catalogue" in sent["body"]["messages"][0]["content"]


async def test_json_wrapped_in_text_is_still_read_and_junk_falls_back(client, stand_in):
    stand_in.replies.append(chat_reply('Sure! {"message": "Here you go", "productIds": []} hope that helps'))
    assert (await ask(client)).json()["message"] == "Here you go"
    stand_in.replies.append(chat_reply("no json at all"))
    junk = await ask(client)
    assert junk.status_code == 502 and junk.json()["mode"] == "catalogue-fallback" and junk.json()["code"] == "upstream"


async def test_providers_without_json_mode_get_one_retry(client, stand_in):
    stand_in.replies += [
        (400, {"error": {"message": "Unknown parameter: response_format"}}),
        chat_reply('{"message": "ok"}'),
    ]
    assert (await ask(client)).json()["message"] == "ok"
    assert "response_format" not in stand_in.calls[1]["body"]


async def test_provider_failures_become_catalogue_answers(client, stand_in):
    stand_in.replies.append((401, {"error": {"code": "invalid_api_key"}}))
    bad_key = await ask(client, "Do you have ceramic boards?")
    body = bad_key.json()
    assert bad_key.status_code == 502 and body["code"] == "auth" and body["retryable"] is True
    assert body["message"].startswith("Bear with me") and "ceramic steel boards" in body["message"]
    stand_in.replies.append((429, {"error": {"code": "insufficient_quota"}}))
    assert (await ask(client)).json()["code"] == "quota"


async def test_unconfigured_validation_rate_limit_and_cross_site(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "obasix_ai_api_key", "")
    monkeypatch.setattr(get_settings(), "openai_api_key", "")
    off = await ask(client)
    assert off.status_code == 503 and off.json()["code"] == "unconfigured"
    assert (await client.get("/api/ai/chat")).json() == {
        "ok": True,
        "configured": False,
        "missing": ["OBASIX_AI_API_KEY"],
        "provider": None,
        "model": None,
    }
    assert (await ask(client, "x")).json()["message"] == "Please enter a short question for OBASIX Assistant."
    assert (
        await client.post("/api/ai/chat", content=b"{", headers={**ORIGIN, "content-type": "application/json"})
    ).status_code == 400
    assert (
        await client.post("/api/ai/chat", json={"message": "hello"}, headers={"origin": "https://evil.example"})
    ).status_code == 403
    monkeypatch.setattr(get_settings(), "obasix_ai_api_key", "sk-x")
    monkeypatch.setattr(get_settings(), "obasix_ai_base_url", "http://127.0.0.1:9")  # nothing listens: upstream
    statuses = [(await ask(client)).status_code for _ in range(21)]
    assert statuses[:20] == [502] * 20 and statuses[20] == 429


# ---------- Frame colours (Claude) ----------


def claude_reply(payload: dict | None, stop_reason: str = "end_turn") -> tuple[int, dict]:
    content = [{"type": "text", "text": json.dumps(payload)}] if payload else []
    return 200, {
        "id": "msg_1",
        "type": "message",
        "role": "assistant",
        "model": "claude-opus-5-5",
        "stop_reason": stop_reason,
        "stop_sequence": None,
        "content": content,
        "usage": {"input_tokens": 10, "output_tokens": 10},
    }


async def colours(client, data=PNG, product="cmwb6090"):
    return await client.post(
        "/api/ai/frame-colours", data={"productId": product}, files={"photo": ("wall.png", data, "image/png")}
    )


async def test_frame_colours_asks_claude_and_names_the_choices(client, stand_in):
    answer = {
        "room": "A pale blue wall.",
        "suggestions": [{"frameId": "aluminium-light", "colourId": "white", "reason": "Light and clean."}],
    }
    stand_in.replies.append(claude_reply(answer))
    body = (await colours(client)).json()
    assert body["ok"] and body["room"] == "A pale blue wall."
    [s] = body["suggestions"]
    assert (
        s["frameId"] == "aluminium-light"
        and s["colourId"] == "white"
        and s["frameName"]
        and s["colourHex"].startswith("#")
    )
    sent = stand_in.calls[0]
    assert (
        sent["path"].startswith("/v1/messages")
        and sent["headers"]["anthropic-beta"] == "server-side-fallback-2026-07-01"
    )
    req = sent["body"]
    assert (
        req["model"] == "claude-opus-5-5" and req["fallbacks"] == "default" and req["output_config"]["effort"] == "low"
    )
    schema = req["output_config"]["format"]["schema"]
    assert schema["required"] == ["room", "suggestions"]
    image, text = req["messages"][0]["content"]
    assert (
        image["source"]["media_type"] == "image/png"
        and "Frames we make:" in text["text"]
        and "The customer is looking at:" in text["text"]
    )


async def test_frame_colours_refusal_rate_limit_and_photo_checks(client, stand_in):
    stand_in.replies.append(claude_reply(None, stop_reason="refusal"))
    refused = await colours(client)
    assert (
        refused.status_code == 422
        and refused.json()["message"] == "We couldn't get suggestions for this photo. Try another one."
    )
    stand_in.replies += [(429, {"type": "error", "error": {"type": "rate_limit_error", "message": "slow down"}})] * 2
    busy = await colours(client)
    assert (
        busy.status_code == 502
        and busy.json()["message"] == "Lots of people are asking right now. Try again in a minute."
    )
    assert (await colours(client, data=b"GIF89a....")).json()["message"] == "Use a JPEG, PNG or WebP photo."
    assert (await colours(client, data=PNG + b"0" * (5 * 1024 * 1024))).json()[
        "message"
    ] == "The photo must be 5 MB or smaller."
    assert (await client.post("/api/ai/frame-colours", data={"x": "y"})).json()["message"] == "Add a photo of the wall."


async def test_status_says_whether_design_help_is_on(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "anthropic_api_key", "")
    assert (await client.get("/api/ai/status")).json() == {"design": False}
    assert (await colours(client)).status_code == 503
    monkeypatch.setattr(get_settings(), "anthropic_api_key", "sk-ant-x")
    assert (await client.get("/api/ai/status")).json() == {"design": True}


# ---------- Parity with the site ----------

MESSAGES = [
    "ceramic please",
    "Notice board for school",
    "pinup",
    "chalk",
    "combination board",
    "mobile stand",
    "pine wood frame",
    "non-magnetic",
    "whiteboard for office",
    "custom size",
    "magnets and markers",
    "hello there",
    "",
]


@pytest.mark.skipif(not shutil.which("node") or not (ROOT / "node_modules/jiti").exists(), reason="needs node + jiti")
def test_fallback_and_helpers_match_the_site():
    ids_cases = [["cmwb6090", "x", "cmwb6090", "CMWB90120", 5, " cmcb6090 ", "spbpcbg6090", "cmwb6090"], "nope", []]
    script = f"""
      import {{ createJiti }} from "jiti"; import path from "node:path";
      const jiti = createJiti(import.meta.url, {{ alias: {{ "@": path.resolve("src") }} }});
      const a = await jiti.import(path.resolve("src/lib/ai/catalogueAssist.ts"));
      const c = await jiti.import(path.resolve("src/lib/ai/catalogueContext.ts"));
      const out = {{
        assist: {json.dumps(MESSAGES)}.map((m) => a.catalogueAssist(m)),
        ids: {json.dumps(ids_cases)}.map((i) => c.filterKnownProductIds(i)),
        cta: ["cmwb6090", "cmwb90120", "nope", undefined].map((id) => c.buildCustomizerCta(id, id === "cmwb6090" ? "  " : undefined)),
      }};
      console.log(JSON.stringify(out));
    """
    node = json.loads(
        subprocess.run(
            ["node", "--input-type=module", "-e", script], capture_output=True, text=True, check=True, cwd=ROOT
        ).stdout
    )
    assert [catalogue_assist(m) for m in MESSAGES] == [
        {**x, "customizerCta": x.get("customizerCta")} for x in node["assist"]
    ]
    assert [filter_known_product_ids(i) for i in ids_cases] == node["ids"]
    assert [customizer_cta(i, "  " if i == "cmwb6090" else None) for i in ["cmwb6090", "cmwb90120", "nope", None]] == [
        x if x else None for x in node["cta"]
    ]
