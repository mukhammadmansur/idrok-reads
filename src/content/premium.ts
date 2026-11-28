import type { Story, ThemeId } from "./types";

export const isPremiumStory = (story: Pick<Story, "category">) =>
  story.category.trim().toLowerCase() === "premium";

export const isPremiumTheme = (id: ThemeId) => id === "kitty" || id === "ghost";
