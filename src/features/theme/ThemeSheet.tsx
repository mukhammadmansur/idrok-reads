import { useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import { Sheet } from "../../design-system/Sheet";
import { themes } from "../../content";
import { isPremiumTheme } from "../../content/premium";
import { PremiumLockModal } from "../premium/PremiumLockModal";
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
  const { progress, update, premium } = useProgress();
  const [lockOpen, setLockOpen] = useState(false);
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
          const locked = isPremiumTheme(theme.id) && !premium;
          const world = theme.id === "classic" ? null : theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              className={`${styles.option} ${selected ? styles.selected : ""}`}
              aria-pressed={selected}
              onClick={() => {
                if (locked) {
                  // The sheet is a top-layer <dialog>; close it so the
                  // portaled lock modal is not painted underneath.
                  onClose();
                  setLockOpen(true);
                  return;
                }
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
              {locked && <LockKeyhole size={18} className={styles.lock} />}
              {selected && <Check size={20} className={styles.check} />}
            </button>
          );
        })}
      </div>
      <PremiumLockModal
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        kind="theme"
      />
    </Sheet>
  );
}
