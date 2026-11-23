import { Check } from "lucide-react";
import { Sheet } from "../../design-system/Sheet";
import { themes } from "../../content";
import { useProgress } from "../../lib/context";
import { ThemeGlyph } from "./ThemeGlyph";
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
      description="Hikoya o‘zgarmaydi — faqat atrofingdagi kayfiyat o‘zgaradi."
    >
      <div className={styles.grid}>
        {themes.map((theme) => {
          const selected = progress.theme === theme.id;
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
              <span
                className={styles.icon}
                data-material={theme.id}
                aria-hidden="true"
              >
                <ThemeGlyph theme={theme.id} size={22} />
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
