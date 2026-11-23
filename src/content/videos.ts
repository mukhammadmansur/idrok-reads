import type { StoryVideoMap } from "../lib/api";
import { youtubeId } from "../lib/youtube";
import type { Story, StoryVideo } from "./types";

export function storyVideo(
  story: Story,
  overrides: StoryVideoMap = {},
): StoryVideo | undefined {
  const saved = overrides[story.id];
  if (saved && youtubeId(saved.url))
    return {
      url: saved.url,
      title: saved.title,
      credit: "Ota-ona tanlovi",
      poster: story.video?.poster ?? story.pages.at(-1)?.image ?? story.cover,
      demo: false,
      source: "parent",
    };
  const fallback = story.video;
  return fallback && !fallback.demo && youtubeId(fallback.url)
    ? fallback
    : undefined;
}
