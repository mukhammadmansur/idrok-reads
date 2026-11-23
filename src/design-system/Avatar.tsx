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
   ORGANIC, ROUNDED, TELEGRAM-STYLE STICKERS (ZERO SHARP POLYGONS!)
   ========================================================================== */

/** 1. Jasur Sher — Chubby cartoon lion with rounded flower mane */
export function LionSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Fluffy rounded mane lobes (overlapping circles) */}
      <circle cx="32" cy="15" r="9" fill="#F59E0B" />
      <circle cx="45" cy="20" r="9" fill="#D97706" />
      <circle cx="50" cy="34" r="9" fill="#F59E0B" />
      <circle cx="45" cy="47" r="9" fill="#D97706" />
      <circle cx="32" cy="51" r="9" fill="#F59E0B" />
      <circle cx="19" cy="47" r="9" fill="#D97706" />
      <circle cx="14" cy="34" r="9" fill="#F59E0B" />
      <circle cx="19" cy="20" r="9" fill="#D97706" />

      {/* Round ears */}
      <circle cx="21" cy="21" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="21" cy="21" r="3.5" fill="#FDE68A" />
      <circle cx="43" cy="21" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="43" cy="21" r="3.5" fill="#FDE68A" />

      {/* Chubby face disc */}
      <circle cx="32" cy="34" r="17.5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Soft rosy cheeks */}
      <circle cx="22" cy="39" r="4" fill="#F87171" opacity="0.6" />
      <circle cx="42" cy="39" r="4" fill="#F87171" opacity="0.6" />

      {/* Shiny round eyes */}
      <circle cx="25.5" cy="31" r="3.2" fill="#1E293B" />
      <circle cx="24.5" cy="29.8" r="1.3" fill="#FFFFFF" />
      <circle cx="26.8" cy="32.2" r="0.6" fill="#FFFFFF" />

      <circle cx="38.5" cy="31" r="3.2" fill="#1E293B" />
      <circle cx="37.5" cy="29.8" r="1.3" fill="#FFFFFF" />
      <circle cx="39.8" cy="32.2" r="0.6" fill="#FFFFFF" />

      {/* Smooth rounded muzzle */}
      <ellipse cx="32" cy="39.5" rx="6" ry="4.5" fill="#FEF3C7" />
      <ellipse cx="32" cy="37.5" rx="2.5" ry="1.8" fill="#78350F" />
      <path d="M32 39.3v1.8m-2.2 0a2.2 2.2 0 0 0 4.4 0" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 2. Dono Ukki — Round chubby owl with big starry eyes */
export function OwlSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Rounded body */}
      <ellipse cx="32" cy="36" rx="19" ry="21" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Rounded soft ear tufts (bezier curves, no sharp points!) */}
      <path d="M19 22 C16 15 21 12 24 15 C26 17 25 21 24 23 Z" fill="#6D28D9" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M45 22 C48 15 43 12 40 15 C38 17 39 21 40 23 Z" fill="#6D28D9" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Belly plate */}
      <ellipse cx="32" cy="41" rx="14" ry="13" fill="#EDE9FE" />
      <path d="M28 42c2 2 6 2 8 0m-9 4c2 2 6 2 8 0" stroke="#C4B5FD" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Big anime owl eyes */}
      <circle cx="23.5" cy="29.5" r="7.5" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
      <circle cx="23.5" cy="29.5" r="5" fill="#FBBF24" />
      <circle cx="23.5" cy="29.5" r="3.2" fill="#1E1B4B" />
      <circle cx="22" cy="28" r="1.4" fill="#FFFFFF" />

      <circle cx="40.5" cy="29.5" r="7.5" fill="#FFFFFF" stroke="#DDD6FE" strokeWidth="1.5" />
      <circle cx="40.5" cy="29.5" r="5" fill="#FBBF24" />
      <circle cx="40.5" cy="29.5" r="3.2" fill="#1E1B4B" />
      <circle cx="39" cy="28" r="1.4" fill="#FFFFFF" />

      {/* Smooth rounded drop beak */}
      <path d="M30 33 Q32 31 34 33 Q33.5 39 32 39 Q30.5 39 30 33 Z" fill="#F59E0B" />

      {/* Cheeks */}
      <circle cx="16" cy="35" r="3" fill="#F472B6" opacity="0.6" />
      <circle cx="48" cy="35" r="3" fill="#F472B6" opacity="0.6" />
    </svg>
  );
}

