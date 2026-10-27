import { useEffect, useState } from "react";
import {
  fetchAdminDatabasePage,
  fetchAdminDatabaseTables,
  updateAdminDatabaseText,
  type AdminDatabasePage,
  type AdminDatabaseTable,
} from "../shared/admin";

type DatabaseBrowserProps = {
  language: string;
};

function text(language: string, polish: string, english: string): string {
  return language === "en" ? english : polish;
}

function tableLabel(language: string, name: string, fallback: string): string {
  if (language !== "en") return fallback;
  const englishLabels: Record<string, string> = {
    Stories: "Stories",
    StoryTranslations: "Story translations",
    RoomDefinitions: "Room definitions",
    StoryRooms: "Story instances",
    RoomContents: "Room content",
    RoomContentTranslations: "Content translations",
    PuzzleDefinitions: "Puzzle definitions",
    PuzzleInstances: "Puzzles in stories",
    PuzzleInstanceTranslations: "Instructions and hints",
    LocalizedTexts: "Interface text",
    AspNetUsers: "Users (safe fields only)",
  };
  return englishLabels[name] ?? name;
}

function formatCell(value: unknown): string {
  if (value === null) return "NULL";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function editableColumns(tableName: string): string[] {
  const columns: Record<string, string[]> = {
    StoryTranslations: ["Name", "Description"],
    RoomContentTranslations: ["Text"],
    PuzzleInstanceTranslations: ["Instruction", "Hint1", "Hint2"],
    LocalizedTexts: ["Value"],
  };
  return columns[tableName] ?? [];
}

function rowKey(page: AdminDatabasePage, row: unknown[]): Record<string, string> | null {
  const keyColumns = page.name === "LocalizedTexts" ? ["Language", "Key"] : ["Id"];
  const key: Record<string, string> = {};
  for (const column of keyColumns) {
    const index = page.columns.indexOf(column);
    const value = row[index];
    if (index < 0 || typeof value !== "string") return null;
    key[column] = value;
  }
  return key;
}

export default function DatabaseBrowser({ language }: DatabaseBrowserProps) {
  const [tables, setTables] = useState<AdminDatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [page, setPage] = useState<AdminDatabasePage | null>(null);
  const [offset, setOffset] = useState(0);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [error, setError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [editingRowId, setEditingRowId] = useState("");
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const pageSize = 50;
  const requestKey = `${selectedTable}:${offset}`;

  useEffect(() => {
    let active = true;
    void fetchAdminDatabaseTables()
      .then((items) => {
        if (!active) return;
        setTables(items);
        setSelectedTable((current) =>
          items.some((table) => table.name === current) ? current : items[0]?.name ?? "",
        );
        setError("");
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error
            ? cause.message
            : text(language, "Nie udało się pobrać tabel.", "Failed to load database tables."));
        }
      })
      .finally(() => {
        if (active) setLoadingTables(false);
      });

    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    if (!selectedTable) return;
    let active = true;
    void fetchAdminDatabasePage(selectedTable, offset, pageSize)
      .then((result) => {
        if (!active) return;
        setPage(result);
        setLoadedRequestKey(requestKey);
        setError("");
      })
      .catch((cause: unknown) => {
        if (active) {
          setPage(null);
          setLoadedRequestKey(requestKey);
          setError(cause instanceof Error
            ? cause.message
            : text(language, "Nie udało się pobrać danych tabeli.", "Failed to load table data."));
        }
      });

    return () => {
      active = false;
    };
  }, [language, offset, requestKey, selectedTable]);

  const loadingPage = Boolean(selectedTable) && loadedRequestKey !== requestKey;
  const end = Math.min(offset + pageSize, page?.totalRows ?? 0);
  const editable = page ? editableColumns(page.name) : [];

  function beginEditing(row: unknown[]) {
    if (!page) return;
    const key = rowKey(page, row);
    if (!key) {
      setError(text(language, "Nie można ustalić klucza edytowanego wiersza.", "Could not identify the selected row."));
      return;
    }

    setEditingRowId(JSON.stringify(key));
    setDraftValues(Object.fromEntries(
      editable.map((column) => {
        const value = row[page.columns.indexOf(column)];
        return [column, value === null ? "" : formatCell(value)];
      }),
    ));
    setError("");
    setSaveNotice("");
  }

  async function saveEditingRow(key: Record<string, string>) {
    if (!page) return;
    setSaving(true);
    setError("");
    setSaveNotice("");
    try {
      await updateAdminDatabaseText(page.name, key, draftValues);
      const refreshed = await fetchAdminDatabasePage(page.name, offset, pageSize);
      setPage(refreshed);
      setLoadedRequestKey(requestKey);
      setEditingRowId("");
      setDraftValues({});
      setSaveNotice(text(language, "Zmiany zapisano.", "Changes saved."));
    } catch (cause: unknown) {
      setError(cause instanceof Error
        ? cause.message
        : text(language, "Nie udało się zapisać zmian.", "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-card admin-database-browser">
      <div className="admin-card-heading">
        <div>
          <h2>{text(language, "Podgląd bazy danych", "Database browser")}</h2>
          <p>
            {text(
              language,
              "Edytowalne są wyłącznie teksty i tłumaczenia. Pozostałe tabele są tylko do odczytu; dane uwierzytelniające i postępy graczy pozostają ukryte.",
              "Only game text and translations can be edited. Other tables are read-only; authentication data and player progress remain hidden.",
            )}
          </p>
        </div>
        <label>
          {text(language, "Tabela", "Table")}
          <select
            disabled={loadingTables}
            onChange={(event) => {
              setSelectedTable(event.target.value);
              setOffset(0);
              setEditingRowId("");
              setDraftValues({});
              setSaveNotice("");
            }}
            value={selectedTable}
          >
            {tables.map((table) => (
              <option key={table.name} value={table.name}>
                {tableLabel(language, table.name, table.label)} · {table.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="admin-message is-error" role="alert">{error}</p>}
      {saveNotice && <p className="admin-message" role="status">{saveNotice}</p>}
      {loadingTables || loadingPage ? (
        <p role="status">{text(language, "Wczytywanie danych…", "Loading data…")}</p>
      ) : page ? (
        <>
          <div className="admin-database-summary">
            <span>{tableLabel(language, page.name, page.label)} · {page.totalRows} {text(language, "wierszy", "rows")}</span>
            <span>{page.totalRows === 0 ? "0" : `${offset + 1}–${end}`} / {page.totalRows}</span>
          </div>
          <div className="admin-database-table-wrap">
            <table className="admin-database-table">
              <thead>
                <tr>
                  {page.columns.map((column) => <th key={column} scope="col">{column}</th>)}
                  {editable.length > 0 && <th scope="col">{text(language, "Akcje", "Actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row, rowIndex) => {
                  const key = rowKey(page, row);
                  const serializedKey = key
                    ? JSON.stringify(key)
                    : `${page.name}-${offset + rowIndex}`;
                  const isEditing = editingRowId === serializedKey;
                  return (
                    <tr key={serializedKey}>
                      {row.map((value, columnIndex) => {
                        const column = page.columns[columnIndex];
                        const formatted = formatCell(value);
                        return (
                          <td key={`${column}-${columnIndex}`} title={formatted}>
                            {isEditing && editable.includes(column) ? (
                              <textarea
                                aria-label={`${column} ${rowIndex + offset + 1}`}
                                className="admin-database-edit-input"
                                onChange={(event) => setDraftValues((current) => ({
                                  ...current,
                                  [column]: event.target.value,
                                }))}
                                rows={column === "Name" || column === "Value" ? 2 : 4}
                                value={draftValues[column] ?? ""}
                              />
                            ) : (
                              formatted.length > 300 ? `${formatted.slice(0, 300)}…` : formatted
                            )}
                          </td>
                        );
                      })}
                      {editable.length > 0 && (
                        <td className="admin-database-actions">
                          {isEditing && key ? (
                            <>
                              <button
                                className="secondary-button"
                                disabled={saving}
                                onClick={() => void saveEditingRow(key)}
                                type="button"
                              >
                                {saving ? text(language, "Zapisywanie…", "Saving…") : text(language, "Zapisz", "Save")}
                              </button>
                              <button
                                className="secondary-button"
                                disabled={saving}
                                onClick={() => {
                                  setEditingRowId("");
                                  setDraftValues({});
                                }}
                                type="button"
                              >
                                {text(language, "Anuluj", "Cancel")}
                              </button>
                            </>
                          ) : (
                            <button
                              className="secondary-button"
                              disabled={!key || Boolean(editingRowId)}
                              onClick={() => beginEditing(row)}
                              type="button"
                            >
                              {text(language, "Edytuj", "Edit")}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {page.rows.length === 0 && (
                  <tr>
                    <td colSpan={page.columns.length + (editable.length > 0 ? 1 : 0)}>
                      {text(language, "Tabela nie zawiera danych.", "This table has no rows.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-database-pagination">
            <button
              className="secondary-button"
              disabled={offset === 0 || Boolean(editingRowId)}
              onClick={() => setOffset(Math.max(0, offset - pageSize))}
              type="button"
            >
              {text(language, "Poprzednie", "Previous")}
            </button>
            <button
              className="secondary-button"
              disabled={end >= page.totalRows || Boolean(editingRowId)}
              onClick={() => setOffset(offset + pageSize)}
              type="button"
            >
              {text(language, "Następne", "Next")}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
