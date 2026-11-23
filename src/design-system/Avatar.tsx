import type { ComponentType } from "react";
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

/* ==========================================================================
   FULL-COLOR KIDTECH STICKER ARTWORK (64x64 SVG)
   ========================================================================== */

export function LionSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Mane: Fluffy golden-orange scallops */}
      <circle cx="32" cy="34" r="23" fill="#F59E0B" />
      <circle cx="17" cy="22" r="7" fill="#D97706" />
      <circle cx="32" cy="14" r="7" fill="#D97706" />
      <circle cx="47" cy="22" r="7" fill="#D97706" />
      <circle cx="50" cy="36" r="7" fill="#D97706" />
      <circle cx="43" cy="49" r="7" fill="#D97706" />
      <circle cx="21" cy="49" r="7" fill="#D97706" />
      <circle cx="14" cy="36" r="7" fill="#D97706" />

      {/* Ears */}
      <circle cx="20" cy="20" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="20" cy="20" r="3.5" fill="#FDE68A" />
      <circle cx="44" cy="20" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="44" cy="20" r="3.5" fill="#FDE68A" />

      {/* Face */}
      <circle cx="32" cy="34" r="17" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Cheeks */}
      <circle cx="23" cy="39" r="3.5" fill="#F87171" opacity="0.65" />
      <circle cx="41" cy="39" r="3.5" fill="#F87171" opacity="0.65" />

      {/* Sparkling Eyes */}
      <circle cx="26" cy="31" r="3.2" fill="#1E293B" />
      <circle cx="25" cy="30" r="1.3" fill="#FFFFFF" />
      <circle cx="27.2" cy="32.2" r="0.6" fill="#FFFFFF" />

      <circle cx="38" cy="31" r="3.2" fill="#1E293B" />
      <circle cx="37" cy="30" r="1.3" fill="#FFFFFF" />
      <circle cx="39.2" cy="32.2" r="0.6" fill="#FFFFFF" />

      {/* Nose and Smile */}
      <polygon points="30,36 34,36 32,38.5" fill="#78350F" />
      <path d="M32 38.5v2.2m-2.5 0a2.5 2.5 0 0 0 5 0" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Whiskers */}
      <path d="M19 37h-3 M19 40h-3 M45 37h3 M45 40h3" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OwlSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Body */}
      <ellipse cx="32" cy="36" rx="20" ry="21" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Ear tufts */}
      <polygon points="16,14 26,24 14,26" fill="#6D28D9" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="48,14 50,26 38,24" fill="#6D28D9" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      {/* Belly plate */}
      <ellipse cx="32" cy="40" rx="14" ry="14" fill="#EDE9FE" />
      <path d="M28 42c2 2 6 2 8 0m-9 4c2 2 6 2 8 0" stroke="#A78BFA" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Huge Curious Eyes */}
      <circle cx="24" cy="30" r="7.5" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
      <circle cx="24" cy="30" r="5" fill="#FBBF24" />
      <circle cx="24" cy="30" r="3.2" fill="#1E1B4B" />
      <circle cx="22.5" cy="28.5" r="1.3" fill="#FFFFFF" />

      <circle cx="40" cy="30" r="7.5" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
      <circle cx="40" cy="30" r="5" fill="#FBBF24" />
      <circle cx="40" cy="30" r="3.2" fill="#1E1B4B" />
      <circle cx="38.5" cy="28.5" r="1.3" fill="#FFFFFF" />

      {/* Beak */}
      <polygon points="29.5,33 34.5,33 32,38" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      {/* Cheeks */}
      <circle cx="16" cy="36" r="3" fill="#F472B6" opacity="0.65" />
      <circle cx="48" cy="36" r="3" fill="#F472B6" opacity="0.65" />
    </svg>
  );
}

