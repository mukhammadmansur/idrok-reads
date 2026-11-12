import { useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import type { Story } from "../data/types";
import { useProgress } from "../lib/context";
export function Art({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="art-fallback" role="img" aria-label={alt}>
      <BookOpen size={50} />
      <span>Hikoya olami</span>
    </div>
  ) : (
    <img {...props} src={src} alt={alt} onError={() => setFailed(true)} />
  );
}
export function SectionTitle({
  id,
  eyebrow,
  title,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 id={id}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
export function StoryCard({
  story,
  index = 0,
}: {
  story: Story;
  index?: number;
}) {
  const { progress } = useProgress();
  const record = progress.reading[story.id];
  const percent = record?.completedAt
    ? 100
    : record
      ? Math.round(((record.page + 1) / story.pages.length) * 100)
      : 0;
  return (
    <a className="story-card" href={`#/story/${story.slug}`}>
      <div className={`story-cover cover-${index}`}>
        <Art src={story.cover} alt={story.subtitle} loading="lazy" />
        <span className="cover-category">{story.category}</span>
        <span className="cover-open">
          <ArrowUpRight size={20} />
        </span>
        {record && (
          <div className="card-progress" aria-label={`${percent}% o‘qilgan`}>
            <span style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <div className="story-card-body">
        <div className="story-meta">
          <span>
            <Clock3 size={13} />
            {story.minutes} daqiqa
          </span>
          <span>
            {story.age[0]}–{story.age[1]} yosh
          </span>
          {record?.completedAt && <span className="done-label">O‘qilgan</span>}
        </div>
        <h3>{story.title}</h3>
        <p>{story.subtitle}</p>
      </div>
    </a>
  );
}
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
