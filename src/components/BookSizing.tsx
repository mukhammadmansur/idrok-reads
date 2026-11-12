import { useLayoutEffect, useRef } from "react";
import type { Story } from "../data/types";
import { PageArtwork, PageText } from "./StoryPageContent";

/** Measure every spread at the current width/type size before choosing one
 * stable book height. Hidden copies never announce content or receive input. */
export default function BookSizing({ story }: { story: Story }) {
  const sizing = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const measure = sizing.current;
    const host = measure?.parentElement;
    if (!measure || !host) return;
    const fit = () => {
      const mobile = window.matchMedia("(max-width:600px)").matches;
      const heights = [...measure.children].map((el) =>
        mobile
          ? Math.max(
              ...[...el.children].map(
                (leaf) => leaf.getBoundingClientRect().height,
              ),
            ) *
              2 +
            12
          : el.getBoundingClientRect().height + 12,
      );
      const floor = window.matchMedia("(max-width:600px)").matches ? 560 : 520;
      host.style.setProperty(
        "--book-height",
        `${Math.ceil(Math.max(floor, ...heights))}px`,
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(measure);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [story]);
  return (
    <div className="book-sizing" ref={sizing} aria-hidden="true" inert>
      {story.pages.map((_, page) => (
        <div className="sizing-spread" key={page}>
          <PageArtwork story={story} page={page} decorative />
          <PageText story={story} page={page} decorative />
        </div>
      ))}
    </div>
  );
}