export function BearSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Ears */}
      <circle cx="18" cy="19" r="8" fill="#92400E" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="18" cy="19" r="4.5" fill="#FDE68A" />
      <circle cx="46" cy="19" r="8" fill="#92400E" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="46" cy="19" r="4.5" fill="#FDE68A" />

      {/* Head */}
      <circle cx="32" cy="35" r="19" fill="#B45309" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Muzzle */}
      <ellipse cx="32" cy="40" rx="9" ry="7" fill="#FEF3C7" />

      {/* Nose and Smile */}
      <ellipse cx="32" cy="37" rx="3.5" ry="2.5" fill="#1F2937" />
      <circle cx="31" cy="36.3" r="0.8" fill="#FFFFFF" />
      <path d="M32 39.5v2m-3 0a3 3 0 0 0 6 0" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <circle cx="21" cy="40" r="3.5" fill="#F87171" opacity="0.6" />
      <circle cx="43" cy="40" r="3.5" fill="#F87171" opacity="0.6" />

      {/* Eyes */}
      <circle cx="25" cy="31" r="3" fill="#1F2937" />
      <circle cx="24" cy="30" r="1.2" fill="#FFFFFF" />
      <circle cx="39" cy="31" r="3" fill="#1F2937" />
      <circle cx="38" cy="30" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function WolfSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Alert Ears */}
      <polygon points="15,10 27,24 13,26" fill="#475569" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="16,13 24,23 15,24" fill="#FDA4AF" />
      <polygon points="49,10 51,26 37,24" fill="#475569" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="48,13 49,24 40,23" fill="#FDA4AF" />

      {/* Face shape */}
      <path d="M32 18 C20 18 14 26 14 34 C14 41 19 46 23 48 C28 51 32 52 32 52 C32 52 36 51 41 48 C45 46 50 41 50 34 C50 26 44 18 32 18 Z" fill="#64748B" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Cheek tufts */}
      <path d="M14 34l8 2-4 7z M50 34l-8 2 4 7z" fill="#F1F5F9" />

      {/* Muzzle */}
      <path d="M26 36 C26 34 32 33 32 33 C32 33 38 34 38 36 C38 42 36 47 32 47 C28 47 26 42 26 36 Z" fill="#F8FAFC" />

      {/* Nose and Smile */}
      <ellipse cx="32" cy="40" rx="2.5" ry="1.8" fill="#1E293B" />
      <path d="M32 41.8v2m-2 0a2 2 0 0 0 4 0" stroke="#334155" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* Amber intelligent eyes */}
      <circle cx="25" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="25" cy="30" r="2" fill="#1E293B" />
      <circle cx="24.2" cy="29.2" r="0.8" fill="#FFFFFF" />

      <circle cx="39" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="39" cy="30" r="2" fill="#1E293B" />
      <circle cx="38.2" cy="29.2" r="0.8" fill="#FFFFFF" />
    </svg>
  );
}

export function FalconSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Body / Head */}
      <ellipse cx="32" cy="35" rx="19" ry="20" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Crest feathers */}
      <path d="M27 15 C30 11 36 12 36 16 C39 12 44 14 43 18" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* White cheek mask */}
      <path d="M20 30 C20 40 28 48 32 48 C36 48 44 40 44 30 C44 26 38 24 32 24 C26 24 20 26 20 30 Z" fill="#F0F9FF" />
      {/* Sharp golden beak */}
      <path d="M29 33 h6 l-3 9 z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
      {/* Dark blue eye marks */}
      <path d="M22 35l4-7 M42 35l-4-7" stroke="#0369A1" strokeWidth="1.8" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="26" cy="30" r="3" fill="#F59E0B" />
      <circle cx="26" cy="30" r="1.8" fill="#0F172A" />
      <circle cx="25.2" cy="29.2" r="0.7" fill="#FFFFFF" />

      <circle cx="38" cy="30" r="3" fill="#F59E0B" />
      <circle cx="38" cy="30" r="1.8" fill="#0F172A" />
      <circle cx="37.2" cy="29.2" r="0.7" fill="#FFFFFF" />
    </svg>
  );
}

export function FoxSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Big perky ears with dark tips */}
      <polygon points="14,9 28,24 12,26" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="14,9 18,14 13,16" fill="#431407" />
      <polygon points="17,14 24,22 15,23" fill="#FBCFE8" />

      <polygon points="50,9 52,26 36,24" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,9 47,16 51,14" fill="#431407" />
      <polygon points="47,14 49,23 40,22" fill="#FBCFE8" />

      {/* Orange Head */}
      <polygon points="32,51 12,31 16,21 48,21 52,31" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Fluffy white cheeks */}
      <polygon points="32,51 16,33 22,25 32,32 42,25 48,33" fill="#FFF7ED" />

      {/* Cheeks blush */}
      <circle cx="22" cy="37" r="3" fill="#FB7185" opacity="0.65" />
      <circle cx="42" cy="37" r="3" fill="#FB7185" opacity="0.65" />

      {/* Happy cute curved eyes */}
      <path d="M23 29 c2-2 5-2 7 0" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M34 29 c2-2 5-2 7 0" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />

      {/* Nose and tiny smile */}
      <circle cx="32" cy="46" r="2.5" fill="#18181B" />
    </svg>
  );
}

