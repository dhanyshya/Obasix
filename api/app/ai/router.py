"""AI on FastAPI (MIG-008): the chat assistant (an OpenAI-compatible provider, as on the site) and
frame-colour suggestions from a wall photo (Claude). Sign-layout suggestions stay on the site, next
to the signage rules its design studio also runs in the browser (see docs/migrations/tracking.md)."""

import base64
import json
import logging
import re
from typing import Any, Literal

import anthropic
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.datastructures import UploadFile

from app.ai.catalogue import catalogue_assist, customizer_cta, data, filter_known_product_ids, product
from app.core.config import get_settings
from app.core.http import client_address, fail, trusted_origin
from app.core.ratelimit import allow_attempt
from app.core.storage import sniff_type

log = logging.getLogger("obasix.ai")
router = APIRouter(tags=["ai"])

DESIGN_MODEL = "claude-opus-5-5"
MAX_MESSAGE, MAX_HISTORY, PHOTO_MAX = 1200, 12, 5 * 1024 * 1024
TROUBLE = "I'm having trouble responding right now. You can still browse our products or explore board customization."


async def allow_ai(key: str) -> bool:
    """20 AI requests a minute per visitor, shared with the site's bucket names."""
    return await allow_attempt(f"ai:{key}", 20, 60_000)


# ---------- Status ----------


@router.get("/api/ai/status", summary="Whether design help (Claude) is switched on")
async def status() -> JSONResponse:
    return JSONResponse({"design": bool(get_settings().anthropic_api_key)}, headers={"cache-control": "no-store"})


# ---------- Chat (OpenAI-compatible provider) ----------


class ProviderError(Exception):
    def __init__(self, code: str, status: int) -> None:
        super().__init__(code)
        self.code, self.status = code, status


def _provider() -> dict[str, str] | None:
    s = get_settings()
    key = s.obasix_ai_api_key.strip() or s.openai_api_key.strip()
    if not key:
        return None
    return {
        "key": key,
        "base": s.obasix_ai_base_url.strip().rstrip("/") or "https://api.openai.com/v1",
        "model": s.obasix_ai_model.strip() or "gpt-4o-mini",
    }


def _redact(text: str) -> str:
    return re.sub(r"Bearer\s+\S+", "Bearer [redacted]", re.sub(r"sk-[a-zA-Z0-9_-]+", "[redacted]", text), flags=re.I)[
        :400
    ]


def _classify(status: int, body: str) -> str:
    lower = body.lower()
    if status in (401, 403) or "invalid_api_key" in lower:
        return "auth"
    if status == 429 or any(k in lower for k in ("insufficient_quota", "credit_balance_exhausted", "billing")):
        return "quota"
    return "upstream"


