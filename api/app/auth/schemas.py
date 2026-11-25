"""Request and response shapes, for the OpenAPI docs. Field limits match the site's forms."""

from typing import Any, Literal

from pydantic import BaseModel


class User(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    company: str
    role: Literal["customer"]


class SessionOut(BaseModel):
    user: User | None


class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    cart: list[dict[str, Any]] | None = None
    wishlist: list[str] | None = None


class LoginIn(BaseModel):
    email: str
    password: str
    cart: list[dict[str, Any]] | None = None
    wishlist: list[str] | None = None


class ForgotIn(BaseModel):
    email: str


class ResetIn(BaseModel):
    token: str
    password: str


class SignedIn(BaseModel):
    ok: Literal[True]
    user: User
    cart: list[dict[str, Any]]
    wishlist: list[str]


class Failure(BaseModel):
    ok: Literal[False]
    message: str | None = None
    errors: dict[str, str] | None = None
