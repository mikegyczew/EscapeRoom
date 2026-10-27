export type StoryRoomContent = {
  contentKey: string;
  text: string;
};

export type StoryRoomCatalogItem = {
  id: string;
  key: string;
  roomNumber: number;
  order: number;
  contents: StoryRoomContent[];
};

export type StoryCatalogItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  rooms: StoryRoomCatalogItem[];
};

export type StoryProgress = {
  storyId: string;
  currentStoryRoomId: string | null;
  completedAt: string | null;
  completedPuzzleInstanceIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStory(value: unknown): StoryCatalogItem {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.key !== "string" ||
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    !Array.isArray(value.rooms)
  ) {
    throw new Error("Serwer scenariuszy zwrócił nieprawidłową strukturę.");
  }

  const rooms = value.rooms.map((room): StoryRoomCatalogItem => {
    if (
      !isRecord(room) ||
      typeof room.id !== "string" ||
      typeof room.key !== "string" ||
      typeof room.roomNumber !== "number" ||
      !Number.isInteger(room.roomNumber) ||
      typeof room.order !== "number" ||
      !Number.isInteger(room.order) ||
      !Array.isArray(room.contents)
    ) {
      throw new Error("Serwer zwrócił nieprawidłową definicję pokoju.");
    }

    const contents = room.contents.map((content): StoryRoomContent => {
      if (
        !isRecord(content) ||
        typeof content.contentKey !== "string" ||
        typeof content.text !== "string"
      ) {
        throw new Error("Serwer zwrócił nieprawidłowy blok treści pokoju.");
      }

      return { contentKey: content.contentKey, text: content.text };
    });

    return {
      id: room.id,
      key: room.key,
      roomNumber: room.roomNumber,
      order: room.order,
      contents,
    };
  });

  return {
    id: value.id,
    key: value.key,
    name: value.name,
    description: value.description,
    rooms,
  };
}

export async function fetchStories(
  language: string,
  signal: AbortSignal,
): Promise<StoryCatalogItem[]> {
  const response = await fetch(`/api/stories/${language}`, { signal });
  if (!response.ok) {
    throw new Error(`Serwer scenariuszy odpowiedział kodem ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.stories)) {
    throw new Error("Serwer scenariuszy zwrócił nieprawidłowy format.");
  }

  return body.stories.map(parseStory);
}

export async function fetchStoryProgress(
  storyId: string,
  signal: AbortSignal,
): Promise<StoryProgress> {
  const response = await fetch(
    `/api/stories/${encodeURIComponent(storyId)}/progress`,
    { credentials: "include", signal },
  );
  if (!response.ok) {
    throw new Error(`Serwer postępu odpowiedział kodem ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    typeof body.storyId !== "string" ||
    !(typeof body.currentStoryRoomId === "string" || body.currentStoryRoomId === null) ||
    !(typeof body.completedAt === "string" || body.completedAt === null) ||
    !Array.isArray(body.completedPuzzleInstanceIds) ||
    !body.completedPuzzleInstanceIds.every((id) => typeof id === "string")
  ) {
    throw new Error("Serwer postępu zwrócił nieprawidłowy format.");
  }

  return {
    storyId: body.storyId,
    currentStoryRoomId: body.currentStoryRoomId,
    completedAt: body.completedAt,
    completedPuzzleInstanceIds: body.completedPuzzleInstanceIds,
  };
}

export async function submitPuzzleAnswer(
  puzzleInstanceId: string,
  answer: string,
): Promise<boolean> {
  const response = await fetch(
    `/api/puzzles/${encodeURIComponent(puzzleInstanceId)}/check`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: answer }),
    },
  );
  if (!response.ok) {
    throw new Error(`Serwer weryfikacji odpowiedział kodem ${response.status}.`);
  }

  const body: unknown = await response.json();
  if (
    !isRecord(body) ||
    typeof body.correct !== "boolean" ||
    typeof body.complete !== "boolean"
  ) {
    throw new Error("Serwer weryfikacji zwrócił nieprawidłowy format.");
  }

  return body.correct && body.complete;
}
