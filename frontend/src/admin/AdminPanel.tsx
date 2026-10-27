import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  fetchAdminContent,
  fetchAdminTranslations,
  saveAdminPuzzle,
  saveAdminRoom,
  saveAdminRoomContent,
  saveAdminStory,
  saveAdminTranslation,
  type AdminLocalizedText,
  type AdminPuzzle,
  type AdminRoom,
  type AdminRoomContent,
  type AdminStory,
} from "../shared/admin";
import DatabaseBrowser from "./DatabaseBrowser";
import "./AdminPanel.css";

type AdminPanelProps = {
  language: string;
  onBack: () => void;
};

function selectedTranslation<T extends { languageCode: string }>(
  translations: T[],
  language: string,
): T | undefined {
  return translations.find((translation) => translation.languageCode === language);
}

function uiText(language: string, polish: string, english: string): string {
  return language === "en" ? english : polish;
}

export default function AdminPanel({ language, onBack }: AdminPanelProps) {
  const [section, setSection] = useState<"content" | "database">("content");
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedPuzzleId, setSelectedPuzzleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchAdminContent()
      .then((items) => {
        if (!active) return;
        setStories(items);
        setSelectedStoryId((current) =>
          items.some((story) => story.id === current) ? current : items[0]?.id ?? "",
        );
        setError("");
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error
            ? cause.message
            : uiText(language, "Nie udało się pobrać treści.", "Failed to load content."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [language, refresh]);

  const story = stories.find((item) => item.id === selectedStoryId);
  const room = story?.rooms.find((item) => item.id === selectedRoomId) ?? story?.rooms[0];
  const puzzle = room?.puzzles.find((item) => item.id === selectedPuzzleId) ?? room?.puzzles[0];

  function saved(message: string) {
    setNotice(message);
    setError("");
    setRefresh((current) => current + 1);
  }

  return (
    <section className="screen admin-panel">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">{uiText(language, "ZARZĄDZANIE ESCAPE ROOMEM", "ESCAPE ROOM MANAGEMENT")}</p>
          <h1>{uiText(language, "Panel", "Admin")} <span className="accent">{uiText(language, "administratora", "panel")}</span></h1>
          <p className="lead">{uiText(language, "Zarządzaj scenariuszami, pokojami, tekstami, tłumaczeniami i konfiguracją zagadek.", "Manage stories, rooms, content, translations, and puzzle configuration.")}</p>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">{uiText(language, "Wróć do gry", "Back to game")}</button>
      </header>

      {(error || notice) && (
        <p className={error ? "admin-message is-error" : "admin-message"} role={error ? "alert" : "status"}>
          {error || notice}
        </p>
      )}

      <nav aria-label={uiText(language, "Sekcje panelu", "Admin panel sections")} className="admin-nav">
        <button
          aria-pressed={section === "content"}
          className="secondary-button"
          onClick={() => setSection("content")}
          type="button"
        >
          {uiText(language, "Zarządzanie treścią", "Content management")}
        </button>
        <button
          aria-pressed={section === "database"}
          className="secondary-button"
          onClick={() => setSection("database")}
          type="button"
        >
          {uiText(language, "Podgląd bazy", "Database browser")}
        </button>
      </nav>

      {section === "database" ? (
        <DatabaseBrowser language={language} />
      ) : loading ? (
        <p role="status">{uiText(language, "Ładowanie treści…", "Loading content…")}</p>
      ) : (
        <>
          <div className="admin-selectors">
            <label>
              {uiText(language, "Scenariusz", "Story")}
              <select
                onChange={(event) => {
                  const nextStory = stories.find((item) => item.id === event.target.value);
                  setSelectedStoryId(event.target.value);
                  setSelectedRoomId(nextStory?.rooms[0]?.id ?? "");
                  setSelectedPuzzleId(nextStory?.rooms[0]?.puzzles[0]?.id ?? "");
                }}
                value={selectedStoryId}
              >
                {stories.map((item) => (
                  <option key={item.id} value={item.id}>{item.key}</option>
                ))}
              </select>
            </label>
            <label>
              {uiText(language, "Pokój", "Room")}
              <select
                onChange={(event) => {
                  const nextRoom = story?.rooms.find((item) => item.id === event.target.value);
                  setSelectedRoomId(event.target.value);
                  setSelectedPuzzleId(nextRoom?.puzzles[0]?.id ?? "");
                }}
                value={room?.id ?? ""}
              >
                {story?.rooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.order}. {uiText(language, "Pokój", "Room")} {item.roomNumber} · {item.key}{item.isEnabled ? "" : uiText(language, " (wyłączony)", " (disabled)")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {story && (
            <StoryEditor
              key={`${story.id}-${language}-${refresh}`}
              language={language}
              onSaved={() => saved(uiText(language, "Zapisano scenariusz.", "Story saved."))}
              story={story}
            />
          )}

          {room && (
            <>
              <RoomEditor
                key={`${room.id}-${refresh}`}
                language={language}
                onSaved={() => saved(uiText(language, "Zapisano ustawienia pokoju.", "Room settings saved."))}
                room={room}
              />
              <section className="admin-card">
                <h2>{uiText(language, "Treści pokoju", "Room content")}</h2>
                <p>{uiText(language, "Teksty z tego katalogu obsługują nazwę i opis pokoju w scenariuszu.", "These entries provide the room title and description in the story.")}</p>
                {room.contents.map((content) => (
                  <RoomContentEditor
                    key={`${content.id}-${language}-${refresh}`}
                    content={content}
                    language={language}
                    onSaved={() => saved(uiText(language, `Zapisano treść „${content.contentKey}”.`, `Saved content "${content.contentKey}".`))}
                    roomId={room.id}
                  />
                ))}
                <RoomContentEditor
                  content={null}
                  language={language}
                  onSaved={() => saved(uiText(language, "Dodano treść pokoju.", "Room content added."))}
                  roomId={room.id}
                />
              </section>
              {room.puzzles.length > 0 && (
                <section className="admin-card">
                  <div className="admin-card-heading">
                    <div>
                      <h2>{uiText(language, "Zagadki", "Puzzles")}</h2>
                      <p>{uiText(language, "Konfiguracja rozwiązania jest ukryta przed graczami, ale dostępna dla administratorów.", "Solution configuration is hidden from players and available only to administrators.")}</p>
                    </div>
                    <select
                      aria-label={uiText(language, "Wybierz zagadkę", "Select a puzzle")}
                      onChange={(event) => setSelectedPuzzleId(event.target.value)}
                      value={puzzle?.id ?? ""}
                    >
                      {room.puzzles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.order}. {item.type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {puzzle && (
                    <PuzzleEditor
                      key={`${puzzle.id}-${language}-${refresh}`}
                      language={language}
                      onSaved={() => saved(uiText(language, "Zapisano konfigurację zagadki.", "Puzzle configuration saved."))}
                      puzzle={puzzle}
                    />
                  )}
                </section>
              )}
            </>
          )}

          <TranslationEditor
            key={`${language}-${refresh}`}
            language={language}
            onSaved={() => saved(uiText(language, "Zapisano tłumaczenie. Odśwież widok gry, aby zobaczyć zmianę.", "Translation saved. Refresh the game view to see the change."))}
          />
        </>
      )}
    </section>
  );
}

function StoryEditor({
  story,
  language,
  onSaved,
}: {
  story: AdminStory;
  language: string;
  onSaved: () => void;
}) {
  const translation = selectedTranslation(story.translations, language);
  const [name, setName] = useState(translation?.name ?? "");
  const [description, setDescription] = useState(translation?.description ?? "");
  const [isPublished, setIsPublished] = useState(story.isPublished);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      await saveAdminStory(story.id, { languageCode: language, name, description, isPublished });
      onSaved();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : uiText(language, "Nie udało się zapisać scenariusza.", "Failed to save story."));
    }
  }

  return (
    <form className="admin-card admin-form" onSubmit={(event) => void submit(event)}>
      <h2>{uiText(language, "Scenariusz", "Story")}</h2>
      <label>{uiText(language, "Nazwa", "Name")} ({language})<input maxLength={200} onChange={(event) => setName(event.target.value)} required value={name} /></label>
      <label>{uiText(language, "Opis", "Description")} ({language})<textarea maxLength={4000} onChange={(event) => setDescription(event.target.value)} required rows={3} value={description} /></label>
      <label className="admin-checkbox"><input checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} type="checkbox" /> {uiText(language, "Opublikowany dla graczy", "Published for players")}</label>
      {formError && <p className="admin-message is-error" role="alert">{formError}</p>}
      <button className="primary-button" type="submit">{uiText(language, "Zapisz scenariusz", "Save story")}</button>
    </form>
  );
}

