import type { LevelDefinition } from "../types";

export type FoundItem = {
  id: string;
  name: string;
  description: string;
  symbol: string;
};

export type Pos = "left" | "top" | "right" | "bottom";
export type ClockRound = Record<Pos, number>;

export const ROUND_TIMES = ["08:30", "04:15", "06:45"];
export const MEMORIZE_MS = 5000;
export const REMIND_MS = 3500;
export const ROTATE_MS = 2500;
export const TOTAL_ROUNDS = 3;
export const LEVEL2_SECONDS = 300;

export const POS: Pos[] = ["left", "top", "right", "bottom"];
export const POS_LABEL: Record<Pos, string> = {
  left: "LEWO",
  top: "GÓRA",
  right: "PRAWO",
  bottom: "DÓŁ",
};
export const POS_SLOT: Record<Pos, number> = {
  left: 10,
  top: 1,
  right: 4,
  bottom: 7,
};

export const ITEMS: FoundItem[] = [
  {
    id: "note",
    name: "Notatka z archiwum",
    description: "Notatka Profesora: „Najważniejsze chwile były zawsze po prawej. Najpierw 8:30, potem 4:15, na końcu 6:45. Nie pomyl krótkiej wskazówki z długą.”",
    symbol: "📜",
  },
  {
    id: "number12",
    name: "Cyfra 12",
    description: "Mosiężna dwunastka, oznaczona jako fragment tarczy z Pokoju 34.",
    symbol: "12",
  },
  {
    id: "number3",
    name: "Cyfra 3",
    description: "Trójka wyryta w kawałku mosiądzu, odnaleziona w zapisie pamięci.",
    symbol: "3",
  },
  {
    id: "number6",
    name: "Cyfra 6",
    description: "Szóstka znaleziona pod biurkiem zegarmistrza.",
    symbol: "6",
  },
  {
    id: "number9",
    name: "Cyfra 9",
    description: "Dziewiątka ukryta za książką w archiwum.",
    symbol: "9",
  },
  {
    id: "hands",
    name: "Wskazówki zegara",
    description: "Dwie wskazówki zachowane w rekonstrukcji zegara.",
    symbol: "🕰️",
  },
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function makeClockRounds(): ClockRound[] {
  const groups = shuffle([
    [12, 3, 6, 9],
    [2, 5, 8, 11],
    [1, 4, 7, 10],
  ]);

  return groups.map((group) => {
    const offset = Math.floor(Math.random() * 4);
    const round = {} as ClockRound;
    POS.forEach((pos, index) => {
      round[pos] = group[(index + offset) % 4];
    });
    return round;
  });
}

const level: LevelDefinition = {
  id: "room34",
  number: 10,
  title: "Zatrzymana Wskazówka",
  description: "W Pokoju 34 odtwórz zapis czasu i uruchom skrót synaptyczny.",
  enabled: true,
};

export default level;