export function WhaleSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Water spout fountains */}
      <path d="M32 16 C32 8 27 6 25 7 M32 16 C32 6 32 4 32 4 M32 16 C32 8 37 6 39 7" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="7" r="1.6" fill="#67E8F9" />
      <circle cx="32" cy="4" r="1.6" fill="#67E8F9" />
      <circle cx="39" cy="7" r="1.6" fill="#67E8F9" />

      {/* Whale Body */}
      <path d="M12 38 C12 25 24 20 38 20 C48 20 54 26 54 35 C54 38 52 42 46 44 C38 46 22 47 16 43 C13 41 12 39 12 38 Z" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Tail fin */}
      <path d="M14 41 C9 43 6 47 8 50 C11 48 14 45 16 43 Z M14 41 C9 39 6 35 8 32 C11 34 14 37 16 41 Z" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Underbelly */}
      <path d="M22 38 C28 38 38 39 46 44 C38 46 22 47 16 43 C19 40 21 38 22 38 Z" fill="#E0F2FE" />
      {/* Smiling Eye */}
      <circle cx="44" cy="32" r="3.2" fill="#0F172A" />
      <circle cx="43" cy="31" r="1.2" fill="#FFFFFF" />
      {/* Smile */}
      <path d="M42 37 c2 1.5 5 1.5 7 0" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Rosy blush */}
      <circle cx="38" cy="36" r="3" fill="#F472B6" opacity="0.65" />
      {/* Flipper */}
      <ellipse cx="32" cy="40" rx="5" ry="2.5" fill="#0284C7" transform="rotate(-15 32 40)" />
    </svg>
  );
}

export function CatSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Ears */}
      <polygon points="16,14 26,24 13,26" fill="#F472B6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="17,17 23,23 15,24" fill="#FCE7F3" />
      <polygon points="48,14 51,26 38,24" fill="#F472B6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="47,17 49,24 41,23" fill="#FCE7F3" />

      {/* Head */}
      <circle cx="32" cy="36" r="18" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Cheeks */}
      <circle cx="21" cy="41" r="3.5" fill="#F43F5E" opacity="0.45" />
      <circle cx="43" cy="41" r="3.5" fill="#F43F5E" opacity="0.45" />

      {/* Sparkling emerald eyes */}
      <ellipse cx="24" cy="32" rx="3.5" ry="4" fill="#10B981" />
      <circle cx="24" cy="32" r="2.2" fill="#064E3B" />
      <circle cx="23" cy="30.5" r="1.2" fill="#FFFFFF" />

      <ellipse cx="40" cy="32" rx="3.5" ry="4" fill="#10B981" />
      <circle cx="40" cy="32" r="2.2" fill="#064E3B" />
      <circle cx="39" cy="30.5" r="1.2" fill="#FFFFFF" />

      {/* Heart nose & Whiskers */}
      <path d="M30 38 Q32 36 34 38 Q32 41 30 38 Z" fill="#E11D48" />
      <path d="M32 39.5v2m-2.5 0a2.5 2.5 0 0 0 5 0" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M15 37h6 M15 41h6 M49 37h-6 M49 41h-6" stroke="#FFF1F2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function RabbitSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Long Bunny Ears */}
      <ellipse cx="23" cy="18" rx="5.5" ry="14" fill="#F8FAFC" stroke="#FFFFFF" strokeWidth="2.5" transform="rotate(-8 23 18)" />
      <ellipse cx="23" cy="18" rx="3" ry="10" fill="#FDA4AF" transform="rotate(-8 23 18)" />

      <ellipse cx="41" cy="18" rx="5.5" ry="14" fill="#F8FAFC" stroke="#FFFFFF" strokeWidth="2.5" transform="rotate(8 41 18)" />
      <ellipse cx="41" cy="18" rx="3" ry="10" fill="#FDA4AF" transform="rotate(8 41 18)" />

      {/* Head */}
      <circle cx="32" cy="39" r="17" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />

      {/* Cheeks */}
      <circle cx="21" cy="43" r="3.5" fill="#FB7185" opacity="0.65" />
      <circle cx="43" cy="43" r="3.5" fill="#FB7185" opacity="0.65" />

      {/* Eyes */}
      <circle cx="25" cy="36" r="3.2" fill="#1E293B" />
      <circle cx="24" cy="35" r="1.3" fill="#FFFFFF" />

      <circle cx="39" cy="36" r="3.2" fill="#1E293B" />
      <circle cx="38" cy="35" r="1.3" fill="#FFFFFF" />

      {/* Pink nose & bunny teeth */}
      <polygon points="30,41 34,41 32,43" fill="#FB7185" />
      <path d="M32 43v2m-2.5 0a2.5 2.5 0 0 0 5 0" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="30.5" y="45" width="3" height="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" rx="0.5" />
    </svg>
  );
}

