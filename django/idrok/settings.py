"""Django settings for the IdrokReads (iqro-kids) backend.

Port of the Node.js backend (server/store.mjs). Kept minimal; django.contrib
auth/admin/messages/staticfiles are enabled for the content-management /admin
site (P2). API views live under /api, hence SESSION_COOKIE_PATH and
APPEND_SLASH below.
"""

import os
from pathlib import Path

# django/ directory.
BASE_DIR = Path(__file__).resolve().parent.parent

# Development only; replace in production.
SECRET_KEY = "django-insecure-idrokreads-dev-only-key"

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.auth",
    "django.contrib.admin",
    "django.contrib.staticfiles",
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    # django.contrib.auth's middleware is only needed for the /admin site;
    # the app's own accounts (core.User) use the custom cookie auth below.
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    # CSRF left at Django defaults; the API slice exempts API views.
    "django.middleware.csrf.CsrfViewMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# /admin static assets served by runserver in development.
STATIC_URL = "static/"

ROOT_URLCONF = "idrok.urls"

WSGI_APPLICATION = "idrok.wsgi.application"

# Same env var the Node backend used (server/index.mjs); ":memory:" for tests.
# WAL + IMMEDIATE + a generous busy timeout match Node's better-sqlite3 (which
# ran WAL): the dev server is multithreaded and the app fires parallel
# activity/event writes, which deadlock under the default rollback journal.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("WBOOKS_DB_PATH", BASE_DIR / "db.sqlite3"),
        "OPTIONS": {
            "timeout": 20,
            "transaction_mode": "IMMEDIATE",
            "init_command": "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;",
        },
    }
}

# Google Sign-In client id; empty disables Google login (same as Node).
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

# Optional test hook: callable returning Google JWKS ({"keys": [...]}).
GOOGLE_FETCH_KEYS = None

# Same knobs the Node store accepted; override in tests via override_settings.
WBOOKS_REGISTER_LIMIT = int(os.environ.get("WBOOKS_REGISTER_LIMIT", "10"))
WBOOKS_LOGIN_LIMIT = int(os.environ.get("WBOOKS_LOGIN_LIMIT", "20"))

# Epoch-ms clock; tests freeze it via override_settings.
CLOCK = lambda: int(__import__("time").time() * 1000)  # noqa: E731

LANGUAGE_CODE = "uz"

TIME_ZONE = "Asia/Tashkent"

USE_I18N = True

USE_TZ = True

# The Node backend scopes its auth cookie to /api.
SESSION_COOKIE_PATH = "/api"

# Node routes have no trailing-slash redirects.
APPEND_SLASH = False

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
