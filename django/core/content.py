"""Bridge between src/content/library.json and the Django content tables.

`import_library` seeds the database from the JSON the frontend ships with;
`export_library` writes the current database back to that same JSON so the
browser bundle and the server grading catalog stay in sync with admin edits.

Both are idempotent and safe to run repeatedly.
"""

import json
from pathlib import Path

from .catalog import LIBRARY_PATH
from .models import Question, Story, StoryPage


def _read_json():
    with open(LIBRARY_PATH, encoding="utf-8") as handle:
        return json.load(handle)


def import_library() -> dict:
    """Load library.json into Story / StoryPage / Question tables. Returns counts."""
    data = _read_json()
    stories = 0
    pages = 0
    questions = 0

    for order, item in enumerate(data.get("stories", []), start=1):
        video = item.get("video") or {}
        story, _ = Story.objects.update_or_create(
            story_id=item["id"],
            defaults={
                "slug": item["slug"],
                "title": item["title"],
                "subtitle": item.get("subtitle", ""),
                "description": item.get("description", ""),
                "cover": item.get("cover", ""),
                "age_min": item["age"][0],
                "age_max": item["age"][1],
                "minutes": item.get("minutes", 5),
                "category": item.get("category", ""),
                "reward": item.get("reward", ""),
                "status": item.get("status", "published"),
                "order": item.get("order", order),
                "price": item.get("price", 0),
                "video_url": video.get("url", ""),
                "video_title": video.get("title", ""),
                "video_credit": video.get("credit", ""),
                "video_poster": video.get("poster", ""),
                "video_source": video.get("source", "library"),
            },
        )
        stories += 1

        story.pages.all().delete()
        for p_index, page in enumerate(item.get("pages", [])):
            StoryPage.objects.create(
                story=story,
                order=p_index,
                text=page.get("text", ""),
                image=page.get("image", ""),
                alt=page.get("alt", ""),
            )
            pages += 1

        story.questions.all().delete()
        for q_index, q in enumerate(item.get("quiz", [])):
            Question.objects.create(
                story=story,
                is_general=False,
                qid=q["id"],
                order=q_index,
                prompt=q["prompt"],
                options=q["options"],
                answer=q["answer"],
                explanation=q.get("explanation", ""),
            )
            questions += 1

    Question.objects.filter(is_general=True).delete()
    for g_index, q in enumerate(data.get("generalQuiz", [])):
        Question.objects.create(
            story=None,
            is_general=True,
            qid=q["id"],
            order=g_index,
            prompt=q["prompt"],
            options=q["options"],
            answer=q["answer"],
            explanation=q.get("explanation", ""),
        )
        questions += 1

    return {"stories": stories, "pages": pages, "questions": questions}


def _story_to_json(story: Story) -> dict:
    entry = {
        "id": story.story_id,
        "slug": story.slug,
        "title": story.title,
        "subtitle": story.subtitle,
        "description": story.description,
        "cover": story.cover,
        "age": [story.age_min, story.age_max],
        "minutes": story.minutes,
        "category": story.category,
        "reward": story.reward,
    }
    if story.video_url:
        entry["video"] = {
            "url": story.video_url,
            "title": story.video_title,
            "credit": story.video_credit,
            "poster": story.video_poster,
            "source": story.video_source or "library",
        }
    entry["quiz"] = [
        {
            "id": q.qid,
            "prompt": q.prompt,
            "options": q.options,
            "answer": q.answer,
            "explanation": q.explanation,
        }
        for q in story.questions.filter(is_general=False).order_by("order", "qid")
    ]
    entry["status"] = story.status
    entry["pages"] = [
        {"text": p.text, "image": p.image, "alt": p.alt}
        for p in story.pages.order_by("order")
    ]
    if story.price:
        entry["price"] = story.price
    return entry


def export_library() -> Path:
    """Write the database back to library.json. Refuses to empty an existing file."""
    stories = list(Story.objects.all())
    if not stories and LIBRARY_PATH.exists():
        existing = _read_json()
        if existing.get("stories"):
            raise RuntimeError(
                "Refusing to export: the Story table is empty but library.json "
                "has stories. Run `manage.py import_library` first."
            )
    general = list(Question.objects.filter(is_general=True).order_by("order", "qid"))
    payload = {
        "stories": [_story_to_json(story) for story in stories],
        "generalQuiz": [
            {
                "id": q.qid,
                "prompt": q.prompt,
                "options": q.options,
                "answer": q.answer,
                "explanation": q.explanation,
            }
            for q in general
        ],
    }
    LIBRARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LIBRARY_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return LIBRARY_PATH
