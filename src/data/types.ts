export type ThemeId = "classic" | "forest" | "ice" | "holo";
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export type ReadingBlock =
  | { type: "text" | "heading" | "caption"; text: string }
  | { type: "illustration"; src: string; alt: string };
export interface StoryPage {
  text: string;
  scene: string;
  illustration?: string;
  leaves: [ReadingBlock[], ReadingBlock[]];
}
export interface Story {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover: string;
  age: [number, number];
  difficulty: string;
  minutes: number;
  category: string;
  themes: ThemeId[];
  pages: StoryPage[];
  recap:
    | {
        kind: "animation";
        duration: number;
        scenes: { text: string; illustration: string }[];
      }
    | { kind: "video"; src: string; poster: string };
  quiz: Question[];
  status: "published" | "draft";
  reward: string;
}
export interface ReadingRecord {
  page: number;
  startedAt: string;
  completedAt?: string;
}
export interface QuizRecord {
  score: number;
  total: number;
  attemptedAt: string;
  attempts: number;
}
export interface ProfileProgress {
  version: 1;
  reading: Record<string, ReadingRecord>;
  quizzes: Record<string, QuizRecord>;
  theme: ThemeId;
}
