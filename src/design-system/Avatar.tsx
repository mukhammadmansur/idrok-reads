import type { ComponentType } from "react";
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
  lion: "Jasur Sher",
  owl: "Dono Ukki",
  bear: "Polvon Ayiq",
  wolf: "Bo‘rivoy",
  falcon: "Lochin",
  fox: "Tulkivoy",
  whale: "Kitvoy",
  cat: "Mushukvoy",
  rabbit: "Quyonvoy",
  rocket: "Fazogir",
  star: "Yulduzcha",
  sun: "Quyosh",
  moon: "Oycha",
  cloud: "Bulutvoy",
  leaf: "Bargcha",
  snow: "Qor parchasi",
};

export const STORYBOOK_AVATARS: { id: StorybookAvatarId; label: string }[] = [
  { id: "lion", label: "Jasur Sher" },
  { id: "owl", label: "Dono Ukki" },
  { id: "bear", label: "Polvon Ayiq" },
  { id: "wolf", label: "Bo‘rivoy" },
  { id: "falcon", label: "Lochin" },
  { id: "fox", label: "Tulkivoy" },
  { id: "whale", label: "Kitvoy" },
  { id: "cat", label: "Mushukvoy" },
  { id: "rabbit", label: "Quyonvoy" },
  { id: "rocket", label: "Fazogir" },
  { id: "star", label: "Yulduzcha" },
  { id: "sun", label: "Quyosh" },
];

export const AVATAR_COLORS: Record<
  StorybookAvatarId,
  { bg: string; color: string; border: string }
> = {
  lion: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  owl: { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  bear: { bg: "#ffedd5", color: "#9a3412", border: "#fed7aa" },
  wolf: { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" },
  falcon: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  fox: { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" },
  whale: { bg: "#e0f2fe", color: "#0284c7", border: "#bae6fd" },
  cat: { bg: "#fce7f3", color: "#be185d", border: "#fbcfe8" },
  rabbit: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  rocket: { bg: "#fae8ff", color: "#a21caf", border: "#f5d0fe" },
  star: { bg: "#fef9c3", color: "#a16207", border: "#fef08a" },
  sun: { bg: "#ffedd5", color: "#ea580c", border: "#fed7aa" },
  moon: { bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe" },
  cloud: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  leaf: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  snow: { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" },
};

function LionGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" strokeDasharray="3 2" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="8" cy="7.5" r="1.5" />
      <circle cx="16" cy="7.5" r="1.5" />
      <circle cx="10" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="14" cy="11.5" r="0.9" fill="currentColor" />
      <path d="M11 13.5h2l-1 1z" fill="currentColor" />
      <path d="M12 14.5v1.2m-1.5-.2a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function OwlGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6l3 2c1.2-.6 2.6-1 4-1s2.8.4 4 1l3-2v9a7 7 0 0 1-14 0V6z" />
      <circle cx="9" cy="12" r="2.5" />
      <circle cx="15" cy="12" r="2.5" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" />
      <circle cx="15" cy="12" r="0.9" fill="currentColor" />
      <path d="M11.5 13.5l.5 1.5.5-1.5z" fill="currentColor" />
      <path d="M9 17.5c1.5.7 4.5.7 6 0" />
    </svg>
  );
}

function BearGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6.5" cy="7.5" r="2.5" />
      <circle cx="17.5" cy="7.5" r="2.5" />
      <circle cx="12" cy="13" r="7" />
      <ellipse cx="12" cy="14.8" rx="3.5" ry="2.3" />
      <ellipse cx="12" cy="14" rx="1.3" ry="0.8" fill="currentColor" />
      <circle cx="9.5" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="14.5" cy="11.5" r="0.9" fill="currentColor" />
      <path d="M12 14.8v1m-1 0a1 1 0 0 0 2 0" />
    </svg>
  );
}

function WolfGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 5l3 5m9-5l-3 5" />
      <path d="M6 10l-2 3 3 2 1 4 4 1 4-1 1-4 3-2-2-3" />
      <path d="M9 13.5l3 3.5 3-3.5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
      <path d="M8.5 11.5l2 .5m3 0l2-.5" />
    </svg>
  );
}

function FalconGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 16c0-6 4-11 10-11 2 0 4 1 4 3-2 1-3 3-3 5 0 2 1 3 3 3-2 3-5 5-9 5-3 0-5-2-5-5z" />
      <path d="M17 8c2 .5 3.5 2 3.5 4-1 0-2.5-.5-3.5-2z" fill="currentColor" />
      <circle cx="12" cy="9.5" r="1.1" fill="currentColor" />
      <path d="M10 13c1 1 3 1.5 5 1" />
    </svg>
  );
}

function FoxGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4l4 6m10-6l-4 6" />
      <path d="M5 4c1 2 1 5 0 7l7 8 7-8c-1-2-1-5 0-7l-5 4-4-2-4 2z" />
      <circle cx="9.5" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="14.5" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function WhaleGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M8 4c0 2 1.5 3 4 3m0-3v3m0 0c2.5 0 4-1 4-3"
        strokeWidth="1.4"
      />
      <path d="M3 14c0-3.5 3-6.5 8-6.5 6 0 9 3 10 6.5-1 1-3 1.5-6 1.5H7c-2.5 0-4-.5-4-1.5z" />
      <path d="M21 14c1.5-1.5 2-3 2-4m-2 4c1.5 1.5 2 3 2 4" />
      <circle cx="7.5" cy="12" r="0.9" fill="currentColor" />
      <path d="M10 14.5a3 3 0 0 0 3 0" />
    </svg>
  );
}

const glyphs: Record<
  StorybookAvatarId,
  ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  lion: LionGlyph,
  owl: OwlGlyph,
  bear: BearGlyph,
  wolf: WolfGlyph,
  falcon: FalconGlyph,
  fox: FoxGlyph,
  whale: WhaleGlyph,
  sun: Sun,
  leaf: Leaf,
  cloud: Cloud,
  star: Sparkles,
  moon: Moon,
  rabbit: Rabbit,
  cat: Cat,
  rocket: Rocket,
  snow: Snowflake,
};

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
  const colors = AVATAR_COLORS[avatar] || AVATAR_COLORS.sun;

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.color,
        borderColor: colors.border,
      }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Glyph size={size * 0.54} strokeWidth={1.9} />
    </span>
  );
}
