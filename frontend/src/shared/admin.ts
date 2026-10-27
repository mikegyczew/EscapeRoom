export type AdminTextTranslation = {
  languageCode: string;
  text: string;
};

export type AdminStoryTranslation = {
  languageCode: string;
  name: string;
  description: string;
};

export type AdminPuzzleTranslation = {
  languageCode: string;
  instruction: string;
  hint1: string | null;
  hint2: string | null;
};

export type AdminRoomContent = {
  id: string;
  contentKey: string;
  contentType: string;
  order: number;
  translations: AdminTextTranslation[];
};

export type AdminPuzzle = {
  id: string;
  type: string;
  configurationVersion: number;
  order: number;
  configuration: string;
  translations: AdminPuzzleTranslation[];
};

export type AdminRoom = {
  id: string;
  key: string;
  roomNumber: number;
  order: number;
  isEnabled: boolean;
  contents: AdminRoomContent[];
  puzzles: AdminPuzzle[];
};

export type AdminStory = {
  id: string;
  key: string;
  isPublished: boolean;
  translations: AdminStoryTranslation[];
  rooms: AdminRoom[];
};

export type AdminLocalizedText = {
  language: string;
  key: string;
  value: string;
};

export type AdminDatabaseTable = {
  name: string;
  label: string;
};

