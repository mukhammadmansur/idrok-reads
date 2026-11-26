import { describe, it, expect } from "vitest";
import {
  emptyProgress,
  readProgress,
  recordPage,
  completeStory,
  recordQuiz,
} from "./progress";
import { stories, generalQuiz } from "../content/stories";

const publicArt = new Set(
  Object.keys(import.meta.glob("../../public/art/**/*")).map((path) =>
    path.replace("../../public", ""),
  ),
);
const hasArt = (path: string) => publicArt.has(path);
describe("persistent reading state", () => {
  it("resumes after serialization", () => {
    const p = recordPage(emptyProgress(), "oy-dosti", 4);
    expect(readProgress(JSON.stringify(p)).reading["oy-dosti"].page).toBe(4);
  });
  it("awards completion once, preserving its date", () => {
    const p = completeStory(emptyProgress(), "oy-dosti", 7);
    const repeat = completeStory(
      readProgress(JSON.stringify(p)),
      "oy-dosti",
      7,
    );
    expect(repeat).toEqual(p);
    expect(
      Object.values(repeat.reading).filter((r) => r.completedAt),
    ).toHaveLength(1);
  });
  it("recovers malformed or unsupported storage", () => {
    for (const v of [
      "{",
      "null",
      '{"version":3}',
      '{"version":1,"reading":{"bad":{"page":-1}}}',
    ])
      expect(readProgress(v)).toEqual(emptyProgress());
  });
  it("preserves best score across deliberate retries", () => {
    const first = recordQuiz(emptyProgress(), "general", 3, 3);
    expect(recordQuiz(first, "general", 1, 3).quizzes.general).toMatchObject({
      score: 3,
      attempts: 2,
    });
    expect(readProgress(JSON.stringify(first))).toEqual(first);
  });
});
describe("published content", () => {
  it("contains complete stories and valid question answers", () => {
    for (const s of stories) {
      expect(s.pages.length).toBeGreaterThanOrEqual(6);
      expect(s.pages.length).toBeLessThanOrEqual(15);
      expect(s.quiz.length).toBeGreaterThanOrEqual(3);
      expect(new Set(s.pages.map((p) => p.id)).size).toBe(s.pages.length);
    }
    for (const q of [...stories.flatMap((s) => s.quiz), ...generalQuiz])
      expect(q.answer).toBeLessThan(q.options.length);
    const ids = [...stories.flatMap((s) => s.quiz), ...generalQuiz].map(
      (q) => q.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("illustrates every page with story-specific, existing artwork", () => {
    for (const story of stories) {
      for (const page of story.pages) {
        expect(page.text.trim().length, page.id).toBeGreaterThan(80);
        expect(page.alt.trim().length, page.id).toBeGreaterThan(10);
        expect(hasArt(page.image), page.image).toBe(true);
      }
      expect(hasArt(story.cover)).toBe(true);
      expect(
        new Set(story.pages.map((p) => p.image)).size,
      ).toBeGreaterThanOrEqual(6);
    }
  });
});
