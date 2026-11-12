import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Medal,
  Settings2,
  X,
} from "lucide-react";
import { themes } from "../data/stories";
import type { Story } from "../data/types";
import { useProgress } from "../lib/context";
import { completeStory, recordPage } from "../lib/progress";
import { Art } from "./ui";
import Recap from "./Recap";
export default function Reader({
  story,
  completed = false,
}: {
  story: Story;
  completed?: boolean;
}) {
  const { progress, update } = useProgress();
  const [page, setPage] = useState(() =>
    Math.min(progress.reading[story.id]?.page || 0, story.pages.length - 1),
  );
  const [showThemes, setShowThemes] = useState(false);
  const [large, setLarge] = useState(false);
  const touch = useRef<number | null>(null);
  const theme = progress.theme;
  useEffect(() => {
    if (!completed) update((p) => recordPage(p, story.id, page));
  }, [page, story.id, completed, update]);
  const changePage = (direction: number) =>
    setPage((p) =>
      Math.max(0, Math.min(story.pages.length - 1, p + direction)),
    );
  useEffect(() => {
    if (completed) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowThemes(false);
        return;
      }
      if ((e.target as HTMLElement).closest("button,input,select,textarea"))
        return;
      if (e.key === "ArrowRight")
        setPage((p) => Math.min(story.pages.length - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [story.pages.length, completed]);
  const finish = () => {
    update((p) => completeStory(p, story.id, story.pages.length - 1));
    window.location.hash = `/completed/${story.slug}`;
  };
  if (completed) {
    const isComplete = !!progress.reading[story.id]?.completedAt;
    return (
      <div className="page completion-page">
        <a className="back-link" href="#/">
          <ArrowLeft size={18} /> Kutubxona
        </a>
        {isComplete ? (
          <>
            <span className="completion-medal">
              <Medal size={43} />
            </span>
            <span className="eyebrow">YANA BIR OLAMNI KASHF ETDING</span>
            <h1>Barakalla, kitobxon!</h1>
            <p>
              «{story.title}»ni o‘qib tugatding.
              <br />
              Bu sarguzasht endi sening bir bo‘laging.
            </p>
            <div className="earned-badge">
              <Check size={17} /> «{story.reward}» nishoni seniki
            </div>
            <h2>Hikoyani birga eslaymizmi?</h2>
            <Recap story={story} />
            <div className="completion-actions">
              <a href="#/" className="button">
                Keyingi hikoyani top <ArrowRight size={18} />
              </a>
              <a className="text-link" href="#/rewards">
                Yutuqlarimni ko‘rish
              </a>
            </div>
            <p className="quiet-note">
              Savollarni istalgan payt alohida «Savol-javob» bo‘limida
              ishlashing mumkin.
            </p>
          </>
        ) : (
          <>
            <h1>Hikoya seni kutmoqda</h1>
            <p>Avval hikoyani o‘qib chiqamizmi?</p>
            <a href={`#/read/${story.slug}`} className="button">
              O‘qishni boshlash <ArrowRight size={18} />
            </a>
          </>
        )}
      </div>
    );
  }
  return (
    <main className={`reader theme-${theme} ${large ? "large-type" : ""}`}>
      <header className="reader-header">
        <a
          href={`#/story/${story.slug}`}
          className="reader-back"
          aria-label="Hikoya tafsilotlariga qaytish"
        >
          <ArrowLeft size={20} />
          <span>Chiqish</span>
        </a>
        <div className="reader-title">
          <span>IQRO ORIGINAL</span>
          <h1>{story.title}</h1>
        </div>
        <div className="reader-settings">
          <button
            className={`icon-button type-button ${large ? "selected" : ""}`}
            aria-label="Katta matn"
            aria-pressed={large}
            onClick={() => setLarge(!large)}
          >
            Aa
          </button>
          <button
            className="icon-button"
            aria-label="O‘qish muhitini tanlash"
            aria-expanded={showThemes}
            onClick={() => setShowThemes(!showThemes)}
          >
            {showThemes ? <X size={21} /> : <Settings2 size={21} />}
          </button>
        </div>
      </header>
      {showThemes && (
        <div
          className="reader-theme-menu"
          role="group"
          aria-label="O‘qish muhiti"
        >
          {themes.map((t) => (
            <button
              key={t.id}
              aria-pressed={theme === t.id}
              onClick={() => {
                update((p) => ({ ...p, theme: t.id }));
                setShowThemes(false);
              }}
            >
              <span>{t.symbol}</span>
              {t.label}
              {theme === t.id && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
      <div className="reader-world-label" aria-hidden="true">
        {themes.find((t) => t.id === theme)?.symbol}{" "}
        {themes.find((t) => t.id === theme)?.name}
      </div>
      <article
        className="book-page"
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touch.current !== null) {
            const difference = touch.current - e.changedTouches[0].clientX;
            if (Math.abs(difference) > 65) changePage(difference > 0 ? 1 : -1);
            touch.current = null;
          }
        }}
      >
        <div className="page-art">
          <Art
            src={story.pages[page].illustration}
            alt={story.pages[page].scene}
          />
          <span className="page-art-mark">
            {String(page + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="page-text" key={page}>
          <span className="chapter-label">
            {page === 0
              ? "BIR BOR EKAN..."
              : page === story.pages.length - 1
                ? "VA SHUNDAY QILIB..."
                : "SARGUZASHT DAVOM ETADI"}
          </span>
          <p aria-live="polite">{story.pages[page].text}</p>
          <span className="page-flourish" aria-hidden="true">
            ❧
          </span>
          <span className="page-number">{page + 1}</span>
        </div>
      </article>
      <nav className="reader-navigation" aria-label="Sahifa boshqaruvi">
        <button
          className="reader-prev"
          onClick={() => changePage(-1)}
          disabled={page === 0}
        >
          <ChevronLeft size={20} />
          <span>Oldingi</span>
        </button>
        <div className="reading-status">
          <span>
            {page + 1} <i>/ {story.pages.length} sahifa</i>
          </span>
          <progress
            max={story.pages.length}
            value={page + 1}
            aria-label="O‘qish jarayoni"
          />
        </div>
        {page === story.pages.length - 1 ? (
          <button className="button" onClick={finish}>
            Yakunlash <Check size={19} />
          </button>
        ) : (
          <button className="button" onClick={() => changePage(1)}>
            Keyingi <ChevronRight size={20} />
          </button>
        )}
      </nav>
      <div className="reader-bottom">
        <a href="#/" aria-label="Kutubxonaga qaytish">
          <Home size={15} />
        </a>
        <span>Shoshilma. Bu olam seniki.</span>
        <span className="keyboard-tip">← → bilan sahifala</span>
      </div>
    </main>
  );
}
