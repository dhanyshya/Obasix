"""Password hashing and session tokens, byte-compatible with the Next.js site.

Hashes are "scrypt$<salt>$<hash>" (base64url, no padding) with Node's scrypt
defaults (N=16384, r=8, p=1, 64-byte key), so accounts created by either side
sign in on the other. Session and reset tokens are stored as SHA-256 hashes.
"""

import asyncio
import base64
import hashlib
import hmac
import secrets

_N, _R, _P, _KEY_LENGTH = 16384, 8, 1, 64


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _scrypt(password: str, salt: bytes, length: int) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=length, maxmem=64 * 1024 * 1024)


async def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = await asyncio.to_thread(_scrypt, password, salt, _KEY_LENGTH)
    return f"scrypt${_b64(salt)}${_b64(digest)}"


async def verify_password(password: str, stored: str) -> bool:
    parts = stored.split("$")
    if len(parts) != 3 or parts[0] != "scrypt" or not parts[1] or not parts[2]:
        return False
    try:
        salt, expected = _unb64(parts[1]), _unb64(parts[2])
    except ValueError:
        return False
    actual = await asyncio.to_thread(_scrypt, password, salt, len(expected))
    return hmac.compare_digest(actual, expected)


def password_error(password: str) -> str:
    # Length in UTF-16 code units, as the site measures it.
    length = len(password.encode("utf-16-le")) // 2
    return "" if 8 <= length <= 72 else "Use 8 to 72 characters."


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return _b64(hashlib.sha256(token.encode()).digest())
