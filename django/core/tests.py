"""Ported from server/test/api.test.mjs (16 of 18 tests).

Skipped Node tests and their Django equivalents:
- "serves its build safely" — vite serves the SPA in development; static
  serving is a deployment concern, not part of the API port.
- "v1 database upgrades preserve..." — Node's additive SQLite migration;
  Django migrations cover schema evolution instead.
"""

import base64
import itertools
import json
import time as time_module
from datetime import datetime, timezone

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from django.test import Client, TestCase, override_settings

from core.google import create_google_verifier
from core.helpers import ApiError
from core.models import Session, User

PASSWORD = "test-fixture-only-long-passphrase"
ORIGIN = "http://testserver"


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def int_to_b64(value):
    length = (value.bit_length() + 7) // 8
    return b64url(value.to_bytes(length, "big"))


class GoogleFixture:
    def __init__(self):
        self.client_id = "fixture-only.apps.googleusercontent.com"
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public = self.private_key.public_key().public_numbers()
        self.jwk = {
            "kty": "RSA",
            "n": int_to_b64(public.n),
            "e": int_to_b64(public.e),
            "kid": "test-signing-key",
            "alg": "RS256",
            "use": "sig",
        }

    def token(self, nonce, override=None):
        def encode(data):
            return b64url(json.dumps(data, separators=(",", ":")).encode())

        now = int(time_module.time())
        payload = {
            "iss": "https://accounts.google.com",
            "aud": self.client_id,
            "sub": "google-fixture-subject",
            "email": "google-parent@example.invalid",
            "email_verified": True,
            "nonce": nonce,
            "iat": now,
            "exp": now + 3600,
            **(override or {}),
        }
        signed = encode({"alg": "RS256", "kid": self.jwk["kid"]}) + "." + encode(payload)
        signature = self.private_key.sign(
            signed.encode(), padding.PKCS1v15(), hashes.SHA256()
        )
        return signed + "." + b64url(signature)

    def fetch_keys(self):
        return {"keys": [self.jwk]}


class ApiBase(TestCase):
    def setUp(self):
        self.counter = itertools.count(1)

    def event_id(self):
        return f"test-event-{next(self.counter):012d}"

    def reading(self, page=7, complete=True):
        return {
            "id": self.event_id(),
            "type": "reading",
            "storyId": "oy-dosti",
            "page": page,
            "complete": complete,
        }

    def quiz(self, answers=(1, 0, 2)):
        return {
            "id": self.event_id(),
            "type": "quiz",
            "quizId": "oy-dosti",
            "answers": list(answers),
        }

    def request(self, client, path, method="GET", body=None, origin=ORIGIN, client_header="web", content_type="application/json"):
        kwargs = {"HTTP_ORIGIN": origin}
        if client_header is not None:
            kwargs["HTTP_X_WBOOKS_CLIENT"] = client_header
        if body is not None:
            kwargs["content_type"] = content_type
            data = body if content_type != "application/json" else json.dumps(body)
        else:
            data = None
        response = getattr(client, method.lower())(path, data=data, **kwargs)
        try:
            payload = response.json()
        except ValueError:
            payload = response.content.decode()
        return response, payload

    def register(self, client, email="parent@example.invalid"):
        response, data = self.request(
            client, "/api/auth/register", "POST", {"email": email, "password": PASSWORD}
        )
        self.assertEqual(response.status_code, 200)
        return response, data

    def child(self, client, name="Kitobxon"):
        response, data = self.request(
            client, "/api/children", "POST", {"name": name, "avatar": "sun"}
        )
        self.assertEqual(response.status_code, 201)
        return data["selectedChildId"]


