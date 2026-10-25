import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type FinalDecision = "privacy" | "research";

type Room99Props = {
  onComplete: (decision: FinalDecision) => void;
};

const DECISIONS = [
  {
    id: "privacy",
    title: "USZANUJ PRYWATNOŚĆ",
    detail:
      "Usuń osobiste zapisy Henry'ego. Zachowaj tylko anonimowy opis wyników, który nie pozwala odtworzyć jego wspomnień.",
    consequence:
      "Archiwum osobistych wspomnień zostaje zamknięte. Badania pozostawiają po sobie jedynie anonimowy ślad.",
  },
  {
    id: "research",
    title: "ZABEZPIECZ BADANIA",
    detail:
      "Zachowaj pełne archiwum, w tym osobiste zapisy, aby przyszli badacze mogli odtworzyć kontekst odkrycia.",
    consequence:
      "Wyniki i wspomnienia Henry'ego zostają zachowane dla przyszłości; ich dalsze wykorzystanie wymaga odpowiedzialności.",
  },
] as const;

export default function Room99({ onComplete }: Room99Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [decision, setDecision] = useState<FinalDecision | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const selectedDecision = DECISIONS.find((item) => item.id === decision);

  function confirmDecision() {
    if (!decision || confirmed) return;
    setConfirmed(true);
    window.setTimeout(() => onComplete(decision), 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.3e11376c" fallback={"POKÓJ 99 / PUNKT OMEGA"} /></div>
        <h1>
          <LocalizedText translationKey="copy.8fd95dcd" fallback={"PUNKT "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.f2a8fac8" fallback={"OMEGA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.922b06bf" fallback={"„Pamięć należy do człowieka. Wiedza może pomóc innym. Co zachowasz?” "} /></p>
        <div className="mission-art omega-mission-art" role="img" aria-label={localizeAttribute("copy.5f962933", "Rdzeń archiwum i dwie możliwe drogi jego zabezpieczenia.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.42c2ecbe" fallback={"RDZEŃ PAMIĘCI // OSTATECZNA DECYZJA "} /></div>
          <div className="omega-core-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.ac0d6404" fallback={"Ω"} /></span>
            <i />
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.1de8beae" fallback={"ARCHIWUM: KOMPLETNE"} /></span>
            <span><LocalizedText translationKey="copy.827b66e4" fallback={"WYBÓR: NIEODWRACALNY"} /></span>
            <span><LocalizedText translationKey="copy.d92482d9" fallback={"OCENA: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.7a4835ac" fallback={"Dotarliście do rdzenia świadomości Henry'ego. Możecie usunąć jego osobiste zapisy, zostawiając anonimowe wyniki, albo zachować pełne badania wraz z prywatnymi wspomnieniami. "} /></p>
          <p>
            <LocalizedText translationKey="copy.5e578016" fallback={"Każda droga ma konsekwencje. Nie ma tu testu ani odpowiedzi ocenianej jako poprawna — to decyzja zespołu o tym, co powinno pozostać po zakończeniu archiwum. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.d250f9e4" fallback={"STAN PRZED RDZENIEM "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.3e11376c" fallback={"POKÓJ 99 / PUNKT OMEGA"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.7c3ce19b" fallback={"CO POZOSTANIE "} /><span className="accent"><LocalizedText translationKey="copy.3b8d66ea" fallback={"PO HENRYM?"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.5f16b62b" fallback={"Przeczytaj obie możliwości. Wybór zapisze zakończenie wyprawy. "} /></p>
      <div className="omega-decisions">
        {DECISIONS.map((item) => (
          <button
            aria-pressed={decision === item.id}
            className={`omega-decision${decision === item.id ? " is-selected" : ""}`}
            disabled={confirmed}
            key={item.id}
            onClick={() => setDecision(item.id)}
            type="button"
          >
            <strong><LocalizedText fallback={item.title} /></strong>
            <span><LocalizedText fallback={item.detail} /></span>
          </button>
        ))}
      </div>
      {selectedDecision && (
        <div aria-live="polite" className="omega-consequence">
          <strong><LocalizedText translationKey="copy.6825889c" fallback={"KONSEKWENCJA WYBORU"} /></strong>
          <p>{selectedDecision.consequence}</p>
        </div>
      )}
      <button
        className="primary-button"
        disabled={!decision || confirmed}
        onClick={confirmDecision}
        type="button"
      >
        <LocalizedText translationKey="copy.0327f7ca" fallback={"ZAPISZ OSTATECZNĄ DECYZJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">
        {confirmed ? <LocalizedText translationKey="copy.ddc4a618" fallback={"Decyzja zapisana. Archiwum czeka na swoje zakończenie."} /> : ""}
      </p>
    </section>
  );
}
