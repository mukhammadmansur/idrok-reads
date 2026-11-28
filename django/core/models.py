"""Database models mirroring the Node data layer (server/store.mjs + server/family.mjs).

Faithfulness notes:
- Node uses TEXT UUID ids for users/children and composite/TEXT primary keys
  elsewhere. Django does not support composite keys, so every model gets a
  BigAutoField PK, the Node ids become unique CharFields (`uid`, `token_hash`,
  `bucket`, `hash`), and composite keys become UniqueConstraints.
- Node stores ISO-8601 strings for created_at/started_at/... (DateTimeField
  here) and epoch milliseconds for expires_at/reset_at/parent_until/
  last_credit_ms/last_at (BigIntegerField here).
- Password hashes are scrypt hex strings in the form "<salt32hex>:<key128hex>"
  (161 chars). Sessions store the SHA-256 hex digest of the bearer token
  (64 chars), never the token itself. Session life is SESSION_DAYS = 7.
- Event idempotency (store.mjs applyEvents): PRIMARY KEY(child_id,event_id);
  payload_hash = sha256(JSON.stringify(event)). Re-using an event_id with a
  different payload is a 409 conflict; identical payloads are skipped.
- Quiz upsert (store.mjs): score = MAX(old, new), attempts = attempts + 1,
  attempted_at = latest attempt time. Story quizzes require the story's
  reading row to have completed_at set (409 reading_required otherwise).
"""

from django.db import models
from django.utils import timezone

SESSION_DAYS = 7  # Node default: sessions live 7 days (expires_at = now + 7d in ms).


class Theme(models.TextChoices):
    CLASSIC = "classic", "classic"
    MAGIC = "magic", "magic"
    CYBER = "cyber", "cyber"
    PIRATE = "pirate", "pirate"
    KITTY = "kitty", "kitty"
    GHOST = "ghost", "ghost"


# store.mjs normalizeTheme maps legacy themes onto the four above.
LEGACY_THEMES = {"forest": Theme.MAGIC, "ice": Theme.PIRATE, "holo": Theme.CYBER}


class Avatar(models.TextChoices):
    LION = "lion", "lion"
    OWL = "owl", "owl"
    BEAR = "bear", "bear"
    WOLF = "wolf", "wolf"
    FALCON = "falcon", "falcon"
    FOX = "fox", "fox"
    WHALE = "whale", "whale"
    CAT = "cat", "cat"
    RABBIT = "rabbit", "rabbit"
    ROCKET = "rocket", "rocket"
    STAR = "star", "star"
    SUN = "sun", "sun"
    MOON = "moon", "moon"
    CLOUD = "cloud", "cloud"
    LEAF = "leaf", "leaf"
    SNOW = "snow", "snow"


class User(models.Model):
    """store.mjs `users` + family.mjs added columns.

    The Node table has no display name and no google columns; Google linking
    is modelled as Identity rows (provider='google') exactly like Node does.
    """

    uid = models.CharField(
        "Node users.id", max_length=36, unique=True
    )  # randomUUID() in Node
    email = models.EmailField(max_length=254, unique=True)
    password_hash = models.CharField(
        max_length=200
    )  # scrypt "<salt>:<key>" hex, NOT NULL in Node
    pin_hash = models.CharField(max_length=200, null=True, blank=True)
    password_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_user"
        ordering = ["id"]

    def __str__(self):
        return self.email


class Child(models.Model):
    """store.mjs `children` + family.mjs added columns."""

    uid = models.CharField("Node children.id", max_length=36, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="children")
    name = models.CharField(max_length=30)
    avatar = models.CharField(max_length=16, choices=Avatar.choices)
    theme = models.CharField(max_length=16, choices=Theme.choices, default=Theme.CLASSIC)
    revision = models.IntegerField(default=0)  # bumped on every applied event
    last_active_at = models.DateTimeField(null=True, blank=True)
    last_credit_ms = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_child"
        indexes = [models.Index(fields=["user"], name="children_owner")]
        # Node: ORDER BY created_at, id
        ordering = ["created_at", "uid"]

    def __str__(self):
        return f"{self.name} ({self.user_id})"


