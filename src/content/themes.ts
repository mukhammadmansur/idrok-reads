import type { Theme, ThemeId } from "./types";

export const themeIds = ["classic", "magic", "cyber", "pirate"] as const;

const legacyThemes: Record<string, ThemeId> = {
  forest: "magic",
  ice: "pirate",
  holo: "cyber",
};

export function normalizeTheme(value: unknown): ThemeId | null {
  if (typeof value !== "string") return null;
  if ((themeIds as readonly string[]).includes(value)) return value as ThemeId;
  return legacyThemes[value] ?? null;
}

export const isDarkTheme = (theme: ThemeId) =>
  theme === "magic" || theme === "cyber";

export const themes: Theme[] = [
  {
    id: "classic",
    name: "Oddiy kitob",
    short: "Oddiy",
    description: "Iliq qog‘oz va sokin o‘qish. Hech qanday sehr yo‘q.",
  },
  {
    id: "magic",
    name: "Sehrgar olami",
    short: "Sehr",
    description: "Ukki uchadi, yulduzlar pirpiraydi. Sen sehrli kitob ichidasan.",
  },
  {
    id: "cyber",
    name: "Neon shahar",
    short: "Neon",
    description: "Shaffof kitob, yonib turgan ko‘chalar. Kelajak shahriga tushding.",
  },
  {
    id: "pirate",
    name: "Qaroqchilar dengizi",
    short: "Dengiz",
    description: "Kema tebranadi, to‘lqin uriladi. Xarita ochiq, xazina yaqin.",
  },
];

export const themeById = (id: string) =>
  themes.find((theme) => theme.id === id) ?? themes[0];
