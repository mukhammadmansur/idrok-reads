import type { ReactNode } from "react";
import styles from "./PageIntro.module.css";

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  size = "page",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: "hero" | "page";
}) {
  return (
    <header className={`${styles.intro} ${size === "hero" ? styles.hero : ""}`}>
      <div className={styles.copy}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
