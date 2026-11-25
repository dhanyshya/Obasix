"""The chat's fixed text and product fields, exported from the site (scripts/export-shared-data.mjs),
and the two small functions ported from src/lib/ai/catalogueContext.ts and catalogueAssist.ts."""

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA = Path(__file__).parent.parent / "data" / "ai.json"


@lru_cache
def data() -> dict[str, Any]:
    return json.loads(_DATA.read_text())


def product(product_id: str) -> dict[str, Any] | None:
    return next((p for p in data()["products"] if product_id in (p["id"], p["slug"], p["sku"])), None)


def filter_known_product_ids(ids: Any) -> list[str]:
    """Up to four distinct ids that exist in the catalogue, in the model's order (as given, not resolved)."""
    if not isinstance(ids, list):
        return []
    seen: list[str] = []
    for raw in ids:
        if not isinstance(raw, str):
            continue
        pid = raw.strip()
        if not pid or pid in seen or not product(pid):
            continue
        seen.append(pid)
        if len(seen) >= 4:
            break
    return seen


def customizer_cta(product_id: str | None, label: str | None = None) -> dict[str, Any] | None:
    if not product_id:
        return None
    p = product(product_id)
    if not p or not p["customizable"]:
        return None
    prefill = {
        "productId": p["id"],
        "boardType": p["boardType"],
        "sizeId": p["firstSize"],
        "frameId": p["frame"],
        "colourId": p["firstColour"],
        "quantity": 1,
    }
    # JSON.stringify drops undefined fields.
    return {
        "label": (label or "").strip() or "Design Your Board",
        "prefill": {k: v for k, v in prefill.items() if v is not None},
    }


_FOCUS = [
    (r"ceramic|porcelain|steel", lambda p: p["surface"] == "ceramic-steel", "ceramic steel boards"),
    (
        r"notice|pin[- ]?up|softboard|fabric",
        lambda p: p["category"] in ("notice-board", "pin-up-board"),
        "notice and pin-up boards",
    ),
    (r"chalk|blackboard", lambda p: p["category"] == "chalk-board", "chalk boards"),
    (r"combin", lambda p: p["category"] == "combination-board", "combination boards"),
    (r"stand|mobile|easel", lambda p: p["category"] == "stand", "stands"),
    (r"wood|pine", lambda p: p["category"] == "wooden-product" or p["frame"] == "pine-wood", "wooden products"),
    (
        r"non[- ]?magnetic|non magnetic",
        lambda p: p["category"] == "non-magnetic-whiteboard",
        "non-magnetic whiteboards",
    ),
]


def catalogue_assist(message: str) -> dict[str, Any]:
    """The answer when the chat model can't be reached: catalogue picks for what was asked."""
    lower, products = message.lower(), data()["products"]
    pool, focus = products, "matching catalogue options"
    for pattern, keep, label in _FOCUS:
        if re.search(pattern, lower):
            pool, focus = [p for p in products if keep(p)], label
            break
    else:
        if re.search(r"magnetic|whiteboard|board|office|classroom|meeting|size|custom", lower):
            pool = [p for p in products if p["category"] == "magnetic-whiteboard" and p["featured"]] or [
                p for p in products if p["category"] == "magnetic-whiteboard"
            ]
            focus = "magnetic whiteboards"
        elif re.search(r"accessor|magnets?|marker|holder", lower):
            pool = [p for p in products if p["category"] in ("accessory", "desk-accessory")]
            focus = "accessories"
        else:
            pool = [p for p in products if p["featured"]]
    picks = [p for p in pool if p["price"] >= 0][:3]
    customizable = next((p for p in picks if p["customizable"]), None)
    return {
        "message": " ".join(
            [
                "Bear with me — my live guidance is having trouble connecting right now. 👋",
                f"In the meantime, here are {focus} from the OBASIX catalogue based on what you shared.",
                "Open a product to explore it, customize a board, or browse the full collection — "
                "would you like to start with the ones above?",
            ]
        ),
        "recommendations": [{"productId": p["id"], "reason": f"{p['shortName']} · {p['sku']}"} for p in picks],
        "customizerCta": customizer_cta(customizable["id"] if customizable else None, "Customize this board"),
        "links": [
            {"label": "Browse Products", "href": "/products"},
            {"label": "Design Your Board", "href": "/customize"},
            {"label": "Explore Accessories", "href": "/products?family=stands-accessories"},
        ],
    }