/** 3. Polvon Ayiq — Chubby teddy bear with soft ears and button nose */
export function BearSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Round teddy ears */}
      <circle cx="17" cy="20" r="8" fill="#92400E" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="17" cy="20" r="4.5" fill="#FDE68A" />
      <circle cx="47" cy="20" r="8" fill="#92400E" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="47" cy="20" r="4.5" fill="#FDE68A" />

      {/* Round head */}
      <circle cx="32" cy="35" r="18.5" fill="#B45309" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Soft rounded muzzle */}
      <ellipse cx="32" cy="40" rx="9" ry="7" fill="#FEF3C7" />

      {/* Black button nose & smile */}
      <ellipse cx="32" cy="37" rx="3.2" ry="2.2" fill="#1F2937" />
      <circle cx="31" cy="36.3" r="0.8" fill="#FFFFFF" />
      <path d="M32 39.2v2m-3 0a3 3 0 0 0 6 0" stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <circle cx="21" cy="39" r="3.5" fill="#F87171" opacity="0.55" />
      <circle cx="43" cy="39" r="3.5" fill="#F87171" opacity="0.55" />

      {/* Eyes */}
      <circle cx="25" cy="30" r="3" fill="#1F2937" />
      <circle cx="24" cy="29" r="1.2" fill="#FFFFFF" />
      <circle cx="39" cy="30" r="3" fill="#1F2937" />
      <circle cx="38" cy="29" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

/** 4. Bo‘rivoy — Friendly husky/wolf pup with smooth curved ears */
export function WolfSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Curved rounded ears (no sharp points!) */}
      <path d="M16 23 C13 16 17 9 22 12 C25 14 26 21 25 24 Z" fill="#475569" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M17 21 C15 17 18 13 21 14 C23 15 24 19 23 21 Z" fill="#FDA4AF" />
      <path d="M48 23 C51 16 47 9 42 12 C39 14 38 21 39 24 Z" fill="#475569" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M47 21 C49 17 46 13 43 14 C41 15 40 19 41 21 Z" fill="#FDA4AF" />

      {/* Round head */}
      <circle cx="32" cy="35" r="18" fill="#64748B" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Fluffy rounded cheek fur patches */}
      <path d="M15 36 C13 32 16 28 20 30 C20 37 17 42 15 36 Z" fill="#F1F5F9" />
      <path d="M49 36 C51 32 48 28 44 30 C44 37 47 42 49 36 Z" fill="#F1F5F9" />

      {/* Soft rounded muzzle */}
      <ellipse cx="32" cy="40.5" rx="8" ry="6" fill="#F8FAFC" />
      <ellipse cx="32" cy="38" rx="2.5" ry="1.8" fill="#1E293B" />
      <path d="M32 39.8v1.8m-2 0a2 2 0 0 0 4 0" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Amber friendly eyes */}
      <circle cx="25" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="25" cy="30" r="2" fill="#1E293B" />
      <circle cx="24.2" cy="29.2" r="0.8" fill="#FFFFFF" />

      <circle cx="39" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="39" cy="30" r="2" fill="#1E293B" />
      <circle cx="38.2" cy="29.2" r="0.8" fill="#FFFFFF" />
    </svg>
  );
}

/** 5. Lochin — Chubby cute cartoon falcon with curved beak */
export function FalconSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Body & head */}
      <circle cx="32" cy="35" r="18.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Rounded crest tuft */}
      <path d="M28 17 C30 11 36 12 36 16 C39 12 43 14 42 18" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Soft rounded white eye mask */}
      <ellipse cx="32" cy="36" rx="14" ry="11" fill="#F0F9FF" />

      {/* Curved smooth golden beak */}
      <path d="M29 33 Q32 31 35 33 Q34 40 32 40 Q30 40 29 33 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />

      {/* Eyes */}
      <circle cx="25.5" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="25.5" cy="30" r="2" fill="#0F172A" />
      <circle cx="24.5" cy="29" r="0.9" fill="#FFFFFF" />

      <circle cx="38.5" cy="30" r="3.2" fill="#F59E0B" />
      <circle cx="38.5" cy="30" r="2" fill="#0F172A" />
      <circle cx="37.5" cy="29" r="0.9" fill="#FFFFFF" />

      {/* Cheeks */}
      <circle cx="20" cy="36" r="2.8" fill="#FB7185" opacity="0.5" />
      <circle cx="44" cy="36" r="2.8" fill="#FB7185" opacity="0.5" />
    </svg>
  );
}