class Session(models.Model):
    """store.mjs `sessions` + family.mjs `parent_until`.

    token_hash is the SHA-256 hex of the bearer token; selected_child_id is
    ON DELETE SET NULL like the Node schema. expires_at is epoch ms.
    """

    token_hash = models.CharField(max_length=64, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    selected_child = models.ForeignKey(
        Child, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    expires_at = models.BigIntegerField()  # epoch ms; now + SESSION_DAYS days
    parent_until = models.BigIntegerField(default=0)

    class Meta:
        db_table = "core_session"
        ordering = ["id"]

    def __str__(self):
        return self.token_hash[:12]


class ReadingProgress(models.Model):
    """store.mjs `reading`: PK(child_id, story_id).

    Node tracks page + started_at/completed_at only; there is no percent
    column (percent is derived client-side as page/story.pages).
    """

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="reading")
    story_id = models.CharField(max_length=64)
    page = models.IntegerField()
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "core_readingprogress"
        constraints = [
            models.UniqueConstraint(fields=["child", "story_id"], name="reading_child_story")
        ]
        ordering = ["child_id", "story_id"]

    def __str__(self):
        return f"{self.child_id}/{self.story_id}"


class QuizResult(models.Model):
    """store.mjs `quizzes`: PK(child_id, quiz_id).

    score = best score so far (MAX on conflict), total = number of questions,
    attempts = attempt counter, attempted_at = last attempt time.
    """

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="quizzes")
    quiz_id = models.CharField(max_length=64)  # story id or "general"
    score = models.IntegerField()
    total = models.IntegerField()
    attempts = models.IntegerField(default=1)
    attempted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "core_quizresult"
        constraints = [
            models.UniqueConstraint(fields=["child", "quiz_id"], name="quizzes_child_quiz")
        ]
        ordering = ["child_id", "quiz_id"]

    def __str__(self):
        return f"{self.child_id}/{self.quiz_id}"


class Event(models.Model):
    """store.mjs `events`: PK(child_id, event_id) for idempotent event replay.

    Only the payload SHA-256 hash is stored (Node stores no payload JSON and
    no kind column; the event type lives in the JSON the hash was made from,
    and event details are mirrored into ActivityLog rows).
    """

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="events")
    event_id = models.CharField(max_length=80)  # ^[a-zA-Z0-9_-]{16,80}$
    payload_hash = models.CharField(max_length=64)  # sha256 of event JSON
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_event"
        constraints = [
            models.UniqueConstraint(fields=["child", "event_id"], name="events_child_event")
        ]
        ordering = ["child_id", "event_id"]

    def __str__(self):
        return f"{self.child_id}/{self.event_id}"


class RateLimit(models.Model):
    """store.mjs `rate_limits`: bucket = sha256("<action>:<ip>").

    count resets when reset_at (epoch ms) passes; rows past reset_at are
    deleted lazily by the rate() helper.
    """

    bucket = models.CharField(max_length=64, unique=True)
    count = models.IntegerField(default=1)
    reset_at = models.BigIntegerField()  # epoch ms

    class Meta:
        db_table = "core_ratelimit"
        ordering = ["bucket"]

    def __str__(self):
        return self.bucket[:12]


