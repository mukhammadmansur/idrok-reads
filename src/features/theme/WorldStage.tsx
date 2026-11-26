import { useLocation } from "react-router-dom";
import type { ThemeId } from "../../content";
import { useProgress } from "../../lib/context";
import styles from "./WorldStage.module.css";

const BACKDROPS: Record<Exclude<ThemeId, "classic">, string> = {
  magic: "/art/worlds/magic-room.jpg",
  pirate: "/art/worlds/pirate-sea.jpg",
  cyber: "/art/worlds/space-nebula.jpg",
  kitty: "/art/worlds/kitty-garden.jpg",
  ghost: "/art/worlds/ghost-sea.jpg",
};

export function WorldStage() {
  const { progress } = useProgress();
  const { pathname } = useLocation();
  const world = progress.theme;
  if (pathname.startsWith("/parent") || world === "classic") return null;

  return (
    <div className={styles.stage} data-world={world} aria-hidden="true">
      <img className={styles.backdrop} src={BACKDROPS[world]} alt="" />
      <span className={styles.scrim} />
      {(world === "magic" || world === "cyber" || world === "kitty") && (
        <>
          <span className={`${styles.sparkle} ${styles.sparkleA}`} />
          <span className={`${styles.sparkle} ${styles.sparkleB}`} />
          <span className={styles.shooting} />
        </>
      )}
      {world === "pirate" && <span className={styles.shimmer} />}
      {world === "ghost" && <span className={styles.fog} />}
    </div>
  );
}
