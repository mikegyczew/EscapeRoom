import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  TranslationContext,
  type Language,
  type TranslationContextValue,
} from "./translation-context";

const EMPTY_TEXTS: Record<string, string> = {};

function interpolate(
  value: string,
  parameters: Record<string, string | number>,
): string {
  return Object.entries(parameters).reduce(
    (result, [name, replacement]) =>
      result.replaceAll(`{${name}}`, String(replacement)),
    value,
  );
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [loadedCatalog, setLoadedCatalog] = useState<{
    language: Language;
    texts: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem("escape-room-language");
    return savedLanguage === "en" ? "en" : "pl";
  });

  useEffect(() => {
    let active = true;

    void fetch(`/api/translations/${language}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Serwer treści odpowiedział kodem ${response.status}.`);
        }

        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !("texts" in body) ||
          typeof body.texts !== "object" ||
          body.texts === null ||
          !Object.values(body.texts).every((value) => typeof value === "string")
        ) {
          throw new Error("Serwer treści zwrócił nieprawidłowy format.");
        }

        if (active) {
          setLoadedCatalog({
            language,
            texts: Object.fromEntries(
              Object.entries(body.texts).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
          });
          setError("");
        }
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Nie udało się pobrać tekstów z serwera.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem("escape-room-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const texts =
    loadedCatalog?.language === language ? loadedCatalog.texts : EMPTY_TEXTS;

  const value = useMemo<TranslationContextValue>(
    () => ({
      error,
      language,
      setLanguage,
      text: (key, fallback, parameters = {}) =>
        interpolate(texts[key] ?? fallback, parameters),
    }),
    [error, language, texts],
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}
