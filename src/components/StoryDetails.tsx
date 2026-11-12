import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect } from "react";
import { themes } from "../data/stories";
import type { Story } from "../data/types";
import { navigate, useProgress } from "../lib/context";
import { Art } from "./ui";
import { ThemeGlyph } from "./ThemeVisual";
export default function StoryDetails({
  story,
  initialTheme,
}: {
  story: Story;
  initialTheme?: string;
}) {
  const { progress, update } = useProgress();
  const theme = progress.theme;
  useEffect(() => {
    const requested = themes.find((t) => t.id === initialTheme)?.id;
    if (requested)
      update((p) => (p.theme === requested ? p : { ...p, theme: requested }));
  }, [initialTheme, update]);
  const record = progress.reading[story.id];
  const start = () => {
    update((p) => ({
      ...p,
      reading: record?.completedAt
        ? { ...p.reading, [story.id]: { ...p.reading[story.id], page: 0 } }
        : p.reading,
    }));
    navigate(`/read/${story.slug}`);
  };
  return (
    <div className="page details-page story-ready">
      <a href="#/" className="back-link">
        <ArrowLeft size={18} /> Kutubxonaga qaytish
      </a>
      <div className="ready-panel">
        <div className="ready-cover">
          <div className="detail-art">
            <Art src={story.cover} alt={story.subtitle} />
            <span className="art-label">IQRO ORIGINAL HIKOYA</span>
          </div>
          <span className="ready-cover-shadow" />
        </div>
        <div className="ready-copy">
          <span className="eyebrow">
            {story.category} · {story.age.join("–")} yosh
          </span>
          <h1>{story.title}</h1>
          <p className="ready-description">{story.description}</p>
          <div className="detail-meta">
            <span>
              <Clock3 size={17} /> {story.minutes} daqiqa
            </span>
            <span>
              <BookOpen size={17} /> {story.pages.length} sahifa
            </span>
          </div>
          {record?.completedAt ? (
            <div className="ready-completed">
              <span>
                <Check size={18} /> Bu kitobni o‘qib bo‘lgansan!
              </span>
              <p>Multfilm ko‘ramizmi yoki yana o‘qiymizmi?</p>
            </div>
          ) : record ? (
            <p className="ready-resume">
              {record.page + 1}-sahifada to‘xtaganding. Davom etamizmi?
            </p>
          ) : (
            <p className="ready-invitation">
              Olamni tanla. Keyin kitobni ochamiz!
            </p>
          )}
          <fieldset className="theme-field">
            <legend>O‘qish olami</legend>
            <div className="theme-options">
              {themes
                .filter((t) => story.themes.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-choice theme-preview-${t.id} ${theme === t.id ? "chosen" : ""}`}
                    onClick={() => {
                      update((p) => ({ ...p, theme: t.id }));
                      window.history.replaceState(
                        null,
                        "",
                        `${location.pathname}${location.search}#/story/${story.slug}`,
                      );
                    }}
                    aria-pressed={theme === t.id}
                    aria-label={t.name}
                  >
                    <span>
                      <ThemeGlyph theme={t.id} />
                    </span>
                    <strong>{t.label}</strong>
                    {theme === t.id && <Check size={14} />}
                  </button>
                ))}
            </div>
          </fieldset>
          <div className="ready-actions">
            {record?.completedAt && (
              <a className="button" href={`#/completed/${story.slug}`}>
                <Play size={19} /> Videoni ko‘rish
              </a>
            )}
            <button
              className={
                record?.completedAt ? "button secondary-button" : "button"
              }
              onClick={start}
            >
              {record?.completedAt ? (
                <RotateCcw size={18} />
              ) : (
                <BookOpen size={18} />
              )}
              {record?.completedAt
                ? "Yana o‘qish"
                : record
                  ? "O‘qishni davom ettir"
                  : "O‘qishni boshlash"}
              <ArrowRight size={18} />
            </button>
          </div>
          <p className="ready-small">Shoshilmay o‘qi. Rasmlarni tomosha qil.</p>
        </div>
      </div>
    </div>
  );
}
