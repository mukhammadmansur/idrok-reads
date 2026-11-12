import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Story } from "../data/types";
import { paperGeometry, PAPER_STRIPS, PAPER_TURN_MS } from "../lib/paper-turn";
import { PageArtwork, PageText } from "./StoryPageContent";

function visualCopy(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const node of [clone, ...clone.querySelectorAll<HTMLElement>("*")]) {
    node.removeAttribute("id");
    node.removeAttribute("aria-live");
    for (const [from, to] of [
      ["page-art", "paper-art"],
      ["page-text", "paper-text"],
      ["page-number", "paper-page-number"],
      ["page-art-mark", "paper-art-mark"],
    ]) {
      if (node.classList.contains(from)) node.classList.replace(from, to);
    }
  }
  return clone;
}

/** Decorative paper renderer only. Reader owns navigation and saved progress. */
export default function PaperTurn({
  source,
  story,
  target,
  direction,
  onComplete,
}: {
  source: RefObject<HTMLElement | null>;
  story: Story;
  target: number;
  direction: -1 | 1;
  onComplete: () => void;
}) {
  const template = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const current = source.current;
    const next = template.current;
    const host = visual.current;
    if (!current || !next || !host) {
      onComplete();
      return;
    }
    const width = current.clientWidth;
    const height = current.clientHeight;
    const portrait = window.matchMedia("(max-width: 600px)").matches;
    const leafWidth = portrait ? width : width / 2;
    const backward = direction === -1;
    const fromArt = current.querySelector<HTMLElement>(".page-art")!;
    const fromText = current.querySelector<HTMLElement>(".page-text")!;
    const toArt = next.querySelector<HTMLElement>(".paper-art")!;
    const toText = next.querySelector<HTMLElement>(".paper-text")!;
    const combined = (art: HTMLElement, text: HTMLElement) => {
      const spread = document.createElement("div");
      spread.className = "paper-mobile-content";
      spread.append(visualCopy(art), visualCopy(text));
      return spread;
    };
    const front = portrait
      ? backward
        ? combined(toArt, toText)
        : combined(fromArt, fromText)
      : backward
        ? fromArt
        : fromText;
    const back = portrait
      ? backward
        ? combined(fromArt, fromText)
        : combined(toArt, toText)
      : backward
        ? toText
        : toArt;
    const underlay = document.createElement("div");
    underlay.className = "paper-underlay";
    if (portrait)
      underlay.append(
        backward ? combined(fromArt, fromText) : combined(toArt, toText),
      );
    else
      underlay.append(
        visualCopy(backward ? toArt : fromArt),
        visualCopy(backward ? fromText : toText),
      );
    host.append(underlay);
    const strips = Array.from({ length: PAPER_STRIPS }, (_, index) => {
      const strip = document.createElement("div");
      strip.className = "paper-strip";
      strip.style.height = `${height}px`;
      strip.style.transformOrigin =
        !portrait && backward ? "100% 50%" : "0 50%";
      for (const [side, content] of [
        ["front", front],
        ["back", back],
      ] as const) {
        const face = document.createElement("div");
        face.className = `paper-face paper-face-${side}`;
        const copy = visualCopy(content);
        copy.style.width = `${leafWidth}px`;
        copy.style.height = `${height}px`;
        const offset =
          side === "front"
            ? !portrait && backward
              ? PAPER_STRIPS - 1 - index
              : index
            : !portrait && backward
              ? index
              : PAPER_STRIPS - 1 - index;
        copy.style.transform = `translateX(${(-offset * leafWidth) / PAPER_STRIPS}px)`;
        const lighting = document.createElement("div");
        lighting.className = "paper-lighting";
        face.append(copy, lighting);
        strip.append(face);
      }
      host.append(strip);
      return strip;
    });
    const shadow = document.createElement("div");
    shadow.className = "paper-falling-shadow";
    host.prepend(shadow);
    let frame = 0;
    let finished = false;
    let started: number | undefined;
    const complete = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      onComplete();
    };
    const draw = (time: number) => {
      if (finished) return;
      started ??= time;
      const progress = Math.min(1, (time - started) / PAPER_TURN_MS);
      const geometry = paperGeometry(progress, leafWidth, portrait && backward);
      const hinge = portrait ? 0 : width / 2;
      geometry.forEach((part, index) => {
        const strip = strips[index];
        const left =
          !portrait && backward ? hinge - part.x - part.width : hinge + part.x;
        const degrees =
          ((part.angle * 180) / Math.PI) * (!portrait && backward ? 1 : -1);
        strip.style.width = `${part.width + 0.6}px`;
        strip.style.transform = `translate3d(${left}px,0,${part.z + 2}px) rotateY(${degrees}deg)`;
        const shade =
          Math.sin(Math.PI * progress) *
          (0.04 + Math.abs(Math.sin(part.angle)) * 0.16);
        for (const light of strip.querySelectorAll<HTMLElement>(
          ".paper-lighting",
        ))
          light.style.opacity = String(shade);
      });
      shadow.style.opacity = String(Math.sin(Math.PI * progress) * 0.28);
      shadow.style.transform = `translateX(${(backward ? -1 : 1) * Math.cos(Math.PI * progress) * leafWidth * 0.25}px)`;
      if (progress < 1) frame = requestAnimationFrame(draw);
      else complete();
    };
    // No timers or global render loops: the renderer exists only during a turn.
    frame = requestAnimationFrame(draw);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChange = () => {
      if (reduced.matches) complete();
    };
    reduced.addEventListener("change", motionChange);
    window.addEventListener("resize", complete, { once: true });
    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      reduced.removeEventListener("change", motionChange);
      window.removeEventListener("resize", complete);
      host.replaceChildren();
    };
  }, [source, story, target, direction, onComplete]);
  return (
    <div
      className={`paper-turn paper-turn-${direction === 1 ? "next" : "previous"}`}
      aria-hidden="true"
      inert
    >
      <div ref={template} className="paper-spread paper-template">
        <PageArtwork story={story} page={target} decorative />
        <PageText story={story} page={target} decorative />
      </div>
      <div ref={visual} className="paper-turn-visual" />
    </div>
  );
}
