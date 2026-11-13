import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { generalQuiz, stories } from "../data/stories";
import type { Question } from "../data/types";
import { useProgress } from "../lib/context";
import { Art, EmptyState, SectionTitle } from "./ui";
export function QuizLibrary() {
  const { progress } = useProgress();
  const [tab, setTab] = useState("books");
  const completed = stories.filter((s) => progress.reading[s.id]?.completedAt);
  return (
    <div className="page quiz-library">
      <div className="page-intro">
        <div className="greeting">
          <span /> QIZIQISH — KASHFIYOTNING BOSHI
        </div>
        <h1>Qani, bir o‘ylab ko‘ramiz!</h1>
        <p>Bilimingni sinab ko‘r. Har bir savol — yangi kashfiyot.</p>
      </div>
      <div className="quiz-banner">
        <span className="quiz-banner-icon">
          <HelpCircle size={48} strokeWidth={1.3} />
        </span>
        <div>
          <span className="eyebrow">IMTIHON EMAS, QIZIQARLI O‘YIN</span>
          <h2>O‘ylashdan zavq ol.</h2>
          <p>Shoshilish shart emas. Javobni bilmasang, birga o‘rganamiz.</p>
        </div>
        <span className="quiz-doodle" aria-hidden="true">
          ?
        </span>
      </div>
      <div className="quiz-tabs" role="group" aria-label="Savollar yo‘nalishi">
        <button
          className={tab === "books" ? "active" : ""}
          onClick={() => setTab("books")}
          aria-pressed={tab === "books"}
        >
          <BookOpen size={19} /> O‘qigan kitoblarim{" "}
          <span>{completed.length}</span>
        </button>
        <button
          className={tab === "general" ? "active" : ""}
          onClick={() => setTab("general")}
          aria-pressed={tab === "general"}
        >
          <Lightbulb size={19} /> Umumiy savollar
        </button>
      </div>
      {tab === "books" ? (
        <section>
          <SectionTitle title="Hikoyalar yodingdami?" />
          {completed.length ? (
            <div className="quiz-book-grid">
              {completed.map((s) => (
                <a
                  key={s.id}
                  className="quiz-book-card"
                  href={`#/quiz/${s.id}`}
                >
                  <Art src={s.cover} alt={s.subtitle} />
                  <div>
                    <span className="eyebrow">{s.quiz.length} TA SAVOL</span>
                    <h3>{s.title}</h3>
                    <p>
                      {progress.quizzes[s.id]
                        ? `Eng yaxshi natija: ${progress.quizzes[s.id].score} / ${s.quiz.length}`
                        : "Tanish voqealar, qiziqarli savollar"}
                    </p>
                    <span className="text-link">
                      Boshlaymizmi? <ArrowRight size={17} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="Har bir hikoyaning o‘z savoli bor"
              description="Biror kitobni o‘qib tugatsang, uning savollari shu yerda paydo bo‘ladi. Hozircha umumiy savollarni ham sinab ko‘rishing mumkin."
              action={
                <>
                  <a href="#/" className="button">
                    Hikoya tanlash <ArrowRight size={18} />
                  </a>
                  <button
                    className="text-link"
                    onClick={() => setTab("general")}
                  >
                    Umumiy savollarga o‘tish
                  </button>
                </>
              }
            />
          )}
        </section>
      ) : (
        <section>
          <SectionTitle title="Atrofimizdagi ajoyib olam" />
          <a className="general-quiz-card" href="#/quiz/general">
            <div className="general-illustration">
              <Lightbulb size={75} strokeWidth={1.1} />
              <span>✧</span>
            </div>
            <div>
              <span className="eyebrow">3 TA SAVOL · BARCHA UCHUN</span>
              <h2>Kichik kashfiyotchilar</h2>
              <p>Tabiat, do‘stlik va bizni o‘rab turgan olam haqida.</p>
              <span className="button">
                Savollarni ochish <ArrowRight size={18} />
              </span>
            </div>
          </a>
        </section>
      )}
    </div>
  );
}
export function QuizSession({
  id,
  questions,
  title,
}: {
  id: string;
  questions: Question[];
  title: string;
}) {
  const { progress, answerQuiz } = useProgress();
  const previous = progress.quizzes[id];
  const [result, setResult] = useState(!!previous);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [thisScore, setThisScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const q = questions[page];
  const submit = () => {
    if (selected === null) return;
    if (!checked) {
      setChecked(true);
      return;
    }
    const newScore = score + (selected === q.answer ? 1 : 0);
    if (page === questions.length - 1) {
      setThisScore(newScore);
      answerQuiz(id, [...answers, selected]);
      setResult(true);
    } else {
      setAnswers([...answers, selected]);
      setScore(newScore);
      setPage(page + 1);
      setSelected(null);
      setChecked(false);
    }
  };
  const retry = () => {
    setPage(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setAnswers([]);
    setThisScore(null);
    setResult(false);
  };
  return (
    <div className="page quiz-session">
      <a href="#/quiz" className="back-link">
        <ArrowLeft size={18} /> Savol-javobga qaytish
      </a>
      {result ? (
        <div className="quiz-result">
          <span className="completion-medal">
            <Trophy size={43} />
          </span>
          <span className="eyebrow">BILIM SARI YANA BIR QADAM</span>
          <h1>
            {(thisScore ?? previous?.score) === questions.length
              ? "Ajoyib, bilimdon!"
              : "Yaxshi harakat qilding!"}
          </h1>
          <p>{title}</p>
          <div className="score-display">
            {thisScore ?? previous?.score}
            <span> / {questions.length}</span>
          </div>
          <p>
            {thisScore === null
              ? "Bu sening saqlangan eng yaxshi natijang."
              : "Har bir savoldan bir nimani o‘rganding. Eng muhimi shu!"}
            <br />
            Yana urinib ko‘rsang ham, eng yaxshi natijang saqlanadi.
          </p>
          <button className="button" onClick={retry}>
            <RotateCcw size={18} /> Yana sinab ko‘rish
          </button>
          <a href="#/quiz" className="text-link">
            Boshqa savollarni ko‘rish <ArrowRight size={17} />
          </a>
        </div>
      ) : (
        <div className="question-panel">
          <div className="question-topline">
            <span>{title}</span>
            <strong>
              {page + 1} / {questions.length}
            </strong>
          </div>
          <div className="question-steps">
            {questions.map((_, i) => (
              <span key={i} className={i <= page ? "filled" : ""} />
            ))}
          </div>
          <span className="question-icon">
            <Sparkles size={26} />
          </span>
          <h1>{q.prompt}</h1>
          <fieldset className="answers">
            <legend className="sr-only">Javobni tanlang</legend>
            {q.options.map((option, i) => (
              <label
                key={option}
                className={`answer ${selected === i ? "selected" : ""} ${checked && i === q.answer ? "correct" : ""}`}
              >
                <input
                  type="radio"
                  name={q.id}
                  value={i}
                  checked={selected === i}
                  disabled={checked}
                  onChange={() => setSelected(i)}
                />
                <span className="answer-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <strong>{option}</strong>
                {checked && i === q.answer ? (
                  <CheckCircle2 size={21} />
                ) : selected === i ? (
                  <Check size={21} />
                ) : null}
              </label>
            ))}
          </fieldset>
          {checked && (
            <div className="answer-feedback" role="status">
              <Lightbulb size={22} />
              <p>
                <strong>
                  {selected === q.answer
                    ? "To‘ppa-to‘g‘ri!"
                    : "Birga eslab olamiz."}
                </strong>{" "}
                {q.explanation}
              </p>
            </div>
          )}
          <button
            className="button answer-submit"
            disabled={selected === null}
            onClick={submit}
          >
            {!checked
              ? "Javobni tekshirish"
              : page === questions.length - 1
                ? "Natijani ko‘rish"
                : "Keyingi savol"}
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
export default function Quiz({ id }: { id?: string }) {
  const { progress } = useProgress();
  if (!id) return <QuizLibrary />;
  if (id === "general")
    return (
      <QuizSession
        id={id}
        questions={generalQuiz}
        title="Kichik kashfiyotchilar"
      />
    );
  const story = stories.find((s) => s.id === id);
  if (!story)
    return (
      <div className="page">
        <EmptyState
          icon={<HelpCircle />}
          title="Savollar topilmadi"
          description="Boshqa savollarni tanlab ko‘r."
          action={
            <a href="#/quiz" className="button">
              Savol-javobga qaytish
            </a>
          }
        />
      </div>
    );
  if (!progress.reading[id]?.completedAt)
    return (
      <div className="page">
        <EmptyState
          icon={<BookOpen />}
          title="Avval sarguzashtni kashf etamiz"
          description="Hikoyani o‘qib bo‘lgach, uning savollari ochiladi."
          action={
            <a href={`#/story/${story.slug}`} className="button">
              Hikoyani ochish <ArrowRight size={18} />
            </a>
          }
        />
      </div>
    );
  return (
    <QuizSession key={id} id={id} questions={story.quiz} title={story.title} />
  );
}
