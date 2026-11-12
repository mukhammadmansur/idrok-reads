import { useState } from "react";
import { Leaf, Orbit, Snowflake, Sun } from "lucide-react";
import type { ThemeId } from "../data/types";
const worldAssets: Record<ThemeId, string> = {
  classic: "/worlds/classic.webp",
  forest: "/worlds/forest.webp",
  ice: "/worlds/ice-garden.webp",
  holo: "/worlds/holo-garden.webp",
};
export const worldImage = (theme: ThemeId) => worldAssets[theme];
export function ThemeGlyph({
  theme,
  size = 22,
}: {
  theme: ThemeId;
  size?: number;
}) {
  const Icon = { classic: Sun, forest: Leaf, ice: Snowflake, holo: Orbit }[
    theme
  ];
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}
export function ThemePreview({ theme }: { theme: ThemeId }) {
  return (
    <div className={`material-preview material-${theme}`} aria-hidden="true">
      <img
        src={worldImage(theme)}
        alt=""
        loading="lazy"
        width="480"
        height="270"
      />
    </div>
  );
}
export function WorldBackdrop({ theme }: { theme: ThemeId }) {
  const [ready, setReady] = useState<Partial<Record<ThemeId, boolean>>>({});
  return (
    <div className={`world-backdrop world-${theme}`} aria-hidden="true">
      {(["classic", "forest", "ice", "holo"] as ThemeId[]).map((id) => (
        <div
          className={`world-layer scenery-${id}`}
          key={id}
          data-active={id === theme && !!ready[id]}
        >
          <img
            src={worldImage(id)}
            alt=""
            data-active={id === theme}
            fetchPriority={id === theme ? "high" : "low"}
            onLoad={() =>
              setReady((previous) =>
                previous[id] ? previous : { ...previous, [id]: true },
              )
            }
            onError={() =>
              setReady((previous) => ({ ...previous, [id]: false }))
            }
          />
        </div>
      ))}
      <div className="world-atmosphere" />
      <div className="world-motes">
        {Array.from({ length: 8 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${8 + i * 12}%`,
              top: `${15 + ((i * 17) % 70)}%`,
              animationDelay: `${-i * 1.8}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
