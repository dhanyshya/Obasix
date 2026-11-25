"""JavaScript conversions, so data written by either side is identical.

Saved carts are JSON that the Next.js site also reads and writes, and cart line
ids are built from String() of each value. These match Number() and String().
"""

import math
import re
from typing import Any

_NUMBER = re.compile(r"^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$")


def number(value: Any) -> float:
    """Number(value): NaN when it isn't a number."""
    if value is None:
        return math.nan
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        text = value.strip()
        if text == "":
            return 0.0
        if _NUMBER.match(text):
            return float(text)
        if text.lower().startswith(("0x", "0b", "0o")):
            try:
                return float(int(text, 0))
            except ValueError:
                return math.nan
        if text in ("Infinity", "+Infinity"):
            return math.inf
        if text == "-Infinity":
            return -math.inf
        return math.nan
    if isinstance(value, list):
        if not value:
            return 0.0
        if len(value) == 1:
            return number(string(value[0]))
    return math.nan


def plain(value: float) -> int | float:
    """A number as JSON.stringify writes it: 50, not 50.0."""
    return int(value) if math.isfinite(value) and value == int(value) else value


def string(value: Any) -> str:
    """String(value) for JSON values."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if math.isnan(value):
            return "NaN"
        if math.isinf(value):
            return "Infinity" if value > 0 else "-Infinity"
        return str(plain(value)) if value == int(value) and abs(value) < 1e21 else repr(value)
    if isinstance(value, list):
        return ",".join("" if item is None else string(item) for item in value)
    if isinstance(value, dict):
        return "[object Object]"
    return str(value)


def truthy(value: Any) -> bool:
    if isinstance(value, float) and math.isnan(value):
        return False
    if isinstance(value, dict | list):
        return True
    return bool(value)


def round_half_up(value: float) -> int:
    """Math.round: halves go up (2.5 → 3, -2.5 → -2). Python's round() goes to the even number."""
    return math.floor(value + 0.5)
