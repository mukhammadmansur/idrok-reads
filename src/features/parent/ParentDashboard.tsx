import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../design-system/Avatar";
import { buttonClass } from "../../design-system/Button";
import { ProgressBar } from "../../design-system/ProgressBar";
import { stories, storyById } from "../../content";
import {
  api,
  ApiError,
  type FamilyChild,
  type FamilyOverview,
} from "../../lib/api";
import { useProgress } from "../../lib/context";
import { useParentAccess } from "./ParentGate";
import styles from "./ParentDashboard.module.css";

const weekdays = ["Yak", "Dsh", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  if (total >= 3600) {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${hours} soat${minutes ? ` ${minutes} daqiqa` : ""}`;
  }
  if (total >= 60) return `${Math.floor(total / 60)} daqiqa`;
  if (total > 0) return `${total} soniya`;
  return "—";
}

function barValue(seconds: number) {
  if (seconds >= 60) return `${Math.floor(seconds / 60)} daq`;
  if (seconds > 0) return `${seconds} s`;
  return "—";
}

function dateTime(value: string) {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tashkent",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
        .formatToParts(new Date(value))
        .map((part) => [part.type, part.value]),
    );
    return `${parts.day}.${parts.month}.${parts.year}, ${parts.hour}:${parts.minute}`;
  } catch {
    return "—";
  }
}

const dayName = (value: string) =>
  weekdays[new Date(`${value}T12:00:00Z`).getUTCDay()];

export function ParentDashboard() {
  const { selectedChildId } = useProgress();
  const access = useParentAccess();
  const refreshAccess = access?.refresh;
  const [data, setData] = useState<FamilyOverview | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const next = await api.family();
      setData(next);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Natijalar yuklanmadi.",
      );
      if (cause instanceof ApiError && cause.code === "parent_locked") {
        setData(null);
        await refreshAccess?.();
      }
    } finally {
      setBusy(false);
    }
  }, [refreshAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const child =
    data?.children.find(
      (entry) => entry.profile.id === (selected ?? selectedChildId),
    ) ?? data?.children[0];

  if (!data)
    return (
      <div className={styles.loading} aria-busy="true">
        <RefreshCw size={24} className={busy ? styles.spin : ""} />
        <p role="status">
          {error ? error : "Farzandlar natijalari yuklanyapti…"}
        </p>
        {error && (
          <button
            type="button"
            className={styles.retry}
            onClick={() => void load()}
          >
            Qayta urinish
          </button>
        )}
      </div>
    );

  if (data.children.length === 0)
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <Users size={30} />
        </span>
        <span className={styles.eyebrow}>BIRINCHI QADAM</span>
        <h1>Birinchi farzand profilini qo‘shing</h1>
        <p>
          Ism va belgini tanlang. Kitob o‘qish boshlangach, natijalar shu yerda
          ko‘rinadi.
        </p>
        <Link to="/parent/account" className={buttonClass({ size: "lg" })}>
          Profil qo‘shish
          <ArrowRight size={18} />
        </Link>
      </div>
    );

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>OILAMIZNING O‘QISH SAYOHATI</span>
          <h1>Farzandlarim</h1>
          <p>
            Har bir bolaning o‘qish jarayoni, faol vaqti va savol-javob
            natijalari.
          </p>
        </div>
      </header>

      {/* HORIZONTAL CHILD SELECTOR PILLS */}
      <div className={styles.childSelectorBar} role="tablist" aria-label="Farzandlar ro‘yxati">
        {data.children.map((entry) => {
          const active = child?.profile.id === entry.profile.id;
          return (
            <button
              key={entry.profile.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.childPill} ${active ? styles.childPillActive : ""}`}
              onClick={() => setSelected(entry.profile.id)}
            >
              <Avatar avatar={entry.profile.avatar} size={28} />
              <span>{entry.profile.name}</span>
            </button>
          );
        })}

        {data.children.length < 6 && (
          <Link to="/parent/account" className={styles.addChildPill}>
            <Plus size={16} />
            <span>Farzand qo‘shish</span>
          </Link>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {child && (
        <section
          className={styles.detail}
          aria-label={`${child.profile.name} natijalari`}
        >
          <header className={styles.detailHead}>
            <div>
              <span className={styles.eyebrow}>O‘QISH XULOSASI</span>
              <h2>{child.profile.name}</h2>
              <p className={styles.summaryLead}>
                {child.metrics.completed > 0
                  ? `[${child.profile.name}] shu kungacha ${child.metrics.completed} ta kitob o‘qidi.`
                  : `[${child.profile.name}] birinchi kitobini boshlashga tayyor.`}
              </p>
            </div>
            <span>
              {child.metrics.lastActiveAt
                ? `Oxirgi faollik: ${dateTime(child.metrics.lastActiveAt)}`
                : "Hali faollik qayd etilmagan"}
            </span>
          </header>

          {/* EXACTLY 3 CLEAN METRIC CARDS */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <BookOpen size={22} style={{ color: "var(--accent)" }} />
              <strong>{child.metrics.completed}</strong>
              <span>Tugatilgan kitoblar</span>
            </div>

            <div className={styles.stat}>
              <CheckCircle2 size={22} style={{ color: "var(--accent)" }} />
              <strong>
                {child.metrics.accuracy === null
                  ? "Hali yo‘q"
                  : `${child.metrics.accuracy}%`}
              </strong>
              <span>Savol-javob natijasi</span>
            </div>

            <div className={styles.stat}>
              <Clock3 size={22} style={{ color: "var(--accent)" }} />
              <strong>
                {duration(
                  child.metrics.weekSeconds || child.metrics.totalSeconds,
                )}
              </strong>
              <span>O‘qish vaqti</span>
            </div>
          </div>

          <div className={styles.columns}>
            {/* 7-DAY BAR CHART */}
            <section className={styles.panel} aria-labelledby="week-title">
              <div className={styles.panelHead}>
                <div>
                  <h3 id="week-title">So‘nggi 7 kun</h3>
                  <p>
                    Faol o‘qish vaqti: {duration(child.metrics.weekSeconds)}
                  </p>
                </div>
              </div>
              <div
                className={styles.chart}
                role="group"
                aria-label="So‘nggi 7 kun faol o‘qish vaqti"
              >
                {child.week.map((day) => {
                  const peak = Math.max(
                    60,
                    ...child.week.map((entry) => entry.seconds),
                  );
                  return (
                    <div key={day.date} className={styles.day}>
                      <span className={styles.dayValue}>
                        {barValue(day.seconds)}
                      </span>
                      <span className={styles.track} aria-hidden="true">
                        <i
                          style={{
                            height: day.seconds
                              ? `${Math.max(6, (day.seconds / peak) * 100)}%`
                              : 0,
                          }}
                        />
                      </span>
                      <span className={styles.dayLabel}>
                        {dayName(day.date)}
                      </span>
                      <small>
                        {day.date.slice(8)}.{day.date.slice(5, 7)}
                      </small>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RECENT ACTIVITIES */}
            <section className={styles.panel} aria-labelledby="recent-title">
              <div className={styles.panelHead}>
                <div>
                  <h3 id="recent-title">Oxirgi harakatlar</h3>
                  <p>Yangi o‘qishlar va savol javoblari.</p>
                </div>
              </div>
              {child.recent.length ? (
                <ol className={styles.recent}>
                  {child.recent.slice(0, 5).map((event, index) => (
                    <li key={`${event.at}:${index}`}>
                      <span className={styles.dot} aria-hidden="true" />
                      <div>
                        <strong>
                          {event.type === "quiz"
                            ? "Savollarga javob berdi"
                            : event.type === "completed"
                              ? "Kitobni tugatdi"
                              : "Kitob o‘qidi"}
                        </strong>
                        <p>
                          {event.type === "quiz"
                            ? event.storyId === "general"
                              ? "Umumiy savollar"
                              : storyById(event.storyId)?.title ?? "Savol-javob"
                            : storyById(event.storyId)?.title ?? "Hikoya"}
                          {event.type === "quiz"
                            ? ` · ${event.score}/${event.total} to‘g‘ri`
                            : ` · ${(event.page ?? 0) + 1}-sahifa`}
                        </p>
                        <time dateTime={event.at}>{dateTime(event.at)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.note}>
                  Yangi o‘qishlar va javoblar shu yerda ko‘rinadi.
                </p>
              )}
            </section>
          </div>

          {/* PER STORY PROGRESS LIST - 0 SONIYA BUG FIXED */}
          <section className={styles.books} aria-labelledby="books-title">
            <div className={styles.panelHead}>
              <div>
                <h3 id="books-title">Kitoblar bo‘yicha</h3>
                <p>Har bir hikoya va savol natijalari.</p>
              </div>
            </div>
            <div className={styles.bookList}>
              {stories.map((story) => {
                const record = child.progress.reading[story.id];
                const quiz = child.progress.quizzes[story.id];
                const isCompleted = Boolean(record?.completedAt);
                const percent = isCompleted
                  ? 100
                  : record
                    ? Math.round(
                        ((record.page + 1) / story.pages.length) * 100,
                      )
                    : 0;

                return (
                  <article key={story.id} className={styles.bookRow}>
                    <img src={story.cover} alt="" loading="lazy" />
                    <div className={styles.bookCopy}>
                      <h4>{story.title}</h4>
                      <p>
                        {isCompleted
                          ? "Tugatilgan"
                          : record
                            ? `${record.page + 1}/${story.pages.length} sahifa · davom etmoqda`
                            : "Hali boshlanmagan"}
                      </p>
                      <ProgressBar
                        value={percent}
                        max={100}
                        label={`${story.title} o‘qish jarayoni`}
                      />
                    </div>
                    <div className={styles.bookQuiz}>
                      <span>{percent}%</span>
                      <small>
                        {quiz
                          ? `${quiz.score}/${quiz.total} · ${quiz.attempts} urinish`
                          : "Savol-javob hali yo‘q"}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