/** 6. Tulkivoy — Cute chubby fox with soft rounded ears and fluffy cheeks */
export function FoxSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Curved rounded fox ears */}
      <path d="M16 24 C13 16 17 9 22 11 C26 13 26 21 25 25 Z" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M17 18 C15 13 18 10 21 12 C23 13 23 18 22 19 Z" fill="#431407" />
      <circle cx="21" cy="19" r="2" fill="#FECDD3" />

      <path d="M48 24 C51 16 47 9 42 11 C38 13 38 21 39 25 Z" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M47 18 C49 13 46 10 43 12 C41 13 41 18 42 19 Z" fill="#431407" />
      <circle cx="43" cy="19" r="2" fill="#FECDD3" />

      {/* Round orange head */}
      <circle cx="32" cy="36" r="18" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Fluffy rounded white cheeks */}
      <path d="M32 49 C22 49 17 41 17 35 C17 29 25 27 32 32 C39 27 47 29 47 35 C47 41 42 49 32 49 Z" fill="#FFF7ED" />

      {/* Cheerful curved smiling eyes */}
      <path d="M23 30 Q26 27 29 30" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M35 30 Q38 27 41 30" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />

      {/* Shiny round nose */}
      <circle cx="32" cy="44" r="2.5" fill="#18181B" />
      <circle cx="31.2" cy="43.2" r="0.7" fill="#FFFFFF" />

      {/* Rosy blush */}
      <circle cx="22" cy="37" r="3.2" fill="#FB7185" opacity="0.65" />
      <circle cx="42" cy="37" r="3.2" fill="#FB7185" opacity="0.65" />
    </svg>
  );
}

/** 7. Kitvoy — Round baby whale with bubbling water spout */
export function WhaleSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Smooth rounded water droplets */}
      <circle cx="26" cy="8" r="2" fill="#67E8F9" />
      <circle cx="32" cy="5" r="2.4" fill="#38BDF8" />
      <circle cx="38" cy="8" r="2" fill="#67E8F9" />
      <path d="M32 16 Q32 10 28 8 M32 16 Q32 9 32 6 M32 16 Q32 10 36 8" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Whale body: smooth organic curve */}
      <path d="M14 36 C14 25 24 21 37 21 C47 21 53 27 53 35 C53 43 42 46 32 46 C21 46 14 43 14 36 Z" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Rounded tail */}
      <path d="M15 39 C10 42 8 46 10 49 C13 47 16 44 18 41 Z" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* White rounded underbelly */}
      <path d="M22 37 C28 37 38 38 45 43 C38 46 22 46 17 42 C19 39 21 37 22 37 Z" fill="#E0F2FE" />

      {/* Smiling eye */}
      <circle cx="43" cy="31" r="3" fill="#0F172A" />
      <circle cx="42" cy="30" r="1.1" fill="#FFFFFF" />

      {/* Sweet smile */}
      <path d="M41 36 Q44 38 47 36" stroke="#0369A1" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Rosy blush */}
      <circle cx="37" cy="36" r="3" fill="#F472B6" opacity="0.65" />

      {/* Little side fin */}
      <ellipse cx="31" cy="39" rx="4.5" ry="2.2" fill="#0284C7" transform="rotate(-15 31 39)" />
    </svg>
  );
}

/** 8. Mushukvoy — Kawaii kitten with round ears and emerald eyes */
export function CatSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Rounded kitten ears (no sharp triangles!) */}
      <path d="M17 24 C15 17 19 13 23 15 C26 17 26 22 25 25 Z" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M18 21 C17 17 19 15 22 16 C24 17 24 20 23 22 Z" fill="#FCE7F3" />
      <path d="M47 24 C49 17 45 13 41 15 C38 17 38 22 39 25 Z" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M46 21 C47 17 45 15 42 16 C40 17 40 20 41 22 Z" fill="#FCE7F3" />

      {/* Round head */}
      <circle cx="32" cy="36" r="18" fill="#FB7185" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* White cheek puffs */}
      <circle cx="21" cy="40" r="4" fill="#FFF1F2" />
      <circle cx="43" cy="40" r="4" fill="#FFF1F2" />

      {/* Emerald eyes */}
      <ellipse cx="24" cy="31.5" rx="3.5" ry="4" fill="#10B981" />
      <circle cx="24" cy="31.5" r="2.2" fill="#064E3B" />
      <circle cx="23" cy="30" r="1.1" fill="#FFFFFF" />

      <ellipse cx="40" cy="31.5" rx="3.5" ry="4" fill="#10B981" />
      <circle cx="40" cy="31.5" r="2.2" fill="#064E3B" />
      <circle cx="39" cy="30" r="1.1" fill="#FFFFFF" />

      {/* Heart nose & smile */}
      <circle cx="32" cy="38" r="2" fill="#E11D48" />
      <path d="M32 39.5v1.8m-2.2 0a2.2 2.2 0 0 0 4.4 0" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Soft whiskers */}
      <path d="M16 38h4 M16 41h4 M48 38h-4 M48 41h-4" stroke="#FFF1F2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** 9. Quyonvoy — Fluffy white bunny with soft round ears */
