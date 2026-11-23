import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  MessageCircleQuestion,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass } from "../../design-system/Button";
import { PageIntro } from "../../design-system/PageIntro";
import { ProgressBar } from "../../design-system/ProgressBar";
import { generalQuiz, stories } from "../../content";
import { useProgress } from "../../lib/context";
import styles from "./QuizLibraryPage.module.css";

export function QuizLibraryPage() {
  const { progress } = useProgress();
  const completed = stories.filter(
    (story) => progress.reading[story.id]?.completedAt,
  );
  const solved = completed.filter((story) => progress.quizzes[story.id]).length;
  const generalBest = progress.quizzes.general;

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow="QIZIQISH — KASHFIYOTNING BOSHI"
        title="Qani, bir o‘ylab ko‘ramiz!"
        description="Shoshilish shart emas. Javobni bilmasang, birga o‘rganamiz."
        actions={
          <span className={styles.stat}>
            <CheckCircle2 size={16} />
            {solved} / {stories.length} kitob savoli yechilgan
          </span>
        }
      />

      <section className={styles.general} aria-labelledby="general-quiz-title">
        <span className={styles.generalIcon}>
          <Lightbulb size={34} strokeWidth={1.5} />
        </span>
        <div className={styles.generalBody}>
          <span className={styles.eyebrow}>BARCHA UCHUN OCHIQ</span>
          <h2 id="general-quiz-title">Atrofimizdagi ajoyib olam</h2>
          <p>Tabiat, do‘stlik va bizni o‘rab turgan dunyo haqida 3 ta savol.</p>
          <ProgressBar
            value={generalBest?.score ?? 0}
            max={generalQuiz.length}
            label="Umumiy savollar natijasi"
            className={styles.generalProgress}
          />
          <span className={styles.generalMeta}>
            {generalBest
              ? `Eng yaxshi natija: ${generalBest.score} / ${generalQuiz.length}`
              : "Hali boshlanmagan"}
          </span>
        </div>
        <Link
          to="/quiz/general"
          className={buttonClass({ size: "lg" })}
        >
          <span>{generalBest ? "Yana sinash" : "Boshlash"}</span>
          <ArrowRight size={19} />
        </Link>
      </section>

      <section className={styles.books} aria-labelledby="book-quizzes-title">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="book-quizzes-title">O‘qigan kitoblarim</h2>
            <p>Har bir hikoyaning o‘z savollari bor.</p>
          </div>
          <span className={styles.count}>{completed.length} ta ochilgan</span>
        </div>

        {completed.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <BookOpen size={30} />
            </span>
            <div>
              <h3>Savollar hikoyadan keyin ochiladi</h3>
              <p>
                Biror kitobni o‘qib tugatsang, uning savollari shu yerda paydo
                bo‘ladi. Xohlasang, avval umumiy savollarni sinab ko‘r.
              </p>
            </div>
            <div className={styles.emptyActions}>
              <Link to="/" className={buttonClass({ size: "lg" })}>
                <BookOpen size={19} />
                <span>Hikoya tanlash</span>
              </Link>
              <Link
                to="/quiz/general"
                className={buttonClass({ variant: "secondary", size: "lg" })}
              >
                Umumiy savollar
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {completed.map((story) => {
              const result = progress.quizzes[story.id];
              return (
                <Link
                  key={story.id}
                  to={`/quiz/${story.id}`}
                  className={styles.card}
                >
                  <img
                    src={story.cover}
                    alt=""
                    className={styles.cardArt}
                    loading="lazy"
                  />
                  <span className={styles.cardBody}>
                    <span className={styles.cardTop}>
                      <span className={styles.cardLabel}>
                        {story.quiz.length} ta savol
                      </span>
                      {result && (
                        <span className={styles.resultBadge}>
                          <Trophy size={14} />
                          {result.score} / {story.quiz.length}
                        </span>
                      )}
                    </span>
                    <strong>{story.title}</strong>
                    <span className={styles.cardNote}>
                      {result
                        ? "Yana urinib, natijani yaxshilashing mumkin."
                        : "Tanish voqealar, qiziqarli savollar."}
                    </span>
                    <span className={styles.cardAction}>
                      <MessageCircleQuestion size={18} />
                      {result ? "Qayta yechish" : "Savollarni ochish"}
                      <ArrowRight size={17} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <p className={styles.note}>
        <Sparkles size={16} />
        Har bir savol — yangi kashfiyot. Xato qilish ham o‘rganishning bir
        qismi.
      </p>
    </div>
  );
}
