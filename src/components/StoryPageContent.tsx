import type { Story } from "../data/types";
import { Art } from "./ui";
export function PageArtwork({
  story,
  page,
  decorative = false,
}: {
  story: Story;
  page: number;
  decorative?: boolean;
}) {
  return (
    <div className={decorative ? "paper-art" : "page-art"}>
      <Art
        src={story.pages[page].illustration}
        alt={decorative ? "" : story.pages[page].scene}
      />
      <span className={decorative ? "paper-art-mark" : "page-art-mark"}>
        {String(page + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
export function PageText({
  story,
  page,
  decorative = false,
}: {
  story: Story;
  page: number;
  decorative?: boolean;
}) {
  return (
    <div className={decorative ? "paper-text" : "page-text"}>
      <span className="chapter-label">
        {page === 0
          ? "BIR BOR EKAN..."
          : page === story.pages.length - 1
            ? "VA SHUNDAY QILIB..."
            : "SARGUZASHT DAVOM ETADI"}
      </span>
      <p aria-live={decorative ? undefined : "polite"}>
        {story.pages[page].text}
      </p>
      <span className="page-flourish" aria-hidden="true">
        ❧
      </span>
      <span className={decorative ? "paper-page-number" : "page-number"}>
        {page + 1}
      </span>
    </div>
  );
}
