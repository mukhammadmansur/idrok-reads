"""Django Admin for IdrokReads content management (P2).

Content editors manage stories, pages, quiz questions, news, guides and
subscription plans here. Saving exports library.json so the browser and the
grading catalog stay in sync.
"""

from django.contrib import admin

from . import content
from .models import (
    Guide,
    NewsItem,
    Question,
    Story,
    StoryPage,
    Subscription,
    SubscriptionPlan,
)


class StoryPageInline(admin.TabularInline):
    model = StoryPage
    extra = 1
    ordering = ("order",)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ("order",)
    fields = ("qid", "order", "prompt", "options", "answer", "explanation")


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "price", "age_min", "age_max", "minutes", "order")
    list_filter = ("category", "status", "price")
    search_fields = ("story_id", "slug", "title")
    inlines = [StoryPageInline, QuestionInline]
    readonly_fields = ("updated_at",)
    ordering = ("order", "title")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        try:
            content.export_library()
        except RuntimeError as error:
            self.message_user(request, str(error), level="ERROR")

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        try:
            content.export_library()
        except RuntimeError:
            pass


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ("title", "active", "order", "created_at")
    list_filter = ("active",)
    search_fields = ("title", "body")


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ("title", "section", "active", "order")
    list_filter = ("section", "active")
    search_fields = ("title", "body")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "period", "max_children", "featured", "active", "order")
    list_filter = ("active", "featured")
    ordering = ("order", "slug")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "provider", "created_at", "expires_at")
    list_filter = ("provider", "plan")
    ordering = ("-expires_at",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("prompt", "story", "is_general", "order")
    list_filter = ("is_general",)
    search_fields = ("prompt", "qid")
