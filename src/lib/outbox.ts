import type { ProfileProgress } from "../content/types";
import type { ProgressEvent } from "./api";
import { generalQuiz, stories } from "../content/stories";
import { normalizeTheme } from "../content/themes";
import { completeStory, recordPage, recordQuiz } from "./progress";
export function eventId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export const outboxKey = (userId: string, childId: string) =>
  `wbooks.pending.v1:${userId}:${childId}`;
export function readOutbox(key: string): ProgressEvent[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((event): event is ProgressEvent => {
          if (
            !event ||
            typeof event.id !== "string" ||
            !/^[a-zA-Z0-9_-]{16,80}$/.test(event.id)
          )
            return false;
          if (event.type === "theme") return normalizeTheme(event.theme) !== null;
          if (event.type === "reading") {
            const story = stories.find((s) => s.id === event.storyId);
            return (
              !!story &&
              Number.isInteger(event.page) &&
              event.page >= 0 &&
              event.page < story.pages.length &&
              typeof event.complete === "boolean" &&
              (!event.complete || event.page === story.pages.length - 1)
            );
          }
          if (event.type === "quiz") {
            const questions =
              event.quizId === "general"
                ? generalQuiz
                : stories.find((s) => s.id === event.quizId)?.quiz;
            return (
              !!questions &&
              Array.isArray(event.answers) &&
              event.answers.length === questions.length &&
              event.answers.every(
                (answer: unknown, index: number) =>
                  typeof answer === "number" &&
                  Number.isInteger(answer) &&
                  answer >= 0 &&
                  answer < questions[index].options.length,
              )
            );
          }
          return false;
        })
      : [];
  } catch {
    return [];
  }
}
export function saveOutbox(key: string, events: ProgressEvent[]) {
  if (events.length) localStorage.setItem(key, JSON.stringify(events));
  else localStorage.removeItem(key);
}
export function progressEvents(
  before: ProfileProgress,
  after: ProfileProgress,
): ProgressEvent[] {
  const result: ProgressEvent[] = [];
  if (before.theme !== after.theme)
    result.push({ id: eventId(), type: "theme", theme: after.theme });
  for (const [storyId, record] of Object.entries(after.reading)) {
    const previous = before.reading[storyId];
    if (
      !previous ||
      previous.page !== record.page ||
      (!previous.completedAt && record.completedAt)
    )
      result.push({
        id: eventId(),
        type: "reading",
        storyId,
        page: record.page,
        complete: !previous?.completedAt && !!record.completedAt,
      });
  }
  return result;
}
export function quizScore(id: string, answers: number[]) {
  const questions =
    id === "general"
      ? generalQuiz
      : stories.find((story) => story.id === id)?.quiz;
  if (!questions || answers.length !== questions.length)
    throw new Error("Savollar topilmadi.");
  return {
    score: answers.reduce(
      (sum, answer, index) => sum + Number(answer === questions[index].answer),
      0,
    ),
    total: questions.length,
  };
}
export function applyPending(
  base: ProfileProgress,
  events: ProgressEvent[],
): ProfileProgress {
  return events.reduce((progress, event) => {
    if (event.type === "theme") return { ...progress, theme: event.theme };
    if (event.type === "reading")
      return event.complete
        ? completeStory(progress, event.storyId, event.page)
        : recordPage(progress, event.storyId, event.page);
    const { score, total } = quizScore(event.quizId, event.answers);
    return recordQuiz(progress, event.quizId, score, total);
  }, base);
}