function RoomEditor({
  room,
  language,
  onSaved,
}: {
  room: AdminRoom;
  language: string;
  onSaved: () => void;
}) {
  const [roomNumber, setRoomNumber] = useState(room.roomNumber);
  const [order, setOrder] = useState(room.order);
  const [isEnabled, setIsEnabled] = useState(room.isEnabled);
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      await saveAdminRoom(room.id, { roomNumber, order, isEnabled });
      onSaved();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : uiText(language, "Nie udało się zapisać pokoju.", "Failed to save room."));
    }
  }

  return (
    <form className="admin-card admin-form admin-room-form" onSubmit={(event) => void submit(event)}>
      <h2>{uiText(language, "Pokój", "Room")} · {room.key}</h2>
      <label>{uiText(language, "Numer widoczny", "Display number")}<input min={1} onChange={(event) => setRoomNumber(Number(event.target.value))} required type="number" value={roomNumber} /></label>
      <label>{uiText(language, "Kolejność przejścia", "Progression order")}<input min={1} onChange={(event) => setOrder(Number(event.target.value))} required type="number" value={order} /></label>
      <label className="admin-checkbox"><input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" /> {uiText(language, "Aktywny", "Enabled")}</label>
      {formError && <p className="admin-message is-error" role="alert">{formError}</p>}
      <button className="primary-button" type="submit">{uiText(language, "Zapisz pokój", "Save room")}</button>
      <span className="admin-muted">{uiText(language, "Edytowany język treści:", "Content language:")} {language}</span>
    </form>
  );
}