export function RabbitSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Soft rounded upright bunny ears */}
      <ellipse cx="24" cy="18" rx="5" ry="13" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" transform="rotate(-6 24 18)" />
      <ellipse cx="24" cy="18" rx="2.8" ry="9" fill="#FDA4AF" transform="rotate(-6 24 18)" />

      <ellipse cx="40" cy="18" rx="5" ry="13" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" transform="rotate(6 40 18)" />
      <ellipse cx="40" cy="18" rx="2.8" ry="9" fill="#FDA4AF" transform="rotate(6 40 18)" />

      {/* Chubby round bunny face */}
      <circle cx="32" cy="38" r="17.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />

      {/* Big shiny eyes */}
      <circle cx="25" cy="34" r="3.2" fill="#1E293B" />
      <circle cx="24" cy="33" r="1.3" fill="#FFFFFF" />
      <circle cx="39" cy="34" r="3.2" fill="#1E293B" />
      <circle cx="38" cy="33" r="1.3" fill="#FFFFFF" />

      {/* Pink cheeks */}
      <circle cx="20" cy="41" r="3.8" fill="#FB7185" opacity="0.65" />
      <circle cx="44" cy="41" r="3.8" fill="#FB7185" opacity="0.65" />

      {/* Cute nose & tiny teeth */}
      <circle cx="32" cy="39.5" r="2" fill="#FB7185" />
      <path d="M32 41v2m-2.2 0a2.2 2.2 0 0 0 4.4 0" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <rect x="30.5" y="44" width="3" height="2.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" rx="0.5" />
    </svg>
  );
}

/** 10. Fazogir — Retro cartoon space rocket with rounded curves */
export function RocketSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* Soft rounded flame puffs */}
      <circle cx="32" cy="53" r="5" fill="#F59E0B" />
      <circle cx="32" cy="51" r="3" fill="#FDE047" />

      {/* Rounded booster fins */}
      <path d="M22 36 Q15 42 16 47 Q22 47 25 45 Z" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M42 36 Q49 42 48 47 Q42 47 39 45 Z" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.8" />

      {/* Bullet-shaped smooth rocket body */}
      <path d="M32 10 C24 18 23 38 25 46 Q32 48 39 46 C41 38 40 18 32 10 Z" fill="#F8FAFC" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Red nosecone with rounded top */}
      <path d="M32 10 C28 15 26 20 26 23 Q32 25 38 23 C38 20 36 15 32 10 Z" fill="#EF4444" />

      {/* Cyan belt stripe */}
      <rect x="24.5" y="41" width="15" height="3.5" rx="1.5" fill="#06B6D4" />

      {/* Glass porthole with happy star inside */}
      <circle cx="32" cy="32" r="6" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4.2" fill="#E0F2FE" />
      <circle cx="30.5" cy="31" r="0.8" fill="#0369A1" />
      <circle cx="33.5" cy="31" r="0.8" fill="#0369A1" />
      <path d="M31 33.2a1.2 1.2 0 0 0 2 0" stroke="#0369A1" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 11. Yulduzcha — Chubby kawaii marshmallow star (ZERO sharp polygon corners!) */
