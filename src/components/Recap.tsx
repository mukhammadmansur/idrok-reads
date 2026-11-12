import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { Story } from "../data/types";
import { Art } from "./ui";
export default function Recap({ story }: { story: Story }) {
  const media = story.recap;
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const duration = media.kind === "animation" ? media.duration : 0;
  useEffect(() => {
    if (!playing || !duration) return;
    const timer = window.setInterval(
      () => setElapsed((t) => Math.min(t + 1, duration)),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing, duration]);
  const ended = elapsed >= duration;
  if (media.kind === "video")
    return (
      <div className="recap">
        {failed ? (
          <p role="status">
            Video hozircha ochilmadi. Hikoyani o‘qib tugatganing saqlangan.
          </p>
        ) : (
          <video
            controls
            preload="none"
            poster={media.poster}
            onError={() => setFailed(true)}
            aria-label={`${story.title} qisqa mazmuni`}
          >
            <source src={media.src} />
            <track kind="captions" label="Matn mavjud emas" />
          </video>
        )}
      </div>
    );
  const scene =
    media.scenes[
      Math.min(
        media.scenes.length - 1,
        Math.floor(elapsed / (duration / media.scenes.length)),
      )
    ];
  return (
    <div className="recap">
      <div className={`recap-scene ${playing && !ended ? "is-playing" : ""}`}>
        <Art src={scene.illustration} alt="Hikoya xotiralari" />
        <div className="recap-caption" key={scene.text}>
          {scene.text}
        </div>
        {!playing && elapsed === 0 && (
          <button
            className="recap-play"
            aria-label="Recap animatsiyani boshlash"
            onClick={() => setPlaying(true)}
          >
            <Play fill="currentColor" size={27} />
          </button>
        )}
      </div>
      <div className="recap-controls">
        <button
          className="icon-button"
          aria-label={
            ended ? "Qayta ko‘rish" : playing ? "To‘xtatish" : "Davom ettirish"
          }
          onClick={() => {
            if (ended) {
              setElapsed(0);
              setPlaying(true);
            } else setPlaying((p) => !p);
          }}
        >
          {ended ? (
            <RotateCcw size={19} />
          ) : playing ? (
            <Pause size={19} />
          ) : (
            <Play size={19} />
          )}
        </button>
        <progress
          value={elapsed}
          max={duration}
          aria-label="Animatsiya davomiyligi"
        />
        <span>
          0:{String(elapsed).padStart(2, "0")} / 0:{duration}
        </span>
      </div>
      <p className="recap-note">
        32 soniyalik tasvirli xotira ·{" "}
        {ended
          ? "Yana bir bor eslab oldik!"
          : "O‘qi va hikoyani yana bir bor esla."}
      </p>
    </div>
  );
}
