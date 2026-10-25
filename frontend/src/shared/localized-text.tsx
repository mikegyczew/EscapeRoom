import { useTranslation } from "./use-translation";
import { translationKeyFor } from "./translation-key";

type LocalizedTextProps = {
  translationKey?: string;
  fallback: string;
  parameters?: Record<string, string | number>;
};

export function LocalizedText({
  translationKey,
  fallback,
  parameters,
}: LocalizedTextProps) {
  const { text } = useTranslation();
  return text(translationKey ?? translationKeyFor(fallback), fallback, parameters);
}