export function StarSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* 5-pointed chubby star with smooth rounded tips and valleys */}
      <path
        d="M32 8 C33.5 12 36 18 38 20 C42 20.5 49 22 51 24 C50 28 44 32 43 35 C44 39 46 47 44 49 C40 47 35 43 32 44 C29 43 24 47 20 49 C18 47 20 39 21 35 C20 32 14 28 13 24 C15 22 22 20.5 26 20 C28 18 30.5 12 32 8 Z"
        fill="#FACC15"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Cheeks */}
      <circle cx="24" cy="33" r="3.5" fill="#FB7185" opacity="0.75" />
      <circle cx="40" cy="33" r="3.5" fill="#FB7185" opacity="0.75" />

      {/* Anime sparkle eyes */}
      <ellipse cx="27" cy="28" rx="2.5" ry="3.5" fill="#1E293B" />
      <circle cx="26" cy="26.5" r="1.3" fill="#FFFFFF" />
      <circle cx="28" cy="29.5" r="0.6" fill="#FFFFFF" />

      <ellipse cx="37" cy="28" rx="2.5" ry="3.5" fill="#1E293B" />
      <circle cx="36" cy="26.5" r="1.3" fill="#FFFFFF" />
      <circle cx="38" cy="29.5" r="0.6" fill="#FFFFFF" />

      {/* Joyful open mouth with tongue */}
      <path d="M29.5 32 Q32 37 34.5 32 Z" fill="#E11D48" />

      {/* Twinkles */}
      <circle cx="16" cy="16" r="1.8" fill="#FDE047" />
      <circle cx="48" cy="15" r="1.6" fill="#FDE047" />
    </svg>
  );
}

/** 12. Quyosh — Warm smiling sun with round bubble rays */
export function SunSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      {/* 8 Soft rounded bubble rays */}
      <circle cx="32" cy="11" r="4.5" fill="#F59E0B" />
      <circle cx="47" cy="17" r="4" fill="#FB923C" />
      <circle cx="53" cy="32" r="4.5" fill="#F59E0B" />
      <circle cx="47" cy="47" r="4" fill="#FB923C" />
      <circle cx="32" cy="53" r="4.5" fill="#F59E0B" />
      <circle cx="17" cy="47" r="4" fill="#FB923C" />
      <circle cx="11" cy="32" r="4.5" fill="#F59E0B" />
      <circle cx="17" cy="17" r="4" fill="#FB923C" />

      {/* Sun face disc */}
      <circle cx="32" cy="32" r="17.5" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Soft rosy cheeks */}
      <circle cx="22" cy="36" r="3.5" fill="#F87171" opacity="0.65" />
      <circle cx="42" cy="36" r="3.5" fill="#F87171" opacity="0.65" />

      {/* Winking & smiling face */}
      <path d="M22 28 Q25 25 28 28" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="38" cy="28" r="3" fill="#78350F" />
      <circle cx="37" cy="27" r="1.2" fill="#FFFFFF" />

      <path d="M27 34 Q32 40 37 34" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 13. Oycha — Smiling golden crescent */
export function MoonSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      <path d="M42 12 C32 12 24 20 24 32 C24 44 32 52 42 52 C30 50 20 40 20 32 C20 24 30 14 42 12 Z" fill="#FDE047" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="28" cy="30" r="2.2" fill="#1E1B4B" />
      <circle cx="27.5" cy="29.5" r="0.8" fill="#FFFFFF" />
      <path d="M26 35 Q28 37 31 35" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="33" r="2" fill="#FB7185" opacity="0.6" />
    </svg>
  );
}

/** 14. Bulutvoy — Fluffy white & sky-blue cloud */
export function CloudSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      <path d="M20 42 h26 a10 10 0 0 0 4 -19 a13 13 0 0 0 -24 -4 a11 11 0 0 0 -6 23 Z" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="26" cy="33" r="2.5" fill="#0369A1" />
      <circle cx="25" cy="32" r="0.9" fill="#FFFFFF" />
      <circle cx="38" cy="33" r="2.5" fill="#0369A1" />
      <circle cx="37" cy="32" r="0.9" fill="#FFFFFF" />
      <path d="M29 37 a3 3 0 0 0 6 0" stroke="#0284C7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="35" r="2.5" fill="#F472B6" opacity="0.6" />
      <circle cx="42" cy="35" r="2.5" fill="#F472B6" opacity="0.6" />
    </svg>
  );
}

/** 15. Bargcha — Fresh emerald leaf with ladybug */
export function LeafSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      <path d="M16 48 C16 48 20 20 48 16 C48 16 48 44 20 48 Z" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M16 48 C24 40 34 30 48 16" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30" cy="32" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="28" cy="30" r="1.3" fill="#18181B" />
      <circle cx="32" cy="33" r="0.9" fill="#18181B" />
    </svg>
  );
}

/** 16. Qor parchasi — Cute crystalline snowflake */
export function SnowSticker({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={styles.stickerSvg}>
      <path d="M32 10v44 M10 32h44 M16 16l32 32 M16 48l32-32" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
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
      <Sticker size={Math.round(size * 0.94)} />
    </span>
  );
}
