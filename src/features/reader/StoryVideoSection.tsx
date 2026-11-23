import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoryVideo } from "../../content/types";
import { youtubeEmbed, youtubeId } from "../../lib/youtube";
import styles from "./StoryVideoSection.module.css";

export function StoryVideoSection({
  video,
  storyTitle,
}: {
  video: StoryVideo;
  storyTitle: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = youtubeId(video.url);
  const embed = youtubeEmbed(video.url);

  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [video.url]);

  if (!id || !embed) return null;

  return (
    <section className={styles.section} aria-labelledby="story-video-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>BIRGA TOMOSHA QILAMIZ</span>
          <h2 id="story-video-title">{video.title}</h2>
        </div>
        <span className={video.demo ? styles.demo : styles.chosen}>
          {video.demo ? "Multfilm" : "Hikoya videosi"}
        </span>
      </div>
      <p className={styles.note}>
        «{storyTitle}» hikoyasiga mos qiziqarli videoni birga tomosha qilamiz.
      </p>
      <div className={styles.stage}>
        {playing && !failed ? (
          <iframe
            title={video.title}
            src={`${embed}&autoplay=1`}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setFailed(true)}
          />
        ) : (
          <button
            type="button"
            className={styles.poster}
            onClick={() => {
              setFailed(false);
              setPlaying(true);
            }}
          >
            <img src={video.poster} alt="" draggable={false} loading="lazy" />
            <span className={styles.playIcon} aria-hidden="true">
              <Play size={28} fill="currentColor" />
            </span>
            <span className={styles.playLabel}>Videoni ko‘rish</span>
          </button>
        )}
      </div>
      <div className={styles.footer}>
        <span>{video.credit ?? "IdrokReads"}</span>
      </div>
      {failed && (
        <p className={styles.error} role="status">
          Video hozir ochilmadi. Sahifani yangilab, qayta urinib ko‘r.
        </p>
      )}
    </section>
  );
}
