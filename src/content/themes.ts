import type { Theme } from "./types";

export const themes: Theme[] = [
  {
    id: "classic",
    name: "Klassik kitob",
    short: "Klassik",
    description: "Iliq qog‘oz va sokin o‘qish.",
  },
  {
    id: "forest",
    name: "Yashil o‘rmon",
    short: "O‘rmon",
    description: "Po‘stloq muqova, maysali sahifalar va sehrli shu‘la.",
  },
  {
    id: "ice",
    name: "Muz saroyi",
    short: "Muz",
    description: "Kristall muqova, qirov naqshlari va qutb shu‘lasi.",
  },
  {
    id: "holo",
    name: "Gologramma kitob",
    short: "Kelajak",
    description: "Shaffof sahifalar va nurli qirralar.",
  },
];

export const themeById = (id: string) =>
  themes.find((theme) => theme.id === id) ?? themes[0];
