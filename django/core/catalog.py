"""Grading facts derived from the same published library the browser reads.

Port of server/catalog.mjs: published stories contribute {pages, answers,
options}; the general quiz contributes its own grading facts.
"""

import json
from pathlib import Path

LIBRARY_PATH = Path(__file__).resolve().parent.parent.parent / "src" / "content" / "library.json"


def grading(quiz):
    return {
        "answers": [question["answer"] for question in quiz],
        "options": [len(question["options"]) for question in quiz],
    }


with open(LIBRARY_PATH, encoding="utf-8") as library_file:
    library = json.load(library_file)

catalog = {
    "stories": {
        story["id"]: {"pages": len(story["pages"]), **grading(story["quiz"])}
        for story in library["stories"]
        if story["status"] == "published"
    },
    "general": grading(library["generalQuiz"]),
}


def story_by_id(value):
    return catalog["stories"].get(value) if isinstance(value, str) else None