export type AdminDatabasePage = {
  name: string;
  label: string;
  columns: string[];
  rows: unknown[][];
  totalRows: number;
  offset: number;
  limit: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function request(path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "PUT",
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Żądanie panelu administratora nie powiodło się (${response.status}).`;
    try {
      const error: unknown = await response.json();
      if (isRecord(error) && typeof error.message === "string") {
        message = error.message;
      } else if (isRecord(error) && typeof error.detail === "string") {
        message = error.detail;
      }
    } catch {
      // The status code is enough when the server does not return JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) return undefined;
  return await response.json();
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(message);
  return value;
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== "string") throw new Error(message);
  return value;
}

function requireNumber(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(message);
  return value;
}

function requireArray(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(message);
  return value;
}

export async function fetchAdminDatabaseTables(): Promise<AdminDatabaseTable[]> {
  const body = requireArray(await request("/api/admin/database/tables"), "Nieprawidłowa lista tabel.");
  return body.map((item): AdminDatabaseTable => {
    const table = requireRecord(item, "Nieprawidłowa tabela.");
    return {
      name: requireString(table.name, "Brak nazwy tabeli."),
      label: requireString(table.label, "Brak opisu tabeli."),
    };
  });
}

export async function fetchAdminDatabasePage(
  tableName: string,
  offset: number,
  limit = 50,
): Promise<AdminDatabasePage> {
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  const body = requireRecord(
    await request(`/api/admin/database/${encodeURIComponent(tableName)}?${query}`),
    "Nieprawidłowy podgląd tabeli.",
  );
  return {
    name: requireString(body.name, "Brak nazwy tabeli."),
    label: requireString(body.label, "Brak opisu tabeli."),
    columns: requireArray(body.columns, "Nieprawidłowe kolumny tabeli.")
      .map((column) => requireString(column, "Nieprawidłowa nazwa kolumny.")),
    rows: requireArray(body.rows, "Nieprawidłowe wiersze tabeli.")
      .map((row) => requireArray(row, "Nieprawidłowy wiersz.")),
    totalRows: requireNumber(body.totalRows, "Nieprawidłowa liczba wierszy."),
    offset: requireNumber(body.offset, "Nieprawidłowy offset."),
    limit: requireNumber(body.limit, "Nieprawidłowy limit."),
  };
}

export async function updateAdminDatabaseText(
  tableName: string,
  key: Record<string, string>,
  values: Record<string, string | null>,
): Promise<void> {
  await request(
    `/api/admin/database/${encodeURIComponent(tableName)}/text`,
    { key, values },
  );
}

export async function fetchAdminContent(): Promise<AdminStory[]> {
  const body = requireArray(await request("/api/admin/content"), "Nieprawidłowy katalog panelu.");
  return body.map((item): AdminStory => {
    const story = requireRecord(item, "Nieprawidłowy scenariusz w panelu.");
    if (typeof story.isPublished !== "boolean") {
      throw new Error("Nieprawidłowy status publikacji scenariusza.");
    }
    return {
      id: requireString(story.id, "Brak identyfikatora scenariusza."),
      key: requireString(story.key, "Brak klucza scenariusza."),
      isPublished: story.isPublished,
      translations: requireArray(story.translations, "Nieprawidłowe tłumaczenia scenariusza.")
        .map((item) => {
          const translation = requireRecord(item, "Nieprawidłowe tłumaczenie scenariusza.");
          return {
            languageCode: requireString(translation.languageCode, "Brak języka tłumaczenia."),
            name: requireString(translation.name, "Brak nazwy scenariusza."),
            description: requireString(translation.description, "Brak opisu scenariusza."),
          };
        }),
      rooms: requireArray(story.rooms, "Nieprawidłowa lista pokoi.")
        .map((item): AdminRoom => {
          const room = requireRecord(item, "Nieprawidłowy pokój.");
          if (typeof room.isEnabled !== "boolean") throw new Error("Nieprawidłowy status pokoju.");
          return {
            id: requireString(room.id, "Brak identyfikatora pokoju."),
            key: requireString(room.key, "Brak klucza pokoju."),
            roomNumber: requireNumber(room.roomNumber, "Nieprawidłowy numer pokoju."),
            order: requireNumber(room.order, "Nieprawidłowa kolejność pokoju."),
            isEnabled: room.isEnabled,
            contents: requireArray(room.contents, "Nieprawidłowe treści pokoju.")
              .map((contentItem): AdminRoomContent => {
                const content = requireRecord(contentItem, "Nieprawidłowy blok treści.");
                return {
                  id: requireString(content.id, "Brak identyfikatora treści."),
                  contentKey: requireString(content.contentKey, "Brak klucza treści."),
                  contentType: requireString(content.contentType, "Brak typu treści."),
                  order: requireNumber(content.order, "Nieprawidłowa kolejność treści."),
                  translations: requireArray(content.translations, "Nieprawidłowe tłumaczenia treści.")
                    .map((translationItem) => {
                      const translation = requireRecord(translationItem, "Nieprawidłowe tłumaczenie treści.");
                      return {
                        languageCode: requireString(translation.languageCode, "Brak języka tłumaczenia."),
                        text: requireString(translation.text, "Brak tekstu tłumaczenia."),
                      };
                    }),
                };
              }),
            puzzles: requireArray(room.puzzles, "Nieprawidłowe zagadki.")
              .map((puzzleItem): AdminPuzzle => {
                const puzzle = requireRecord(puzzleItem, "Nieprawidłowa zagadka.");
                return {
                  id: requireString(puzzle.id, "Brak identyfikatora zagadki."),
                  type: requireString(puzzle.type, "Brak typu zagadki."),
                  configurationVersion: requireNumber(puzzle.configurationVersion, "Nieprawidłowa wersja konfiguracji."),
                  order: requireNumber(puzzle.order, "Nieprawidłowa kolejność zagadki."),
                  configuration: requireString(puzzle.configuration, "Brak konfiguracji zagadki."),
                  translations: requireArray(puzzle.translations, "Nieprawidłowe tłumaczenia zagadki.")
                    .map((translationItem) => {
                      const translation = requireRecord(translationItem, "Nieprawidłowe tłumaczenie zagadki.");
                      const hint1 = translation.hint1;
                      const hint2 = translation.hint2;
                      if (!(typeof hint1 === "string" || hint1 === null) ||
                          !(typeof hint2 === "string" || hint2 === null)) {
                        throw new Error("Nieprawidłowa podpowiedź zagadki.");
                      }
                      return {
                        languageCode: requireString(translation.languageCode, "Brak języka tłumaczenia."),
                        instruction: requireString(translation.instruction, "Brak instrukcji zagadki."),
                        hint1,
                        hint2,
                      };
                    }),
                };
              }),
          };
        }),
    };
  });
}

export async function fetchAdminTranslations(language: string): Promise<AdminLocalizedText[]> {
  const body = requireArray(
    await request(`/api/admin/translations/${encodeURIComponent(language)}`),
    "Nieprawidłowy słownik tłumaczeń.",
  );
  return body.map((item) => {
    const translation = requireRecord(item, "Nieprawidłowa pozycja słownika.");
    return {
      language: requireString(translation.language, "Brak języka tłumaczenia."),
      key: requireString(translation.key, "Brak klucza tłumaczenia."),
      value: requireString(translation.value, "Brak wartości tłumaczenia."),
    };
  });
}

export async function saveAdminTranslation(
  language: string,
  key: string,
  value: string,
): Promise<void> {
  await request(
    `/api/admin/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}`,
    { value },
  );
}

export async function saveAdminStory(
  storyId: string,
  data: {
    languageCode: string;
    name: string;
    description: string;
    isPublished: boolean;
  },
): Promise<void> {
  await request(`/api/admin/stories/${encodeURIComponent(storyId)}`, data);
}

export async function saveAdminRoom(
  roomId: string,
  data: { roomNumber: number; order: number; isEnabled: boolean },
): Promise<void> {
  await request(`/api/admin/rooms/${encodeURIComponent(roomId)}`, data);
}

export async function saveAdminRoomContent(
  roomId: string,
  data: {
    languageCode: string;
    contentKey: string;
    contentType: string;
    order: number;
    text: string;
  },
): Promise<void> {
  await request(`/api/admin/rooms/${encodeURIComponent(roomId)}/contents`, data);
}

export async function saveAdminPuzzle(
  puzzleId: string,
  data: {
    languageCode: string;
    puzzleType: string;
    configurationVersion: number;
    order: number;
    configuration: string;
    instruction: string;
    hint1: string;
    hint2: string;
  },
): Promise<void> {
  await request(`/api/admin/puzzles/${encodeURIComponent(puzzleId)}`, data);
}
