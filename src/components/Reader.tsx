import { useCallback, useEffect, useRef, useState } from "react";
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
import { PageArtwork, PageText } from "./StoryPageContent";
import PaperTurn from "./PaperTurn";
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
  const touch = useRef<{ x: number; y: number } | null>(null);
  const surface = useRef<HTMLElement>(null);
  const turnLock = useRef(false);
  const [turn, setTurn] = useState<{
    target: number;
    direction: -1 | 1;
  } | null>(null);
  const theme = progress.theme;
  useEffect(() => {
    if (!completed) update((p) => recordPage(p, story.id, page));
  }, [page, story.id, completed, update]);
  const changePage = useCallback(
    (direction: number) => {
      if (turnLock.current || completed) return;
      const target = Math.max(
        0,
        Math.min(story.pages.length - 1, page + direction),
      );
      if (target === page) return;
      if (
        theme === "classic" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        turnLock.current = true;
        setTurn({ target, direction: direction > 0 ? 1 : -1 });
      } else setPage(target);
    },
    [page, story.pages.length, theme, completed],
  );
  const finishTurn = useCallback(() => {
    if (!turn) return;
    turnLock.current = false;
    setPage(turn.target);
    setTurn(null);
  }, [turn]);
  useEffect(() => {
    if (completed) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowThemes(false);
        return;
      }
      if (
        (e.target as HTMLElement).closest(
          "input,select,textarea,[contenteditable=true],.reader-theme-menu",
        )
      )
        return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (!e.repeat) changePage(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [changePage, completed]);
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
            disabled={!!turn}
            aria-pressed={large}
            onClick={() => setLarge(!large)}
          >
            Aa
          </button>
          <button
            className="icon-button"
            aria-label="O‘qish muhitini tanlash"
            disabled={!!turn}
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
              disabled={!!turn}
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
      <div className={`book-stage ${turn ? "is-turning" : ""}`}>
        <article
          ref={surface}
          className="book-page"
          aria-busy={!!turn}
          onTouchStart={(e) => {
            if (e.touches.length === 1)
              touch.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };
          }}
          onTouchEnd={(e) => {
            if (touch.current) {
              const dx = touch.current.x - e.changedTouches[0].clientX;
              const dy = touch.current.y - e.changedTouches[0].clientY;
              if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.2)
                changePage(dx > 0 ? 1 : -1);
            }
            touch.current = null;
          }}
          onTouchCancel={() => {
            touch.current = null;
          }}
        >
          <PageArtwork story={story} page={page} />
          <PageText key={page} story={story} page={page} />
          {theme === "classic" && (
            <>
              {page > 0 && (
                <button
                  className="page-corner page-corner-previous"
                  aria-label="Oldingi sahifani varaqlash"
                  onClick={() => changePage(-1)}
                  disabled={!!turn}
                />
              )}
              {page < story.pages.length - 1 && (
                <button
                  className="page-corner page-corner-next"
                  aria-label="Keyingi sahifani varaqlash"
                  onClick={() => changePage(1)}
                  disabled={!!turn}
                />
              )}
            </>
          )}
        </article>
        {turn && (
          <PaperTurn
            source={surface}
            story={story}
            target={turn.target}
            direction={turn.direction}
            onComplete={finishTurn}
          />
        )}
      </div>
      <nav className="reader-navigation" aria-label="Sahifa boshqaruvi">
        <button
          className="reader-prev"
          onClick={() => changePage(-1)}
          disabled={page === 0 || !!turn}
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
          <button className="button" onClick={finish} disabled={!!turn}>
            Yakunlash <Check size={19} />
          </button>
        ) : (
          <button
            className="button"
            onClick={() => changePage(1)}
            disabled={!!turn}
          >
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
