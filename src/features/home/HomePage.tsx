import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { stories } from "../../content/stories";
import { useProgress } from "../../lib/context";
import { Avatar } from "../../design-system/Avatar";
import { ProgressBar } from "../../design-system/ProgressBar";
import { AhaMomentBanner } from "../onboarding/AhaMomentBanner";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { user, children: profileList, selectedChildId, progress } = useProgress();

  const child = profileList.find((p) => p.id === selectedChildId);
  const childName = child?.name || "Kitobxon";
  const childAvatar = child?.avatar || "lion";

  // In-progress story
  const inProgressStory = stories
    .filter(
      (story) =>
        progress.reading[story.id] && !progress.reading[story.id].completedAt,
    )
    .sort(
      (a, b) =>
        Date.parse(progress.reading[b.id].startedAt) -
        Date.parse(progress.reading[a.id].startedAt),
    )[0];

  // Stats
  const completedCount = stories.filter(
    (story) => progress.reading[story.id]?.completedAt,
  ).length;
  const badgesCount = completedCount;

  // Featured spotlight story (first non-completed story or first story)
  const featuredStory =
    stories.find((s) => !progress.reading[s.id]?.completedAt) || stories[0];

  return (
    <div className={styles.page}>
      {/* 1. GREETING HEADER */}
      <header className={styles.greetingWrap}>
        <div className={styles.greetingLeft}>
          <Avatar avatar={childAvatar} size={58} />
          <div className={styles.greetingText}>
            <h1>Salom, {childName}! 🌟</h1>
            <p>Bugun qaysi sehrli olamga sayohat qilamiz?</p>
          </div>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.statBadge}>
            <Sparkles size={15} style={{ color: "#d97706" }} />
            {completedCount} ta tugatilgan
          </span>
          <span className={styles.statBadge}>
            <Trophy size={15} style={{ color: "#2563eb" }} />
            {badgesCount} ta nishon
          </span>
        </div>
      </header>

      {/* Post-story Aha-moment prompt for unauthenticated families */}
      {!user && completedCount > 0 && (
        <AhaMomentBanner childName={childName} />
      )}

      {/* 2. CONTINUE READING (IF ACTIVE) */}
      {inProgressStory && (
        <section className={styles.continueSection} aria-label="O‘qishni davom ettirish">
          <div className={styles.shelfHeader}>
            <h2 className={styles.shelfTitle}>
              <Flame size={20} style={{ color: "#ea580c" }} />
              O‘qishni davom ettiramiz!
            </h2>
          </div>

          <Link
            to={`/read/${inProgressStory.slug}`}
            className={styles.continueCard}
          >
            <img
              src={inProgressStory.cover}
              alt=""
              className={styles.continueCover}
            />
            <div className={styles.continueBody}>
              <span className={styles.continueEyebrow}>QAYTIB KELGANING BILAN!</span>
              <h3 className={styles.continueTitle}>{inProgressStory.title}</h3>
              <div className={styles.continueProgressWrap}>
                <ProgressBar
                  value={progress.reading[inProgressStory.id].page + 1}
                  max={inProgressStory.pages.length}
                  label={`${inProgressStory.title} jarayoni`}
                />
              </div>
            </div>
            <span className={styles.continueActionBtn}>
              Davom ettirish <ArrowRight size={17} />
            </span>
          </Link>
        </section>
      )}

      {/* 3. HERO FEATURED STORY */}
      {featuredStory && (
        <Link
          to={`/story/${featuredStory.slug}`}
          className={styles.heroSpotlight}
          aria-label={`Kunning ertagi: ${featuredStory.title}`}
        >
          <div className={styles.heroArtWrap}>
            <span className={styles.heroBadge}>
              <Sparkles size={13} />
              Kunning ertagi
            </span>
            <img
              src={featuredStory.cover}
              alt={featuredStory.title}
              className={styles.heroArt}
            />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroMeta}>
              <span>⏱ {featuredStory.minutes} daqiqa</span>
              <span>•</span>
              <span>🎯 {featuredStory.age[0]}–{featuredStory.age[1]} yosh</span>
              <span>•</span>
              <span>{featuredStory.category}</span>
            </div>
            <h2 className={styles.heroTitle}>{featuredStory.title}</h2>
            <p className={styles.heroSubtitle}>{featuredStory.description}</p>
            <span className={styles.heroCta}>
              <Play size={18} fill="currentColor" />
              Birga o‘qiymiz!
            </span>
          </div>
        </Link>
      )}

      {/* 4. STORY SHELF: POPULAR STORIES */}
      <section className={styles.shelf} aria-label="Ertaklar olami">
        <div className={styles.shelfHeader}>
          <h2 className={styles.shelfTitle}>
            <Compass size={20} style={{ color: "var(--accent)" }} />
            Sehrli sarguzashtlar
          </h2>
          <Link to="/library" className={styles.seeAllLink}>
            Barchasini ko‘rish <ArrowRight size={15} />
          </Link>
        </div>

        <div className={styles.shelfGrid}>
          {stories.map((story) => {
            const isCompleted = !!progress.reading[story.id]?.completedAt;
            const isStarted =
              !isCompleted && !!progress.reading[story.id];

            return (
              <Link
                key={story.id}
                to={`/story/${story.slug}`}
                className={styles.storyCard}
              >
                <div className={styles.cardCoverWrap}>
                  <img
                    src={story.cover}
                    alt=""
                    className={styles.cardCover}
                  />
                  <span className={styles.cardCategoryBadge}>
                    {story.category === "Do‘stlik"
                      ? "🤝 Do‘stlik"
                      : story.category === "Sarguzasht"
                        ? "🦁 Sarguzasht"
                        : "🌿 Tabiat"}
                  </span>
                  {isCompleted && (
                    <span className={styles.cardStatusBadge}>
                      Tugatilgan ✓
                    </span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{story.title}</h3>
                  <p className={styles.cardSubtitle}>{story.subtitle}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardMeta}>
                      <span>
                        <Clock size={13} style={{ display: "inline", marginRight: 3 }} />
                        {story.minutes} daq
                      </span>
                      <span>{story.pages.length} bet</span>
                    </div>

                    <span className={styles.cardAction}>
                      {isCompleted ? (
                        <>
                          <RotateCcw size={13} />
                          Yana
                        </>
                      ) : isStarted ? (
                        <>
                          <Play size={13} fill="currentColor" />
                          Davom
                        </>
                      ) : (
                        <>
                          <BookOpen size={13} />
                          O‘qish
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. INTERACTIVE QUIZ TEASER */}
      <section className={styles.quizTeaser} aria-label="Savol-javob">
        <div className={styles.quizTeaserLeft}>
          <div className={styles.quizIconBox}>
            <HelpCircle size={28} />
          </div>
          <div className={styles.quizTeaserText}>
            <h2>Zukko kitobxon viktorinasi!</h2>
            <p>
              Ertaklarni qanchalik eslab qolding? Savollarga javob ber va
              yulduzchalarni to‘pla!
            </p>
          </div>
        </div>
        <Link to="/quiz" className={styles.quizTeaserCta}>
          Savol-javobni boshlash <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