export function RocketSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Blasting Flames */}
      <polygon points="28,48 36,48 32,58" fill="#F59E0B" />
      <polygon points="30,48 34,48 32,54" fill="#FDE047" />

      {/* Red Booster Fins */}
      <polygon points="22,36 14,48 24,46" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="42,36 50,48 40,46" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />

      {/* Fuselage / Rocket Body */}
      <path d="M32 10 C22 22 22 42 24 48 L40 48 C42 42 42 22 32 10 Z" fill="#F8FAFC" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Red Nosecone */}
      <path d="M32 10 C27 16 26 21 26 23 L38 23 C38 21 37 16 32 10 Z" fill="#EF4444" />

      {/* Cyan Stripe */}
      <rect x="23.5" y="42" width="17" height="3.5" fill="#06B6D4" />

      {/* Glass Porthole Window with Happy Astronaut Star */}
      <circle cx="32" cy="32" r="6.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4.5" fill="#E0F2FE" />
      <circle cx="30.5" cy="31" r="0.9" fill="#0369A1" />
      <circle cx="33.5" cy="31" r="0.9" fill="#0369A1" />
      <path d="M31 33.5a1.5 1.5 0 0 0 2 0" stroke="#0369A1" strokeWidth="0.9" strokeLinecap="round" fill="none" />

      {/* Tiny Cosmic Stars floating */}
      <path d="M15 20l1 2 2 1-2 1-1 2-1-2-2-1 2-1z M48 24l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="#FBBF24" />
    </svg>
  );
}

export function StarSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Chubby 5-point Star */}
      <path d="M32 8 L37.5 22.5 L53 23.5 L41 33.5 L45 49 L32 40 L19 49 L23 33.5 L11 23.5 L26.5 22.5 Z" fill="#FACC15" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 12 L36.5 23.5 L49 24.5 L39.5 32.5 L42.5 45 L32 38 L21.5 45 L24.5 32.5 L15 24.5 L27.5 23.5 Z" fill="#FDE047" opacity="0.6" />

      {/* Cheeks */}
      <circle cx="24" cy="32" r="3.2" fill="#FB7185" opacity="0.75" />
      <circle cx="40" cy="32" r="3.2" fill="#FB7185" opacity="0.75" />

      {/* Anime Sparkle Eyes */}
      <ellipse cx="27" cy="27" rx="2.5" ry="3.5" fill="#1E293B" />
      <circle cx="26" cy="25.5" r="1.3" fill="#FFFFFF" />
      <circle cx="28" cy="28.5" r="0.6" fill="#FFFFFF" />

      <ellipse cx="37" cy="27" rx="2.5" ry="3.5" fill="#1E293B" />
      <circle cx="36" cy="25.5" r="1.3" fill="#FFFFFF" />
      <circle cx="38" cy="28.5" r="0.6" fill="#FFFFFF" />

      {/* Happy smile */}
      <path d="M30 32 Q32 36 34 32 Z" fill="#E11D48" />

      {/* Magic twinkles */}
      <circle cx="16" cy="16" r="1.8" fill="#FDE047" />
      <circle cx="48" cy="15" r="1.5" fill="#FDE047" />
    </svg>
  );
}

