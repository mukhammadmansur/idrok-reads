"""Seed the content tables from src/content/library.json."""

from django.core.management.base import BaseCommand

from core import content


class Command(BaseCommand):
    help = "Import library.json into the Story / StoryPage / Question tables."

    def handle(self, *args, **options):
        counts = content.import_library()
        self.stdout.write(
            self.style.SUCCESS(
                "Imported {stories} stories, {pages} pages, {questions} questions.".format(
                    **counts
                )
            )
        )
