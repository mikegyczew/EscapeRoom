import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room66Props = {
  onComplete: (choice: "privacy" | "research") => void;
};

const CHOICES = [
  {
    id: "privacy",
    title: "CHROŃ PRYWATNOŚĆ",
    detail: "Zachowaj osobiste zapisy w zamkniętym archiwum; udostępnij wyłącznie anonimowe wnioski.",
    consequence: "Wspomnienia pozostają prywatne, a badania można kontynuować bez danych osobowych.",
  },
  {
    id: "research",
    title: "ZACHOWAJ BADANIA",
    detail: "Zabezpiecz kopię badań do dalszej pracy; ogranicz dostęp i zapisz zgodę Profesora.",
    consequence: "Wiedza zostaje zachowana, a dostęp jest ograniczony do zespołu z udokumentowaną zgodą.",
  },
] as const;

export default function Room66({ onComplete }: Room66Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [choice, setChoice] = useState<(typeof CHOICES)[number]["id"] | null>(null);
  const [complete, setComplete] = useState(false);

  const selectedChoice = CHOICES.find((item) => item.id === choice);

  function confirmDecision() {
    if (!selectedChoice || complete) return;
    setComplete(true);
    window.setTimeout(() => onComplete(selectedChoice.id), 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.639fbca7" fallback={"POKÓJ 66 / PŁAT CZOŁOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.3638e46a" fallback={"GRANICE "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.fd22d007" fallback={"EKSPERYMENTU"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.486c98d3" fallback={"„Wiedza i prywatność są ważne. Nie udawaj, że wybór nie ma konsekwencji.” "} /></p>
        <div className="mission-art ethics-mission-art" role="img" aria-label={localizeAttribute("copy.b9d9c799", "Dwie ścieżki decyzji: prywatność oraz zachowanie badań.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.105b06eb" fallback={"GABINET DECYZJI // DWA ODPOWIEDZIALNE WYBORY "} /></div>
          <div className="ethics-art-options" aria-hidden="true">
            <span><LocalizedText translationKey="copy.76b09335" fallback={"PRYWATNOŚĆ"} /></span><i><LocalizedText translationKey="copy.913c7383" fallback={"↔"} /></i><span><LocalizedText translationKey="copy.bf6af689" fallback={"BADANIA"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.86d15eaa" fallback={"WYBÓR: TWÓJ"} /></span>
            <span><LocalizedText translationKey="copy.fe71a1a3" fallback={"KONSEKWENCJE: JAWNE"} /></span>
            <span><LocalizedText translationKey="copy.b1963e1a" fallback={"KARA: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.7a9c8128" fallback={"Archiwum zawiera osobiste zapisy Henry'ego oraz wyniki badań, które mogą pomóc innym. Każda decyzja ma konsekwencje dla dalszej drogi. "} /></p>
          <p>
            <LocalizedText translationKey="copy.6547923b" fallback={"Wybierz ochronę prywatności albo zachowanie badań z ograniczonym dostępem i zapisaną zgodą. Żadna opcja nie jest oznaczona jako błędna — nie ma cofania ani kary za wybór. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.fc3eb711" fallback={"OTWÓRZ AKTA "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.639fbca7" fallback={"POKÓJ 66 / PŁAT CZOŁOWY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.c9f975bb" fallback={"PODEJMIJ "} /><span className="accent"><LocalizedText translationKey="copy.87b65a9e" fallback={"DECYZJĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.8325293b" fallback={"Obie drogi są dostępne. Przeczytaj ich skutki i wybierz tę, którą uznajesz za właściwą. "} /></p>
      <div className="ethics-choices">
        {CHOICES.map((item) => (
          <button
            aria-pressed={choice === item.id}
            className={`ethics-choice${choice === item.id ? " is-selected" : ""}`}
            disabled={complete}
            key={item.id}
            onClick={() => setChoice(item.id)}
            type="button"
          >
            <strong><LocalizedText fallback={item.title} /></strong>
            <span><LocalizedText fallback={item.detail} /></span>
          </button>
        ))}
      </div>
      {selectedChoice && (
        <div aria-live="polite" className="ethics-consequence">
          <strong><LocalizedText translationKey="copy.c7ca48e2" fallback={"WYBRANA DROGA"} /></strong>
          <p>{selectedChoice.consequence}</p>
        </div>
      )}
      <button
        className="primary-button"
        disabled={!selectedChoice || complete}
        onClick={confirmDecision}
        type="button"
      >
        <LocalizedText translationKey="copy.3189144d" fallback={"ZAPISZ DECYZJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">
        {complete ? <LocalizedText translationKey="copy.d0d6ec96" fallback={"Decyzja zapisana. Możesz kontynuować bez oceny ani kary."} /> : ""}
      </p>
    </section>
  );
}
