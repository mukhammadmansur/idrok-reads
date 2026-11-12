import { describe, it, expect } from "vitest";
import { youtubeId, youtubeEmbed } from "./youtube";
describe("YouTube links", () => {
  it("supports watch, short and embed links without passing arbitrary iframe markup", () => {
    for (const url of [
      "https://youtu.be/aqz-KE-bpKQ?t=15",
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ&list=ignored",
      "https://www.youtube.com/shorts/aqz-KE-bpKQ",
      "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    ])
      expect(youtubeId(url)).toBe("aqz-KE-bpKQ");
    expect(youtubeEmbed("https://youtu.be/aqz-KE-bpKQ")).toBe(
      "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&playsinline=1",
    );
  });
  it("rejects other hosts, protocols, malformed IDs and pasted HTML", () => {
    for (const url of [
      "javascript:alert(1)",
      "https://youtube.com.evil.test/watch?v=aqz-KE-bpKQ",
      "https://evil.test/aqz-KE-bpKQ",
      "http://youtu.be/aqz-KE-bpKQ",
      "https://youtu.be/bad",
      '<iframe src="https://youtube.com/embed/aqz-KE-bpKQ"></iframe>',
    ])
      expect(youtubeEmbed(url)).toBeNull();
  });
});