async def _complete(system: str, turns: list[dict[str, str]]) -> tuple[str, str]:
    provider = _provider()
    if not provider:
        raise ProviderError("unconfigured", 503)

    async def post(client: httpx.AsyncClient, json_mode: bool) -> httpx.Response:
        return await client.post(
            f"{provider['base']}/chat/completions",
            headers={"authorization": f"Bearer {provider['key']}"},
            json={
                "model": provider["model"],
                "temperature": 0.4,
                **({"response_format": {"type": "json_object"}} if json_mode else {}),
                "messages": [{"role": "system", "content": system}, *turns],
            },
        )

    try:
        async with httpx.AsyncClient(timeout=28) as client:
            response = await post(client, True)
            if response.status_code in (400, 404):
                # Some compatible providers don't take JSON mode: try once without it.
                if re.search(r"response_format|json_object|unknown parameter", response.text, re.I):
                    log.warning("Retrying chat without response_format: %s", _redact(response.text))
                    response = await post(client, False)
            if response.is_error:
                code = _classify(response.status_code, response.text)
                log.error("Chat provider error %s (%s): %s", response.status_code, code, _redact(response.text))
                raise ProviderError(code, 502)
            content = (((response.json().get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
    except ProviderError:
        raise
    except httpx.TimeoutException as error:
        log.error("Chat provider timeout")
        raise ProviderError("timeout", 504) from error
    except (httpx.HTTPError, ValueError) as error:
        log.error("Chat provider network error: %s", type(error).__name__)
        raise ProviderError("upstream", 502) from error
    if not content:
        raise ProviderError("upstream", 502)
    return content, provider["model"]


def _clean(value: Any, limit: int = MAX_MESSAGE) -> str:
    return re.sub(r"\s+", " ", value).strip()[:limit] if isinstance(value, str) else ""


def _fallback(message: str, code: str, status: int) -> JSONResponse:
    assist = catalogue_assist(message)
    return JSONResponse(
        {
            "ok": False,
            "code": code,
            "message": assist["message"],
            "retryable": True,
            "mode": "catalogue-fallback",
            "recommendations": assist["recommendations"],
            "customizerCta": assist["customizerCta"],
            "links": assist["links"],
        },
        status_code=status,
    )


@router.get("/api/ai/chat", summary="Whether the chat provider is configured")
async def chat_status() -> JSONResponse:
    provider = _provider()
    return JSONResponse(
        {
            "ok": True,
            "configured": bool(provider),
            "missing": [] if provider else ["OBASIX_AI_API_KEY"],
            "provider": "openai-compatible" if provider else None,
            "model": provider["model"] if provider else None,
        }
    )


@router.post("/api/ai/chat", summary="Ask the OBASIX assistant (answers grounded in the catalogue)")
async def chat(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    try:
        body = json.loads(await request.body())
    except ValueError:
        return JSONResponse(
            {"ok": False, "code": "validation", "message": "Could not read the chat request.", "retryable": False},
            status_code=400,
        )
    payload = body if isinstance(body, dict) else {}
    message = _clean(payload.get("message"))
    if len(message) < 2:
        return JSONResponse(
            {
                "ok": False,
                "code": "validation",
                "message": "Please enter a short question for OBASIX Assistant.",
                "retryable": False,
            },
            status_code=400,
        )
    if not _provider():
        return _fallback(message, "unconfigured", 503)
    if not await allow_ai(client_address(request)):
        return JSONResponse(
            {
                "ok": False,
                "code": "rate_limited",
                "message": "Too many chat requests. Please wait a minute and try again.",
                "retryable": True,
                "links": [
                    {"label": "Browse Products", "href": "/products"},
                    {"label": "Design Your Board", "href": "/customize"},
                ],
            },
            status_code=429,
        )
    history = []
    for item in payload.get("history") if isinstance(payload.get("history"), list) else []:
        item = item if isinstance(item, dict) else {}
        role = item.get("role") if item.get("role") in ("user", "assistant") else None
        content = _clean(item.get("content"))
        if role and content:
            history.append({"role": role, "content": content})
            if len(history) >= MAX_HISTORY:
                break
    system = f"{data()['systemPrompt']}\n\n{data()['catalogueContext']}"
    try:
        raw, model = await _complete(system, [*history, {"role": "user", "content": message}])
    except ProviderError as error:
        return _fallback(message, error.code, 503 if error.code == "unconfigured" else 502)
    try:
        parsed = json.loads(raw)
    except ValueError:
        match = re.search(r"\{[\s\S]*\}", raw)
        try:
            parsed = json.loads(match[0]) if match else None
        except ValueError:
            parsed = None
    if not isinstance(parsed, dict):
        log.error("Chat model returned invalid JSON")
        return _fallback(message, "upstream", 502)
    reply = _clean(parsed.get("message"), 4000)
    if not reply:
        return _fallback(message, "upstream", 502)
    ids = filter_known_product_ids(parsed.get("productIds"))
    chosen = parsed.get("customizerProductId")
    customizer_id = (
        (filter_known_product_ids([chosen]) or [None])[0]
        if isinstance(chosen, str)
        else next((pid for pid in ids if customizer_cta(pid)), None)
    )
    label = parsed.get("customizerLabel") if isinstance(parsed.get("customizerLabel"), str) else None
    return JSONResponse(
        {
            "ok": True,
            "mode": "ai",
            "message": reply,
            "productIds": ids,
            "recommendations": [
                {"productId": pid, "reason": "Suggested from the live OBASIX catalogue"} for pid in ids
            ],
            "customizerCta": customizer_cta(customizer_id, label),
            "model": model,
        }
    )


# ---------- Frame colours (Claude) ----------


def _suggestion_model() -> type[BaseModel]:
    frame_ids = tuple(f["id"] for f in data()["frames"])
    colour_ids = tuple(c["id"] for c in data()["colours"])

    class Suggestion(BaseModel):
        frameId: Literal[frame_ids]  # type: ignore[valid-type]
        colourId: Literal[colour_ids]  # type: ignore[valid-type]
        reason: str = Field(description="One sentence on why this suits the room")

    class Suggestions(BaseModel):
        room: str = Field(description="One short sentence describing the wall and room as seen in the photo")
        suggestions: list[Suggestion] = Field(description="Two or three suggestions, best first")

    return Suggestions


_client: anthropic.AsyncAnthropic | None = None


def claude() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(timeout=45, max_retries=1)  # key and base URL from the environment
    return _client


def claude_error_message(error: Exception) -> str:
    """A short message for the customer; details go to the log."""
    if isinstance(error, anthropic.RateLimitError):
        return "Lots of people are asking right now. Try again in a minute."
    if isinstance(error, anthropic.AuthenticationError):
        log.error("Claude authentication failed: check ANTHROPIC_API_KEY.")
        return "Design suggestions are unavailable right now."
    if isinstance(error, anthropic.APIStatusError):
        log.error("Claude API error %s: %s", error.status_code, error.message)
        return "We couldn't get suggestions this time. Try again."
    log.error("Claude request failed: %s", error)
    return "We couldn't get suggestions this time. Try again."


@router.post(
    "/api/ai/frame-colours", summary="Frame and colour suggestions from a photo of the wall (multipart: photo)"
)
async def frame_colours(request: Request) -> JSONResponse:
    if not trusted_origin(request):
        return fail(403, "The request was rejected.")
    if not get_settings().anthropic_api_key:
        return fail(503, "Design suggestions aren't switched on yet.")
    if not await allow_ai(f"{client_address(request)}:frame-colours"):
        return fail(429, "Too many requests. Wait a minute and try again.")
    try:
        form = await request.form(max_files=1, max_fields=5, max_part_size=12 * 1024 * 1024)
    except Exception:  # noqa: BLE001
        form = None
    photo = form.get("photo") if form else None
    if not isinstance(photo, UploadFile) or not photo.size:
        return fail(400, "Add a photo of the wall.")
    if photo.size > PHOTO_MAX:
        return fail(400, "The photo must be 5 MB or smaller.")
    raw = await photo.read()
    media_type = sniff_type(raw)
    if media_type not in ("image/jpeg", "image/png", "image/webp"):
        return fail(400, "Use a JPEG, PNG or WebP photo.")
    chosen = product(form.get("productId") if isinstance(form.get("productId"), str) else "")
    options = "\n".join(
        [
            "Frames we make:",
            *(f"- {f['id']}: {f['name']}. {f['description']}" for f in data()["frames"]),
            "Surface colours we make:",
            *(f"- {c['id']}: {c['name']} ({c['hex']})" for c in data()["colours"]),
        ]
    )
    looking_at = f"The customer is looking at: {chosen['name']}." if chosen else ""
    try:
        response = await claude().beta.messages.parse(
            model=DESIGN_MODEL,
            max_tokens=4000,
            # Server-side fallback: a declined request is re-run on a fallback model in the same call.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "low"},
            output_format=_suggestion_model(),
            system=(
                "You help customers of OBASIX, an Indian maker of whiteboards and notice boards, choose a frame and "
                "surface colour that suit their room. Look at the wall colour, flooring, furniture and light in the "
                "photo. Only suggest frames and colours from the lists given, by id. Keep reasons short and concrete "
                "(e.g. 'the black frame echoes the dark window frames'). If the photo doesn't show a room or wall, say "
                "so in 'room' and still suggest neutral options."
            ),
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64.b64encode(raw).decode(),
                            },
                        },
                        {
                            "type": "text",
                            "text": f"{options}\n\n{looking_at} Suggest the best frame and colour combinations "
                            "for this wall.",
                        },
                    ],
                }
            ],
        )
    except (anthropic.APIError, httpx.HTTPError) as error:
        return fail(502, claude_error_message(error))
    if response.stop_reason == "refusal" or not response.parsed_output:
        return fail(422, "We couldn't get suggestions for this photo. Try another one.")
    frames = {f["id"]: f for f in data()["frames"]}
    colours = {c["id"]: c for c in data()["colours"]}
    out = response.parsed_output
    return JSONResponse(
        {
            "ok": True,
            "room": out.room,
            "suggestions": [
                {
                    "frameId": s.frameId,
                    "frameName": frames[s.frameId]["name"],
                    "colourId": s.colourId,
                    "colourName": colours[s.colourId]["name"],
                    "colourHex": colours[s.colourId]["hex"],
                    "reason": s.reason,
                }
                for s in out.suggestions[:3]
            ],
        }
    )
