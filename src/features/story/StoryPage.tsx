import {
  ArrowLeft,
  BookOpen,
  Clock3,
  MessageCircleQuestion,
  Play,
  RotateCcw,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { buttonClass } from "../../design-system/Button";
import { storyBySlug } from "../../content";
import { useProgress } from "../../lib/context";
import { NotFoundPage } from "../../app/NotFoundPage";
import styles from "./StoryPage.module.css";

export function StoryPage() {
  const { slug } = useParams();
  const story = storyBySlug(slug);
  const { progress } = useProgress();
  if (!story) return <NotFoundPage />;

  const record = progress.reading[story.id];
  const completed = !!record?.completedAt;
  const started = !!record && !completed;
  const label = completed
    ? "Qayta o‘qish"
    : started
      ? "Davom etish"
      : "O‘qishni boshlash";
  const Icon = completed ? RotateCcw : Play;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        <ArrowLeft size={20} />
        Kutubxonaga qaytish
      </Link>

      <div className={styles.layout}>
        <div className={styles.coverWrap}>
          <div className={styles.coverInset}>
            <img
              src={story.cover}
              alt={`${story.title} muqovasi`}
              className={styles.cover}
            />
          </div>
          <span className={styles.ribbon}>{story.category}</span>
          {completed && (
            <span className={styles.completed}>O‘qib tugatilgan</span>
          )}
        </div>

        <div className={styles.detail}>
          <h1>{story.title}</h1>
          <p className={styles.subtitle}>{story.subtitle}</p>
          <p className={styles.description}>{story.description}</p>

          <div className={styles.meta}>
            <span>
              <Clock3 size={17} />
              {story.minutes} daqiqa
            </span>
            <span>
              <BookOpen size={17} />
              {story.pages.length} sahifa
            </span>
            <span>
              <Users size={17} />
              {story.age[0]}–{story.age[1]} yosh
            </span>
          </div>

          {started && (
            <p className={styles.resumeNote}>
              Sen {record.page + 1}-sahifada to‘xtagansan. Davom ettiramizmi?
            </p>
          )}

          <div className={styles.actions}>
            <Link
              to={`/read/${story.slug}`}
              className={buttonClass({ size: "lg", full: true })}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
            {completed && (
              <Link
                to={`/quiz/${story.id}`}
                className={buttonClass({
                  variant: "secondary",
                  size: "lg",
                  full: true,
                })}
              >
                <MessageCircleQuestion size={20} />
                <span>Savollarni yechish</span>
              </Link>
            )}
          </div>

          <div className={styles.about}>
            <h2>Bu hikoya haqida</h2>
            <p>
              {story.title} — {story.subtitle.toLocaleLowerCase()} haqidagi
              original hikoya. Har bir sahifada katta rasm va oson o‘qiladigan
              matn bor.
            </p>
            <p className={styles.reward}>
              Oxirigacha o‘qisang, «{story.reward}» nishoni ochiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
