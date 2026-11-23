import {
  Cat,
  Cloud,
  Leaf,
  Moon,
  Rabbit,
  Rocket,
  Snowflake,
  Sparkles,
  Sun,
} from "lucide-react";
import styles from "./Avatar.module.css";
import type { StorybookAvatarId } from "../lib/localProfiles";

export type AvatarId = StorybookAvatarId;

export const AVATAR_LABELS: Record<StorybookAvatarId, string> = {
  sun: "Quyosh",
  leaf: "Barg",
  cloud: "Bulut",
  star: "Yulduzcha",
  moon: "Oy",
  rabbit: "Quyonvoy",
  cat: "Tulkicha",
  rocket: "Raketa",
  snow: "Qor parchasi",
};

export const STORYBOOK_AVATARS: { id: StorybookAvatarId; label: string }[] = [
  { id: "cat", label: "Tulkicha" },
  { id: "rabbit", label: "Quyonvoy" },
  { id: "star", label: "Yulduzcha" },
  { id: "sun", label: "Quyosh" },
  { id: "moon", label: "Oy" },
  { id: "cloud", label: "Bulut" },
  { id: "leaf", label: "Barg" },
  { id: "rocket", label: "Raketa" },
];

const glyphs = {
  sun: Sun,
  leaf: Leaf,
  cloud: Cloud,
  star: Sparkles,
  moon: Moon,
  rabbit: Rabbit,
  cat: Cat,
  rocket: Rocket,
  snow: Snowflake,
} as const;

export function Avatar({
  avatar,
  size = 44,
  label,
}: {
  avatar: AvatarId;
  size?: number;
  label?: string;
}) {
  const Glyph = glyphs[avatar] || glyphs.sun;
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Glyph size={size * 0.52} strokeWidth={1.8} />
    </span>
  );
}