class AuthTests(ApiBase):
    def test_register_login_hashed_credentials_cookies_and_revocation(self):
        client = Client()
        response, _ = self.request(
            client, "/api/auth/register", "POST",
            {"email": "parent@example.invalid", "password": "short"},
        )
        self.assertEqual(response.status_code, 400)
        for email in ("not-an-email", "x\u0000@example.invalid"):
            response, _ = self.request(
                client, "/api/auth/register", "POST",
                {"email": email, "password": PASSWORD},
            )
            self.assertEqual(response.status_code, 400)
        response, data = self.register(client, "Parent@Example.invalid")
        self.assertEqual(data["user"]["email"], "parent@example.invalid")
        self.assertNotIn("token", data)
        cookie = response.cookies["wbooks_session"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Lax")
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        child_id = self.child(client)
        stored = User.objects.first()
        self.assertNotEqual(stored.password_hash, PASSWORD)
        self.assertRegex(stored.password_hash, r"^[a-f0-9]{32}:[a-f0-9]{128}$")
        old_token = client.cookies["wbooks_session"].value
        token_hash = Session.objects.first().token_hash
        self.assertNotIn(token_hash, old_token)
        response, _ = self.request(
            client, "/api/auth/register", "POST",
            {"email": "parent@example.invalid", "password": PASSWORD},
        )
        self.assertEqual(response.status_code, 409)
        for email, password in (
            ("parent@example.invalid", "incorrect-password"),
            ("unknown@example.invalid", "incorrect-password"),
        ):
            response, data = self.request(
                client, "/api/auth/login", "POST",
                {"email": email, "password": password},
            )
            self.assertEqual(response.status_code, 401)
            self.assertEqual(data["error"], "E-mail yoki parol noto‘g‘ri.")
        response, _ = self.request(client, "/api/auth/logout", "POST", {})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.cookies["wbooks_session"]["max-age"], 0)
        old_cookie = Client()
        old_cookie.cookies["wbooks_session"] = old_token
        response, data = self.request(old_cookie, "/api/session")
        self.assertEqual(data["user"], None)
        response, _ = self.request(
            old_cookie, f"/api/children/{child_id}/progress"
        )
        self.assertEqual(response.status_code, 401)
        fresh = Client()
        response, data = self.request(
            fresh, "/api/auth/login", "POST",
            {"email": "parent@example.invalid", "password": PASSWORD},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["children"][0]["id"], child_id)

    def test_parent_cannot_touch_another_parents_child(self):
        one, two = Client(), Client()
        _, one_data = self.register(one, "one@example.invalid")
        self.register(two, "two@example.invalid")
        child_id = self.child(one)
        for suffix, method, body in (
            ("progress", "GET", None),
            ("select", "POST", {}),
            ("events", "POST", {"events": [self.reading()]}),
        ):
            response, _ = self.request(
                two, f"/api/children/{child_id}/{suffix}", method, body
            )
            self.assertEqual(response.status_code, 404)
        response, _ = self.request(
            two, "/api/children", "POST",
            {"name": "Other", "avatar": "sun", "user_id": one_data["user"]["id"]},
        )
        self.assertEqual(response.status_code, 400)
        response, data = self.request(one, f"/api/children/{child_id}/progress")
        self.assertEqual(data["revision"], 0)

    def test_siblings_keep_separate_progress_and_per_session_selection(self):
        parent = Client()
        self.register(parent)
        first = self.child(parent, "Birinchi")
        second = self.child(parent, "Ikkinchi")
        response, data = self.request(
            parent, f"/api/children/{first}/events", "POST",
            {"events": [self.reading(3, False)]},
        )
        self.assertEqual(data["progress"]["reading"]["oy-dosti"]["page"], 3)
        response, data = self.request(parent, f"/api/children/{second}/progress")
        self.assertEqual(data["progress"]["reading"], {})
        other = Client()
        self.request(
            other, "/api/auth/login", "POST",
            {"email": "parent@example.invalid", "password": PASSWORD},
        )
        self.request(other, f"/api/children/{first}/select", "POST", {})
        response, data = self.request(parent, "/api/session")
        self.assertEqual(data["selectedChildId"], second)
        response, data = self.request(other, "/api/session")
        self.assertEqual(data["selectedChildId"], first)

    def test_grading_best_score_and_idempotent_retries(self):
        parent = Client()
        self.register(parent)
        child_id = self.child(parent)
        path = f"/api/children/{child_id}/events"
        response, _ = self.request(
            parent, path, "POST", {"events": [self.quiz()]}
        )
        self.assertEqual(response.status_code, 409)
        completed = self.reading()
        attempt = self.quiz([1, 1, 2])
        batch = {"events": [completed, attempt]}
        response, first = self.request(parent, path, "POST", batch)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(first["progress"]["quizzes"]["oy-dosti"]["score"], 2)
        completed_at = first["progress"]["reading"]["oy-dosti"]["completedAt"]
        response, repeat = self.request(parent, path, "POST", batch)
        self.assertEqual(repeat, first)
        response, worse = self.request(
            parent, path, "POST",
            {"events": [self.quiz([0, 1, 0]), self.reading(0, False)]},
        )
        self.assertEqual(worse["progress"]["quizzes"]["oy-dosti"]["score"], 2)
        self.assertEqual(worse["progress"]["quizzes"]["oy-dosti"]["attempts"], 2)
        self.assertEqual(
            worse["progress"]["reading"]["oy-dosti"]["completedAt"], completed_at
        )
        self.assertEqual(worse["progress"]["reading"]["oy-dosti"]["page"], 0)
        response, _ = self.request(
            parent, path, "POST",
            {"events": [{**attempt, "answers": [1, 0, 2]}]},
        )
        self.assertEqual(response.status_code, 409)

    def test_invalid_batches_are_atomic_and_forged_fields_rejected(self):
        parent = Client()
        self.register(parent)
        child_id = self.child(parent)
        path = f"/api/children/{child_id}/events"
        invalid = [
            self.reading(-1, False),
            self.reading(8, False),
            self.reading(0, True),
            {**self.reading(), "storyId": "__proto__"},
            {**self.reading(), "completedAt": "forged"},
            {**self.quiz(), "score": 99},
            {**self.quiz(), "quizId": "__proto__"},
            self.quiz([99, 0, 2]),
            self.quiz([1]),
        ]
        for event in invalid:
            response, _ = self.request(
                parent, path, "POST",
                {"events": [self.reading(2, False), event]},
            )
            self.assertEqual(response.status_code, 400)
        response, _ = self.request(
            parent, path, "POST",
            {"events": [self.reading(2, False), self.quiz()]},
        )
        self.assertEqual(response.status_code, 409)
        response, data = self.request(parent, f"/api/children/{child_id}/progress")
        self.assertEqual(data["progress"]["reading"], {})
        self.assertEqual(data["revision"], 0)

    def test_sessions_and_progress_survive_a_full_server_restart(self):
        parent = Client()
        _, register_data = self.register(parent)
        child_id = self.child(parent)
        self.request(
            parent, f"/api/children/{child_id}/events", "POST",
            {"events": [self.reading(), self.quiz()]},
        )
        token = parent.cookies["wbooks_session"].value
        restarted = Client()
        restarted.cookies["wbooks_session"] = token
        response, data = self.request(restarted, "/api/session")
        self.assertEqual(data["user"]["id"], register_data["user"]["id"])
        response, data = self.request(
            restarted, f"/api/children/{child_id}/progress"
        )
        self.assertEqual(data["progress"]["quizzes"]["oy-dosti"]["score"], 3)
        self.assertEqual(data["progress"]["reading"]["oy-dosti"]["page"], 7)

    def test_cross_origin_writes_and_form_posts_are_rejected(self):
        parent = Client()
        self.register(parent)
        for origin, client_header in (
            ("https://other.invalid", "web"),
            (ORIGIN, ""),
            (ORIGIN, None),
        ):
            response, _ = self.request(
                parent, "/api/children", "POST",
                {"name": "No", "avatar": "sun"},
                origin=origin, client_header=client_header,
            )
            self.assertEqual(response.status_code, 403)
        response, _ = self.request(
            parent, "/api/children", "POST",
            {"name": "No", "avatar": "sun"}, content_type="text/plain",
        )
        self.assertEqual(response.status_code, 415)
        response, data = self.request(parent, "/api/session")
        self.assertEqual(len(data["children"]), 0)

    @override_settings(WBOOKS_LOGIN_LIMIT=2)
    def test_failed_authentication_attempts_are_rate_limited(self):
        client = Client()
        self.register(client)
        for _ in range(2):
            response, _ = self.request(
                client, "/api/auth/login", "POST",
                {"email": "parent@example.invalid", "password": "wrong"},
            )
            self.assertEqual(response.status_code, 401)
        response, _ = self.request(
            client, "/api/auth/login", "POST",
            {"email": "parent@example.invalid", "password": PASSWORD},
        )
        self.assertEqual(response.status_code, 429)
        self.assertGreater(int(response.headers["Retry-After"]), 0)


