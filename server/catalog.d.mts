export interface QuizGrading {
  answers: number[];
  options: number[];
}

export declare const catalog: Readonly<{
  stories: Record<string, QuizGrading & { pages: number }>;
  general: QuizGrading;
}>;
