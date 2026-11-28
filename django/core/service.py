"""Session/auth store ported from server/store.mjs onto the Django ORM.

Every endpoint semantic, validation message and status code matches the Node
implementation so the React client and the ported test suite behave
identically. Sessions are custom rows (core_session), not Django sessions;
the bearer token lives in the wbooks_session cookie and only its SHA-256
digest is stored.
"""

import math
from datetime import datetime, timezone
from uuid import uuid4

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F

from .catalog import catalog, story_by_id
from .family import Family
from .helpers import (
    ApiError,
    AVATARS,
    CONTROL_CHARS,
    DUMMY_HASH,
    EVENT_ID_RE,
    digest,
    event_payload_hash,
    iso,
    keys,
    new_token,
    normalize_theme,
    now_dt,
    password_hash,
    password_matches,
    PREMIUM_THEMES,
    require_value,
    valid_email,
    valid_password,
)
from .models import (
    Child,
    Event,
    QuizResult,
    RateLimit,
    ReadingProgress,
    Session,
    StoryVideo,
    Subscription,
    SubscriptionPlan,
    User,
)
from .youtube import canonical_youtube_url


class Store:
    session_days = 7

    def __init__(self):
        self.family = Family(self)

    def clock(self):
        # Settings-backed so tests can freeze time via override_settings.
        return settings.CLOCK()

    # -- request plumbing ---------------------------------------------------

    def session(self, token):
        if not isinstance(token, str) or not token:
            return None
        return (
            Session.objects.select_related("user", "selected_child")
            .filter(token_hash=digest(token), expires_at__gt=self.clock())
            .first()
        )

    def authenticated(self, token):
        current = self.session(token)
        if not current:
            raise ApiError(401, "Akkauntga qayta kiring.", "unauthorized")
        return current

    def owned(self, token, id_value):
        current = self.authenticated(token)
        child = current.user.children.filter(uid=id_value).first()
        if not child:
            raise ApiError(404, "Profil topilmadi.", "not_found")
        return current, child

    def rate(self, action, key, limit, window_ms):
        bucket = digest(f"{action}:{key}")
        now = self.clock()
        RateLimit.objects.filter(reset_at__lt=now).delete()
        old = RateLimit.objects.filter(bucket=bucket).first()
        if old and old.count >= limit:
            raise ApiError(
                429,
                "Urinishlar ko‘payib ketdi. Birozdan keyin qayta urinib ko‘ring.",
                "rate_limited",
                retry_after=math.ceil((old.reset_at - now) / 1000),
            )
        if old:
            RateLimit.objects.filter(pk=old.pk).update(count=F("count") + 1)
        else:
            RateLimit.objects.create(bucket=bucket, count=1, reset_at=now + window_ms)

    def clear_rate(self, action, key):
        RateLimit.objects.filter(bucket=digest(f"{action}:{key}")).delete()

    # -- session view --------------------------------------------------------

    def public_child(self, child):
        return {
            "id": child.uid,
            "name": child.name,
            "avatar": child.avatar,
            "createdAt": iso(child.created_at),
        }

    def session_view(self, token):
        current = self.session(token)
        if not current:
            return {
                "user": None,
                "children": [],
                "selectedChildId": None,
                "parent": None,
                "subscription": None,
            }
        children = list(current.user.children.all())
        return {
            "user": {"id": current.user.uid, "email": current.user.email},
            "parent": self.family.parent_state(token),
            "children": [self.public_child(child) for child in children],
            "selectedChildId": (
                current.selected_child.uid
                if current.selected_child_id
                else (children[0].uid if children else None)
            ),
            "subscription": self.active_subscription(current.user),
        }

    # -- subscription ---------------------------------------------------------

    def active_subscription(self, user):
        row = (
            Subscription.objects.select_related("plan")
            .filter(user=user, expires_at__gt=self.clock())
            .first()
        )
        if not row:
            return None
        return {
            "plan": row.plan.slug,
            "planName": row.plan.name,
            "provider": row.provider,
            "expiresAt": iso(
                datetime.fromtimestamp(row.expires_at / 1000, tz=timezone.utc)
            ),
        }

    def subscribe(self, token, body):
        keys(body, ["plan"])
        current = self.family.require_parent(token)
        plan = SubscriptionPlan.objects.filter(
            slug=body.get("plan"), active=True
        ).first()
        if not plan:
            raise ApiError(404, "Tarif topilmadi.", "not_found")
        now = self.clock()
        existing = Subscription.objects.filter(
            user=current.user, expires_at__gt=now
        ).first()
        base = existing.expires_at if existing else now
        days = 365 if plan.period == "/yil" else 30
        Subscription.objects.create(
            user=current.user,
            plan=plan,
            provider="demo",
            created_at=now,
            expires_at=base + days * 86400000,
        )
        return self.session_view(token)

    def issue_session(self, user):
        token = new_token()
        Session.objects.filter(expires_at__lte=self.clock()).delete()
        Session.objects.create(
            token_hash=digest(token),
            user=user,
            expires_at=self.clock() + self.session_days * 86400000,
        )
        self.family.unlock_session(token)
        return {**self.session_view(token), "token": token}

    # -- auth -----------------------------------------------------------------

    def register(self, body, ip):
        keys(body, ["email", "password"])
        address = valid_email(body["email"])
        secret = valid_password(body["password"])
        self.rate("register", ip, settings.WBOOKS_REGISTER_LIMIT, 3600000)
        hash_value = password_hash(secret)
        user = User(
            uid=str(uuid4()),
            email=address,
            password_hash=hash_value,
        )
        try:
            with transaction.atomic():
                user.save()
        except IntegrityError:
            if User.objects.filter(email=address).exists():
                raise ApiError(
                    409,
                    "Bu e-mail bilan akkaunt bor. Kirish bo‘limidan foydalaning.",
                    "already_registered",
                )
            raise
        return self.issue_session(user)

    def login(self, body, ip):
        keys(body, ["email", "password"])
        self.rate("login", ip, settings.WBOOKS_LOGIN_LIMIT, 900000)
        address = (
            body["email"].strip().lower()
            if isinstance(body["email"], str)
            else ""
        )
        secret = (
            body["password"]
            if isinstance(body["password"], str) and len(body["password"]) <= 128
            else ""
        )
        user = User.objects.filter(email=address).first()
        matches = password_matches(
            secret,
            user.password_hash if user and user.password_enabled else DUMMY_HASH,
        )
        if not user or not user.password_enabled or not matches:
            raise ApiError(
                401,
                "E-mail yoki parol noto‘g‘ri.",
                "invalid_credentials",
            )
        return self.issue_session(user)

    def logout(self, token):
        if token:
            Session.objects.filter(token_hash=digest(token)).delete()

    # -- videos ---------------------------------------------------------------

    def video_overrides(self, token):
        current = self.session(token)
        if not current:
            return {}
        return {
            row.story_id: {
                "url": row.url,
                "title": row.title,
                "updatedAt": iso(row.updated_at),
            }
            for row in StoryVideo.objects.filter(user=current.user)
        }

    def save_story_video(self, token, body):
        keys(body, ["storyId", "url", "title"])
        current = self.family.require_parent(token)
        if not story_by_id(body.get("storyId")):
            raise ApiError(404, "Hikoya topilmadi.", "not_found")
        require_value(
            isinstance(body.get("url"), str)
            and len(body["url"]) <= 500
            and bool(canonical_youtube_url(body["url"])),
            "YouTube video havolasini tekshiring.",
        )
        require_value(
            isinstance(body.get("title"), str)
            and 1 <= len(body["title"].strip()) <= 120
            and not CONTROL_CHARS.search(body["title"]),
            "Video nomi 1–120 belgidan iborat bo‘lsin.",
        )
        url = canonical_youtube_url(body["url"])
        title = body["title"].strip()
        time = now_dt()
        StoryVideo.objects.update_or_create(
            user=current.user,
            story_id=body["storyId"],
            defaults={"url": url, "title": title, "updated_at": time},
        )
        return {
            "video": {
                "storyId": body["storyId"],
                "url": url,
                "title": title,
                "updatedAt": iso(time),
            }
        }

    def remove_story_video(self, token, body):
        keys(body, ["storyId"])
        current = self.family.require_parent(token)
        StoryVideo.objects.filter(
            user=current.user, story_id=body.get("storyId")
        ).delete()
        return {"ok": True}

    # -- children ---------------------------------------------------------------

    def create_child(self, token, body):
        keys(body, ["name", "avatar"])
        current = self.authenticated(token)
        require_value(
            isinstance(body.get("name"), str)
            and 1 <= len(body["name"].strip()) <= 30
            and not CONTROL_CHARS.search(body["name"]),
            "Ism 1–30 belgidan iborat bo‘lsin.",
        )
        require_value(body.get("avatar") in AVATARS, "Belgi tanlang.")
        user = current.user
        if user.pin_hash:
            self.family.require_parent(token)
        with transaction.atomic():
            require_value(
                user.children.count() < 6,
                "Bitta akkauntga ko‘pi bilan 6 profil qo‘shiladi.",
            )
            child = Child.objects.create(
                uid=str(uuid4()),
                user=user,
                name=body["name"].strip(),
                avatar=body["avatar"],
            )
            Session.objects.filter(pk=current.pk).update(selected_child=child)
            return self.session_view(token)

    def select_child(self, token, id_value):
        current, _child = self.owned(token, id_value)
        self.family.require_parent(token)
        Session.objects.filter(pk=current.pk).update(
            selected_child_id=_child.pk
        )
        return self.session_view(token)

    def update_child(self, token, id_value, body):
        current, child = self.owned(token, id_value)
        self.family.require_parent(token)
        keys(body, ["name", "avatar"])
        if "name" in body:
            require_value(
                isinstance(body["name"], str)
                and 1 <= len(body["name"].strip()) <= 30
                and not CONTROL_CHARS.search(body["name"]),
                "Ism 1–30 belgidan iborat bo‘lsin.",
            )
        if "avatar" in body:
            require_value(body["avatar"] in AVATARS, "Belgi tanlang.")
        with transaction.atomic():
            fields = {}
            if "name" in body:
                fields["name"] = body["name"].strip()
            if "avatar" in body:
                fields["avatar"] = body["avatar"]
            if fields:
                Child.objects.filter(pk=child.pk).update(**fields)
            return self.session_view(token)

    def delete_child(self, token, id_value):
        current, child = self.owned(token, id_value)
        self.family.require_parent(token)
        with transaction.atomic():
            Child.objects.filter(pk=child.pk).delete()
            remaining = list(current.user.children.all())
            next_selected = remaining[0] if remaining else None
            Session.objects.filter(pk=current.pk).update(
                selected_child=next_selected
            )
            return self.session_view(token)

    # -- progress and events -----------------------------------------------------

    def progress(self, token, id_value):
        current, child = self.owned(token, id_value)
        reading = {}
        for row in child.reading.all():
            entry = {"page": row.page, "startedAt": iso(row.started_at)}
            if row.completed_at:
                entry["completedAt"] = iso(row.completed_at)
            reading[row.story_id] = entry
        quizzes = {}
        for row in child.quizzes.all():
            quizzes[row.quiz_id] = {
                "score": row.score,
                "total": row.total,
                "attempts": row.attempts,
                "attemptedAt": iso(row.attempted_at),
            }
        return {
            "revision": child.revision,
            "progress": {
                "version": 1,
                "theme": normalize_theme(child.theme) or "classic",
                "reading": reading,
                "quizzes": quizzes,
            },
        }

    def validate_event(self, event):
        require_value(isinstance(event, dict), "Natija noto‘g‘ri.")
        require_value(
            isinstance(event.get("id"), str)
            and bool(EVENT_ID_RE.fullmatch(event["id"])),
            "Natija identifikatori noto‘g‘ri.",
        )
        event_type = event.get("type")
        if event_type == "theme":
            keys(event, ["id", "type", "theme"])
            theme = normalize_theme(event.get("theme"))
            require_value(theme, "Olam noto‘g‘ri.")
            event["theme"] = theme
        elif event_type == "reading":
            keys(event, ["id", "type", "storyId", "page", "complete"])
            story = story_by_id(event.get("storyId"))
            require_value(
                bool(story)
                and isinstance(event.get("page"), int)
                and not isinstance(event.get("page"), bool)
                and 0 <= event["page"] < story["pages"],
                "Kitob sahifasi noto‘g‘ri.",
            )
            require_value(
                isinstance(event.get("complete"), bool)
                and (not event["complete"] or event["page"] == story["pages"] - 1),
                "Kitob oxirigacha o‘qilsin.",
            )
        elif event_type == "quiz":
            keys(event, ["id", "type", "quizId", "answers"])
            quiz = (
                catalog["general"]
                if event.get("quizId") == "general"
                else story_by_id(event.get("quizId"))
            )
            require_value(
                bool(quiz)
                and isinstance(event.get("answers"), list)
                and len(event["answers"]) == len(quiz["answers"])
                and all(
                    isinstance(answer, int)
                    and not isinstance(answer, bool)
                    and 0 <= answer < quiz["options"][index]
                    for index, answer in enumerate(event["answers"])
                ),
                "Savol javoblari noto‘g‘ri.",
            )
        else:
            raise ApiError(400, "Natija turi noto‘g‘ri.")

    def apply_events(self, token, id_value, body):
        current, child = self.owned(token, id_value)
        keys(body, ["events"])
        require_value(
            isinstance(body.get("events"), list)
            and 1 <= len(body["events"]) <= 50,
            "Bir so‘rovda 1–50 ta natija yuborilsin.",
        )
        premium = self.active_subscription(current.user) is not None
        for event in body["events"]:
            self.validate_event(event)
            if premium:
                continue
            if event["type"] == "theme" and event["theme"] in PREMIUM_THEMES:
                raise ApiError(
                    402,
                    "Bu olam premium obunaga kiradi. Ota-onangizdan so‘rang!",
                    "premium_required",
                )
            story_id = (
                event.get("storyId")
                if event["type"] == "reading"
                else (
                    event.get("quizId")
                    if event["type"] == "quiz" and event.get("quizId") != "general"
                    else None
                )
            )
            story = story_by_id(story_id) if story_id else None
            if story and story.get("premium"):
                raise ApiError(
                    402,
                    "Bu kitob premium obunaga kiradi. Ota-onangizdan so‘rang!",
                    "premium_required",
                )
        with transaction.atomic():
            for event in body["events"]:
                payload = event_payload_hash(event)
                old = Event.objects.filter(
                    child=child, event_id=event["id"]
                ).first()
                if old:
                    if old.payload_hash != payload:
                        raise ApiError(
                            409,
                            "Natija identifikatori qayta ishlatilgan.",
                            "event_conflict",
                        )
                    continue
                time = now_dt()
                if event["type"] == "theme":
                    Child.objects.filter(pk=child.pk).update(theme=event["theme"])
                elif event["type"] == "reading":
                    row = ReadingProgress.objects.filter(
                        child=child, story_id=event["storyId"]
                    ).first()
                    if row:
                        row.page = event["page"]
                        row.completed_at = row.completed_at or (
                            time if event["complete"] else None
                        )
                        row.save(update_fields=["page", "completed_at"])
                    else:
                        ReadingProgress.objects.create(
                            child=child,
                            story_id=event["storyId"],
                            page=event["page"],
                            started_at=time,
                            completed_at=time if event["complete"] else None,
                        )
                else:
                    if event["quizId"] != "general":
                        reading_row = ReadingProgress.objects.filter(
                            child=child, story_id=event["quizId"]
                        ).first()
                        if not reading_row or not reading_row.completed_at:
                            raise ApiError(
                                409,
                                "Avval kitobni o‘qib tugating.",
                                "reading_required",
                            )
                    quiz = (
                        catalog["general"]
                        if event["quizId"] == "general"
                        else story_by_id(event["quizId"])
                    )
                    score = sum(
                        1
                        for index, answer in enumerate(event["answers"])
                        if answer == quiz["answers"][index]
                    )
                    result = QuizResult.objects.filter(
                        child=child, quiz_id=event["quizId"]
                    ).first()
                    if result:
                        result.score = max(result.score, score)
                        result.attempts += 1
                        result.attempted_at = time
                        result.save(
                            update_fields=["score", "attempts", "attempted_at"]
                        )
                    else:
                        QuizResult.objects.create(
                            child=child,
                            quiz_id=event["quizId"],
                            score=score,
                            total=len(quiz["answers"]),
                            attempts=1,
                            attempted_at=time,
                        )
                self.family.log_event(
                    child,
                    (
                        {**event, "attemptScore": score}
                        if event["type"] == "quiz"
                        else event
                    ),
                    time,
                )
                Event.objects.create(
                    child=child,
                    event_id=event["id"],
                    payload_hash=payload,
                    created_at=time,
                )
                Child.objects.filter(pk=child.pk).update(revision=F("revision") + 1)
        return self.progress(token, id_value)


store = Store()
