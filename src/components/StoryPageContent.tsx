import type { ReadingBlock, Story } from "../data/types";
import { Art } from "./ui";
function ContentBlock({ block }: { block: ReadingBlock }) {
  if (block.type === "illustration")
    return (
      <figure className="inline-scene">
        <Art src={block.src} alt={block.alt} />
      </figure>
    );
  if (block.type === "heading")
    return <h2 className="story-opening-title">{block.text}</h2>;
  if (block.type === "caption")
    return <span className="story-opening-subtitle">{block.text}</span>;
  return <p>{block.text}</p>;
}
function StoryLeaf({
  story,
  page,
  side,
  decorative = false,
}: {
  story: Story;
  page: number;
  side: 0 | 1;
  decorative?: boolean;
}) {
  const blocks = story.pages[page].leaves[side];
  const narration = blocks.some((block) => block.type === "text");
  const legacy =
    side === 0
      ? decorative
        ? "paper-art"
        : "page-art"
      : decorative
        ? "paper-text"
        : "page-text";
  return (
    <div
      className={`${legacy} reader-leaf leaf-${side === 0 ? "left" : "right"} ${narration ? "narration-leaf" : "illustration-leaf"} ${page === 0 ? "opening-leaf" : ""}`}
      data-leaf={side === 0 ? "left" : "right"}
    >
      <div
        className="leaf-content"
        aria-live={!decorative && narration ? "polite" : undefined}
      >
        {blocks.map((block, i) => (
          <ContentBlock key={`${page}-${side}-${i}`} block={block} />
        ))}
      </div>
      {side === 1 && (
        <span className={decorative ? "paper-page-number" : "page-number"}>
          {page + 1}
        </span>
      )}
    </div>
  );
}
export function PageArtwork(props: {
  story: Story;
  page: number;
  decorative?: boolean;
}) {
  return <StoryLeaf {...props} side={0} />;
}
export function PageText(props: {
  story: Story;
  page: number;
  decorative?: boolean;
}) {
  return <StoryLeaf {...props} side={1} />;
}
