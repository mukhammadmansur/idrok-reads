import type { Theme, ThemeId } from "./types";

export const themeIds = [
  "classic",
  "magic",
  "cyber",
  "pirate",
  "kitty",
  "ghost",
] as const;

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
  theme === "magic" || theme === "cyber" || theme === "ghost";

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
    description: "Sehrli ukki va uchayotgan kitoblar. Sen sehrli qasr kutubxonasidasan.",
  },
  {
    id: "cyber",
    name: "Kosmos olami",
    short: "Kosmos",
    description: "Yulduzlar, sayyoralar va kichik raketa. Sen kosmik kitobni o‘qiyapsan.",
  },
  {
    id: "pirate",
    name: "Qaroqchilar dengizi",
    short: "Dengiz",
    description: "Kema suzib ketmoqda, to‘lqinlar shitirlaydi. Xazina yaqin.",
  },
  {
    id: "kitty",
    name: "Pushti mushukcha",
    short: "Mushukcha",
    description: "Pushti gulzor va shirin mushukcha. Hammadan shirin o‘qish!",
    premium: true,
  },
  {
    id: "ghost",
    name: "Arvoh qaroqchilar",
    short: "Arvoh",
    description: "Tumanli dengizda arvoh kema suzadi. Jasurlar uchun!",
    premium: true,
  },
];

export const themeById = (id: string) =>
  themes.find((theme) => theme.id === id) ?? themes[0];
