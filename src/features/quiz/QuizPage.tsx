import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, buttonClass } from "../../design-system/Button";
import { generalQuiz, stories, storyById } from "../../content";
import type { Question } from "../../content";
import { useProgress } from "../../lib/context";
import { NotFoundPage } from "../../app/NotFoundPage";
import styles from "./QuizPage.module.css";

export function QuizPage() {
  const { id = "" } = useParams();
  const { progress, answerQuiz } = useProgress();
  const story = id === "general" ? undefined : storyById(id);
  const questions: Question[] | undefined =
    id === "general" ? generalQuiz : story?.quiz;
  const title =
    id === "general" ? "Kichik kashfiyotchilar" : (story?.title ?? "");

  if (id !== "general" && !story) return <NotFoundPage />;
  if (story && !progress.reading[story.id]?.completedAt)
    return <LockedQuiz story={story} />;

  return (
    <QuizRunner
      key={id}
      quizId={id}
      title={title}
      questions={questions!}
      best={progress.quizzes[id]?.score ?? null}
      onAnswer={answerQuiz}
    />
  );
}

function LockedQuiz({ story }: { story: (typeof stories)[number] }) {
  return (
    <div className={styles.page}>
      <Link to="/quiz" className={styles.back}>
        <ArrowLeft size={19} />
        Savol-javobga qaytish
      </Link>
      <div className={styles.stateCard}>
        <span className={styles.stateIcon}>
          <LockKeyhole size={30} />
        </span>
        <span className={styles.eyebrow}>
          SAVOLLAR HIKOYADAN KEYIN OCHILADI
        </span>
        <h1>Avval sarguzashtni kashf etamiz</h1>
        <p>
          «{story.title}»ni o‘qib tugatganingdan so‘ng uning savollari shu
          yerda paydo bo‘ladi.
        </p>
        <div className={styles.stateActions}>
          <Link
            to={`/story/${story.slug}`}
            className={buttonClass({ size: "lg" })}
          >
            <BookOpen size={19} />
            <span>Hikoyani ochish</span>
          </Link>
          <Link
            to="/quiz/general"
            className={buttonClass({ variant: "secondary", size: "lg" })}
          >
            Umumiy savollarni sinash
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuizRunner({
  quizId,
  title,
  questions,
  best,
  onAnswer,
}: {
  quizId: string;
  title: string;
  questions: Question[];
  best: number | null;
  onAnswer: (id: string, answers: number[]) => void;
}) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [needChoice, setNeedChoice] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = questions[page];
  const isLast = page === questions.length - 1;
  // The current checked choice counts until it is committed to `answers`.
  // After the last question it is already committed, so it must not repeat.
  const answered =
    !done && checked && selected !== null ? [...answers, selected] : answers;
  const score = answered.reduce(
    (total, answer, index) =>
      total + (answer === questions[index]?.answer ? 1 : 0),
    0,
  );

  const submit = () => {
    if (selected === null) {
      setNeedChoice(true);
      return;
    }
    if (!checked) {
      setChecked(true);
      return;
    }
    const next = [...answers, selected];
    setAnswers(next);
    if (isLast) {
      onAnswer(quizId, next);
      setDone(true);
    } else {
      setPage((value) => value + 1);
      setSelected(null);
      setChecked(false);
      setNeedChoice(false);
      requestAnimationFrame(() => heading.current?.focus());
    }
  };

  const retry = () => {
    setPage(0);
    setSelected(null);
    setChecked(false);
    setAnswers([]);
    setDone(false);
    setNeedChoice(false);
  };

  if (done)
    return (
      <div className={styles.page}>
        <Link to="/quiz" className={styles.back}>
          <ArrowLeft size={19} />
          Savol-javobga qaytish
        </Link>
        <div className={styles.result}>
          <span className={styles.medal}>
            <Trophy size={40} strokeWidth={1.5} />
          </span>
          <span className={styles.eyebrow}>NATIJA TAYYOR</span>
          <h1>
            {score === questions.length
              ? "Ajoyib, bilimdon!"
              : "Yaxshi harakat!"}
          </h1>
          <p>{title}</p>
          <div className={styles.score}>
            {score}
            <span> / {questions.length}</span>
          </div>
          <p className={styles.resultNote}>
            {score === questions.length
              ? "Barcha javob to‘g‘ri. Endi boshqa hikoya savollarini ham sinab ko‘r."
              : "Xato qilish ham o‘rganishning bir qismi. Tushuntirishlarni yana bir bor o‘qib ko‘r."}
          </p>
          {best !== null && best > score && (
            <p className={styles.bestNote}>
              Eng yaxshi natijang: {best} / {questions.length}
            </p>
          )}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={retry} icon={<RotateCcw size={19} />}>
              Yana sinab ko‘rish
            </Button>
            <Link
              to="/quiz"
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              Boshqa savollar
            </Link>
          </div>
          <Link to="/" className={styles.homeLink}>
            Kutubxonaga qaytish <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    );

  const correct = question.answer;

  return (
    <div className={styles.page}>
      <Link to="/quiz" className={styles.back}>
        <ArrowLeft size={19} />
        Savol-javobga qaytish
      </Link>

      <div className={styles.panel}>
        <div className={styles.panelTop}>
          <div className={styles.panelTitle}>
            <span>{title}</span>
            <strong>
              Savol {page + 1} / {questions.length}
            </strong>
          </div>
          {best !== null && (
            <span className={styles.bestBadge}>
              <Trophy size={14} />
              Eng yaxshi: {best}
            </span>
          )}
        </div>

        <div
          className={styles.steps}
          aria-hidden="true"
          data-count={questions.length}
        >
          {questions.map((_, index) => (
            <span
              key={index}
              className={
                index < page || (index === page && checked)
                  ? styles.stepDone
                  : index === page
                    ? styles.stepCurrent
                    : ""
              }
            />
          ))}
        </div>

        <span className={styles.questionIcon}>
          <Sparkles size={24} />
        </span>
        <h1 tabIndex={-1} ref={heading}>
          {question.prompt}
        </h1>

        <fieldset className={styles.options} disabled={checked}>
          <legend className="sr-only">Javobni tanla</legend>
          {question.options.map((option, index) => {
            const isCorrect = checked && index === correct;
            const isWrong = checked && index === selected && index !== correct;
            const isSelected = index === selected;
            return (
              <label
                key={option}
                className={[
                  styles.option,
                  isSelected ? styles.selected : "",
                  isCorrect ? styles.correct : "",
                  isWrong ? styles.wrong : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-state={
                  isCorrect ? "correct" : isWrong ? "wrong" : undefined
                }
              >
                <input
                  className="sr-only"
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => {
                    setSelected(index);
                    setNeedChoice(false);
                  }}
                />
                <span className={styles.letter}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={styles.optionText}>{option}</span>
                {isCorrect && (
                  <span className={styles.optionBadge}>
                    <CheckCircle2 size={20} />
                    To‘g‘ri javob
                  </span>
                )}
                {isWrong && (
                  <span className={styles.optionBadge}>
                    <XCircle size={20} />
                    Sen tanlagan javob
                  </span>
                )}
                {!checked && isSelected && <Check size={21} />}
              </label>
            );
          })}
        </fieldset>

        {checked && (
          <div className={styles.feedback} role="status">
            <Lightbulb size={22} />
            <p>
              <strong>
                {selected === correct
                  ? "To‘ppa-to‘g‘ri!"
                  : "Birga eslab olamiz."}
              </strong>{" "}
              {question.explanation}
            </p>
          </div>
        )}

        {needChoice && (
          <p className={styles.choiceHint} role="alert">
            Avval bitta javobni tanla.
          </p>
        )}

        <div className={styles.footer}>
          <Button size="lg" onClick={submit} full>
            <span>
              {!checked
                ? "Javobni tekshirish"
                : isLast
                  ? "Natijani ko‘rish"
                  : "Keyingi savol"}
            </span>
            <ArrowRight size={19} />
          </Button>
          <p className={styles.footerNote}>
            {checked
              ? "Tushuntirishni o‘qib, keyingi savolga o‘t."
              : "Shoshilma. O‘ylab javob ber."}
          </p>
        </div>
      </div>
    </div>
  );
}