class ParentGateTests(ApiBase):
    def test_pin_and_password_gate_enforced_expire_and_preserve_reading(self):
        clock = [int(time_module.time() * 1000)]
        parent = Client()
        with override_settings(CLOCK=lambda: clock[0]):
            self.register(parent)
            child_id = self.child(parent, "Azizbek")
            response, _ = self.request(parent, "/api/parent/pin", "POST", {"pin": "123"})
            self.assertEqual(response.status_code, 400)
            response, _ = self.request(parent, "/api/parent/pin", "POST", {"pin": "482619"})
            self.assertEqual(response.status_code, 200)
            stored = User.objects.first().pin_hash
            self.assertRegex(stored, r"^[a-f0-9]{32}:[a-f0-9]{128}$")
            self.assertNotEqual(stored, "482619")
            self.request(parent, "/api/parent/lock", "POST", {})
            response, _ = self.request(parent, "/api/parent/overview")
            self.assertEqual(response.status_code, 403)
            response, _ = self.request(
                parent, "/api/children", "POST", {"name": "Blocked", "avatar": "sun"}
            )
            self.assertEqual(response.status_code, 403)
            response, _ = self.request(parent, "/api/parent/pin", "POST", {"pin": "999999"})
            self.assertEqual(response.status_code, 403)
            response, _ = self.request(parent, f"/api/children/{child_id}/progress")
            self.assertEqual(response.status_code, 200)
            response, _ = self.request(
                parent, "/api/parent/unlock", "POST", {"method": "pin", "secret": "111111"}
            )
            self.assertEqual(response.status_code, 403)
            response, data = self.request(
                parent, "/api/parent/unlock", "POST", {"method": "pin", "secret": "482619"}
            )
            self.assertEqual(data["unlocked"], True)
            response, _ = self.request(parent, "/api/parent/overview")
            self.assertEqual(response.status_code, 200)
            clock[0] += 31 * 60000
            response, data = self.request(parent, "/api/parent/status")
            self.assertEqual(data["unlocked"], False)
            response, _ = self.request(parent, "/api/parent/overview")
            self.assertEqual(response.status_code, 403)
            response, data = self.request(
                parent, "/api/parent/unlock", "POST",
                {"method": "password", "secret": PASSWORD},
            )
            self.assertEqual(data["unlocked"], True)

    def test_parents_set_validated_youtube_videos_for_their_family_only(self):
        parent = Client()
        self.register(parent)
        response, data = self.request(parent, "/api/videos")
        self.assertEqual(data["videos"], {})
        response, data = self.request(Client(), "/api/videos")
        self.assertEqual(data["videos"], {})
        for url in (
            "javascript:alert(1)",
            "http://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "https://evil.invalid/watch?v=aqz-KE-bpKQ",
            "https://www.youtube.com/watch?v=short",
        ):
            response, _ = self.request(
                parent, "/api/parent/videos", "POST",
                {"storyId": "oy-dosti", "url": url, "title": "Video"},
            )
            self.assertEqual(response.status_code, 400)
        response, _ = self.request(
            parent, "/api/parent/videos", "POST",
            {"storyId": "not-a-story", "url": "https://youtu.be/aqz-KE-bpKQ", "title": "Video"},
        )
        self.assertEqual(response.status_code, 404)
        response, data = self.request(
            parent, "/api/parent/videos", "POST",
            {
                "storyId": "oy-dosti",
                "url": "https://youtu.be/aqz-KE-bpKQ?t=4",
                "title": "  Oyga maktub videosi  ",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            data["video"]["url"], "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
        )
        self.assertEqual(data["video"]["title"], "Oyga maktub videosi")
        response, data = self.request(parent, "/api/videos")
        self.assertEqual(data["videos"]["oy-dosti"]["title"], "Oyga maktub videosi")
        other = Client()
        self.register(other, "other-videos@example.invalid")
        response, data = self.request(other, "/api/videos")
        self.assertEqual(data["videos"], {})
        self.request(parent, "/api/parent/lock", "POST", {})
        response, _ = self.request(parent, "/api/parent/videos")
        self.assertEqual(response.status_code, 403)
        response, _ = self.request(
            parent, "/api/parent/videos", "POST",
            {"storyId": "oy-dosti", "url": "https://youtu.be/aqz-KE-bpKQ", "title": "X"},
        )
        self.assertEqual(response.status_code, 403)
        self.request(
            parent, "/api/parent/unlock", "POST",
            {"method": "password", "secret": PASSWORD},
        )
        response, _ = self.request(
            parent, "/api/parent/videos/remove", "POST", {"storyId": "oy-dosti"}
        )
        self.assertEqual(response.status_code, 200)
        response, data = self.request(parent, "/api/videos")
        self.assertEqual(data["videos"], {})

    def test_pin_guessing_is_rate_limited_per_parent_across_sessions(self):
        parent = Client()
        self.register(parent)
        self.request(parent, "/api/parent/pin", "POST", {"pin": "482619"})
        self.request(parent, "/api/parent/lock", "POST", {})
        for _ in range(5):
            response, _ = self.request(
                parent, "/api/parent/unlock", "POST",
                {"method": "pin", "secret": "111111"},
            )
            self.assertEqual(response.status_code, 403)
        other = Client()
        self.request(
            other, "/api/auth/login", "POST",
            {"email": "parent@example.invalid", "password": PASSWORD},
        )
        self.request(other, "/api/parent/lock", "POST", {})
        response, _ = self.request(
            other, "/api/parent/unlock", "POST",
            {"method": "pin", "secret": "482619"},
        )
        self.assertEqual(response.status_code, 429)

    def test_four_children_retain_separate_summaries_and_recent_history(self):
        parent = Client()
        self.register(parent)
        ids = [self.child(parent, name) for name in ("Azizbek", "Madina", "Yusuf", "Soliha")]
        first = [self.reading(), self.quiz()]
        second = [self.reading(2, False)]
        self.request(parent, f"/api/children/{ids[0]}/events", "POST", {"events": first})
        self.request(parent, f"/api/children/{ids[0]}/events", "POST", {"events": first})
        self.request(parent, f"/api/children/{ids[1]}/events", "POST", {"events": second})
        response, data = self.request(parent, "/api/parent/overview")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["children"]), 4)
        by_name = {entry["profile"]["name"]: entry for entry in data["children"]}
        self.assertEqual(by_name["Azizbek"]["metrics"]["completed"], 1)
        self.assertEqual(by_name["Azizbek"]["metrics"]["quizAttempts"], 1)
        self.assertEqual(by_name["Azizbek"]["metrics"]["accuracy"], 100)
        self.assertEqual(len(by_name["Azizbek"]["recent"]), 2)
        self.assertEqual(by_name["Madina"]["progress"]["reading"]["oy-dosti"]["page"], 2)
        self.assertEqual(by_name["Madina"]["metrics"]["completed"], 0)
        self.assertEqual(by_name["Yusuf"]["metrics"]["accuracy"], None)
        self.assertEqual(by_name["Soliha"]["metrics"]["totalSeconds"], 0)
        self.request(
            parent, f"/api/children/{ids[0]}/events", "POST",
            {"events": [self.quiz([0, 1, 0])]},
        )
        response, data = self.request(parent, "/api/parent/overview")
        aziz = next(
            entry for entry in data["children"] if entry["profile"]["name"] == "Azizbek"
        )
        self.assertEqual(aziz["metrics"]["accuracy"], 100)
        self.assertEqual(aziz["recent"][0]["score"], 0)
        stranger = Client()
        self.register(stranger, "other-family@example.invalid")
        response, data = self.request(stranger, "/api/parent/overview")
        self.assertEqual(len(data["children"]), 0)

    def test_activity_intervals_no_double_count_and_tashkent_midnight_split(self):
        start = datetime(2026, 11, 12, 18, 59, 50, tzinfo=timezone.utc)
        clock = [int(start.timestamp() * 1000)]
        parent = Client()
        with override_settings(CLOCK=lambda: clock[0]):
            self.register(parent)
            child_id = self.child(parent)
            one, two = "a" * 32, "b" * 32
            self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "phase": "start", "storyId": "oy-dosti"},
            )
            self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": two, "phase": "start", "storyId": "oy-dosti"},
            )
            clock[0] += 15000
            response, data = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "phase": "pulse", "storyId": "oy-dosti"},
            )
            self.assertEqual(data["creditedSeconds"], 15)
            response, data = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": two, "phase": "pulse", "storyId": "oy-dosti"},
            )
            self.assertEqual(data["creditedSeconds"], 0)
            response, data = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "phase": "pulse", "storyId": "oy-dosti"},
            )
            self.assertEqual(data["creditedSeconds"], 0)
            clock[0] += 15000
            response, data = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": two, "phase": "pulse", "storyId": "oy-dosti"},
            )
            self.assertEqual(data["creditedSeconds"], 15)
            response, _ = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "phase": "pulse", "storyId": "oy-dosti", "elapsed": 999999},
            )
            self.assertEqual(response.status_code, 400)
            clock[0] += 60000
            response, data = self.request(
                parent, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "phase": "pulse", "storyId": "oy-dosti"},
            )
            self.assertEqual(data["creditedSeconds"], 0)
            response, data = self.request(parent, "/api/parent/overview")
            summary = data["children"][0]
            self.assertEqual(summary["metrics"]["totalSeconds"], 30)
            self.assertEqual(
                next(day for day in summary["week"] if day["date"] == "2026-11-12")["seconds"], 10
            )
            self.assertEqual(
                next(day for day in summary["week"] if day["date"] == "2026-11-13")["seconds"], 20
            )
            self.assertEqual(summary["metrics"]["todaySeconds"], 20)
            stranger = Client()
            self.register(stranger, "stranger@example.invalid")
            response, _ = self.request(
                stranger, f"/api/children/{child_id}/activity", "POST",
                {"streamId": one, "storyId": "oy-dosti", "phase": "start"},
            )
            self.assertEqual(response.status_code, 404)


