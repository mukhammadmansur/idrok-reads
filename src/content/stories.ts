import library from "./library.json";
import type { Question, Story } from "./types";

/**
 * `library.json` is the single source for published stories and questions.
 * The server derives its grading catalog from the same file, so page counts
 * and answer keys can never drift between browser and API.
 */
type AuthoredStory = Omit<Story, "pages" | "age" | "status"> & {
  age: number[];
  status: string;
  pages: Omit<Story["pages"][number], "id">[];
};

const authored = library.stories as AuthoredStory[];

export const stories: Story[] = authored
  .filter((story) => story.status === "published")
  .map((story) => ({
    ...story,
    age: [story.age[0], story.age[1]],
    status: "published",
    pages: story.pages.map((page, index) => ({
      id: `${story.id}-${index}`,
      ...page,
    })),
  }));

export const generalQuiz: Question[] = library.generalQuiz;

export const storyBySlug = (slug: string | undefined) =>
  stories.find((story) => story.slug === slug);

export const storyById = (id: string | undefined) =>
  stories.find((story) => story.id === id);
