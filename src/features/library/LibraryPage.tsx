import {
  ArrowRight,
  Clock3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { IconButton } from "../../design-system/IconButton";
import { PageIntro } from "../../design-system/PageIntro";
import { ProgressBar } from "../../design-system/ProgressBar";
import { stories } from "../../content";
import { useProgress } from "../../lib/context";
import { AhaMomentBanner } from "../onboarding/AhaMomentBanner";
import styles from "./LibraryPage.module.css";

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
      .replace(/[‘’ʻʼ`']/g, "");
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
  const reading = stories
    .filter(
      (story) =>
        progress.reading[story.id] && !progress.reading[story.id].completedAt,
    )
    .sort(
      (a, b) =>
        Date.parse(progress.reading[b.id].startedAt) -
        Date.parse(progress.reading[a.id].startedAt),
    )[0];
  const completed = stories.filter(
    (story) => progress.reading[story.id]?.completedAt,
  ).length;

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow="Kichik kitobxonlar olami"
        title={
          child
            ? `Salom, ${child.name}! Bugun qaysi olamga sayohat qilamiz?`
            : "Salom! Bugun qaysi olamga sayohat qilamiz?"
        }
        description="Bir hikoya tanla — qolganini tasavvuring bitiradi."
        size="hero"
        actions={
          <span className={styles.stat}>
            <Sparkles size={16} />
            {completed} ta hikoya tugatilgan
          </span>
        }
      />

      {!user && completed > 0 && (
        <AhaMomentBanner childName={child?.name ?? "Kitobxon"} />
      )}

      {reading && (
        <Link to={`/read/${reading.slug}`} className={styles.continueCard}>
          <img src={reading.cover} alt="" className={styles.continueArt} />
          <span className={styles.continueBody}>
            <span className={styles.continueEyebrow}>DAVOM ETISH</span>
            <strong>{reading.title}</strong>
            <span className={styles.continueMeta}>
              {progress.reading[reading.id].page + 1} / {reading.pages.length}{" "}
              sahifa
            </span>
            <ProgressBar
              value={progress.reading[reading.id].page + 1}
              max={reading.pages.length}
              label={`${reading.title} o‘qish jarayoni`}
              className={styles.continueProgress}
            />
          </span>
          <span className={styles.continueAction}>
            Davom etish <ArrowRight size={19} />
          </span>
        </Link>
      )}

      <section aria-labelledby="library-title" className={styles.library}>
        <div className={styles.sectionHead}>
          <h2 id="library-title">Hikoyalar</h2>
          <span>{stories.length} ta original hikoya</span>
        </div>
        <div className={styles.libraryTools}>
          <div className={styles.search}>
            <Search size={20} aria-hidden="true" />
            <label htmlFor="story-search" className="sr-only">
              Hikoya qidirish
            </label>
            <input
              id="story-search"
              type="search"
              value={query}
              onChange={(event) => changeFilter("q", event.target.value)}
              placeholder="Hikoya nomini yoz…"
              autoComplete="off"
            />
            {query && (
              <IconButton
                label="Qidiruvni tozalash"
                icon={<X size={18} />}
                onClick={() => changeFilter("q", "")}
              />
            )}
          </div>
          <div
            className={styles.topicFilters}
            role="group"
            aria-label="Mavzu bo‘yicha filtr"
          >
            {[
              { id: "all", label: "Barchasi" },
              { id: "Do‘stlik", label: "Do‘stlik" },
              { id: "Sarguzasht", label: "Sarguzasht" },
              { id: "Tabiat", label: "Tabiat" },
            ].map((topicItem) => (
              <button
                key={topicItem.id}
                type="button"
                className={`${styles.topicPill} ${topic === topicItem.id ? styles.topicPillActive : ""}`}
                aria-pressed={topic === topicItem.id}
                onClick={() => changeFilter("topic", topicItem.id)}
              >
                {topicItem.label}
              </button>
            ))}
          </div>
          <div
            className={styles.filters}
            role="group"
            aria-label="O‘qish holati"
          >
            {[
              { id: "all", label: "Barchasi" },
              { id: "reading", label: "Boshlangan" },
              { id: "completed", label: "Tugatilgan" },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={status === filter.id}
                onClick={() => changeFilter("status", filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.results} role="status">
          {query || status !== "all" || topic !== "all"
            ? `${filtered.length} ta hikoya topildi`
            : "Hikoyani tanla va sayohatni boshlaymiz."}
        </p>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <Search size={28} aria-hidden="true" />
            <h3>Hikoya topilmadi</h3>
            <p>
              {status === "completed" && !query
                ? "Hikoyani o‘qib tugatganingdan keyin shu yerda ko‘rinadi."
                : status === "reading" && !query
                  ? "Hali boshlagan hikoyang yo‘q. Kutubxonadan birini tanla."
                  : "Boshqa nom bilan qidir yoki barcha hikoyalarni ko‘r."}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("q");
                next.delete("status");
                next.delete("topic");
                setParams(next, { replace: true });
              }}
            >
              Barcha hikoyalar
            </Button>
          </div>
        )}
        <div className={styles.grid}>
          {filtered.map((story) => {
            const record = progress.reading[story.id];
            const percent = record?.completedAt
              ? 100
              : record
                ? Math.min(
                    99,
                    Math.round(((record.page + 1) / story.pages.length) * 100),
                  )
                : 0;
            return (
              <Link
                key={story.id}
                to={`/story/${story.slug}`}
                className={styles.card}
              >
                <span className={styles.coverWrap}>
                  <img
                    src={story.cover}
                    alt=""
                    className={styles.cover}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.category}>{story.category}</span>
                  {percent > 0 && (
                    <span className={styles.percentBadge}>
                      {record?.completedAt ? "Tugatilgan" : `${percent}%`}
                    </span>
                  )}
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>
                    <strong>{story.title}</strong>
                  </span>
                  <span className={styles.cardSubtitle}>{story.subtitle}</span>
                  <span className={styles.cardMeta}>
                    <Clock3 size={15} />
                    {story.minutes} daqiqa
                    <i />
                    {story.age[0]}–{story.age[1]} yosh
                  </span>
                  {percent > 0 && (
                    <ProgressBar
                      value={percent}
                      max={100}
                      label={`${story.title} o‘qish jarayoni`}
                    />
                  )}
                  <span className={styles.cardActionPill}>
                    {record?.completedAt
                      ? "Yana o‘qish"
                      : percent > 0
                        ? "Davom ettirish →"
                        : "O‘qish →"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
