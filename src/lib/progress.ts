import type { ProfileProgress, ThemeId } from "../data/types";
export const STORAGE_KEY = "iqro.progress.v1";
export const emptyProgress = (): ProfileProgress => ({
  version: 1,
  reading: {},
  quizzes: {},
  theme: "classic",
});
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
export function readProgress(raw: string | null): ProfileProgress {
  try {
    const data: unknown = JSON.parse(raw || "null");
    if (!object(data) || data.version !== 1) return emptyProgress();
    const result = emptyProgress();
    if (["classic", "forest", "ice", "holo"].includes(String(data.theme)))
      result.theme = data.theme as ThemeId;
    if (object(data.reading))
      for (const [id, r] of Object.entries(data.reading)) {
        if (
          object(r) &&
          Number.isInteger(r.page) &&
          Number(r.page) >= 0 &&
          typeof r.startedAt === "string"
        )
          result.reading[id] = {
            page: Number(r.page),
            startedAt: r.startedAt,
            ...(typeof r.completedAt === "string"
              ? { completedAt: r.completedAt }
              : {}),
          };
      }
    if (object(data.quizzes))
      for (const [id, q] of Object.entries(data.quizzes)) {
        if (
          object(q) &&
          Number.isInteger(q.score) &&
          Number.isInteger(q.total) &&
          Number(q.total) > 0 &&
          Number(q.score) >= 0 &&
          Number(q.score) <= Number(q.total) &&
          typeof q.attemptedAt === "string" &&
          Number.isInteger(q.attempts) &&
          Number(q.attempts) > 0
        )
          result.quizzes[id] = {
            score: Number(q.score),
            total: Number(q.total),
            attemptedAt: q.attemptedAt,
            attempts: Number(q.attempts),
          };
      }
    return result;
  } catch {
    return emptyProgress();
  }
}
export function recordPage(
  state: ProfileProgress,
  id: string,
  page: number,
): ProfileProgress {
  return {
    ...state,
    reading: {
      ...state.reading,
      [id]: {
        ...state.reading[id],
        startedAt: state.reading[id]?.startedAt || new Date().toISOString(),
        page,
      },
    },
  };
}
export function completeStory(
  state: ProfileProgress,
  id: string,
  lastPage: number,
): ProfileProgress {
  const next = recordPage(state, id, lastPage);
  return {
    ...next,
    reading: {
      ...next.reading,
      [id]: {
        ...next.reading[id],
        completedAt: next.reading[id].completedAt || new Date().toISOString(),
      },
    },
  };
}
export function recordQuiz(
  state: ProfileProgress,
  id: string,
  score: number,
  total: number,
): ProfileProgress {
  const previous = state.quizzes[id];
  return {
    ...state,
    quizzes: {
      ...state.quizzes,
      [id]: {
        score: Math.max(previous?.score || 0, score),
        total,
        attemptedAt: new Date().toISOString(),
        attempts: (previous?.attempts || 0) + 1,
      },
    },
  };
}
