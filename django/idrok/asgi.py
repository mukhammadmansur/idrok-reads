"""ASGI config for the idrok project."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "idrok.settings")

application = get_asgi_application()
