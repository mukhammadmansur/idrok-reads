"""Import a legacy Node SQLite database (server/store.mjs schema) into Django.

Usage:
    python manage.py import_nodedb data/wbooks.db
    python manage.py import_nodedb data/wbooks.db --flush

Idempotent: rows whose unique keys already exist in the Django DB are skipped,
so the command can be re-run safely. Pass --flush to wipe all Django data
first (destructive).
"""

import sqlite3
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core import models
from core.helpers import normalize_theme


def parse_iso(value):
    if value is None:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def col(row, name, default=None):
    if name in row.keys():
        return row[name]
    return default


class Command(BaseCommand):
    help = "Import a legacy Node SQLite DB (data/wbooks.db) into the Django DB."

    def add_arguments(self, parser):
        parser.add_argument("source", help="Path to the Node SQLite database file")
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete ALL existing Django data before importing (destructive).",
        )

    def handle(self, source, flush, **options):
        if flush:
            for model in (models.RateLimit, models.GoogleChallenge, models.User):
                model.objects.all().delete()
            self.stdout.write("Flushed Django data.")

        conn = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        counts = {}

        with transaction.atomic():
            users = {}
            for row in conn.execute("SELECT * FROM users"):
                uid = row["id"]
                user = models.User.objects.filter(uid=uid).first()
                if user is None:
                    user = models.User.objects.create(
                        uid=uid,
                        email=row["email"],
                        password_hash=row["password_hash"],
                        pin_hash=col(row, "pin_hash") or None,
                        password_enabled=bool(col(row, "password_enabled", 1)),
                    )
                    created = parse_iso(col(row, "created_at"))
                    if created:
                        models.User.objects.filter(pk=user.pk).update(created_at=created)
                    counts["users"] = counts.get("users", 0) + 1
                users[uid] = user

            children = {}
            for row in conn.execute("SELECT * FROM children"):
                uid = row["id"]
                child = models.Child.objects.filter(uid=uid).first()
                if child is None:
                    child = models.Child.objects.create(
                        uid=uid,
                        user=users[row["user_id"]],
                        name=row["name"],
                        avatar=row["avatar"],
                        theme=normalize_theme(col(row, "theme")) or models.Theme.CLASSIC,
                        revision=int(col(row, "revision", 0) or 0),
                        last_active_at=parse_iso(col(row, "last_active_at")),
                        last_credit_ms=int(col(row, "last_credit_ms", 0) or 0),
                    )
                    created = parse_iso(col(row, "created_at"))
                    if created:
                        models.Child.objects.filter(pk=child.pk).update(created_at=created)
                    counts["children"] = counts.get("children", 0) + 1
                children[uid] = child

            for row in conn.execute("SELECT * FROM sessions"):
                if models.Session.objects.filter(token_hash=row["token_hash"]).exists():
                    continue
                models.Session.objects.create(
                    token_hash=row["token_hash"],
                    user=users[row["user_id"]],
                    selected_child=children.get(row["selected_child_id"]),
                    expires_at=int(row["expires_at"]),
                    parent_until=int(col(row, "parent_until", 0) or 0),
                )
                counts["sessions"] = counts.get("sessions", 0) + 1

            for row in conn.execute("SELECT * FROM reading"):
                child = children[row["child_id"]]
                if models.ReadingProgress.objects.filter(
                    child=child, story_id=row["story_id"]
                ).exists():
                    continue
                rp = models.ReadingProgress.objects.create(
                    child=child,
                    story_id=row["story_id"],
                    page=int(row["page"]),
                    completed_at=parse_iso(col(row, "completed_at")),
                )
                started = parse_iso(col(row, "started_at"))
                if started:
                    models.ReadingProgress.objects.filter(pk=rp.pk).update(started_at=started)
                counts["reading"] = counts.get("reading", 0) + 1

            for row in conn.execute("SELECT * FROM quizzes"):
                child = children[row["child_id"]]
                if models.QuizResult.objects.filter(
                    child=child, quiz_id=row["quiz_id"]
                ).exists():
                    continue
                models.QuizResult.objects.create(
                    child=child,
                    quiz_id=row["quiz_id"],
                    score=int(row["score"]),
                    total=int(row["total"]),
                    attempts=int(col(row, "attempts", 1) or 1),
                    attempted_at=parse_iso(col(row, "attempted_at")) or timezone.now(),
                )
                counts["quizzes"] = counts.get("quizzes", 0) + 1

            for row in conn.execute("SELECT * FROM events"):
                child = children[row["child_id"]]
                if models.Event.objects.filter(child=child, event_id=row["event_id"]).exists():
                    continue
                ev = models.Event.objects.create(
                    child=child,
                    event_id=row["event_id"],
                    payload_hash=row["payload_hash"],
                )
                created = parse_iso(col(row, "created_at"))
                if created:
                    models.Event.objects.filter(pk=ev.pk).update(created_at=created)
                counts["events"] = counts.get("events", 0) + 1

            for row in conn.execute("SELECT * FROM rate_limits"):
                if models.RateLimit.objects.filter(bucket=row["bucket"]).exists():
                    continue
                models.RateLimit.objects.create(
                    bucket=row["bucket"],
                    count=int(col(row, "count", 1) or 1),
                    reset_at=int(row["reset_at"]),
                )
                counts["rate_limits"] = counts.get("rate_limits", 0) + 1

            for row in conn.execute("SELECT * FROM story_videos"):
                user = users[row["user_id"]]
                if models.StoryVideo.objects.filter(
                    user=user, story_id=row["story_id"]
                ).exists():
                    continue
                sv = models.StoryVideo.objects.create(
                    user=user,
                    story_id=row["story_id"],
                    url=row["url"],
                    title=row["title"],
                )
                updated = parse_iso(col(row, "updated_at"))
                if updated:
                    models.StoryVideo.objects.filter(pk=sv.pk).update(updated_at=updated)
                counts["story_videos"] = counts.get("story_videos", 0) + 1

            for row in conn.execute("SELECT * FROM identities"):
                if models.Identity.objects.filter(
                    provider=row["provider"], subject=row["subject"]
                ).exists():
                    continue
                models.Identity.objects.create(
                    provider=row["provider"],
                    subject=row["subject"],
                    user=users[row["user_id"]],
                )
                counts["identities"] = counts.get("identities", 0) + 1

            for row in conn.execute("SELECT * FROM google_challenges"):
                if models.GoogleChallenge.objects.filter(hash=row["hash"]).exists():
                    continue
                models.GoogleChallenge.objects.create(
                    hash=row["hash"], expires_at=int(row["expires_at"])
                )
                counts["google_challenges"] = counts.get("google_challenges", 0) + 1

            for row in conn.execute("SELECT * FROM activity_daily"):
                child = children[row["child_id"]]
                if models.ActivityDaily.objects.filter(child=child, day=row["day"]).exists():
                    continue
                models.ActivityDaily.objects.create(
                    child=child,
                    day=row["day"],
                    active_ms=int(col(row, "active_ms", 0) or 0),
                    reading_events=int(col(row, "reading_events", 0) or 0),
                    quiz_attempts=int(col(row, "quiz_attempts", 0) or 0),
                )
                counts["activity_daily"] = counts.get("activity_daily", 0) + 1

            for row in conn.execute("SELECT * FROM activity_streams"):
                child = children[row["child_id"]]
                if models.ActivityStream.objects.filter(
                    child=child, stream_id=row["stream_id"]
                ).exists():
                    continue
                models.ActivityStream.objects.create(
                    child=child,
                    stream_id=row["stream_id"],
                    story_id=row["story_id"],
                    last_at=int(row["last_at"]),
                )
                counts["activity_streams"] = counts.get("activity_streams", 0) + 1

            for row in conn.execute("SELECT * FROM activity_log"):
                child = children[row["child_id"]]
                created = parse_iso(col(row, "created_at"))
                # activity_log is append-only with no unique key, so idempotency
                # is checked on the full row tuple (Node never writes two
                # identical rows: duplicate event payloads are skipped).
                if models.ActivityLog.objects.filter(
                    child=child,
                    type=row["type"],
                    story_id=row["story_id"],
                    page=col(row, "page"),
                    score=col(row, "score"),
                    total=col(row, "total"),
                    created_at=created,
                ).exists():
                    continue
                al = models.ActivityLog.objects.create(
                    child=child,
                    type=row["type"],
                    story_id=row["story_id"],
                    page=col(row, "page"),
                    score=col(row, "score"),
                    total=col(row, "total"),
                )
                if created:
                    models.ActivityLog.objects.filter(pk=al.pk).update(created_at=created)
                counts["activity_log"] = counts.get("activity_log", 0) + 1

        conn.close()
        summary = ", ".join(f"{name}={n}" for name, n in sorted(counts.items()))
        self.stdout.write(self.style.SUCCESS(f"Import done: {summary or 'no new rows'}."))
