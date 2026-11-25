"""Product lookups from app/data/catalogue.json (exported from src/data/catalogue.ts)."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_DATA = Path(__file__).parent / "data"


@lru_cache
def _products() -> list[dict[str, Any]]:
    return json.loads((_DATA / "catalogue.json").read_text())


@lru_cache
def company() -> dict[str, str]:
    return json.loads((_DATA / "company.json").read_text())


def all_products() -> list[dict[str, Any]]:
    """Catalogue order, as the site lists them."""
    return list(_products())


def get_product(product_id: str) -> dict[str, Any] | None:
    """Matches an id, slug or SKU, like getProductById on the site."""
    return next((p for p in _products() if product_id in (p["id"], p["slug"], p["sku"])), None)
