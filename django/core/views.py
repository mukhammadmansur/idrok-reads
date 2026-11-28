"""HTTP API views mirroring the server/app.mjs route table.

One catch-all view dispatches on path + method exactly like the Node server,
including its origin checks for write methods, cookie handling and Uzbek
error messages.
"""

import json
import logging
import re
from urllib.parse import urlparse

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .google import create_google_verifier
from .helpers import ApiError
from .models import Guide, NewsItem, SubscriptionPlan
from .service import store

logger = logging.getLogger(__name__)

COOKIE_NAME = "wbooks_session"
GOOGLE_NONCE_COOKIE = "wbooks_google_nonce"

# Production verifier is cached; a custom GOOGLE_FETCH_KEYS (tests) builds a
# fresh verifier so fixtures never leak across requests.
_verifier_cache = {}


def get_google_verifier():
    client_id = settings.GOOGLE_CLIENT_ID or ""
    fetch_keys = getattr(settings, "GOOGLE_FETCH_KEYS", None)
    if fetch_keys is None:
        verifier = _verifier_cache.get(client_id)
        if verifier is None:
            verifier = _verifier_cache[client_id] = create_google_verifier(client_id)
        return verifier
    return create_google_verifier(client_id, fetch_keys=fetch_keys)

CHILD_RE = re.compile(r"^/api/children/([a-f0-9-]{36})$")
ACTION_RE = re.compile(
    r"^/api/children/([a-f0-9-]{36})/(progress|events|select|activity)$"
)

MAX_BODY = 32768


