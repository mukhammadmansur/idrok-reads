import library from "../src/content/library.json" with { type: "json" };

/** Grading facts derived from the same published library the browser reads. */
const grading = (quiz) => ({
  answers: quiz.map((question) => question.answer),
  options: quiz.map((question) => question.options.length),
});

export const catalog = Object.freeze({
  stories: Object.fromEntries(
    library.stories
      .filter((story) => story.status === "published")
      .map((story) => [
        story.id,
        { pages: story.pages.length, ...grading(story.quiz) },
      ]),
  ),
  general: grading(library.generalQuiz),
});
