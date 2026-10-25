import { createContext } from "react";

export type Language = "pl" | "en";

export type TranslationContextValue = {
  error: string;
  language: Language;
  setLanguage: (language: Language) => void;
  text: (
    key: string,
    fallback: string,
    parameters?: Record<string, string | number>,
  ) => string;
};

export const TranslationContext = createContext<TranslationContextValue>({
  error: "",
  language: "pl",
  setLanguage: () => {},
  text: (_key, fallback, parameters = {}) =>
    Object.entries(parameters).reduce(
      (result, [name, replacement]) =>
        result.replaceAll(`{${name}}`, String(replacement)),
      fallback,
    ),
});