export function SunSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* 8 Sunbeams */}
      <circle cx="32" cy="10" r="4.5" fill="#F59E0B" />
      <circle cx="48" cy="16" r="4" fill="#FB923C" />
      <circle cx="54" cy="32" r="4.5" fill="#F59E0B" />
      <circle cx="48" cy="48" r="4" fill="#FB923C" />
      <circle cx="32" cy="54" r="4.5" fill="#F59E0B" />
      <circle cx="16" cy="48" r="4" fill="#FB923C" />
      <circle cx="10" cy="32" r="4.5" fill="#F59E0B" />
      <circle cx="16" cy="16" r="4" fill="#FB923C" />

      {/* Sun Face Disc */}
      <circle cx="32" cy="32" r="18" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Cheeks */}
      <circle cx="22" cy="36" r="3.5" fill="#F87171" opacity="0.65" />
      <circle cx="42" cy="36" r="3.5" fill="#F87171" opacity="0.65" />

      {/* Winking & Smiling Face */}
      <path d="M22 28 c2-2 5-2 7 0" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="28" r="3" fill="#78350F" />
      <circle cx="37" cy="27" r="1.2" fill="#FFFFFF" />

      <path d="M27 34 Q32 40 37 34" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function MoonSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Glowing Crescent */}
      <path d="M42 12 C32 12 24 20 24 32 C24 44 32 52 42 52 C30 50 20 40 20 32 C20 24 30 14 42 12 Z" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="28" cy="30" r="2.2" fill="#1E1B4B" />
      <circle cx="27.5" cy="29.5" r="0.8" fill="#FFFFFF" />
      <path d="M26 35 c1.5 1.5 3.5 1.5 5 0" stroke="#78350F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="33" r="2" fill="#FB7185" opacity="0.6" />
      <path d="M44 24l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="#FEF08A" />
    </svg>
  );
}

export function CloudSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Puffy Cloud */}
      <path d="M20 42 h26 a10 10 0 0 0 4 -19 a13 13 0 0 0 -24 -4 a11 11 0 0 0 -6 23 Z" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="26" cy="34" r="2.5" fill="#0369A1" />
      <circle cx="25" cy="33" r="0.9" fill="#FFFFFF" />
      <circle cx="38" cy="34" r="2.5" fill="#0369A1" />
      <circle cx="37" cy="33" r="0.9" fill="#FFFFFF" />
      <path d="M29 38 a3 3 0 0 0 6 0" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="36" r="2.5" fill="#F472B6" opacity="0.6" />
      <circle cx="42" cy="36" r="2.5" fill="#F472B6" opacity="0.6" />
    </svg>
  );
}

export function LeafSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Green Leaf */}
      <path d="M16 48 C16 48 20 20 48 16 C48 16 48 44 20 48 Z" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M16 48 C24 40 34 30 48 16" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      {/* Ladybug on leaf */}
      <circle cx="30" cy="32" r="5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="28" cy="30" r="1.5" fill="#18181B" />
      <circle cx="32" cy="33" r="1" fill="#18181B" />
      <circle cx="29" cy="34" r="1" fill="#18181B" />
    </svg>
  );
}

export function SnowSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Snowflake arms */}
      <path d="M32 10v44 M10 32h44 M16 16l32 32 M16 48l32-32" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      {/* Center smiley circle */}
      <circle cx="32" cy="32" r="9" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
      <circle cx="29" cy="30" r="1.3" fill="#0369A1" />
      <circle cx="35" cy="30" r="1.3" fill="#0369A1" />
      <path d="M30 34 a2 2 0 0 0 4 0" stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const stickers: Record<
  StorybookAvatarId,
  ComponentType<{ size?: number }>
> = {
  lion: LionSticker,
  owl: OwlSticker,
  bear: BearSticker,
  wolf: WolfSticker,
  falcon: FalconSticker,
  fox: FoxSticker,
  whale: WhaleSticker,
  cat: CatSticker,
  rabbit: RabbitSticker,
  rocket: RocketSticker,
  star: StarSticker,
  sun: SunSticker,
  moon: MoonSticker,
  cloud: CloudSticker,
  leaf: LeafSticker,
  snow: SnowSticker,
};

export function Avatar({
  avatar,
  size = 48,
  label,
}: {
  avatar: AvatarId;
  size?: number;
  label?: string;
}) {
  const Sticker = stickers[avatar] || stickers.sun;
  const colors = AVATAR_COLORS[avatar] || AVATAR_COLORS.sun;

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Sticker size={Math.round(size * 0.92)} />
    </span>
  );
}
