import {
  Clapperboard,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useBeforeUnload, useBlocker } from "react-router-dom";
import { Button, buttonClass } from "../../design-system/Button";
import { stories } from "../../content";
import type { Story } from "../../content/types";
import {
  api,
  ApiError,
  type StoryVideoMap,
  type StoryVideoOverride,
} from "../../lib/api";
import { youtubeId } from "../../lib/youtube";
import { useProgress } from "../../lib/context";
import { useParentAccess } from "./ParentGate";
import styles from "./ParentVideos.module.css";

export function ParentVideos() {
  const { user } = useProgress();
  const access = useParentAccess();
  const refreshAccess = access?.refresh;
  const [videos, setVideos] = useState<StoryVideoMap | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [loadVersion, setLoadVersion] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setVideos({});
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      setVideos((await api.parentVideos()).videos);
      setLoadVersion((value) => value + 1);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Videolar yuklanmadi.");
      if (cause instanceof ApiError && cause.code === "parent_locked")
        await refreshAccess?.();
    } finally {
      setBusy(false);
    }
  }, [refreshAccess, user]);

  useEffect(() => {
    void load();
  }, [load]);

  // In-app links (sidebar, "Natijalarga qaytish", child mode) must not
  // silently discard a typed but unsaved video link.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      !!document.querySelector('[data-video-dirty="true"]'),
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (
      window.confirm(
        "Saqlanmagan video o‘zgarishlari bor. Sahifadan chiqib, ularni bekor qilasizmi?",
      )
    )
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  const saved = videos
    ? Object.values(videos).filter((v) => youtubeId(v.url))
    : [];

  if (!videos)
    return (
      <div className={styles.loading} aria-busy={busy}>
        <RefreshCw size={24} className={busy ? styles.spin : ""} />
        <p role={error ? "alert" : "status"}>
          {error || "Video sozlamalari yuklanyapti…"}
        </p>
        {error && (
          <Button variant="secondary" onClick={() => void load()}>
            Qayta urinish
          </Button>
        )}
      </div>
    );

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>VIDEO BOSHQARUVI</span>
          <h1>Har bir hikoyaning videosi.</h1>
          <p>
            Kitob tugagach bola ko‘radigan YouTube videosini shu yerda
            tanlaysiz. «Saqlash» tugmasini bosgandan keyin havola bazaga
            saqlanadi va faqat sizning oilangizga ko‘rinadi.
          </p>
        </div>
        <div className={styles.headingActions}>
          <Link
            to="/parent"
            className={buttonClass({ variant: "secondary", size: "md" })}
          >
            Natijalarga qaytish
          </Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <span>
          <Clapperboard size={17} />
          {stories.length} hikoya
        </span>
        <span>
          <ShieldCheck size={17} />
          {saved.length} video saqlangan
        </span>
        <button
          type="button"
          className={styles.refresh}
          disabled={busy}
          onClick={() => {
            if (
              document.querySelector('[data-video-dirty="true"]') &&
              !window.confirm(
                "Saqlanmagan video o‘zgarishlari bor. Ularni bekor qilib yangilaysizmi?",
              )
            )
              return;
            void load();
          }}
        >
          <RefreshCw size={16} className={busy ? styles.spin : ""} />
          {busy ? "Yangilanyapti…" : "Yangilash"}
        </button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.grid}>
        {stories.map((story) => (
          <VideoCard
            key={`${story.id}-${loadVersion}`}
            story={story}
            saved={
              videos[story.id] && youtubeId(videos[story.id].url)
                ? videos[story.id]
                : undefined
            }
            onSaved={(storyId, video) =>
              setVideos((current) => ({
                ...(current ?? {}),
                [storyId]: {
                  url: video.url,
                  title: video.title,
                  updatedAt: video.updatedAt,
                },
              }))
            }
            onRemoved={(storyId) =>
              setVideos((current) => {
                if (!current) return current;
                const next = { ...current };
                delete next[storyId];
                return next;
              })
            }
            onLocked={() => refreshAccess?.()}
          />
        ))}
      </div>

      <p className={styles.note}>
        Havola <strong>youtube.com</strong>, <strong>youtu.be</strong> yoki{" "}
        <strong>youtube-nocookie.com</strong> manzillaridan biri bo‘lishi kerak.
        Boshqa saytlar va xavfli havolalar qabul qilinmaydi. Siz saqlagan video
        kitobning asosiy videosi o‘rnida ko‘rsatiladi. Saqlangan video olib
        tashlansa, kitobning asosiy videosi qaytadi; u bo‘lmasa video
        ko‘rinmaydi. Videoni avval YouTube’da tekshiring: havola to‘g‘ri
        bo‘lishi uning ochilishi yoki shu oynada ijro etilishini kafolatlamaydi.
      </p>
    </div>
  );
}

