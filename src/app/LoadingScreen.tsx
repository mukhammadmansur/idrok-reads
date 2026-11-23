import { BookOpen, RefreshCw } from "lucide-react";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen({
  title = "Kutubxonani tayyorlayapmiz…",
}: {
  title?: string;
}) {
  return (
    <main className={styles.screen} aria-busy="true">
      <span className={styles.icon}>
        <BookOpen size={30} />
      </span>
      <p role="status">{title}</p>
      <RefreshCw size={18} className={styles.spinner} />
    </main>
  );
}
