import { describe, it, expect, vi, afterEach } from "vitest";
import {
  applyPending,
  progressEvents,
  outboxKey,
  readOutbox,
  saveOutbox,
} from "./outbox";
import { emptyProgress, recordPage } from "./progress";
import { generalQuiz, stories } from "../content/stories";
import { catalog } from "../../server/catalog.mjs";
afterEach(() => vi.unstubAllGlobals());
describe("account synchronization", () => {
  it("uses separate pending queues for every parent and child", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    });
    const one = outboxKey("parent-a", "child-a"),
      two = outboxKey("parent-b", "child-a"),
      sibling = outboxKey("parent-a", "child-b");
    const events = progressEvents(
      emptyProgress(),
      recordPage(emptyProgress(), "oy-dosti", 3),
    );
    saveOutbox(one, events);
    expect(readOutbox(one)).toEqual(events);
    expect(readOutbox(two)).toEqual([]);
    expect(readOutbox(sibling)).toEqual([]);
    data.set(one, "corrupt");
    expect(readOutbox(one)).toEqual([]);
  });
  it("only sends actual changes, never rewrites a whole private progress snapshot", () => {
    const before = recordPage(emptyProgress(), "oy-dosti", 2);
    expect(progressEvents(before, recordPage(before, "oy-dosti", 2))).toEqual(
      [],
    );
    const events = progressEvents(before, recordPage(before, "oy-dosti", 3));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "reading",
      storyId: "oy-dosti",
      page: 3,
      complete: false,
    });
    expect(events[0]).not.toHaveProperty("startedAt");
    expect(applyPending(before, events).reading["oy-dosti"].page).toBe(3);
  });
  it("derives the server grading catalog from the same published library", () => {
    expect(Object.keys(catalog.stories).sort()).toEqual(
      stories.map((s) => s.id).sort(),
    );
    for (const story of stories) {
      const config = catalog.stories[story.id];
      expect(config.pages).toBe(story.pages.length);
      expect(config.answers).toEqual(story.quiz.map((q) => q.answer));
      expect(config.options).toEqual(story.quiz.map((q) => q.options.length));
    }
    expect(catalog.general.answers).toEqual(generalQuiz.map((q) => q.answer));
  });
});
