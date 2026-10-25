import type { LevelDefinition } from "../types";

export type GuessResponse = {
  correct: boolean;
  complete?: boolean;
  nextPosition?: number;
  binary?: string;
  message?: string;
};

export type FirstPuzzleResponse = {
  length: number;
  binaryCodes: string[];
};

const level: LevelDefinition = {
  id: "room01",
  number: 1,
  title: "Pokój Pierwszego Światła",
  description: "Odszyfruj sygnał START i uruchom pierwszą synapsę.",
  enabled: true,
};

export default level;