function RoomContentEditor({
  roomId,
  content,
  language,
  onSaved,
}: {
  roomId: string;
  content: AdminRoomContent | null;
  language: string;
  onSaved: () => void;
}) {
  const translation = content
    ? selectedTranslation(content.translations, language)
    : undefined;
  const [contentKey, setContentKey] = useState(content?.contentKey ?? "");
  const [contentType, setContentType] = useState(content?.contentType ?? "text");
  const [order, setOrder] = useState(content?.order ?? 100);
  const [text, setText] = useState(translation?.text ?? "");
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      await saveAdminRoomContent(roomId, {
        languageCode: language,
        contentKey,
        contentType,
        order,
        text,
      });
      onSaved();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : uiText(language, "Nie udało się zapisać treści pokoju.", "Failed to save room content."));
    }
  }

  return (
    <form className="admin-content-row" onSubmit={(event) => void submit(event)}>
      <label>{uiText(language, "Klucz", "Key")}<input disabled={content !== null} maxLength={100} onChange={(event) => setContentKey(event.target.value)} required value={contentKey} /></label>
      <label>{uiText(language, "Typ", "Type")}<input maxLength={40} onChange={(event) => setContentType(event.target.value)} required value={contentType} /></label>
      <label>{uiText(language, "Kolejność", "Order")}<input min={0} onChange={(event) => setOrder(Number(event.target.value))} required type="number" value={order} /></label>
      <label className="admin-content-text">{uiText(language, "Tekst", "Text")} ({language})<textarea maxLength={20000} onChange={(event) => setText(event.target.value)} required rows={2} value={text} /></label>
      {formError && <p className="admin-message is-error" role="alert">{formError}</p>}
      <button className="secondary-button" type="submit">{content
        ? uiText(language, "Zapisz tekst", "Save text")
        : uiText(language, "Dodaj tekst", "Add text")}</button>
    </form>
  );
}

