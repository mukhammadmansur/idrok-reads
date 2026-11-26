"""API routes mirroring server/app.mjs, all handled by core.views.api."""

from django.contrib import admin
from django.urls import path, re_path

from core.views import api

urlpatterns = [
    re_path(r"^api(?P<path>/.*)?$", api),
    path("admin/", admin.site.urls),
]
