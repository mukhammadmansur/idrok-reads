import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  HelpCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { api, ApiError, type FamilyOverview } from "../lib/api";
import { stories } from "../data/stories";
import { useProgress } from "../lib/context";
import { useParentAccess } from "./ParentGate";
import { ChildAvatar } from "./Account";
import { Art } from "./ui";
const duration = (seconds: number) =>
  seconds >= 3600
    ? `${Math.floor(seconds / 3600)} soat ${Math.floor((seconds % 3600) / 60)} daq`
    : seconds >= 60
      ? `${Math.floor(seconds / 60)} daq ${Math.floor(seconds % 60)} son`
      : `${Math.floor(seconds)} son`;
const dateTime = (value: string) => {
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
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year}, ${parts.hour}:${parts.minute}`;
};
const weekday = (value: string) =>
  ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Shan"][
    new Date(value + "T12:00:00Z").getUTCDay()
  ];
const scrollTo = (node: HTMLElement | null) =>
  node?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
export default function ParentDashboard() {
  const detailRef = useRef<HTMLElement>(null),
    detailHeading = useRef<HTMLHeadingElement>(null),
    overviewRef = useRef<HTMLDivElement>(null);
  const { selectedChildId } = useProgress(),
    access = useParentAccess();
  const [data, setData] = useState<FamilyOverview | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const refreshAccess = access?.refresh;
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const next = await api.family();
      setData(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Natijalar yuklanmadi.");
      if (e instanceof ApiError && e.code === "parent_locked") {
        setData(null);
        await refreshAccess?.();
      }
    } finally {
      setBusy(false);
    }
  }, [refreshAccess]);
  useEffect(() => {
    void load();
    const visible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = window.setInterval(visible, 15000);
    window.addEventListener("focus", visible);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", visible);
    };
  }, [load]);
  const child =
    data?.children.find(
      (c) => c.profile.id === (selected ?? selectedChildId),
    ) ?? data?.children[0];
  const totals = data?.children.reduce(
    (sum, c) => ({
      completed: sum.completed + c.metrics.completed,
      seconds: sum.seconds + c.metrics.weekSeconds,
    }),
    { completed: 0, seconds: 0 },
  );
  const peak = Math.max(60, ...(child?.week.map((d) => d.seconds) ?? []));
  return (
    <div className="page family-page">
      <div className="family-heading">
        <div>
          <span className="eyebrow">OILAMIZNING O‘QISH SAYOHATI</span>
          <h1>Har bir farzand — o‘z yo‘lida.</h1>
          <p>
            Kim nima o‘qidi, qanday tushundi va qancha faol bo‘ldi — barchasi
            shu yerda.
          </p>
        </div>
        <a className="button" href="#/account">
          Farzandlar va sozlamalar <ArrowRight size={17} />
        </a>
      </div>
      <div className="family-toolbar">
        <span>
          <Users size={18} />
          {data?.children.length ?? 0} farzand
        </span>
        <span>
          <CheckCircle2 size={18} />
          {totals?.completed ?? 0} tugatilgan kitob
        </span>
        <span>
          <Clock3 size={18} />
          {duration(totals?.seconds ?? 0)} bu hafta
        </span>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
          {busy ? "Yangilanyapti…" : "Yangilash"}
        </button>
      </div>
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && (
        <p role="status">Farzandlar natijalari yuklanyapti…</p>
      )}
      {data?.children.length === 0 && (
        <div className="quiet-panel">
          <h2>Birinchi farzandingizni qo‘shing</h2>
          <p>
            Ismi va belgisini tanlang. Kitob o‘qishni boshlagach, natijalari shu
            yerda ko‘rinadi.
          </p>
          <a href="#/account" className="button">
            Farzand qo‘shish
          </a>
        </div>
      )}
      <div className="family-grid" ref={overviewRef}>
        {data?.children.map((entry) => {
          const m = entry.metrics;
          return (
            <button
              key={entry.profile.id}
              className={`family-child-card ${child?.profile.id === entry.profile.id ? "selected" : ""}`}
              aria-pressed={child?.profile.id === entry.profile.id}
              aria-label={`${entry.profile.name} — batafsil natijalar`}
              onClick={() => {
                setSelected(entry.profile.id);
                requestAnimationFrame(() => {
                  detailHeading.current?.focus({ preventScroll: true });
                  scrollTo(detailRef.current);
                });
              }}
            >
              <span className="family-child-title">
                <span className="child-symbol">
                  <ChildAvatar avatar={entry.profile.avatar} />
                </span>
                <strong>{entry.profile.name}</strong>
                {selectedChildId === entry.profile.id && (
                  <small>Hozirgi profil</small>
                )}
              </span>
              <span className="family-child-numbers">
                <span>
                  <strong>{m.completed}</strong>kitob tugatdi
                </span>
                <span>
                  <strong>{m.started - m.completed}</strong>davom etyapti
                </span>
              </span>
              <span className="family-child-meta">
                <Clock3 size={15} />
                {duration(m.weekSeconds)} / hafta<span>·</span>
                {m.accuracy === null
                  ? "Savol natijasi hali yo‘q"
                  : `${m.accuracy}% eng yaxshi javoblar`}
              </span>
              <span className="family-last-seen">
                {m.lastActiveAt
                  ? `Oxirgi faollik: ${dateTime(m.lastActiveAt)}`
                  : "Hali kitob o‘qishni boshlamagan"}
              </span>
              <span className="text-link">
                Batafsil ko‘rish <ArrowRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
      {child && (
        <section
          ref={detailRef}
          className="child-detail"
          aria-label={`${child.profile.name} natijalari`}
        >
          <div className="child-detail-heading">
            <button
              className="text-link family-overview-back"
              onClick={() => {
                scrollTo(overviewRef.current);
                overviewRef.current
                  ?.querySelector<HTMLButtonElement>(".selected")
                  ?.focus({ preventScroll: true });
              }}
            >
              ← Barcha farzandlar
            </button>
            <div>
              <span className="eyebrow">FARZANDINGIZ NATIJALARI</span>
              <h2 ref={detailHeading} tabIndex={-1}>
                {child.profile.name}
              </h2>
            </div>
            <span>
              {child.metrics.lastActiveAt
                ? `Oxirgi faollik: ${dateTime(child.metrics.lastActiveAt)}`
                : "Birinchi sarguzasht hali oldinda"}
            </span>
          </div>
          <div className="stat-grid">
            {[
              {
                icon: BookOpen,
                label: "Tugatilgan kitoblar",
                value: child.metrics.completed,
              },
              {
                icon: HelpCircle,
                label: "Savol-javob urinishlari",
                value: child.metrics.quizAttempts,
              },
              {
                icon: Clock3,
                label: "Bugungi faol o‘qish",
                value: duration(child.metrics.todaySeconds),
              },
              {
                icon: CheckCircle2,
                label: "Eng yaxshi javoblar",
                value:
                  child.metrics.accuracy === null
                    ? "Hali yo‘q"
                    : `${child.metrics.accuracy}%`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="stat-card">
                <Icon size={22} />
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="family-detail-grid">
            <section className="account-panel activity-chart">
              <h3>So‘nggi 7 kun</h3>
              <p>Faol o‘qish vaqti · {duration(child.metrics.weekSeconds)}</p>
              <div className="week-bars">
                {child.week.map((d) => (
                  <div key={d.date}>
                    <span className="week-value">
                      {d.seconds >= 60
                        ? `${Math.floor(d.seconds / 60)} daq`
                        : `${d.seconds} son`}
                    </span>
                    <span className="week-track">
                      <i
                        style={{
                          height: `${d.seconds ? Math.max(4, (d.seconds / peak) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    <span>{weekday(d.date)}</span>
                    <small>
                      {d.date.slice(8)}.{d.date.slice(5, 7)}
                    </small>
                  </div>
                ))}
              </div>
              <p className="metric-note">
                Kitob ochiq va bola faol bo‘lgan vaqt hisoblanadi. Fon oynalari,
                uzoq tanaffuslar va internetsiz vaqt hisobga kirmaydi. Bir
                nechta oyna vaqtni ikki marta oshirmaydi.
              </p>
            </section>
            <section className="account-panel recent-activity">
              <h3>Oxirgi harakatlar</h3>
              {child.recent.length ? (
                <ol>
                  {child.recent.map((event, index) => (
                    <li key={`${event.at}:${index}`}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>
                          {event.type === "quiz"
                            ? "Savollarga javob berdi"
                            : event.type === "completed"
                              ? "Kitobni tugatdi"
                              : "Kitob o‘qidi"}
                        </strong>
                        <p>
                          {stories.find((s) => s.id === event.storyId)?.title ??
                            "Umumiy savollar"}
                          {event.type === "quiz"
                            ? ` · ${event.score}/${event.total} javob`
                            : ` · ${(event.page ?? 0) + 1}-sahifa`}
                        </p>
                        <time dateTime={event.at}>{dateTime(event.at)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="metric-note">
                  Yangi o‘qishlar va javoblar shu yerda paydo bo‘ladi. Oldingi
                  natijalar quyida saqlangan.
                </p>
              )}
            </section>
          </div>
          <h3>Kitoblar bo‘yicha</h3>
          <div className="family-books">
            {stories
              .filter((s) => s.status === "published")
              .map((story) => {
                const r = child.progress.reading[story.id],
                  q = child.progress.quizzes[story.id];
                const percent = r?.completedAt
                  ? 100
                  : r
                    ? Math.round(((r.page + 1) / story.pages.length) * 100)
                    : 0;
                return (
                  <div className="family-book-row" key={story.id}>
                    <Art src={story.cover} alt="" />
                    <div>
                      <h4>{story.title}</h4>
                      <p>
                        {r?.completedAt
                          ? "O‘qib tugatilgan"
                          : r
                            ? `${r.page + 1}/${story.pages.length} sahifa · davom etmoqda`
                            : "Hali boshlanmagan"}
                      </p>
                    </div>
                    <div>
                      <progress
                        max={100}
                        value={percent}
                        aria-label={`${story.title} o‘qish jarayoni`}
                      />
                      <span>{percent}%</span>
                    </div>
                    <span>
                      {q
                        ? `${q.score}/${q.total} · ${q.attempts} urinish`
                        : "Savol-javob hali yo‘q"}
                    </span>
                  </div>
                );
              })}
          </div>
          {child.progress.quizzes.general && (
            <p className="quiet-panel">
              Umumiy savollar: {child.progress.quizzes.general.score}/
              {child.progress.quizzes.general.total} eng yaxshi javob ·{" "}
              {child.progress.quizzes.general.attempts} urinish
            </p>
          )}
          <p className="metric-note">
            Natijalar oxirgi sinxronlangan holatni ko‘rsatadi. Vaqt hisobi ushbu
            yangilanishdan boshlab yuritiladi. Yangilangan:{" "}
            {data && dateTime(data.generatedAt)}.
          </p>
        </section>
      )}
    </div>
  );
}