def json_response(status, body, retry_after=None):
    response = JsonResponse(body, status=status)
    response["Cache-Control"] = "no-store"
    response["X-Content-Type-Options"] = "nosniff"
    response["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if retry_after is not None:
        response["Retry-After"] = str(retry_after)
    return response


def set_session_cookie(response, token):
    if token:
        response.set_cookie(
            COOKIE_NAME,
            token,
            path="/api",
            httponly=True,
            samesite="Lax",
            max_age=store.session_days * 86400,
        )
    else:
        response.delete_cookie(COOKIE_NAME, path="/api")


def set_google_nonce_cookie(response, nonce):
    response.set_cookie(
        GOOGLE_NONCE_COOKIE,
        nonce,
        path="/api",
        httponly=True,
        samesite="Lax",
        max_age=600,
    )


def json_body(request):
    if not request.content_type.startswith("application/json"):
        raise ApiError(415, "JSON so‘rov kerak.")
    body = request.body
    if len(body) > MAX_BODY:
        raise ApiError(413, "So‘rov juda katta.")
    try:
        return json.loads(body)
    except ValueError:
        raise ApiError(400, "So‘rov formati noto‘g‘ri.")


def write_check(request):
    try:
        origin_host = urlparse(request.headers.get("origin") or "").netloc
    except ValueError:
        raise ApiError(403, "So‘rov manzili tasdiqlanmadi.", "origin_rejected")
    if (
        origin_host != request.get_host()
        or request.headers.get("x-wbooks-client") != "web"
        or request.headers.get("sec-fetch-site") == "cross-site"
    ):
        raise ApiError(403, "So‘rov manzili tasdiqlanmadi.", "origin_rejected")


def client_ip(request):
    return request.META.get("REMOTE_ADDR") or "unknown"


def dispatch(request, path):
    method = request.method
    full_path = "/api" + (path or "")
    token = request.COOKIES.get(COOKIE_NAME)

    if method == "GET" and full_path == "/api/health":
        return json_response(200, {"ok": True})

    if method == "GET" and full_path == "/api/auth/options":
        nonce = store.family.google_challenge() if settings.GOOGLE_CLIENT_ID else None
        response = json_response(
            200, {"googleClientId": settings.GOOGLE_CLIENT_ID or "", "nonce": nonce}
        )
        if nonce:
            set_google_nonce_cookie(response, nonce)
        return response

    if method == "GET" and full_path == "/api/parent/status":
        return json_response(200, store.family.parent_state(token))
    if method == "GET" and full_path == "/api/parent/overview":
        return json_response(200, store.family.family_summary(token))
    if method == "GET" and full_path == "/api/session":
        return json_response(200, store.session_view(token))
    if method == "GET" and full_path == "/api/videos":
        return json_response(200, {"videos": store.video_overrides(token)})
    if method == "GET" and full_path == "/api/parent/videos":
        store.family.require_parent(token)
        return json_response(200, {"videos": store.video_overrides(token)})

    if method == "GET" and full_path == "/api/pricing":
        plans = SubscriptionPlan.objects.filter(active=True).order_by("order", "slug")
        return json_response(
            200,
            {
                "plans": [
                    {
                        "slug": plan.slug,
                        "name": plan.name,
                        "price": plan.price,
                        "period": plan.period,
                        "maxChildren": plan.max_children,
                        "note": plan.note,
                        "featured": plan.featured,
                    }
                    for plan in plans
                ]
            },
        )
    if method == "GET" and full_path == "/api/news":
        items = NewsItem.objects.filter(active=True)
        return json_response(
            200,
            {
                "news": [
                    {
                        "id": item.pk,
                        "title": item.title,
                        "body": item.body,
                        "createdAt": item.created_at.isoformat(),
                    }
                    for item in items
                ]
            },
        )
    if method == "GET" and full_path == "/api/guides":
        items = Guide.objects.filter(active=True)
        grouped: dict[str, list[dict]] = {}
        for item in items:
            grouped.setdefault(item.section or "Umumiy", []).append(
                {"id": item.pk, "title": item.title, "body": item.body}
            )
        return json_response(200, {"guides": grouped})

    if method not in ("GET", "HEAD"):
        write_check(request)

    if method == "POST" and full_path == "/api/auth/google":
        store.rate("google-login", client_ip(request), 20, 15 * 60000)
        body = json_body(request)
        if (
            not isinstance(body, dict)
            or any(key not in ("credential", "link") for key in body)
            or ("link" in body and not isinstance(body["link"], bool))
        ):
            raise ApiError(400, "So‘rov noto‘g‘ri.")
        nonce = request.COOKIES.get(GOOGLE_NONCE_COOKIE)
        claims = get_google_verifier()(body["credential"], nonce)
        result = store.family.google_login(
            token, claims, nonce, body.get("link") is True
        )
        if body.get("link"):
            return json_response(200, result)
        session_token = result.pop("token")
        response = json_response(200, result)
        set_session_cookie(response, session_token)
        return response

    if method == "POST" and full_path == "/api/parent/unlock":
        return json_response(200, store.family.unlock_parent(token, json_body(request)))
    if method == "POST" and full_path == "/api/parent/lock":
        json_body(request)
        return json_response(200, store.family.lock_parent(token))
    if method == "POST" and full_path == "/api/parent/pin":
        return json_response(200, store.family.set_parent_pin(token, json_body(request)))
    if method == "POST" and full_path == "/api/parent/videos":
        return json_response(200, store.save_story_video(token, json_body(request)))
    if method == "POST" and full_path == "/api/parent/videos/remove":
        return json_response(200, store.remove_story_video(token, json_body(request)))

    if method == "POST" and full_path == "/api/subscribe/checkout":
        store.rate("subscribe", client_ip(request), 10, 3600000)
        return json_response(200, store.subscribe(token, json_body(request)))

    if method == "POST" and full_path in ("/api/auth/register", "/api/auth/login"):
        body = json_body(request)
        result = (
            store.register(body, client_ip(request))
            if full_path.endswith("register")
            else store.login(body, client_ip(request))
        )
        session_token = result.pop("token")
        response = json_response(200, result)
        set_session_cookie(response, session_token)
        return response

    if method == "POST" and full_path == "/api/auth/logout":
        json_body(request)
        store.logout(token)
        response = json_response(200, {"ok": True})
        set_session_cookie(response, "")
        return response

    if method == "POST" and full_path == "/api/children":
        return json_response(201, store.create_child(token, json_body(request)))

    child_match = CHILD_RE.fullmatch(full_path)
    if child_match:
        child_id = child_match.group(1)
        if method == "PATCH":
            return json_response(200, store.update_child(token, child_id, json_body(request)))
        if method == "DELETE":
            return json_response(200, store.delete_child(token, child_id))

    action_match = ACTION_RE.fullmatch(full_path)
    if action_match:
        child_id, action = action_match.groups()
        if method == "GET" and action == "progress":
            return json_response(200, store.progress(token, child_id))
        if method == "POST" and action == "select":
            json_body(request)
            return json_response(200, store.select_child(token, child_id))
        if method == "POST" and action == "activity":
            return json_response(200, store.family.activity(token, child_id, json_body(request)))
        if method == "POST" and action == "events":
            return json_response(200, store.apply_events(token, child_id, json_body(request)))

    raise ApiError(404, "Manzil topilmadi.", "not_found")


@csrf_exempt
def api(request, path=None):
    try:
        return dispatch(request, path)
    except ApiError as error:
        return json_response(
            error.status, {"error": str(error), "code": error.code}, error.retry_after
        )
    except Exception:
        logger.exception("API request failed")
        return json_response(
            500,
            {"error": "Serverda xatolik. Qayta urinib ko‘ring.", "code": "server_error"},
        )
