import { describe, expect, it } from "vitest";
import { storyVideo } from "./videos";
import type { Story } from "./types";
import { stories } from "./index";
import { youtubeId } from "../lib/youtube";

const base: Story = {
  id: "demo",
  slug: "demo",
  title: "Demo",
  subtitle: "Demo",
  description: "Demo",
  cover: "/cover.webp",
  age: [6, 8],
  minutes: 3,
  category: "ertak",
  reward: "nishon",
  pages: [],
  quiz: [],
  status: "published",
};

describe("storyVideo", () => {
  it("gives every published story that ships a video a distinct valid library video with a local poster", () => {
    const published = stories.filter(
      (story) => story.status === "published" && story.video,
    );
    const ids = published.map((story) => {
      const video = storyVideo(story);
      expect(video?.source).toBe("library");
      expect(video?.title).toContain("inglizcha");
      expect(video?.poster).toMatch(/^\/art\/.+\.webp$/);
      expect(video?.credit).toBeTruthy();
      const id = youtubeId(video?.url ?? "");
      expect(id).not.toBeNull();
      return id;
    });
    expect(new Set(ids).size).toBe(published.length);
  });

  it("never silently shows a sample film, even when an override is invalid", () => {
    const story = {
      ...base,
      video: {
        url: "https://youtu.be/aqz-KE-bpKQ",
        title: "Namuna",
        demo: true,
      },
    };
    expect(storyVideo(story)).toBeUndefined();
    expect(
      storyVideo(story, {
        demo: {
          url: "javascript:alert(1)",
          title: "Invalid",
          updatedAt: "2026-11-19T00:00:00.000Z",
        },
      }),
    ).toBeUndefined();
  });
  it("returns an original video when no override exists", () => {
    const story = {
      ...base,
      video: { url: "https://youtu.be/aqz-KE-bpKQ", title: "Namuna" },
    };
    expect(storyVideo(story, {})).toEqual(story.video);
  });

  it("returns nothing when neither demo nor override is usable", () => {
    expect(
      storyVideo({
        ...base,
        video: { url: "https://evil.example/x", title: "X" },
      }),
    ).toBeUndefined();
    expect(storyVideo(base)).toBeUndefined();
  });

  it("prefers a valid parent override and marks it as a parent choice", () => {
    const story = {
      ...base,
      video: {
        url: "https://youtu.be/aqz-KE-bpKQ",
        title: "Namuna",
        poster: "/poster.webp",
      },
    };
    const video = storyVideo(story, {
      demo: {
        url: "https://www.youtube.com/watch?v=C_nJJHaHmnY",
        title: "Oila videosi",
        updatedAt: "2026-11-18T00:00:00.000Z",
      },
    });
    expect(video).toEqual({
      url: "https://www.youtube.com/watch?v=C_nJJHaHmnY",
      title: "Oila videosi",
      credit: "Ota-ona tanlovi",
      poster: "/poster.webp",
      demo: false,
      source: "parent",
    });
  });

  it("ignores an invalid override and falls back to an original video", () => {
    const story = {
      ...base,
      video: { url: "https://youtu.be/aqz-KE-bpKQ", title: "Namuna" },
    };
    const video = storyVideo(story, {
      demo: {
        url: "javascript:alert(1)",
        title: "Yomon",
        updatedAt: "2026-11-18T00:00:00.000Z",
      },
    });
    expect(video).toEqual(story.video);
  });
});
