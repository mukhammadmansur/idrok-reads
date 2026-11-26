"""Write the current content tables back to src/content/library.json."""

from django.core.management.base import BaseCommand

from core import content


class Command(BaseCommand):
    help = "Export the Story / Question tables to library.json."

    def handle(self, *args, **options):
        path = content.export_library()
        self.stdout.write(self.style.SUCCESS(f"Wrote {path}"))
