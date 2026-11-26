import { Check } from "lucide-react";
import { Sheet } from "../../design-system/Sheet";
import { themes } from "../../content";
import { useProgress } from "../../lib/context";
import { ThemeGlyph } from "./ThemeGlyph";
import { WORLD_MASCOT } from "./WorldCritter";
import styles from "./ThemeSheet.module.css";

export function ThemeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { progress, update } = useProgress();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="O‘qish muhiti"
      description="Har olamda o‘z jonivori va o‘z kitobi bor. Hikoya o‘zgarmaydi — dunyo o‘zgaradi."
    >
      <div className={styles.grid}>
        {themes.map((theme) => {
          const selected = progress.theme === theme.id;
          const world = theme.id === "classic" ? null : theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              className={`${styles.option} ${selected ? styles.selected : ""}`}
              aria-pressed={selected}
              onClick={() => {
                update((value) => ({ ...value, theme: theme.id }));
                onClose();
              }}
            >
              <span className={styles.icon} aria-hidden="true">
                {world ? (
                  <img src={WORLD_MASCOT[world]} alt="" loading="lazy" />
                ) : (
                  <ThemeGlyph theme={theme.id} size={24} />
                )}
              </span>
              <span className={styles.copy}>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
              {selected && <Check size={20} className={styles.check} />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
