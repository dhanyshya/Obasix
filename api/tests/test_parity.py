"""The Python ports must give the same results as the site's TypeScript."""

import asyncio
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from app import cart
from app.core.security import hash_password, verify_password

ROOT = Path(__file__).parent.parent.parent
node = shutil.which("node")
pytestmark = pytest.mark.skipif(not node or not (ROOT / "node_modules/jiti").exists(), reason="needs node + jiti")


def run_ts(script: str, payload: object) -> object:
    result = subprocess.run(
        [node, "--input-type=module", "-e", script],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=ROOT,
        check=True,
    )
    return json.loads(result.stdout)


TS_CART = """
import { createJiti } from "jiti";
import path from "node:path";
const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const cart = await jiti.import(path.resolve("src/lib/auth/cart.ts"));
const cases = JSON.parse(await new Response(process.stdin).text());
console.log(JSON.stringify(cases.map(([saved, guest]) => {
  const merged = cart.mergeCartLines(cart.normalizeCartLines(saved), cart.normalizeCartLines(guest));
  return { merged: JSON.parse(JSON.stringify(merged)), items: cart.toCartItems(merged) };
})));
"""

CART_CASES = [
    [[], [{"productId": "cmwb6090", "quantity": 1}]],
    [[{"productId": "cmwb6090", "quantity": 98}], [{"productId": "CMWB6090", "quantity": "3"}]],
    [
        [],
        [
            {"productId": "cmwb6090", "quantity": 2.5},
            {"productId": "cmwb6090", "quantity": 0},
            {"productId": "cmwb6090", "quantity": True},
            {"productId": None, "quantity": 1},
            "junk",
            {
                "productId": "classic-magnetic-whiteboard-3x4",
                "quantity": 1,
                "configuration": {
                    "sizeId": 3,
                    "frameId": None,
                    "colourId": "black",
                    "features": ["a", 2, None],
                    "customWidthFt": "4.5",
                    "customHeightFt": -1,
                    "branding": "yes",
                    "application": None,
                    "combinationLayout": {
                        "mode": "combination",
                        "orientation": "diagonal",
                        "sections": [
                            {"materialId": "chalkboard", "percent": 33.5},
                            {"id": 7, "materialId": "unknown", "percent": "x"},
                            None,
                            {"percent": 500},
                        ],
                    },
                },
            },
        ],
    ],
    [[{"productId": "cmwb6090", "quantity": 1, "configuration": {"combinationLayout": {"mode": "x"}}}], "not a list"],
]


def test_cart_matches_the_site():
    expected = run_ts(TS_CART, CART_CASES)
    actual = []
    for saved, guest in CART_CASES:
        merged = cart.merge_cart_lines(cart.normalize_cart_lines(saved), cart.normalize_cart_lines(guest))
        actual.append({"merged": merged, "items": cart.to_cart_items(merged)})
    assert json.loads(json.dumps(actual)) == expected


TS_PASSWORD = """
import { createJiti } from "jiti";
import path from "node:path";
const jiti = createJiti(import.meta.url);
const pw = await jiti.import(path.resolve("src/lib/auth/password.ts"));
const { password, pythonHash } = JSON.parse(await new Response(process.stdin).text());
console.log(JSON.stringify({
  nodeHash: await pw.hashPassword(password),
  verifiesPython: await pw.verifyPassword(password, pythonHash),
  rejectsWrong: !(await pw.verifyPassword(password + "x", pythonHash)),
}));
"""


def test_password_hashes_work_both_ways():
    password = "pässwörd 🔑 long enough"
    python_hash = asyncio.run(hash_password(password))
    result = run_ts(TS_PASSWORD, {"password": password, "pythonHash": python_hash})
    assert result["verifiesPython"] is True and result["rejectsWrong"] is True
    assert asyncio.run(verify_password(password, result["nodeHash"])) is True
    assert asyncio.run(verify_password("wrong", result["nodeHash"])) is False
