"""Parent gate, activity tracking, Google login and the family summary.

Port of server/family.mjs onto the Django ORM. All timestamps are epoch
milliseconds (BigIntegerField) except created_at/attempted_at which are
timezone-aware datetimes serialized back to the Node ISO format.
"""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from django.db import transaction
from django.db.models import F

from .catalog import story_by_id
from .helpers import (
    ApiError,
    PIN_RE,
    STREAM_ID_RE,
    day_key,
    digest,
    iso,
    keys,
    password_hash,
    password_matches,
    require_value,
)
from .models import (
    ActivityDaily,
    ActivityLog,
    ActivityStream,
    Child,
    GoogleChallenge,
    Identity,
    QuizResult,
    Session,
    User,
)


class Family:
    def __init__(self, store):
        self.store = store

    def parent_state(self, token):
        current = self.store.authenticated(token)
        user = current.user
        return {
            "unlocked": current.parent_until > self.store.clock(),
            "pinSet": bool(user.pin_hash),
            "canUsePassword": user.password_enabled,
            "googleLinked": Identity.objects.filter(user=user, provider="google").exists(),
        }

    def require_parent(self, token):
        current = self.store.authenticated(token)
        if current.parent_until <= self.store.clock():
            raise ApiError(
                403,
                "Ota-onalar bo‘limini kod yoki parol bilan oching.",
                "parent_locked",
            )
        return current

    def unlock_session(self, token):
        Session.objects.filter(token_hash=digest(token)).update(
            parent_until=self.store.clock() + 30 * 60000
        )
        return self.parent_state(token)

    def log_event(self, child, event, time):
        if event["type"] == "theme":
            return
        score = None
        total = None
        if event["type"] == "quiz":
            result = QuizResult.objects.filter(child=child, quiz_id=event["quizId"]).first()
            # Log this attempt, rather than the retained best score.
            score = event["attemptScore"]
            total = result.total if result else len(event["answers"])
        Child.objects.filter(pk=child.pk).update(last_active_at=time)
        day = day_key(int(time.timestamp() * 1000))
        reading = 1 if event["type"] == "reading" else 0
        quiz = 1 if event["type"] == "quiz" else 0
        row, created = ActivityDaily.objects.get_or_create(
            child=child,
            day=day,
            defaults={"reading_events": reading, "quiz_attempts": quiz},
        )
        if not created:
            ActivityDaily.objects.filter(pk=row.pk).update(
                reading_events=F("reading_events") + reading,
                quiz_attempts=F("quiz_attempts") + quiz,
            )
        ActivityLog.objects.create(
            child=child,
            type="quiz" if event["type"] == "quiz" else ("completed" if event.get("complete") else "reading"),
            story_id=event.get("storyId") or event.get("quizId"),
            page=event.get("page"),
            score=score,
            total=total,
            created_at=time,
        )

    def unlock_parent(self, token, body):
        keys(body, ["method", "secret"])
        current = self.store.authenticated(token)
        self.store.rate("parent-unlock", current.user.uid, 5, 15 * 60000)
        require_value(
            body.get("method") in ("pin", "password", "math")
            and isinstance(body.get("secret"), str)
            and len(body["secret"]) <= 128,
            "Kod yoki parolni kiriting.",
        )
        user = current.user
        if body["method"] == "math":
            if user.pin_hash:
                raise ApiError(
                    403,
                    "PIN-kod o‘rnatilgan. PIN-kodni kiriting.",
                    "pin_required",
                )
            self.store.clear_rate("parent-unlock", current.user.uid)
            return self.unlock_session(token)
        hash_value = (
            user.pin_hash
            if body["method"] == "pin"
            else (user.password_hash if user.password_enabled else None)
        )
        valid_format = body["method"] != "pin" or bool(PIN_RE.fullmatch(body["secret"]))
        if not hash_value or not valid_format or not password_matches(body["secret"], hash_value):
            raise ApiError(
                403,
                "Kod yoki parol noto‘g‘ri.",
                "invalid_parent_secret",
            )
        self.store.clear_rate("parent-unlock", current.user.uid)
        return self.unlock_session(token)

    def lock_parent(self, token):
        self.store.authenticated(token)
        Session.objects.filter(token_hash=digest(token)).update(parent_until=0)
        return self.parent_state(token)

    def set_parent_pin(self, token, body):
        keys(body, ["pin"])
        current = self.require_parent(token)
        require_value(
            isinstance(body.get("pin"), str) and bool(PIN_RE.fullmatch(body["pin"])),
            "Kod 4 yoki 6 ta raqamdan iborat bo‘lsin.",
        )
        hash_value = password_hash(body["pin"])
        # Parent permission may expire while a slow hash is in flight.
        self.require_parent(token)
        with transaction.atomic():
            User.objects.filter(pk=current.user.pk).update(pin_hash=hash_value)
            Session.objects.filter(user=current.user).exclude(
                token_hash=current.token_hash
            ).update(parent_until=0)
        return self.parent_state(token)

    def family_summary(self, token):
        current = self.require_parent(token)
        clock = self.store.clock()
        today = day_key(clock)
        days = [day_key(clock - (6 - i) * 86400000) for i in range(7)]
        children = []
        for child in current.user.children.all():
            progress = self.store.progress(token, child.uid)["progress"]
            records = list(child.activity_daily.order_by("day"))
            week = []
            for date in days:
                entry = next((row for row in records if row.day == date), None)
                week.append(
                    {
                        "date": date,
                        "seconds": (entry.active_ms if entry else 0) // 1000,
                        "readingEvents": entry.reading_events if entry else 0,
                        "quizAttempts": entry.quiz_attempts if entry else 0,
                    }
                )
            quizzes = list(progress["quizzes"].values())
            total = sum(quiz["total"] for quiz in quizzes)
            children.append(
                {
                    "profile": self.store.public_child(child),
                    "progress": progress,
                    "metrics": {
                        "started": len(progress["reading"]),
                        "completed": sum(
                            1
                            for row in progress["reading"].values()
                            if row.get("completedAt")
                        ),
                        "quizAttempts": sum(quiz["attempts"] for quiz in quizzes),
                        "accuracy": (
                            round(sum(quiz["score"] for quiz in quizzes) / total * 100)
                            if total
                            else None
                        ),
                        "todaySeconds": next(
                            day["seconds"] for day in week if day["date"] == today
                        ),
                        "weekSeconds": sum(day["seconds"] for day in week),
                        "totalSeconds": sum(
                            (row.active_ms or 0) for row in records
                        )
                        // 1000,
                        "lastActiveAt": iso(child.last_active_at),
                    },
                    "week": week,
                    "recent": [
                        {
                            "type": row.type,
                            "storyId": row.story_id,
                            "page": row.page,
                            "score": row.score,
                            "total": row.total,
                            "at": iso(row.created_at),
                        }
                        for row in child.activity_log.order_by("-id")[:12]
                    ],
                }
            )
        return {"generatedAt": iso(datetime.fromtimestamp(clock / 1000, tz=timezone.utc)), "children": children}

    def activity(self, token, id_value, body):
        current, child = self.store.owned(token, id_value)
        keys(body, ["streamId", "storyId", "phase"])
        require_value(
            isinstance(body.get("streamId"), str)
            and bool(STREAM_ID_RE.fullmatch(body["streamId"]))
            and bool(story_by_id(body.get("storyId")))
            and body.get("phase") in ("start", "pulse", "stop"),
            "Faollik so‘rovi noto‘g‘ri.",
        )
        with transaction.atomic():
            time_ms = self.store.clock()
            stream = ActivityStream.objects.filter(
                child=child, stream_id=body["streamId"]
            ).first()
            credited = 0
            if (
                body["phase"] != "start"
                and stream
                and stream.story_id == body["storyId"]
                and time_ms >= stream.last_at
                and time_ms - stream.last_at <= 45000
            ):
                cursor = max(stream.last_at, child.last_credit_ms)
                while cursor < time_ms:
                    local = datetime.fromtimestamp(cursor / 1000 + 5 * 3600, tz=timezone.utc)
                    next_day_ms = int(
                        (
                            datetime(local.year, local.month, local.day, tzinfo=timezone.utc)
                            + timedelta(days=1, hours=-5)
                        ).timestamp()
                        * 1000
                    )
                    end = min(time_ms, next_day_ms)
                    ms = end - cursor
                    row, created = ActivityDaily.objects.get_or_create(
                        child=child,
                        day=day_key(cursor),
                        defaults={"active_ms": ms},
                    )
                    if not created:
                        ActivityDaily.objects.filter(pk=row.pk).update(
                            active_ms=F("active_ms") + ms
                        )
                    credited += ms
                    cursor = end
                if credited:
                    Child.objects.filter(pk=child.pk).update(last_credit_ms=time_ms)
            ActivityStream.objects.filter(last_at__lt=time_ms - 120000).delete()
            if body["phase"] == "stop":
                ActivityStream.objects.filter(
                    child=child, stream_id=body["streamId"]
                ).delete()
            else:
                # Bound stale/background streams per child, even if a modified
                # client invents IDs.
                if (
                    not stream
                    and ActivityStream.objects.filter(child=child).count() >= 12
                ):
                    raise ApiError(429, "Faollik oynalari ko‘payib ketdi.")
                ActivityStream.objects.update_or_create(
                    child=child,
                    stream_id=body["streamId"],
                    defaults={
                        "story_id": body["storyId"],
                        "last_at": time_ms,
                    },
                )
            Child.objects.filter(pk=child.pk).update(
                last_active_at=datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc)
            )
            return {"ok": True, "creditedSeconds": credited // 1000}

    def google_challenge(self):
        nonce = secrets.token_urlsafe(32)
        clock = self.store.clock()
        GoogleChallenge.objects.filter(expires_at__lte=clock).delete()
        GoogleChallenge.objects.create(hash=digest(nonce), expires_at=clock + 10 * 60000)
        return nonce

    def google_login(self, token, claims, nonce, link=False):
        with transaction.atomic():
            challenge = GoogleChallenge.objects.filter(
                hash=digest(nonce), expires_at__gt=self.store.clock()
            ).first()
            if not challenge:
                raise ApiError(400, "Google kirishini qayta boshlang.", "invalid_nonce")
            challenge.delete()
            identity = Identity.objects.filter(
                provider="google", subject=claims["sub"]
            ).first()
            if link:
                current = self.require_parent(token)
                require_value(
                    current.user.email == claims["email"].lower(),
                    "Google e-maili akkaunt e-mailiga mos bo‘lsin.",
                )
                if identity and identity.user_id != current.user_id:
                    raise ApiError(409, "Google akkaunti boshqa profilga ulangan.")
                if not identity:
                    Identity.objects.create(
                        provider="google", subject=claims["sub"], user=current.user
                    )
                return {"linked": True}
            if not identity:
                if User.objects.filter(email=claims["email"].lower()).exists():
                    raise ApiError(
                        409,
                        "Bu e-mail bilan akkaunt bor. Parol bilan kiring va sozlamalarda Google’ni ulang.",
                        "google_link_required",
                    )
                user = User.objects.create(
                    uid=str(uuid4()),
                    email=claims["email"].lower(),
                    # Google-only accounts have no password login; this marker
                    # is never accepted as a password.
                    password_hash="disabled",
                    password_enabled=False,
                )
                identity = Identity.objects.create(
                    provider="google", subject=claims["sub"], user=user
                )
            return self.store.issue_session(identity.user)