function VideoCard({
  story,
  saved,
  onSaved,
  onRemoved,
  onLocked,
}: {
  story: Story;
  saved?: StoryVideoOverride;
  onSaved: (
    storyId: string,
    video: StoryVideoOverride & { storyId: string },
  ) => void;
  onRemoved: (storyId: string) => void;
  onLocked: () => void;
}) {
  const fallback = story.video && !story.video.demo ? story.video : undefined;
  const initialUrl = saved?.url ?? fallback?.url ?? "";
  const initialTitle =
    saved?.title ?? fallback?.title ?? `${story.title} videosi`;
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setUrl(initialUrl);
    setTitle(initialTitle);
  }, [initialUrl, initialTitle]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!youtubeId(url)) {
      setError("Havolani tekshiring: bu YouTube videosi emas.");
      return;
    }
    if (!trimmed) {
      setError("Video uchun nom kiriting.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      const result = await api.saveStoryVideo(story.id, url, trimmed);
      if (!mounted.current) return;
      onSaved(story.id, result.video);
      setUrl(result.video.url);
      setTitle(result.video.title);
      setNote("Saqlandi. Kitob oxirida shu video chiqadi.");
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof ApiError && cause.code === "parent_locked")
        onLocked();
      setError(cause instanceof Error ? cause.message : "Saqlanmadi.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const restore = async () => {
    if (
      !window.confirm(
        `«${story.title}» uchun saqlangan video olib tashlansinmi?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      await api.removeStoryVideo(story.id);
      if (!mounted.current) return;
      onRemoved(story.id);
      setUrl(fallback?.url ?? "");
      setTitle(fallback?.title ?? `${story.title} videosi`);
      setNote(
        fallback
          ? "Kitobning asosiy videosi qaytarildi."
          : "Video olib tashlandi. Namuna video avtomatik qo‘yilmaydi.",
      );
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof ApiError && cause.code === "parent_locked")
        onLocked();
      setError(cause instanceof Error ? cause.message : "O‘chirilmadi.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const id = youtubeId(url);
  const publishedId = youtubeId(saved?.url ?? fallback?.url ?? "");
  const dirty = url !== initialUrl || title !== initialTitle;
  useBeforeUnload(
    useCallback(
      (event) => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [dirty],
    ),
  );
  const status = saved
    ? { label: "Sizning videongiz", className: styles.chosen }
    : fallback
      ? { label: "Asl video", className: styles.chosen }
      : { label: "Video tanlanmagan", className: styles.emptyState };
  const inputId = `video-url-${story.id}`;
  const titleId = `video-title-${story.id}`;
  const hintId = `video-hint-${story.id}`;

  return (
    <article
      className={styles.card}
      aria-labelledby={`video-heading-${story.id}`}
    >
      <header className={styles.cardHead}>
        <img src={story.cover} alt="" loading="lazy" />
        <div>
          <h2 id={`video-heading-${story.id}`}>{story.title}</h2>
          <p>{story.subtitle}</p>
        </div>
        <span className={status.className}>{status.label}</span>
      </header>

      <div className={styles.current}>
        {publishedId ? (
          <>
            <span>Saqlangan video:</span>
            <a
              href={`https://www.youtube.com/watch?v=${publishedId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {saved?.title ?? fallback?.title ?? "YouTube videosi"}{" "}
              <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <span>Hozircha ko‘rsatiladigan video yo‘q. Havola qo‘shing.</span>
        )}
      </div>

      {dirty && (
        <div className={styles.current}>
          <span role="status">Saqlanmagan o‘zgarishlar</span>
          {id && (
            <a
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanlangan videoni tekshirish <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
      <form
        className={styles.form}
        data-video-dirty={dirty}
        onSubmit={(event) => void save(event)}
      >
        <label htmlFor={inputId}>YouTube havolasi</label>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setNote("");
            setError("");
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-describedby={hintId}
          required
        />
        <span id={hintId} className={styles.fieldHint}>
          Videoni YouTube’da ochib, manzil satridan nusxalang.
        </span>
        <label htmlFor={titleId}>Video nomi</label>
        <input
          id={titleId}
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setNote("");
            setError("");
          }}
          required
        />
        <div className={styles.formActions}>
          <Button type="submit" disabled={busy} icon={<Save size={17} />}>
            {busy ? "Saqlanyapti…" : "Saqlash"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !saved}
            onClick={() => void restore()}
            icon={<RotateCcw size={17} />}
          >
            Videoni olib tashlash
          </Button>
        </div>
      </form>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {note && (
        <p className={styles.success} role="status">
          {note}
        </p>
      )}
    </article>
  );
}
