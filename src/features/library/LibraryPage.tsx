import type { ComponentType } from "react";
import {
  BookOpen,
  Clock3,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { stories } from "../../content";
import { useProgress } from "../../lib/context";
import { ProgressBar } from "../../design-system/ProgressBar";
import {
  BookSticker,
  LionSticker,
  FoxSticker,
  WhaleSticker,
} from "../../design-system/Avatar";
import { AhaMomentBanner } from "../onboarding/AhaMomentBanner";
import styles from "./LibraryPage.module.css";

interface WorldTopic {
  id: string;
  category: string;
  label: string;
  sublabel: string;
  theme: "all" | "adventure" | "friendship" | "nature";
  icon: ComponentType<{ size?: number }>;
}

const WORLD_TOPICS: WorldTopic[] = [
  {
    id: "all",
    category: "all",
    label: "Barchasi",
    sublabel: "Barcha ertaklar",
    theme: "all",
    icon: BookSticker,
  },
  {
    id: "Sarguzasht",
    category: "Sarguzasht",
    label: "Jasur sarguzasht",
    sublabel: "Jasorat va sayohat",
    theme: "adventure",
    icon: LionSticker,
  },
  {
    id: "Do‘stlik",
    category: "Do‘stlik",
    label: "Do‘stlik va mehr",
    sublabel: "Mehr-oqibat ertaklari",
    theme: "friendship",
    icon: FoxSticker,
  },
  {
    id: "Tabiat",
    category: "Tabiat",
    label: "Sehrli tabiat",
    sublabel: "Dengiz va tabiat sirlari",
    theme: "nature",
    icon: WhaleSticker,
  },
];

const STATUS_OPTIONS = [
  { id: "all", label: "Barcha kitoblar", emoji: "✨" },
  { id: "reading", label: "O‘qilayotganlar", emoji: "📖" },
  { id: "completed", label: "Tugatilganlar", emoji: "🏆" },
];

export function LibraryPage() {
  const { progress, children: profiles, selectedChildId, user } = useProgress();
  const child = profiles.find((profile) => profile.id === selectedChildId);
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const topic = params.get("topic") ?? "all";
  const status = ["reading", "completed"].includes(params.get("status") ?? "")
    ? params.get("status")!
    : "all";

  const changeFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("uz")
      .normalize("NFKC")
      .replace(/[‘’ʻʼ`']/g, "")
      .trim();

  const filtered = stories.filter((story) => {
    const record = progress.reading[story.id];
    const matchesStatus =
      status === "all" ||
      (status === "completed"
        ? !!record?.completedAt
        : !!record && !record.completedAt);
    const matchesTopic =
      topic === "all" || normalize(story.category) === normalize(topic);
    return (
      matchesStatus &&
      matchesTopic &&
      normalize(`${story.title} ${story.subtitle} ${story.category}`).includes(
        normalize(query.trim()),
      )
    );
  });

  const completed = stories.filter(
    (story) => progress.reading[story.id]?.completedAt,
  ).length;

  return (
    <div className={styles.page}>
      {/* 1. TOP BAR: Compact, joyful, child-centric */}
      <header className={styles.libraryHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleIcon}>
              <BookSticker size={32} />
            </span>
            <span>Sehrli kitoblar javoni</span>
          </h1>
          <p className={styles.pageSubtitle}>
            O‘zingga yoqqan ertakni tanla va sehrli sayohatga chiq!
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchBox}>
            <Search size={18} aria-hidden="true" className={styles.searchIcon} />
            <label htmlFor="story-search" className="sr-only">
              Ertak qidirish
            </label>
            <input
              id="story-search"
              type="search"
              value={query}
              onChange={(event) => changeFilter("q", event.target.value)}
              placeholder="Ertak nomini yoz..."
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => changeFilter("q", "")}
                aria-label="Qidiruvni tozalash"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <span className={styles.storyCounter}>
            <Sparkles size={15} style={{ color: "var(--gold)" }} />
            {stories.length} ta ertak
          </span>
        </div>
      </header>

      {/* Soft Aha-Moment Banner if applicable */}
      {!user && completed > 0 && (
        <AhaMomentBanner childName={child?.name ?? "Kitobxon"} />
      )}

      {/* 2. CONTROLS BAR: Playful Themed Worlds + Reading Status */}
      <section className={styles.filterBar} aria-label="Ertaklar filtri">
        {/* World / Topic Tiles */}
        <div className={styles.worldList} role="group" aria-label="Sehrli olamlar">
          {WORLD_TOPICS.map((item) => {
            const isActive =
              normalize(topic) === normalize(item.category) ||
              (item.id === "all" && topic === "all");
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeFilter("topic", item.id)}
                className={`${styles.worldTile} ${styles[`theme_${item.theme}`]} ${
                  isActive ? styles.worldTileActive : ""
                }`}
                aria-pressed={isActive}
              >
                <div className={styles.worldIconWrap}>
                  <Icon size={34} />
                </div>
                <div className={styles.worldText}>
                  <strong className={styles.worldLabel}>{item.label}</strong>
                  <span className={styles.worldSublabel}>{item.sublabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Status Pills */}
        <div className={styles.statusGroup} role="group" aria-label="O‘qish holati">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeFilter("status", item.id)}
              className={`${styles.statusPill} ${
                status === item.id ? styles.statusPillActive : ""
              }`}
              aria-pressed={status === item.id}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. STORY CARDS GRID / EMPTY STATE */}
      <section className={styles.bookshelfSection} aria-label="Kitoblar javoni">
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>Ertak topilmadi</h3>
            <p>
              {query
                ? `«${query}» bo‘yicha hech qanday ertak chiqmadi. Boshqa so‘z bilan qidirib ko‘r!`
                : "Bu bo‘limda hozircha kitob yo‘q. Barcha ertaklarni ochishing mumkin."}
            </p>
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("q");
                next.delete("status");
                next.delete("topic");
                setParams(next, { replace: true });
              }}
            >
              <BookSticker size={20} />
              <span>Barcha ertaklarni ko‘rish</span>
            </button>
          </div>
        ) : (
          <div className={styles.booksGrid}>
            {filtered.map((story) => {
              const record = progress.reading[story.id];
              const isCompleted = !!record?.completedAt;
              const percent = isCompleted
                ? 100
                : record
                  ? Math.min(
                      99,
                      Math.round(((record.page + 1) / story.pages.length) * 100),
                    )
                  : 0;
              const currentStep = record ? record.page + 1 : 0;

              const normCat = normalize(story.category);
              const cardTheme = normCat.includes("sarguzasht")
                ? "adventure"
                : normCat.includes("dost")
                  ? "friendship"
                  : "nature";

              return (
                <Link
                  key={story.id}
                  to={`/story/${story.slug}`}
                  className={`${styles.bookCard} ${styles[`card_${cardTheme}`]}`}
                >
                  {/* Cover Art Container */}
                  <div className={styles.coverFrame}>
                    <img
                      src={story.cover}
                      alt={`${story.title} muqovasi`}
                      className={styles.coverImage}
                      loading="lazy"
                    />

                    {/* Floating Top Badges */}
                    <div className={styles.coverTopBadges}>
                      <span className={styles.categoryBadge}>
                        {cardTheme === "adventure" && <LionSticker size={16} />}
                        {cardTheme === "friendship" && <FoxSticker size={16} />}
                        {cardTheme === "nature" && <WhaleSticker size={16} />}
                        <span>{story.category}</span>
                      </span>

                      {isCompleted ? (
                        <span className={styles.ribbonCompleted}>
                          <Sparkles size={13} /> O‘qib bo‘lindi
                        </span>
                      ) : percent > 0 ? (
                        <span className={styles.ribbonReading}>
                          {percent}% o‘qildi
                        </span>
                      ) : (
                        <span className={styles.ribbonAge}>
                          {story.age[0]}–{story.age[1]} yosh
                        </span>
                      )}
                    </div>

                    {/* Floating Bottom Metadata */}
                    <div className={styles.coverBottomMeta}>
                      <span className={styles.timeBadge}>
                        <Clock3 size={13} /> {story.minutes} daqiqa
                      </span>
                      {percent > 0 && !isCompleted && (
                        <span className={styles.pageBadge}>
                          {currentStep} / {story.pages.length} sahifa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Book Details Container */}
                  <div className={styles.bookInfo}>
                    <h2 className={styles.bookTitle}>{story.title}</h2>
                    <p className={styles.bookSubtitle}>{story.subtitle}</p>

                    {/* Reading Progress Bar (if in progress) */}
                    {percent > 0 && (
                      <div className={styles.progressContainer}>
                        <ProgressBar
                          value={percent}
                          max={100}
                          label={`${story.title} jarayoni`}
                        />
                      </div>
                    )}

                    {/* Big KidTech Call-To-Action Button */}
                    <div className={styles.actionWrap}>
                      <span
                        className={`${styles.actionButton} ${
                          isCompleted
                            ? styles.btnCompleted
                            : percent > 0
                              ? styles.btnContinue
                              : styles.btnStart
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <RotateCcw size={16} /> Qayta o‘qish
                          </>
                        ) : percent > 0 ? (
                          <>
                            <Play size={16} fill="currentColor" /> Davom ettirish
                          </>
                        ) : (
                          <>
                            <BookOpen size={16} /> Ertakni o‘qish
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
