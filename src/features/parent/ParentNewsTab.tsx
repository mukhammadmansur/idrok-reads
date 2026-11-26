import { useEffect, useState } from "react";
import { BookOpen, Lightbulb, Newspaper } from "lucide-react";
import { api, type GuidesBySection, type NewsEntry } from "../../lib/api";
import styles from "./ParentNewsTab.module.css";

function formatDate(value: string) {
  try {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
  } catch {
    return "";
  }
}

export function ParentNewsTab() {
  const [news, setNews] = useState<NewsEntry[] | null>(null);
  const [guides, setGuides] = useState<GuidesBySection | null>(null);

  useEffect(() => {
    let active = true;
    api
      .news()
      .then((result) => {
        if (active) setNews(result.news);
      })
      .catch(() => {
        if (active) setNews([]);
      });
    api
      .guides()
      .then((result) => {
        if (active) setGuides(result.guides);
      })
      .catch(() => {
        if (active) setGuides({});
      });
    return () => {
      active = false;
    };
  }, []);

  const guideSections = guides ? Object.entries(guides) : [];

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>OILA UCHUN XABARLAR</span>
        <h1>Yangiliklar</h1>
        <p>
          Yangi kitoblar, o‘qish bo‘yicha maslahatlar va IdrokReads
          yangiliklari shu yerda chiqadi.
        </p>
      </header>

      {news === null ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Newspaper size={30} />
          </span>
          <h2>Yuklanmoqda…</h2>
          <p>Yangiliklar sahifasi ochilmoqda, biroz kuting.</p>
        </div>
      ) : news.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Newspaper size={30} />
          </span>
          <h2>Hozircha yangilik yo‘q</h2>
          <p>
            Tez orada bu yerda yangi kitoblar, foydali maslahatlar va obuna
            yangiliklari paydo bo‘ladi.
          </p>
          <div className={styles.teasers}>
            <span>
              <BookOpen size={16} />
              Yangi kitoblar
            </span>
            <span>
              <Lightbulb size={16} />
              O‘qish maslahatlari
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.newsList}>
          {news.map((item) => (
            <article key={item.id} className={styles.newsItem}>
              <div className={styles.newsHead}>
                <Newspaper size={18} style={{ color: "var(--accent)" }} />
                <h2>{item.title}</h2>
              </div>
              <time className={styles.newsDate}>{formatDate(item.createdAt)}</time>
              <p className={styles.newsBody}>{item.body}</p>
            </article>
          ))}
        </div>
      )}

      {guideSections.length > 0 && (
        <section className={styles.guides} aria-labelledby="guides-title">
          <h2 id="guides-title">
            <Lightbulb size={20} style={{ color: "var(--accent)" }} />
            Ota-ona uchun maslahatlar
          </h2>
          {guideSections.map(([section, items]) => (
            <div key={section} className={styles.guideGroup}>
              <h3 className={styles.guideSection}>{section}</h3>
              <ul className={styles.guideList}>
                {items.map((guide) => (
                  <li key={guide.id} className={styles.guideItem}>
                    <strong>{guide.title}</strong>
                    <p>{guide.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
