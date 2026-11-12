import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  HelpCircle,
  LockKeyhole,
  Medal,
  Sprout,
  Trophy,
} from "lucide-react";
import { stories } from "../data/stories";
import { useProgress } from "../lib/context";
import { Art, EmptyState, SectionTitle } from "./ui";
export default function Progress({ parent = false }: { parent?: boolean }) {
  const { progress } = useProgress();
  const started = stories.filter((s) => progress.reading[s.id]);
  const completed = started.filter((s) => progress.reading[s.id].completedAt);
  const quizScores = Object.values(progress.quizzes);
  const earned = completed.length;
  if (!parent)
    return (
      <div className="page rewards-page">
        <div className="page-intro">
          <div className="greeting">
            <span /> HAR BIR SAHIFA HISOBDA
          </div>
          <h1>Kichik qadamlar. Katta yutuqlar.</h1>
          <p>Bu — sening kashfiyotlaring xazinasi.</p>
        </div>
        <div className="rewards-banner">
          <span className="big-medal">
            <Medal size={68} strokeWidth={1.2} />
          </span>
          <div>
            <span className="eyebrow">SENING O‘QISH SAYOHATING</span>
            <h2>
              {earned
                ? `${earned} ta yangi olam kashf etildi!`
                : "Birinchi sarguzasht oldinda!"}
            </h2>
            <p>
              {earned
                ? "Har bir hikoya senga yangi fikr va yangi do‘st olib keladi."
                : "Bitta hikoyani tugat va ilk nishoningni ol."}
            </p>
            <a href="#/" className="text-link">
              {earned
                ? "Yana bir hikoya o‘qiymizmi?"
                : "Birinchi hikoyani tanla"}{" "}
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <SectionTitle title="Hikoyalar xazinasi" />
        <div className="badge-grid">
          {stories.map((s) => {
            const unlocked = !!progress.reading[s.id]?.completedAt;
            return (
              <div
                key={s.id}
                className={`badge-card ${unlocked ? "unlocked" : "locked"}`}
              >
                <span className="badge-emblem">
                  {unlocked ? <Medal size={40} /> : <LockKeyhole size={30} />}
                </span>
                <span className="eyebrow">
                  {unlocked ? "SENIKI!" : "HALI OLDINDA"}
                </span>
                <h3>{s.reward}</h3>
                <p>«{s.title}»ni o‘qib tugatish</p>
                {unlocked ? (
                  <span className="badge-date">
                    <Check size={14} />
                    {new Date(
                      progress.reading[s.id].completedAt!,
                    ).toLocaleDateString("uz-UZ", {
                      timeZone: "Asia/Tashkent",
                    })}
                  </span>
                ) : (
                  <a href={`#/story/${s.slug}`} className="text-link">
                    Hikoyaga o‘tish <ArrowRight size={15} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
        <SectionTitle title="Navbatdagi marralar" />
        <div className="milestones">
          {[1, 5, 10, 20].map((n, i) => (
            <div key={n} className={earned >= n ? "reached" : ""}>
              <span>
                {earned >= n ? (
                  <CheckCircle2 size={23} />
                ) : (
                  <Sprout size={23} />
                )}
              </span>
              <div>
                <h3>
                  {
                    [
                      "Ilk kashfiyot",
                      "Hikoyalar do‘sti",
                      "Haqiqiy kitobxon",
                      "Kitoblar bilimdoni",
                    ][i]
                  }
                </h3>
                <p>{n} ta hikoya o‘qish</p>
              </div>
              <strong>
                {Math.min(earned, n)} / {n}
              </strong>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="page parent-page">
      <div className="page-intro">
        <div className="greeting">
          <span /> OTA-ONALAR UCHUN
        </div>
        <h1>Mutolaa sari birga.</h1>
        <p>Farzandingizning o‘qish sayohatiga bir nazar.</p>
      </div>
      <div className="local-notice">
        <LockKeyhole size={19} />
        <p>
          <strong>Shu brauzerdagi demo profil.</strong> Natijalar shu qurilmada
          saqlanadi. Hisob, bulut bilan sinxronlash va alohida ota-ona kirishi
          hali ulanmagan.
        </p>
      </div>
      <div className="parent-profile">
        <span className="avatar">K</span>
        <div>
          <h2>Kichik kitobxon</h2>
          <p>Bir hikoya, bir yangi kashfiyot.</p>
        </div>
        <span className="profile-label">Mahalliy profil</span>
      </div>
      <div className="stat-grid">
        {[
          {
            icon: BookOpen,
            label: "Boshlangan hikoyalar",
            value: started.length,
          },
          { icon: CheckCircle2, label: "Tugatilgan hikoyalar", value: earned },
          {
            icon: HelpCircle,
            label: "Ishlangan savol to‘plamlari",
            value: quizScores.length,
          },
          { icon: Trophy, label: "Olingan nishonlar", value: earned },
        ].map(({ icon: Icon, label, value }) => (
          <div className="stat-card" key={label}>
            <Icon size={23} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <SectionTitle title="O‘qish jarayoni" />
      {started.length ? (
        <div className="activity-table">
          {started.map((s) => {
            const r = progress.reading[s.id];
            const percent = r.completedAt
              ? 100
              : Math.round(((r.page + 1) / s.pages.length) * 100);
            return (
              <div className="activity-row" key={s.id}>
                <Art src={s.cover} alt="" />
                <div className="activity-title">
                  <h3>{s.title}</h3>
                  <span>
                    {r.completedAt ? "Tugatilgan" : "O‘qilmoqda"} · {r.page + 1}{" "}
                    / {s.pages.length} sahifa
                  </span>
                </div>
                <div className="activity-progress">
                  <progress
                    max={100}
                    value={percent}
                    aria-label={`${s.title} o‘qish jarayoni`}
                  />
                  <span>{percent}%</span>
                </div>
                <span className="activity-date">
                  <CalendarDays size={14} />
                  {new Date(r.completedAt || r.startedAt).toLocaleDateString(
                    "uz-UZ",
                    { timeZone: "Asia/Tashkent" },
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen />}
          title="Sayohat hali boshlanmadi"
          description="Bola birinchi kitobni ochganda, o‘qish jarayoni shu yerda ko‘rinadi."
          action={
            <a href="#/" className="button">
              Kutubxonani ochish <ArrowRight size={18} />
            </a>
          }
        />
      )}
      <SectionTitle title="Tushunish va eslab qolish" />
      {quizScores.length ? (
        <div className="quiz-results-list">
          {Object.entries(progress.quizzes).map(([id, q]) => (
            <div key={id}>
              <span className="result-icon">
                <HelpCircle size={22} />
              </span>
              <div>
                <h3>
                  {stories.find((s) => s.id === id)?.title || "Umumiy savollar"}
                </h3>
                <p>{q.attempts} ta urinish · eng yaxshi natija</p>
              </div>
              <strong>
                {q.score} / {q.total}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="quiet-panel">
          Hozircha savol-javob natijalari yo‘q. Savollar o‘qishdan alohida,
          bolaning o‘z xohishi bilan ishlanadi.
        </p>
      )}
      <div className="parent-tip">
        <Sprout size={25} />
        <div>
          <h3>Birga suhbatlashing</h3>
          <p>
            «Hikoyaning qaysi joyi senga yoqdi?» kabi oddiy savol ham o‘qiganini
            eslab qolishga yordam beradi.
          </p>
        </div>
      </div>
    </div>
  );
}
