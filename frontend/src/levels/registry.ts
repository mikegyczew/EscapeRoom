import room01 from "./Room01";
import room05 from "./Room05";
import room11 from "./Room11";
import room12 from "./Room12";
import room17 from "./Room17";
import room22 from "./Room22";
import room23 from "./Room23";
import room27 from "./Room27";
import room33 from "./Room33";
import room34 from "./Room34";
import room40 from "./Room40";
import room44 from "./Room44";
import room45 from "./Room45";
import room50 from "./Room50";
import room55 from "./Room55";
import room56 from "./Room56";
import room61 from "./Room61";
import room66 from "./Room66";
import room76 from "./Room76";
import room72 from "./Room72";
import room77 from "./Room77";
import room67 from "./Room67";
import room78 from "./Room78";
import room83 from "./Room83";
import room88 from "./Room88";
import room89 from "./Room89";
import room99 from "./Room99";
import type { LevelDefinition, LevelId } from "./types";

// Kolejność wpisów wyznacza kolejność kampanii. Każdy poziom można wyłączyć
// przez enabled: false w jego własnym folderze.
export const LEVELS: LevelDefinition[] = [
  room01,
  room05,
  room11,
  room12,
  room17,
  room22,
  room23,
  room27,
  room33,
  room34,
  room40,
  room44,
  room45,
  room50,
  room55,
  room56,
  room61,
  room66,
  room76,
  room72,
  room77,
  room67,
  room78,
  room83,
  room88,
  room89,
  room99,
];

export const ENABLED_LEVELS: LevelDefinition[] = getEnabledLevels();
export const ACTIVE_LEVEL_COUNT = ENABLED_LEVELS.length;

export function getEnabledLevels(): LevelDefinition[] {
  return LEVELS.filter((level) => level.enabled);
}

export function isLevelEnabled(levelId: LevelId): boolean {
  return ENABLED_LEVELS.some((level) => level.id === levelId);
}

export function getNextEnabledLevel(
  completedLevelId: LevelId,
): LevelDefinition | undefined {
  const completedIndex = ENABLED_LEVELS.findIndex(
    (level) => level.id === completedLevelId,
  );

  if (completedIndex < 0) return undefined;

  return ENABLED_LEVELS[completedIndex + 1];
}
