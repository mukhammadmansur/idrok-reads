import { describe, it, expect } from "vitest";
import {
  emptyProgress,
  readProgress,
  recordPage,
  completeStory,
  recordQuiz,
} from "./progress";
import { stories, generalQuiz } from "../data/stories";
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
      expect(s.pages.length).toBeGreaterThanOrEqual(8);
      expect(s.pages.length).toBeLessThanOrEqual(15);
      expect(s.themes).toHaveLength(4);
      expect(s.quiz.length).toBeGreaterThanOrEqual(3);
    }
    for (const q of [...stories.flatMap((s) => s.quiz), ...generalQuiz])
      expect(q.answer).toBeLessThan(q.options.length);
  });
});

describe("structured story leaves", () => {
  it("retains every word once across the reading leaves", () => {
    const normalize = (v: string) => v.replace(/\s+/g, " ").trim();
    for (const story of stories)
      for (const page of story.pages) {
        const text = page.leaves
          .flat()
          .filter((b) => b.type === "text")
          .map((b) => ("text" in b ? b.text : ""))
          .join(" ");
        expect(normalize(text)).toBe(normalize(page.text));
      }
  });
  it("illustrates every main dialogue with story-specific scenes", () => {
    for (const story of stories) {
      const illustrated = story.pages.filter((p) =>
        p.leaves.flat().some((b) => b.type === "illustration"),
      );
      expect(illustrated.length).toBeGreaterThanOrEqual(6);
      for (const page of story.pages.filter((p) => p.text.includes("«")))
        expect(
          page.leaves.flat().some((b) => b.type === "illustration"),
          page.text,
        ).toBe(true);
      const assets = illustrated.flatMap((p) =>
        p.leaves
          .flat()
          .filter((b) => b.type === "illustration")
          .map((b) => ("src" in b ? b.src : "")),
      );
      expect(new Set(assets).size).toBeGreaterThanOrEqual(6);
    }
  });
});
