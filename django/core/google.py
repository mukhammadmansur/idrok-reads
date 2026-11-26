"""Verify Google's signed ID token locally; no Client Secret or password.

Port of server/google.mjs: manual JWT header/claim checks with the same
error mapping, then RS256 signature verification via PyJWT against Google's
cached JWKS. Keys rotate hourly; an unknown kid forces a refresh after one
minute.
"""

import base64
import json
import urllib.request

import jwt

from .helpers import ApiError, CONTROL_CHARS, EMAIL_RE

ISSUERS = ("https://accounts.google.com", "accounts.google.com")


def _b64url_decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding).decode()


def create_google_verifier(client_id, fetch_keys=None, clock=None):
    if clock is None:
        import time as _time

        clock = lambda: int(_time.time() * 1000)  # noqa: E731

    def fetch_google_keys():
        request = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/certs"
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status != 200:
                raise ConnectionError("Google keys unavailable")
            return json.loads(response.read().decode())

    fetch_keys = fetch_keys or fetch_google_keys
    state = {"cached": None, "loaded_at": 0}

    def verify_google(credential, nonce):
        def invalid():
            return ApiError(
                401,
                "Google orqali tasdiqlash bajarilmadi. Qayta urinib ko‘ring.",
                "invalid_google_token",
            )

        if not client_id:
            raise ApiError(
                503,
                "Google orqali kirish hozircha mavjud emas.",
                "google_not_configured",
            )
        if (
            not isinstance(credential, str)
            or len(credential) > 16000
            or not isinstance(nonce, str)
            or not nonce
        ):
            raise invalid()
        parts = credential.split(".")
        if len(parts) != 3:
            raise invalid()
        try:
            header = json.loads(_b64url_decode(parts[0]))
            claims = json.loads(_b64url_decode(parts[1]))
        except (ValueError, UnicodeDecodeError):
            raise invalid()
        if (
            not isinstance(header, dict)
            or not isinstance(claims, dict)
            or isinstance(claims, list)
        ):
            raise invalid()
        if header.get("alg") != "RS256" or not isinstance(header.get("kid"), str) or len(header["kid"]) > 200:
            raise invalid()
        seconds = clock() / 1000
        if (
            claims.get("iss") not in ISSUERS
            or claims.get("aud") != client_id
            or (claims.get("azp") and claims["azp"] != client_id)
            or not isinstance(claims.get("exp"), (int, float))
            or claims["exp"] <= seconds
            or not isinstance(claims.get("iat"), (int, float))
            or claims["iat"] > seconds + 60
            or claims["iat"] < seconds - 7200
            or claims.get("nonce") != nonce
            or claims.get("email_verified") is not True
            or not isinstance(claims.get("sub"), str)
            or not claims["sub"]
            or len(claims["sub"]) > 255
            or not isinstance(claims.get("email"), str)
            or len(claims["email"]) > 254
            or bool(CONTROL_CHARS.search(claims["email"]))
            or not EMAIL_RE.fullmatch(claims["email"])
        ):
            raise invalid()
        try:
            # Rotate hourly, or refresh an unknown key at most once per minute.
            if (
                not state["cached"]
                or clock() - state["loaded_at"] > 3600000
                or (
                    not any(key.get("kid") == header["kid"] for key in state["cached"].get("keys", []))
                    and clock() - state["loaded_at"] > 60000
                )
            ):
                state["cached"] = fetch_keys()
                if not isinstance(state["cached"].get("keys"), list):
                    raise ConnectionError("Invalid key set")
                state["loaded_at"] = clock()
        except (OSError, ValueError, ConnectionError):
            raise ApiError(
                503,
                "Google bilan aloqa o‘rnatilmadi. Birozdan keyin qayta urinib ko‘ring.",
                "google_unavailable",
            )
        jwk = next(
            (
                key
                for key in state["cached"]["keys"]
                if key.get("kid") == header["kid"]
                and key.get("kty") == "RSA"
                and (key.get("use") in (None, "sig"))
                and (key.get("alg") in (None, "RS256"))
            ),
            None,
        )
        if not jwk:
            raise invalid()
        try:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
            jwt.decode(
                credential,
                public_key,
                algorithms=["RS256"],
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_exp": False,
                    "verify_iat": False,
                    "verify_iss": False,
                    "verify_nbf": False,
                    "require": [],
                },
            )
        except (jwt.InvalidTokenError, ValueError):
            raise invalid()
        return claims

    return verify_google
