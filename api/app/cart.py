"""Saved carts: a port of src/lib/auth/cart.ts. Keep the two in step."""

import math
from typing import Any

from app.catalogue import get_product
from app.core import js

MATERIAL_IDS = {"magnetic-whiteboard", "non-magnetic-whiteboard", "ceramic-steel", "fabric-softboard", "chalkboard"}


# JavaScript's undefined, which JSON.stringify drops (null is kept).
MISSING: Any = object()


def _compact(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if value is not MISSING}


def _sanitize_layout(value: Any) -> Any:
    if not isinstance(value, dict):
        return MISSING
    if value.get("mode") not in ("single", "combination"):
        return MISSING
    sections = value.get("sections")
    if not isinstance(sections, list) or not sections:
        return MISSING
    clean = []
    for index, section in enumerate(sections[:3]):
        section = section if isinstance(section, dict) else {}
        raw_id = section.get("id")
        percent = js.number(section.get("percent"))
        percent = percent if js.truthy(percent) else 1
        clean.append(
            {
                "id": js.string(raw_id) if raw_id is not None else f"section-{index + 1}",
                "materialId": section.get("materialId")
                if section.get("materialId") in MATERIAL_IDS
                else "magnetic-whiteboard",
                "percent": js.plain(max(1, min(100, percent))),
            }
        )
    return {
        "mode": value["mode"],
        "orientation": "horizontal" if value.get("orientation") == "horizontal" else "vertical",
        "sections": clean,
    }


def cart_line_id(product_id: str, configuration: dict[str, Any]) -> str:
    layout = configuration.get("combinationLayout")
    layout_key = (
        f"{layout['mode']}:{layout['orientation']}:"
        + "+".join(f"{s['materialId']}:{js.string(s['percent'])}" for s in layout["sections"])
        if layout
        else ""
    )

    def part(key: str) -> str:
        value = configuration.get(key)
        return "" if value is None else js.string(value)

    return "-".join(
        [
            product_id,
            part("sizeId"),
            part("frameId"),
            part("colourId"),
            "+".join(js.string(f) for f in configuration.get("features") or []),
            "branded" if configuration.get("branding") else "",
            layout_key,
        ]
    )


def _positive(value: Any) -> Any:
    number = js.number(value)
    return js.plain(number) if math.isfinite(number) and number > 0 else MISSING


def _either(value: Any, fallback: Any) -> Any:
    """value ?? fallback, where the fallback may itself be undefined."""
    if value is not None:
        return value
    return MISSING if fallback is None else fallback


def normalize_cart_lines(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []
    lines = []
    for entry in data[:40]:
        if not isinstance(entry, dict):
            continue
        raw_id = entry.get("productId")
        product_id = js.string(raw_id) if raw_id is not None else ""
        product = get_product(product_id)
        quantity = js.number(entry.get("quantity"))
        if not product or not math.isfinite(quantity) or quantity != int(quantity) or not 1 <= quantity <= 99:
            continue
        config = entry.get("configuration")
        config = config if isinstance(config, dict) else {}
        size = config.get("sizeId")
        if size is None:
            size = product["sizes"][0] if product["sizes"] else "standard"
        features = config.get("features")
        lines.append(
            {
                "productId": product_id,
                "quantity": int(quantity),
                "configuration": _compact(
                    {
                        "sizeId": js.string(size),
                        "frameId": _either(config.get("frameId"), product["frame"]),
                        "colourId": _either(
                            config.get("colourId"), product["colours"][0] if product["colours"] else MISSING
                        ),
                        "features": [js.string(f) for f in features[:12]] if isinstance(features, list) else [],
                        "customWidthFt": _positive(config.get("customWidthFt")),
                        "customHeightFt": _positive(config.get("customHeightFt")),
                        "branding": js.truthy(config.get("branding")),
                        "application": config.get("application", MISSING),
                        "combinationLayout": _sanitize_layout(config.get("combinationLayout")),
                    }
                ),
            }
        )
    return lines


def merge_cart_lines(saved: list[dict[str, Any]], guest: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for line in [*saved, *guest]:
        key = cart_line_id(line["productId"], line["configuration"])
        if key in merged:
            merged[key]["quantity"] = min(99, merged[key]["quantity"] + line["quantity"])
        else:
            merged[key] = {**line, "configuration": dict(line["configuration"])}
    return list(merged.values())


def to_cart_items(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for line in lines:
        product = get_product(line["productId"])
        if not product:
            continue
        items.append(
            {
                "id": cart_line_id(line["productId"], line["configuration"]),
                "productId": line["productId"],
                "quantity": line["quantity"],
                "configuration": line["configuration"],
                "unitPrice": product["price"],
            }
        )
    return items
