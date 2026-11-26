import { useEffect, useRef, useState } from "react";
import type { ThemeId } from "../../content";
import styles from "./WorldCritter.module.css";

export type CritterWorld = Exclude<ThemeId, "classic">;

type Variant = "stage" | "home" | "shelf" | "reader" | "inline" | "preview";

interface WorldCritterProps {
  world: CritterWorld;
  variant?: Variant;
  pulse?: number;
  className?: string;
}

export const WORLD_MASCOT: Record<CritterWorld, string> = {
  magic: "/art/worlds/mascot-owl.jpg",
  pirate: "/art/worlds/mascot-crow.jpg",
  cyber: "/art/worlds/mascot-cat.jpg",
  kitty: "/art/worlds/mascot-kitty.jpg",
  ghost: "/art/worlds/mascot-ghost.jpg",
};

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function WorldCritter({
  world,
  variant = "stage",
  pulse = 0,
  className = "",
}: WorldCritterProps) {
  const root = useRef<HTMLDivElement>(null);
  const [reacting, setReacting] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node || reduceMotion()) return;
    let frame = 0;
    let idle = 0;
    const move = (event: PointerEvent) => {
      window.clearTimeout(idle);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height * 0.4);
        const x = Math.max(-1, Math.min(1, dx / 260));
        const y = Math.max(-1, Math.min(1, dy / 260));
        node.style.setProperty("--look-x", `${(x * 5).toFixed(2)}px`);
        node.style.setProperty("--look-y", `${(y * 4).toFixed(2)}px`);
        node.style.setProperty("--tilt", `${(x * 2.4).toFixed(2)}deg`);
      });
      idle = window.setTimeout(() => {
        node.style.setProperty("--look-x", "0px");
        node.style.setProperty("--look-y", "0px");
        node.style.setProperty("--tilt", "0deg");
      }, 2600);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    if (!pulse || reduceMotion()) return;
    setReacting(false);
    const frame = requestAnimationFrame(() => setReacting(true));
    const timer = window.setTimeout(() => setReacting(false), 950);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pulse]);

  return (
    <div
      ref={root}
      className={`${styles.root} ${styles[variant]} ${className}`}
      data-world={world}
      aria-hidden="true"
    >
      <span className={styles.shadow} />
      <span className={`${styles.art} ${reacting ? styles.react : ""}`}>
        <img
          src={WORLD_MASCOT[world]}
          alt=""
          draggable={false}
          decoding="async"
        />
      </span>
    </div>
  );
}
