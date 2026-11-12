import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Sparkles,
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
  const selectTheme = (id: typeof theme) => {
    update((p) => ({ ...p, theme: id }));
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#/story/${story.slug}`,
    );
  };
  const record = progress.reading[story.id];
  const start = () => {
    update((p) => ({
      ...p,
      theme,
      reading: record?.completedAt
        ? { ...p.reading, [story.id]: { ...p.reading[story.id], page: 0 } }
        : p.reading,
    }));
    navigate(`/read/${story.slug}`);
  };
  return (
    <div className="page details-page">
      <a href="#/" className="back-link">
        <ArrowLeft size={18} /> Kutubxonaga qaytish
      </a>
      <div className="details-layout">
        <div className="detail-art">
          <Art src={story.cover} alt={story.subtitle} />
          <span className="art-label">IQRO ORIGINAL HIKOYA</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {story.category.toLocaleUpperCase()} HAQIDA HIKOYA
          </span>
          <h1>{story.title}</h1>
          <p className="detail-subtitle">{story.subtitle}</p>
          <p className="detail-description">{story.description}</p>
          <div className="detail-meta">
            <span>
              <Clock3 size={17} />
              {story.minutes} daqiqa
            </span>
            <span>
              <BookOpen size={17} />
              {story.pages.length} sahifa
            </span>
            <span>{story.age.join("–")} yosh</span>
          </div>
          <fieldset className="theme-field">
            <legend>Qaysi olamda o‘qiymiz?</legend>
            <p>Hikoya bir xil. Kayfiyatni esa o‘zing tanla.</p>
            <div className="theme-options">
              {themes
                .filter((t) => story.themes.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-choice theme-preview-${t.id} ${theme === t.id ? "chosen" : ""}`}
                    onClick={() => selectTheme(t.id)}
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
          <button className="button start-button" onClick={start}>
            {record && !record.completedAt
              ? "O‘qishni davom ettir"
              : record?.completedAt
                ? "Yana o‘qish"
                : "O‘qishni boshlash"}
            <ArrowRight size={19} />
          </button>
          {record && !record.completedAt && (
            <p className="resume-note">
              {record.page + 1}-sahifada to‘xtaganding. O‘sha yerdan davom
              etamiz.
            </p>
          )}
          <div className="detail-reward">
            <span>
              <Sparkles size={22} />
            </span>
            <p>
              Har bir tugatilgan hikoya —<br />
              <strong>yangi kashfiyot va esdalik nishoni.</strong>
            </p>
          </div>
        </div>
      </div>
      <section className="story-preview">
        <span className="eyebrow">BIRINCHI SAHIFADAN</span>
        <blockquote>“{story.pages[0].text}”</blockquote>
      </section>
    </div>
  );
}
