export type ThemeId =
  | "classic"
  | "magic"
  | "cyber"
  | "pirate"
  | "kitty"
  | "ghost";

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface StoryPage {
  id: string;
  text: string;
  image: string;
  alt: string;
}

export interface StoryVideo {
  url: string;
  title: string;
  credit?: string;
  poster?: string;
  demo?: boolean;
  source?: "library" | "parent";
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover: string;
  age: [number, number];
  minutes: number;
  category: string;
  reward: string;
  pages: StoryPage[];
  video?: StoryVideo;
  quiz: Question[];
  status: "published" | "draft";
}

export interface Theme {
  id: ThemeId;
  name: string;
  short: string;
  description: string;
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
