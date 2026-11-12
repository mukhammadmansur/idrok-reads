import { BookOpen, Leaf, Orbit, Snowflake, Sun } from "lucide-react";
import type { ThemeId } from "../data/types";
export const themeFrame = (theme: ThemeId) =>
  theme === "classic" ? undefined : `/themes/${theme}-frame.webp`;
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
  const frame = themeFrame(theme);
  return (
    <div className={`material-preview material-${theme}`} aria-hidden="true">
      <BookOpen size={52} strokeWidth={1.15} />
      {frame && <img src={frame} alt="" loading="lazy" />}
    </div>
  );
}
