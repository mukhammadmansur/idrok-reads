"""Shared primitives ported 1:1 from server/store.mjs.

Byte-for-byte compatibility notes:
- Node scrypt(value, salt, 64) uses the hex salt STRING (not its bytes) as
  the salt, with Node defaults N=16384, r=8, p=1, dklen=64. Python must pass
  the same hex string encoded as UTF-8 so hashes verify across both servers.
- digest = sha256 hex; sessions store the digest of the bearer token.
- now() is UTC ISO-8601 with milliseconds and a "Z" suffix.
- day_key() adds 5 hours (Asia/Tashkent) before taking the calendar date.
"""

import hashlib
import hmac
import json
import re
import secrets
import time
from datetime import datetime, timezone


class ApiError(Exception):
    def __init__(self, status, message, code="invalid_request", retry_after=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.retry_after = retry_after


THEMES = ["classic", "magic", "cyber", "pirate", "kitty", "ghost"]
LEGACY_THEMES = {"forest": "magic", "ice": "pirate", "holo": "cyber"}
# Worlds that require an active family subscription (roadmap P4 gating rule).
PREMIUM_THEMES = {"kitty", "ghost"}
AVATARS = [
    "lion", "owl", "bear", "wolf", "falcon", "fox", "whale", "cat",
    "rabbit", "rocket", "star", "sun", "moon", "cloud", "leaf", "snow",
]

# Same value Node uses when an account has no password login.
DUMMY_HASH = "00000000000000000000000000000000:" + "00" * 64

CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f-\x9f]")  # Node \p{Cc}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PIN_RE = re.compile(r"^\d{4,6}$")
EVENT_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{16,80}$")
STREAM_ID_RE = re.compile(r"^[a-f0-9]{32}$")
CHILD_ID_RE = re.compile(r"^[a-f0-9-]{36}$")
YOUTUBE_ID_RE = re.compile(r"^[\w-]{11}$")


def normalize_theme(value):
    return value if value in THEMES else LEGACY_THEMES.get(value)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def clock_ms():
    return int(time.time() * 1000)


def now_dt():
    return datetime.now(timezone.utc)


def iso(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def day_key(ms):
    return datetime.fromtimestamp(ms / 1000 + 5 * 3600, tz=timezone.utc).strftime("%Y-%m-%d")


def new_token():
    # randomBytes(32).toString("base64url") in Node
    return secrets.token_urlsafe(32)


def password_hash(value):
    salt = secrets.token_hex(16)
    key = hashlib.scrypt(
        value.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64
    )
    return f"{salt}:{key.hex()}"


def password_matches(value, hash_value):
    salt, expected = hash_value.split(":")
    key = hashlib.scrypt(
        value.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64
    )
    return hmac.compare_digest(key.hex(), expected)


def require_value(ok, message):
    if not ok:
        raise ApiError(400, message)


def keys(body, allowed):
    require_value(
        isinstance(body, dict),
        "So‘rov noto‘g‘ri.",
    )
    require_value(
        all(key in allowed for key in body),
        "So‘rovda noma’lum maydon bor.",
    )


def valid_email(value):
    require_value(
        isinstance(value, str)
        and len(value) <= 254
        and not CONTROL_CHARS.search(value)
        and bool(EMAIL_RE.fullmatch(value)),
        "E-mail manzilini tekshiring.",
    )
    return value.strip().lower()


def valid_password(value):
    require_value(
        isinstance(value, str) and 12 <= len(value) <= 128,
        "Parol 12–128 belgidan iborat bo‘lsin.",
    )
    return value


def event_payload_hash(event):
    # JSON.stringify in Node emits no spaces and keeps raw non-ASCII chars.
    return digest(json.dumps(event, ensure_ascii=False, separators=(",", ":")))
