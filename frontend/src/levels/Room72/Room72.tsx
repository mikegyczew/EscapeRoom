import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room72Props = {
  onComplete: () => void;
};

const SYMBOLS = [
  { id: "door", symbol: "▣", meaning: "DRZWI" },
  { id: "open", symbol: "↗", meaning: "OTWÓRZ" },
  { id: "memory", symbol: "✳", meaning: "WSPOMNIENIE" },
] as const;

const INSTRUCTIONS = [
  { clue: "Wprowadź przez symboliczne drzwi.", answer: "door" },
  { clue: "Wybierz symbol oznaczający rozpoczęcie.", answer: "open" },
  { clue: "Na koniec wskaż to, co terminal ma przywrócić.", answer: "memory" },
] as const;

export default function Room72({ onComplete }: Room72Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function chooseSymbol(symbolId: string) {
    if (symbolId !== INSTRUCTIONS[step].answer) {
      setFeedback(localizeAttribute("copy.4801dd33", "Symbol nie pasuje do komunikatu. Skorzystaj z klucza i spróbuj ponownie."));
      return;
    }

    if (step === INSTRUCTIONS.length - 1) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.0b17e535", "Komunikat odczytany bez użycia głosu. Archiwum odpowiada."));
      window.setTimeout(onComplete, 700);
      return;
    }

    setStep((current) => current + 1);
    setFeedback(localizeAttribute("copy.a51aec43", "Symbol przyjęty. Odczytaj kolejny komunikat."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.53c760d9" fallback={"POKÓJ 72 / OBSZAR BROKI I WERNICKEGO"} /></div>
        <h1>
          <LocalizedText translationKey="copy.33236ebc" fallback={"KOMUNIKACJA "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.ac5e838a" fallback={"SYMBOLAMI"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.0fc20366" fallback={"„Nie każda wiadomość potrzebuje głosu. Wspólne znaki także niosą sens.” "} /></p>
        <div className="mission-art symbol-language-mission-art" role="img" aria-label={localizeAttribute("copy.a65d9368", "Trzy symbole składające się na krótką instrukcję.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.6957ed42" fallback={"TABLICA KOMUNIKACJI // KLUCZ SYMBOLI "} /></div>
          <div className="symbol-language-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.a6364892" fallback={"▣"} /></span><i><LocalizedText translationKey="copy.2e0c9daa" fallback={"+"} /></i><span><LocalizedText translationKey="copy.923c7516" fallback={"↗"} /></span><i><LocalizedText translationKey="copy.2e0c9daa" fallback={"+"} /></i><span><LocalizedText translationKey="copy.363a5142" fallback={"✳"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.b8aa5aff" fallback={"SYMBOLE: 3"} /></span>
            <span><LocalizedText translationKey="copy.5f9a6a0c" fallback={"MIKROFON: WYŁĄCZONY"} /></span>
            <span><LocalizedText translationKey="copy.551a39fa" fallback={"GŁOS: OPCJONALNY"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.71323e9f" fallback={"Terminal pokazuje krótkie polecenia zapisane symbolami. Korzystaj z klucza, aby wskazać właściwy znak dla każdego kroku. "} /></p>
          <p>
            <LocalizedText translationKey="copy.209fda60" fallback={"Zagadka jest w pełni dostępna bez mówienia i mikrofonu — wszystkie informacje są widoczne na ekranie. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.760f5360" fallback={"OTWÓRZ TABLICĘ SYMBOLI "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.53c760d9" fallback={"POKÓJ 72 / OBSZAR BROKI I WERNICKEGO"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.684f3836" fallback={"CZYTAJ "} /><span className="accent"><LocalizedText translationKey="copy.0acd5e7c" fallback={"SYMBOLE"} /></span>
      </h1>
      <div className="symbol-key">
        {SYMBOLS.map((item) => (
          <div className="symbol-key-item" key={item.id}>
            <strong aria-hidden="true">{item.symbol}</strong>
            <span><LocalizedText fallback={item.meaning} /></span>
          </div>
        ))}
      </div>
      <div aria-live="polite" className="symbol-instruction">
        <LocalizedText translationKey="copy.c1d9a19e" fallback={"KROK "} />{step + 1} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{INSTRUCTIONS.length}<LocalizedText translationKey="copy.8e062137" fallback={": "} /><LocalizedText fallback={INSTRUCTIONS[step].clue} />
      </div>
      <div className="symbol-choice-grid">
        {SYMBOLS.map((item) => (
          <button
            aria-label={localizeAttribute("copy.e8ada51a", "{symbol}: {meaning}", {
              symbol: item.symbol,
              meaning: localizeAttribute(
                translationKeyFor(item.meaning),
                item.meaning,
              ),
            })}
            className="symbol-choice"
            disabled={complete}
            key={item.id}
            onClick={() => chooseSymbol(item.id)}
            type="button"
          >
            <strong aria-hidden="true">{item.symbol}</strong>
            <span><LocalizedText fallback={item.meaning} /></span>
          </button>
        ))}
      </div>
      <div className="small-note">
        <LocalizedText translationKey="copy.377025f4" fallback={"ODCZYTANE KROKI: "} />{complete ? INSTRUCTIONS.length : step}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{INSTRUCTIONS.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
