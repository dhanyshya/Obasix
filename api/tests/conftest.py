"""Tests run against a real Postgres: set TEST_DATABASE_URL (it is wiped)."""

import os
import subprocess
from collections.abc import AsyncIterator
from pathlib import Path

import pytest

TEST_URL = os.environ.get("TEST_DATABASE_URL", "")
if not TEST_URL:
    pytest.skip("Set TEST_DATABASE_URL to a disposable Postgres database.", allow_module_level=True)

os.environ.update(
    DATABASE_URL=TEST_URL,
    APP_ENV="test",
    ALLOWED_ORIGINS="http://localhost:3000",
    NEXT_PUBLIC_SITE_URL="http://localhost:3000",
    RESEND_API_KEY="",
    EMAIL_FROM="",
    OBASIX_ADMIN_EMAILS="boss@example.com",
)

import httpx  # noqa: E402

from app.core import db  # noqa: E402
from app.main import app  # noqa: E402

API_ROOT = Path(__file__).parent.parent
ORIGIN = {"origin": "http://localhost:3000"}


@pytest.fixture(scope="session", autouse=True)
async def database() -> AsyncIterator[None]:
    subprocess.run(["uv", "run", "alembic", "upgrade", "head"], cwd=API_ROOT, check=True, capture_output=True)
    await db.open_pool(TEST_URL, 4)
    yield
    await db.close_pool()


@pytest.fixture(autouse=True)
async def clean_tables() -> None:
    async with db.connection() as conn:
        await conn.execute(
            "TRUNCATE users, sessions, password_resets, carts, wishlist_items, rate_limit_hits, addresses, "
            "saved_configs, customer_quotes, demo_orders, product_stock, staff_roles, audit_log, quote_requests, "
            "design_proofs, associates, associate_quotes, associate_commissions, distributors, distributor_orders, "
            "partners, partner_projects, reorder_lists, company_members, companies"
        )


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", headers=ORIGIN) as c:
        yield c
