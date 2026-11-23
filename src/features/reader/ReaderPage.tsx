import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Medal,
  MessageCircleQuestion,
  RotateCcw,
  Pause,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, buttonClass } from "../../design-system/Button";
import { IconButton } from "../../design-system/IconButton";
import { ProgressBar } from "../../design-system/ProgressBar";
import { Sheet } from "../../design-system/Sheet";
import { stories, storyBySlug, themes } from "../../content";
import { storyVideo } from "../../content/videos";
import { api, type StoryVideoMap } from "../../lib/api";
import { useProgress } from "../../lib/context";
import { completeStory, recordPage } from "../../lib/progress";
import { useReadingActivity } from "../../lib/useReadingActivity";
import { ThemeGlyph } from "../theme/ThemeGlyph";
import { NotFoundPage } from "../../app/NotFoundPage";
import { StoryBook, type StoryBookHandle } from "./StoryBook";
import { StoryVideoSection } from "./StoryVideoSection";
import styles from "./ReaderPage.module.css";

const sizes = ["Oddiy", "Katta", "Juda katta"];

export function ReaderPage() {
  const { slug } = useParams();
  const story = storyBySlug(slug);
  if (!story) return <NotFoundPage />;

  return <Reader key={story.id} story={story} />;
}

function Reader({
  story,
}: {
  story: NonNullable<ReturnType<typeof storyBySlug>>;
}) {
  const {
    progress,
    update,
    children: profiles,
    selectedChildId,
  } = useProgress();
  const record = progress.reading[story.id];
  const [page, setPage] = useState(() => {
    const start = record?.completedAt ? 0 : (record?.page ?? 0);
    return Math.min(Math.max(0, start), story.pages.length - 1);
  });
  const [textSize, setTextSize] = useState(0);
  const [motion, setMotion] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechNote, setSpeechNote] = useState("");
  const [turning, setTurning] = useState(false);
  const [videos, setVideos] = useState<StoryVideoMap>({});
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState("");
  const videoRequest = useRef({ value: 0 });
  const book = useRef<StoryBookHandle>(null);
  const speech = useRef<SpeechSynthesisUtterance | null>(null);
  const uzbekVoice = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const child = profiles.find((profile) => profile.id === selectedChildId);
  const current = story.pages[page];
  const last = page === story.pages.length - 1;
  const nextStory = stories[(stories.indexOf(story) + 1) % stories.length];
  const video = storyVideo(story, videos);

  useReadingActivity(story.id, finished);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMotion(!preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  const loadVideos = useCallback(async () => {
    const request = ++videoRequest.current.value;
    setVideoLoading(true);
    setVideoError("");
    try {
      const result = await api.videos();
      if (request === videoRequest.current.value) setVideos(result.videos);
    } catch {
      if (request === videoRequest.current.value)
        setVideoError(
          "Video sozlamalari yuklanmadi. Qayta urinib ko‘rishing yoki savol-javobga o‘tishing mumkin.",
        );
    } finally {
      if (request === videoRequest.current.value) setVideoLoading(false);
    }
  }, []);
  useEffect(() => {
    const tracker = videoRequest.current;
    void loadVideos();
    return () => {
      tracker.value++;
    };
  }, [loadVideos]);

  useEffect(() => {
    if (!finished) update((value) => recordPage(value, story.id, page));
  }, [finished, page, story.id, update]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const discoverVoice = () => {
      uzbekVoice.current = window.speechSynthesis
        .getVoices()
        .find((voice) => /^uz(?:[-_]|$)/i.test(voice.lang));
    };
    discoverVoice();
    window.speechSynthesis.addEventListener("voiceschanged", discoverVoice);
    return () =>
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        discoverVoice,
      );
  }, []);

  const stopSpeech = useCallback(() => {
    const active = speech.current;
    speech.current = null;
    if (active) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => {
    stopSpeech();
  }, [page, stopSpeech]);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  const onTurningChange = useCallback(
    (active: boolean) => {
      if (active) stopSpeech();
      setTurning(active);
    },
    [stopSpeech],
  );

  const turnPage = useCallback((direction: -1 | 1) => {
    book.current?.turn(direction);
  }, []);

  useEffect(() => {
    if (settingsOpen || finished) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        turnPage(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        turnPage(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, settingsOpen, turnPage]);

  const toggleSpeech = () => {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      setSpeechNote(
        "Bu qurilmada ovozli o‘qish mavjud emas. Hikoyani o‘zing o‘qishing mumkin.",
      );
      return;
    }
    if (speaking) {
      stopSpeech();
      return;
    }
    const voice = uzbekVoice.current;
    if (!voice) {
      setSpeechNote(
        "Bu qurilmada o‘zbekcha ovoz topilmadi. Tinglash uchun qurilma sozlamalarida o‘zbekcha ovoz kerak.",
      );
      return;
    }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.92;
    utterance.onend = () => {
      if (speech.current !== utterance) return;
      speech.current = null;
      setSpeaking(false);
    };
    const failed = () => {
      if (speech.current !== utterance) return;
      speech.current = null;
      setSpeaking(false);
      setSpeechNote(
        "Ovozli o‘qish ishga tushmadi. Qayta urinib ko‘r yoki hikoyani o‘zing o‘qi.",
      );
    };
    utterance.onerror = failed;
    speech.current = utterance;
    setSpeechNote("");
    setSpeaking(true);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      failed();
    }
  };

  const finish = () => {
    stopSpeech();
    update((value) => completeStory(value, story.id, story.pages.length - 1));
    setFinished(true);
  };

  if (finished)
    return (
      <main className={styles.done}>
        <div className={styles.doneLayout}>
          <div className={styles.doneHero}>
            <span className={styles.medal}>
              <Medal size={48} strokeWidth={1.5} />
            </span>
            <span className={styles.doneEyebrow}>HIKOYA TUGADI</span>
            <h1>Barakalla{child ? `, ${child.name}` : ""}!</h1>
            <p className={styles.doneLead}>
              «{story.title}»ni o‘qib tugatding. «{story.reward}» nishoni endi
              seniki.
            </p>
          </div>
          <div className={styles.doneVideo}>
            {!videoLoading && !videoError && video ? (
              <StoryVideoSection video={video} storyTitle={story.title} />
            ) : (
              <section
                className={styles.videoNotice}
                aria-labelledby="video-notice-title"
                aria-busy={videoLoading}
              >
                <h2 id="video-notice-title">
                  {videoLoading
                    ? "Video tekshirilmoqda…"
                    : videoError
                      ? "Video yuklanmadi"
                      : "Video hali qo‘shilmagan"}
                </h2>
                <p role={videoError ? "alert" : "status"}>
                  {videoLoading
                    ? "Ota-onang tanlagan videoni tekshiryapmiz."
                    : videoError ||
                      "Ota-onang video tanlaganda shu yerda ko‘rinadi. Hozir hikoya savollarini sinab ko‘rishing mumkin."}
                </p>
                {videoError && (
                  <Button variant="secondary" onClick={() => void loadVideos()}>
                    Videoni qayta tekshirish
                  </Button>
                )}
              </section>
            )}
          </div>
          <div className={styles.doneActions}>
            {!progress.quizzes[story.id] ? (
              <Link
                to={`/quiz/${story.id}`}
                className={buttonClass({ size: "lg" })}
              >
                <MessageCircleQuestion size={20} />
                <span>Savol-javobni yechish</span>
              </Link>
            ) : nextStory && nextStory.id !== story.id ? (
              <Link
                to={`/story/${nextStory.slug}`}
                className={buttonClass({ size: "lg" })}
              >
                <span>Keyingi hikoya</span>
                <ChevronRight size={20} />
              </Link>
            ) : null}
            <Link
              to="/"
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              <Home size={20} />
              <span>Kutubxonaga</span>
            </Link>
            <button
              type="button"
              className={buttonClass({ variant: "secondary", size: "lg" })}
              onClick={() => {
                setPage(0);
                setFinished(false);
              }}
            >
              <RotateCcw size={20} />
              <span>Yana o‘qish</span>
            </button>
          </div>
        </div>
      </main>
    );

  return (
    <div
      className={styles.reader}
      data-theme={progress.theme}
      data-size={textSize}
      data-motion={motion ? "on" : "off"}
    >
      <header className={styles.header}>
        <Link
          to={`/story/${story.slug}`}
          className={styles.back}
          aria-label="Hikoya sahifasiga qaytish"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className={styles.titleBlock}>
          <strong>{story.title}</strong>
          <span>
            {page + 1} / {story.pages.length}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toolButton}
            aria-label={
              motion
                ? "Rasmlar: jonli shu‘lalarni to‘xtatish"
                : "Rasmlar: jonli shu‘lalarni yoqish"
            }
            onClick={() => setMotion((value) => !value)}
            aria-pressed={motion}
          >
            {motion ? <Pause size={19} /> : <Sparkles size={19} />}
            <span>Rasmlar</span>
          </button>
          <button
            type="button"
            className={styles.toolButton}
            aria-label={
              speaking
                ? "To‘xtatish: ovozli o‘qish"
                : "Tinglash: matnni ovozli o‘qish"
            }
            onClick={toggleSpeech}
            aria-pressed={speaking}
            disabled={turning}
          >
            {speaking ? <VolumeX size={19} /> : <Volume2 size={19} />}
            <span>{speaking ? "To‘xtatish" : "Tinglash"}</span>
          </button>
          <button
            type="button"
            className={styles.toolButton}
            aria-label="Matn va muhit sozlamalari"
            onClick={() => setSettingsOpen(true)}
            aria-expanded={settingsOpen}
          >
            <Type size={19} />
            <span>Matn</span>
          </button>
        </div>
      </header>

      <ProgressBar
        value={page + 1}
        max={story.pages.length}
        label={`${story.title} o‘qish jarayoni`}
        className={styles.progress}
      />

      <div className={styles.stage}>
        {speechNote && (
          <div className={styles.speechStatus}>
            <p role="status">{speechNote}</p>
            <IconButton
              label="Ovoz xabarini yopish"
              icon={<X size={19} />}
              onClick={() => setSpeechNote("")}
            />
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {page + 1}-sahifa. {current.text}
        </p>
        <StoryBook
          ref={book}
          story={story}
          initialPage={page}
          textSize={textSize}
          onSettled={setPage}
          onTurningChange={onTurningChange}
        />
      </div>

      <footer className={styles.footer}>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => turnPage(-1)}
          disabled={page === 0 || turning}
          icon={<ChevronLeft size={21} />}
        >
          Oldingi
        </Button>
        <span className={styles.position} aria-hidden="true">
          {page + 1} / {story.pages.length}
        </span>
        {last ? (
          <Button
            size="lg"
            onClick={finish}
            disabled={turning}
            iconRight={<Check size={21} />}
          >
            Yakunlash
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => turnPage(1)}
            disabled={turning}
            iconRight={<ChevronRight size={21} />}
          >
            Keyingi
          </Button>
        )}
      </footer>

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="O‘qish sozlamalari"
        description="Ko‘zing va qulog‘ing uchun qulay qilib sozla."
      >
        <div className={styles.settingGroup}>
          <h3>Matn o‘lchami</h3>
          <div
            className={styles.segmented}
            role="group"
            aria-label="Matn o‘lchami"
          >
            {sizes.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={textSize === index}
                className={textSize === index ? styles.segmentActive : ""}
                onClick={() => setTextSize(index)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.settingGroup}>
          <h3>O‘qish muhiti</h3>
          <div className={styles.themeGrid}>
            {themes.map((theme) => {
              const active = progress.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={active}
                  className={active ? styles.themeActive : ""}
                  onClick={() =>
                    update((value) => ({ ...value, theme: theme.id }))
                  }
                >
                  <ThemeGlyph theme={theme.id} size={20} />
                  <span>{theme.short}</span>
                  {active && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>
        <p className={styles.note}>
          «Tinglash» matnni ovozli o‘qiydi, musiqa qo‘ymaydi. Buning uchun
          qurilmada o‘zbekcha ovoz bo‘lishi kerak. Matn o‘lchami shu o‘qish
          davomida amal qiladi.
        </p>
      </Sheet>
    </div>
  );
}