class StoryVideo(models.Model):
    """store.mjs `story_videos`: PK(user_id, story_id), upserted."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="story_videos")
    story_id = models.CharField(max_length=64)
    url = models.CharField(max_length=500)  # canonical YouTube URL
    title = models.CharField(max_length=120)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_storyvideo"
        constraints = [
            models.UniqueConstraint(fields=["user", "story_id"], name="story_videos_user_story")
        ]
        ordering = ["user_id", "story_id"]

    def __str__(self):
        return f"{self.user_id}/{self.story_id}"


class Identity(models.Model):
    """family.mjs `identities`: PK(provider, subject) — Google linking.

    Node stores no google id/name/photo on users; google accounts are linked
    through this table (provider='google', subject=Google `sub` claim).
    """

    provider = models.CharField(max_length=32)
    subject = models.CharField(max_length=128)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="identities")

    class Meta:
        db_table = "core_identity"
        constraints = [
            models.UniqueConstraint(fields=["provider", "subject"], name="identities_provider_subject")
        ]
        ordering = ["provider", "subject"]

    def __str__(self):
        return f"{self.provider}:{self.subject}"


class GoogleChallenge(models.Model):
    """family.mjs `google_challenges`: one-time nonce for Google login."""

    hash = models.CharField(max_length=64, unique=True)  # sha256 of nonce
    expires_at = models.BigIntegerField()  # epoch ms

    class Meta:
        db_table = "core_googlechallenge"
        ordering = ["hash"]

    def __str__(self):
        return self.hash[:12]


class ActivityDaily(models.Model):
    """family.mjs `activity_daily`: PK(child_id, day) daily rollups."""

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="activity_daily")
    day = models.CharField(max_length=10)  # YYYY-MM-DD (Tashkent +5h day key)
    active_ms = models.BigIntegerField(default=0)
    reading_events = models.IntegerField(default=0)
    quiz_attempts = models.IntegerField(default=0)

    class Meta:
        db_table = "core_activitydaily"
        constraints = [
            models.UniqueConstraint(fields=["child", "day"], name="activity_daily_child_day")
        ]
        ordering = ["child_id", "day"]

    def __str__(self):
        return f"{self.child_id}/{self.day}"


class ActivityStream(models.Model):
    """family.mjs `activity_streams`: PK(child_id, stream_id)."""

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="activity_streams")
    stream_id = models.CharField(max_length=64)
    story_id = models.CharField(max_length=64)
    last_at = models.BigIntegerField()  # epoch ms

    class Meta:
        db_table = "core_activitystream"
        constraints = [
            models.UniqueConstraint(fields=["child", "stream_id"], name="activity_streams_child_stream")
        ]
        ordering = ["child_id", "stream_id"]

    def __str__(self):
        return f"{self.child_id}/{self.stream_id}"


class ActivityLog(models.Model):
    """family.mjs `activity_log`: append-only event log with an index on
    (child_id, created_at). `type` is theme|reading|quiz; page/score/total are
    set per type (score/total on quiz events)."""

    child = models.ForeignKey(Child, on_delete=models.CASCADE, related_name="activity_log")
    type = models.CharField(max_length=16)
    story_id = models.CharField(max_length=64)
    page = models.IntegerField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    total = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_activitylog"
        indexes = [models.Index(fields=["child", "created_at"], name="activity_child_date")]
        ordering = ["id"]

    def __str__(self):
        return f"{self.child_id}/{self.type}"


# -- content management (P2: Django admin) ------------------------------------
# The founder edits these tables through /admin; the app regenerates
# src/content/library.json from them (core/content.py) and grades from them
# (core/catalog.py), so no code change is needed to publish a book, tweak a
# price, post news, add a guide or change the subscription plans.


class Story(models.Model):
    """One book in the library. Maps 1:1 onto a library.json `stories[]` entry.

    `story_id` is the public id used in URLs and progress records (Node kept
    the id in library.json as the source of truth; the admin now owns it).
    """

    story_id = models.CharField("library id", max_length=64, unique=True)
    slug = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=120)
    subtitle = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    cover = models.CharField(max_length=500, blank=True, default="")
    age_min = models.IntegerField(default=3)
    age_max = models.IntegerField(default=10)
    minutes = models.IntegerField(default=5)
    category = models.CharField(max_length=64, blank=True, default="")
    reward = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(
        max_length=16,
        choices=[("published", "published"), ("draft", "draft")],
        default="draft",
    )
    order = models.IntegerField(default=0)
    price = models.IntegerField(default=0)  # 0 = free (so‘m otherwise)
    video_url = models.CharField(max_length=500, blank=True, default="")
    video_title = models.CharField(max_length=120, blank=True, default="")
    video_credit = models.CharField(max_length=120, blank=True, default="")
    video_poster = models.CharField(max_length=500, blank=True, default="")
    video_source = models.CharField(max_length=16, blank=True, default="library")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_story"
        ordering = ["order", "story_id"]

    def __str__(self):
        return self.title


class StoryPage(models.Model):
    """A single page of a Story (library.json `pages[]`)."""

    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="pages")
    order = models.IntegerField()
    text = models.TextField()
    image = models.CharField(max_length=500, blank=True, default="")
    alt = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        db_table = "core_storypage"
        constraints = [
            models.UniqueConstraint(fields=["story", "order"], name="page_story_order")
        ]
        ordering = ["story", "order"]

    def __str__(self):
        return f"{self.story_id}#{self.order}"


class Question(models.Model):
    """One quiz question: either part of a Story's quiz or the general quiz
    (story is NULL and is_general is True for general questions)."""

    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name="questions", null=True, blank=True
    )
    is_general = models.BooleanField(default=False)
    qid = models.CharField("question id", max_length=64)
    order = models.IntegerField(default=0)
    prompt = models.TextField()
    options = models.JSONField(default=list)
    answer = models.IntegerField()
    explanation = models.TextField(blank=True, default="")

    class Meta:
        db_table = "core_question"
        ordering = ["order", "qid"]

    def __str__(self):
        return f"{self.qid}"


class NewsItem(models.Model):
    """A news entry shown in the parent panel's Yangiliklar tab."""

    title = models.CharField(max_length=120)
    body = models.TextField()
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "core_newsitem"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title


class Guide(models.Model):
    """A reading tip / parenting guide, grouped under a section label."""

    title = models.CharField(max_length=120)
    body = models.TextField()
    section = models.CharField(max_length=64, blank=True, default="")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "core_guide"
        ordering = ["order", "title"]

    def __str__(self):
        return self.title


class SubscriptionPlan(models.Model):
    """A pricing plan shown in the Obuna va do’kon tab."""

    slug = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=64)
    price = models.IntegerField()  # so’m
    period = models.CharField(max_length=16)  # "/oy" or "/yil"
    max_children = models.IntegerField(null=True, blank=True)  # None = unlimited
    note = models.CharField(max_length=200, blank=True, default="")
    featured = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "core_subscriptionplan"
        ordering = ["order", "slug"]

    def __str__(self):
        return self.name


class Subscription(models.Model):
    """A purchase linking a family account to a plan.

    `provider` is "demo" while checkout is simulated; Payme/Click webhooks
    (roadmap P4) will write rows with provider "payme"/"click".
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions"
    )
    provider = models.CharField(max_length=16, default="demo")
    created_at = models.BigIntegerField()  # epoch ms, like Session.expires_at
    expires_at = models.BigIntegerField()  # epoch ms

    class Meta:
        db_table = "core_subscription"
        ordering = ["-expires_at"]

    def __str__(self):
        return f"{self.user.email} — {self.plan.slug} until {self.expires_at}"
