import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Story } from "../data/types";
import type { PaperDragRef } from "../lib/usePaperDrag";
import { PageArtwork, PageText } from "./StoryPageContent";

/** Decorative preview; Reader commits progress only after a released gesture settles. */
export default function HologramReveal({
  source,
  story,
  target,
  gesture,
  onComplete,
}: {
  source: RefObject<HTMLElement | null>;
  story: Story;
  target: number;
  gesture?: PaperDragRef;
  onComplete: (commit: boolean) => void;
}) {
  const preview = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const current = source.current;
    const next = preview.current;
    if (!current || !next) {
      onComplete(!gesture || !!gesture.current?.commit);
      return;
    }
    const leaves = [...current.children] as HTMLElement[];
    let frame = 0;
    let started: number | undefined;
    let releaseStarted: number | undefined;
    let releaseFrom = 0;
    let finished = false;
    const complete = (commit: boolean) => {
      if (finished) return;
      finished = true;
      onComplete(commit);
    };
    const draw = (time: number) => {
      started ??= time;
      let p = Math.min(1, (time - started) / 850);
      let settled = p === 1;
      const motion = gesture?.current;
      if (motion) {
        p = motion.progress;
        settled = false;
        if (motion.released) {
          if (releaseStarted === undefined) {
            releaseStarted = time;
            releaseFrom = p;
          }
          const elapsed = Math.min(1, (time - releaseStarted) / 450);
          p =
            releaseFrom +
            ((motion.commit ? 1 : 0) - releaseFrom) * (1 - (1 - elapsed) ** 3);
          settled = elapsed === 1;
        }
      }
      next.style.opacity = String(p);
      next.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
      next.style.filter = `blur(${(1 - p) * 6}px) brightness(${1 + Math.sin(p * Math.PI) * 0.5})`;
      for (const leaf of leaves)
        leaf.style.opacity = String(Math.max(0, 1 - p * 2));
      next.style.setProperty("--scan-position", `${p * 100}%`);
      if (settled) complete(!gesture || !!motion?.commit);
      else frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChange = () => {
      if (reduced.matches) complete(!gesture || !!gesture.current?.commit);
    };
    const resize = () => complete(!gesture || !!gesture.current?.commit);
    reduced.addEventListener("change", motionChange);
    window.addEventListener("resize", resize);
    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      leaves.forEach((leaf) => {
        leaf.style.removeProperty("opacity");
        leaf.style.removeProperty("transform");
      });
      reduced.removeEventListener("change", motionChange);
      window.removeEventListener("resize", resize);
    };
  }, [source, story, target, gesture, onComplete]);
  return (
    <div
      ref={preview}
      className="world-transition hologram-reveal"
      aria-hidden="true"
      inert
    >
      <PageArtwork story={story} page={target} decorative />
      <PageText story={story} page={target} decorative />
    </div>
  );
}
