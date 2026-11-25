import { Anchor, Orbit, Sparkles, Sun } from "lucide-react";
import type { ThemeId } from "../../content";

const glyphs = {
  classic: Sun,
  magic: Sparkles,
  cyber: Orbit,
  pirate: Anchor,
} as const;

export function ThemeGlyph({
  theme,
  size = 20,
}: {
  theme: ThemeId;
  size?: number;
}) {
  const Glyph = glyphs[theme] ?? Sparkles;
  return <Glyph size={size} strokeWidth={1.8} aria-hidden="true" />;
}
