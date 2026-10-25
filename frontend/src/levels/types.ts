export type LevelId =
  | "room01"
  | "room05"
  | "room11"
  | "room12"
  | "room17"
  | "room22"
  | "room23"
  | "room27"
  | "room33"
  | "room34"
  | "room40"
  | "room44"
  | "room45"
  | "room50"
  | "room55"
  | "room56"
  | "room61"
  | "room66"
  | "room76"
  | "room72"
  | "room77"
  | "room67"
  | "room78"
  | "room83"
  | "room88"
  | "room89"
  | "room99";

export type LevelDefinition = {
  id: LevelId;
  number: number;
  title: string;
  description: string;
  enabled: boolean;
};
