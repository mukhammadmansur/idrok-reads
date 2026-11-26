"""WSGI config for the idrok project."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "idrok.settings")

application = get_wsgi_application()