function PuzzleEditor({
  puzzle,
  language,
  onSaved,
}: {
  puzzle: AdminPuzzle;
  language: string;
  onSaved: () => void;
}) {
  const translation = selectedTranslation(puzzle.translations, language);
  const [order, setOrder] = useState(puzzle.order);
  const [configuration, setConfiguration] = useState(puzzle.configuration);
  const [instruction, setInstruction] = useState(translation?.instruction ?? "");
  const [hint1, setHint1] = useState(translation?.hint1 ?? "");
  const [hint2, setHint2] = useState(translation?.hint2 ?? "");
  const [formError, setFormError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    try {
      JSON.parse(configuration);
      await saveAdminPuzzle(puzzle.id, {
        languageCode: language,
        puzzleType: puzzle.type,
        configurationVersion: puzzle.configurationVersion,
        order,
        configuration,
        instruction,
        hint1,
        hint2,
      });
      onSaved();
    } catch (cause) {
      setFormError(cause instanceof Error
        ? cause.message
        : uiText(language, "Nieprawidłowa konfiguracja zagadki.", "Invalid puzzle configuration."));
    }
  }

  return (
    <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <div className="admin-form-grid">
        <label>{uiText(language, "Typ", "Type")}<input disabled value={puzzle.type} /></label>
        <label>{uiText(language, "Wersja", "Version")}<input disabled value={puzzle.configurationVersion} /></label>
        <label>{uiText(language, "Kolejność", "Order")}<input min={1} onChange={(event) => setOrder(Number(event.target.value))} required type="number" value={order} /></label>
      </div>
      <label>{uiText(language, "Instrukcja", "Instructions")} ({language})<textarea maxLength={2000} onChange={(event) => setInstruction(event.target.value)} required rows={2} value={instruction} /></label>
      <label>{uiText(language, "Podpowiedź 1", "Hint 1")}<input maxLength={2000} onChange={(event) => setHint1(event.target.value)} value={hint1} /></label>
      <label>{uiText(language, "Podpowiedź 2", "Hint 2")}<input maxLength={2000} onChange={(event) => setHint2(event.target.value)} value={hint2} /></label>
      <label>{uiText(language, "Konfiguracja JSON", "JSON configuration")}<textarea className="admin-code-input" maxLength={100000} onChange={(event) => setConfiguration(event.target.value)} required rows={8} value={configuration} /></label>
      {formError && <p className="admin-message is-error" role="alert">{formError}</p>}
      <button className="primary-button" type="submit">{uiText(language, "Zapisz zagadkę", "Save puzzle")}</button>
    </form>
  );
}

function TranslationEditor({
  language,
  onSaved,
}: {
  language: string;
  onSaved: () => void;
}) {
  const [translations, setTranslations] = useState<AdminLocalizedText[]>([]);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchAdminTranslations(language)
      .then((items) => {
        if (!active) return;
        setTranslations(items);
        setSelectedKey((current) =>
          items.some((item) => item.key === current) ? current : items[0]?.key ?? "",
        );
        setError("");
      })
      .catch((cause: unknown) => {
        if (active)         setError(cause instanceof Error
          ? cause.message
          : uiText(language, "Nie udało się pobrać tłumaczeń.", "Failed to load translations."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language]);

  const filteredTranslations = useMemo(
    () => translations.filter((item) =>
      `${item.key} ${item.value}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    ),
    [query, translations],
  );
  const selectedTranslation = filteredTranslations.find((item) => item.key === selectedKey)
    ?? filteredTranslations[0];

  return (
    <section className="admin-card">
      <h2>{uiText(language, "Słownik tekstów interfejsu", "Interface text catalog")}</h2>
      <p>{uiText(language, "Edycja tekstów i etykiet dostępności zapisanych w tabeli LocalizedTexts", "Edit interface text and accessibility labels stored in LocalizedTexts")} ({language}).</p>
      {error && <p className="admin-message is-error" role="alert">{error}</p>}
      {loading ? <p role="status">{uiText(language, "Ładowanie słownika…", "Loading catalog…")}</p> : (
        <div className="admin-translation-editor">
          <div>
            <label>{uiText(language, "Szukaj", "Search")}<input onChange={(event) => setQuery(event.target.value)} value={query} /></label>
            <label>{uiText(language, "Klucz", "Key")}
              <select onChange={(event) => setSelectedKey(event.target.value)} size={12} value={selectedTranslation?.key ?? ""}>
                {filteredTranslations.map((item) => <option key={item.key} value={item.key}>{item.key}</option>)}
              </select>
            </label>
          </div>
          {selectedTranslation && (
            <TranslationValueEditor
              key={selectedTranslation.key}
              language={language}
              onSaved={(value) => {
                setTranslations((items) => items.map((item) =>
                  item.key === selectedTranslation.key ? { ...item, value } : item,
                ));
                onSaved();
              }}
              translation={selectedTranslation}
            />
          )}
        </div>
      )}
    </section>
  );
}

function TranslationValueEditor({
  language,
  translation,
  onSaved,
}: {
  language: string;
  translation: AdminLocalizedText;
  onSaved: (value: string) => void;
}) {
  const [value, setValue] = useState(translation.value);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await saveAdminTranslation(language, translation.key, value);
      setError("");
      onSaved(value);
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : uiText(language, "Nie udało się zapisać tłumaczenia.", "Failed to save translation."));
    }
  }

  return (
    <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <label>{uiText(language, "Wartość", "Value")}<textarea maxLength={20000} onChange={(event) => setValue(event.target.value)} required rows={8} value={value} /></label>
      {error && <p className="admin-message is-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit">{uiText(language, "Zapisz tłumaczenie", "Save translation")}</button>
    </form>
  );
}
