import { useState } from "react";
import { Leaf, Orbit, Snowflake, Sun } from "lucide-react";
import type { ThemeId } from "../data/types";
export const worldImage = (theme: ThemeId) => `/worlds/${theme}.webp`;
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
  const [failed, setFailed] = useState<string | null>(null);
  if (theme === "classic") return null;
  return (
    <div className={`world-backdrop world-${theme}`} aria-hidden="true">
      {failed !== theme && (
        <img
          key={theme}
          src={worldImage(theme)}
          alt=""
          fetchPriority="high"
          onError={() => setFailed(theme)}
        />
      )}
    </div>
  );
}
