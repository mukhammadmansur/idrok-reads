import { useState } from "react";
import { ArrowRight, BookOpen, Check, Search, Sparkles, X } from "lucide-react";
import { ThemePreview } from "./ThemeVisual";
import { stories, themes } from "../data/stories";
import { useProgress } from "../lib/context";
import { Art, EmptyState, SectionTitle, StoryCard } from "./ui";
export default function Home() {
  const { progress } = useProgress();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Barchasi");
  const featured = stories[0];
  const reading = stories.find(
    (s) => progress.reading[s.id] && !progress.reading[s.id].completedAt,
  );
  const finished = Object.values(progress.reading).filter(
    (r) => r.completedAt,
  ).length;
  const filtered = stories.filter(
    (s) =>
      (category === "Barchasi" || s.category === category) &&
      `${s.title} ${s.subtitle}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="page home-page">
      <div className="page-intro">
        <div>
          <div className="greeting">
            <span /> TASAVVURINGGA QANOT BER
          </div>
          <h1>
            Katta olamlar,
            <br className="mobile-only" /> kichik sahifalarda
            <span className="title-star">✳</span>
          </h1>
          <p>Bir hikoya tanla. Yangi sarguzashtingni boshla.</p>
        </div>
        <span className="intro-doodle" aria-hidden="true">
          ✧
        </span>
      </div>
      <section className="hero" aria-labelledby="featured-title">
        <div className="hero-copy">
          <span className="feature-tag">
            <Sparkles size={14} /> HAFTANING HIKOYASI
          </span>
          <h2 id="featured-title">
            Bir maktub.
            <br />
            Mingta <em>mo‘jiza.</em>
          </h2>
          <p>
            Kichkina tulki, olisdagi Oy va do‘stlikka to‘la bir sarguzasht. Timo
            bilan tanishishga tayyormisan?
          </p>
          <a href={`#/story/${featured.slug}`} className="button button-cream">
            Hikoyani kashf et <ArrowRight size={18} />
          </a>
          <div className="hero-meta">
            <span>
              <BookOpen size={15} /> 8 sahifa
            </span>
            <span className="meta-dot" />
            <span>6 daqiqa sehr</span>
          </div>
        </div>
        <div className="hero-visual">
          <Art
            src={featured.cover}
            alt="Tulki Timo yulduzli o‘rmonda Oyga yozgan maktubini ushlab turibdi"
          />
          <span className="hero-orbit orbit-one" />
          <span className="hero-orbit orbit-two" />
          <span className="illustration-caption">
            TASAVVUR QIL. HAMMASI MUMKIN.
          </span>
        </div>
        <span className="hero-number" aria-hidden="true">
          01 / 03
        </span>
      </section>
      {reading && (
        <a className="continue-card" href={`#/read/${reading.slug}`}>
          <Art src={reading.cover} alt="" />
          <div>
            <span className="eyebrow">SENI KUTAYOTGAN HIKOYA</span>
            <h3>{reading.title}</h3>
            <span>
              {progress.reading[reading.id].page + 1} / {reading.pages.length}{" "}
              sahifa
            </span>
          </div>
          <span className="continue-action">
            Davom et <ArrowRight size={19} />
          </span>
        </a>
      )}
      <section className="library-section" aria-labelledby="library-title">
        <SectionTitle
          id="library-title"
          title="Bugun nima o‘qiymiz?"
          action={
            <span className="section-count">
              {stories.length} ta original hikoya <span>↙</span>
            </span>
          }
        />
        <div className="library-toolbar">
          <div className="filter-tabs" aria-label="Hikoya turi">
            {["Barchasi", "Do‘stlik", "Sarguzasht", "Tabiat"].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={category === c ? "filter active" : "filter"}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Hikoya qidirish"
              placeholder="Hikoya izlash..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                aria-label="Qidiruvni tozalash"
                onClick={() => setQuery("")}
              >
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        {filtered.length ? (
          <div className="story-grid">
            {filtered.map((s) => (
              <StoryCard key={s.id} story={s} index={stories.indexOf(s)} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search />}
            title="Bu hikoya hali topilmadi"
            description="Boshqa nom bilan izlab ko‘r yoki barcha hikoyalarni och."
            action={
              <button
                className="button"
                onClick={() => {
                  setQuery("");
                  setCategory("Barchasi");
                }}
              >
                Barchasini ko‘rish
              </button>
            }
          />
        )}
      </section>
      <section className="world-section">
        <SectionTitle
          eyebrow="BITTA HIKOYA. TO‘RT XIL KAYFIYAT."
          title="O‘z olamingni tanla"
          action={
            <span className="world-hint">
              Kitob ichida almashtirish mumkin <ArrowUpRightSmall />
            </span>
          }
        />
        <div className="world-grid">
          {themes.map((t) => (
            <a
              href={`#/story/${featured.slug}?theme=${t.id}`}
              key={t.id}
              className={`world-card theme-preview-${t.id}`}
            >
              <ThemePreview theme={t.id} />
              <div className="world-caption">
                <span>
                  <strong>{t.label}</strong>
                  <small>{t.description}</small>
                </span>
                <ArrowRight size={17} />
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="bottom-invitation">
        <span className="invitation-icon">
          <Check size={26} />
        </span>
        <div>
          <h3>
            {finished
              ? "Har bir sahifa — yangi yutuq!"
              : "Katta sayohat birinchi sahifadan boshlanadi."}
          </h3>
          <p>
            {finished
              ? `${finished} ta hikoyani tugatding. Navbatdagi sarguzasht seni kutmoqda.`
              : "Har kuni ozgina mutolaa. Har kuni yangi kashfiyot."}
          </p>
        </div>
        <a href="#/rewards">
          Mening yutuqlarim <ArrowRight size={17} />
        </a>
      </section>
    </div>
  );
}
function ArrowUpRightSmall() {
  return <span aria-hidden="true">↗</span>;
}