class GoogleTests(ApiBase):
    def test_google_verifier_checks_signature_audience_nonce_issuer_and_email(self):
        fixture = GoogleFixture()
        verify = create_google_verifier(
            fixture.client_id, fetch_keys=fixture.fetch_keys
        )
        nonce = "test-nonce-123"
        claims = verify(fixture.token(nonce), nonce)
        self.assertEqual(claims["sub"], "google-fixture-subject")
        for override in (
            {"aud": "wrong-client"},
            {"iss": "https://attacker.invalid"},
            {"exp": 0},
            {"iat": time_module.time() + 600},
            {"nonce": "wrong-nonce"},
            {"email_verified": False},
            {"azp": "other-client"},
            {"sub": ""},
        ):
            with self.assertRaises(ApiError) as caught:
                verify(fixture.token(nonce, override), nonce)
            self.assertEqual(caught.exception.status, 401)
        parts = fixture.token(nonce).split(".")
        parts[1] = b64url(json.dumps({"email": "forged@example.invalid"}).encode())
        with self.assertRaises(ApiError) as caught:
            verify(".".join(parts), nonce)
        self.assertEqual(caught.exception.status, 401)
        other = GoogleFixture()
        with self.assertRaises(ApiError) as caught:
            verify(other.token(nonce), nonce)
        self.assertEqual(caught.exception.status, 401)

    def test_google_login_single_use_nonce_and_no_silent_linking(self):
        fixture = GoogleFixture()
        with override_settings(
            GOOGLE_CLIENT_ID=fixture.client_id,
            GOOGLE_FETCH_KEYS=fixture.fetch_keys,
        ):
            client = Client()
            response, options = self.request(client, "/api/auth/options")
            self.assertEqual(options["googleClientId"], fixture.client_id)
            credential = fixture.token(options["nonce"])
            response, logged = self.request(
                client, "/api/auth/google", "POST", {"credential": credential}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(logged["parent"]["canUsePassword"], False)
            response, _ = self.request(
                client, "/api/auth/google", "POST", {"credential": credential}
            )
            self.assertEqual(response.status_code, 400)
            response, _ = self.request(
                client, "/api/auth/login", "POST",
                {"email": "google-parent@example.invalid", "password": "disabled"},
            )
            self.assertEqual(response.status_code, 401)
            child_id = self.child(client, "Google child")
            response, options = self.request(client, "/api/auth/options")
            response, logged = self.request(
                client, "/api/auth/google", "POST",
                {"credential": fixture.token(options["nonce"])},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(logged["selectedChildId"], child_id)

            local = Client()
            _, local_data = self.register(local, "local-parent@example.invalid")
            response, options = self.request(local, "/api/auth/options")
            local_credential = fixture.token(
                options["nonce"],
                {"sub": "different-google-subject", "email": "local-parent@example.invalid"},
            )
            response, _ = self.request(
                local, "/api/auth/google", "POST", {"credential": local_credential}
            )
            self.assertEqual(response.status_code, 409)
            response, linked = self.request(
                local, "/api/auth/google", "POST",
                {"credential": local_credential, "link": True},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(linked, {"linked": True})
            response, options = self.request(local, "/api/auth/options")
            response, login = self.request(
                local, "/api/auth/google", "POST",
                {"credential": fixture.token(options["nonce"], {
                    "sub": "different-google-subject",
                    "email": "local-parent@example.invalid",
                })},
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(login["user"]["id"], local_data["user"]["id"])

    @override_settings(GOOGLE_CLIENT_ID="")
    def test_google_stays_unavailable_without_configuration(self):
        client = Client()
        response, options = self.request(client, "/api/auth/options")
        self.assertEqual(options["googleClientId"], "")
        self.assertEqual(options["nonce"], None)
        response, _ = self.request(
            client, "/api/auth/google", "POST", {"credential": "not-a-real-token"}
        )
        self.assertEqual(response.status_code, 503)
