import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room45Props = {
  onComplete: () => void;
};

const CLOCK_POINTS = [
  { id: "top", label: "GÓRA", target: "12" },
  { id: "right", label: "PRAWO", target: "3" },
  { id: "bottom", label: "DÓŁ", target: "6" },
  { id: "left", label: "LEWO", target: "9" },
] as const;

const DIGITS = Array.from({ length: 12 }, (_, index) => String(index + 1));

export default function Room45({ onComplete }: Room45Props) {
  const { text: localizeAttribute, language } = useTranslation();
  const [started, setStarted] = useState(false);
  const [points, setPoints] = useState<Record<string, string>>({
    top: "3",
    right: "6",
    bottom: "9",
    left: "12",
  });
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function setPoint(pointId: string, value: string) {
    setPoints((previous) => ({ ...previous, [pointId]: value }));
    setFeedback("");
  }

  function checkClock() {
    if (!CLOCK_POINTS.every((point) => points[point.id] === point.target)) {
      setFeedback(localizeAttribute("copy.8dad182c", "Tarcza jest niesymetryczna. Sprawdź cztery główne punkty."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.9d996a8d", "Główne punkty tarczy ustawione. Mechanizm rysunku został odtworzony."));
    window.setTimeout(onComplete, 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.95d25add" fallback={"POKÓJ 45 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.4dcff11f" fallback={"TEST "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.bdbcbb2e" fallback={"RYSOWANIA ZEGARA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.8b0fc3d9" fallback={"„Każdy punkt ma swoje miejsce. Ustawcie je razem, bez pośpiechu.” "} /></p>
        <div className="mission-art clock-drawing-mission-art" role="img" aria-label={localizeAttribute("copy.a9387c08", "Tarcza zegara z czterema pustymi punktami kardynalnymi.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.af3caa9f" fallback={"PRACOWNIA RUCHU // ODTWARZANIE TARCZY "} /></div>
          <div className="clock-drawing-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.1deb2d6a" fallback={"12"} /></span><i /><span><LocalizedText translationKey="copy.360caa42" fallback={"3"} /></span><i /><span><LocalizedText translationKey="copy.330ca589" fallback={"6"} /></span><i /><span><LocalizedText translationKey="copy.3c0cb3b4" fallback={"9"} /></span><i />
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.99db4a29" fallback={"PUNKTY GŁÓWNE: 4"} /></span>
            <span><LocalizedText translationKey="copy.41da47dc" fallback={"STEROWANIE: PRZYCISKI"} /></span>
            <span><LocalizedText translationKey="copy.c5a94e59" fallback={"TRYB: WSPÓŁPRACA"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.49b2ba85" fallback={"Wielka tarcza ma cztery miejsca na główne cyfry. Ustawcie je wspólnie: 12 u góry, 3 po prawej, 6 na dole, 9 po lewej. "} /></p>
          <p>
            <LocalizedText translationKey="copy.a41f5889" fallback={"W wersji cyfrowej liny zastępują dostępne selektory. Można używać klawiatury, ekranu dotykowego lub wspólnie wskazywać ustawienia. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.ae53c4bd" fallback={"USTAW TARCZĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.95d25add" fallback={"POKÓJ 45 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.7c95b5c4" fallback={"ODTWÓRZ "} /><span className="accent"><LocalizedText translationKey="copy.2619d717" fallback={"TARCZĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.364e9592" fallback={"Ustaw cyfry na czterech głównych punktach. Pozostałe oznaczenia pojawią się po sprawdzeniu układu. "} /></p>
      <div className="clock-drawing-console">
        <div className="clock-drawing-dial" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span
              className={`clock-drawing-mark clock-mark-${index}`}
              key={index}
            >
              {index === 0 ? points.top : index === 3 ? points.right : index === 6 ? points.bottom : index === 9 ? points.left : "·"}
            </span>
          ))}
          <i />
        </div>
        <div className="clock-drawing-inputs">
          {CLOCK_POINTS.map((point) => (
            <label key={point.id}>
              <span><LocalizedText fallback={point.label} /></span>
              <select
                aria-label={localizeAttribute(
                  "copy.94457e7a",
                  "Cyfra na pozycji {position}",
                  {
                    position: localizeAttribute(
                      translationKeyFor(point.label),
                      point.label,
                    ).toLocaleLowerCase(language === "pl" ? "pl-PL" : "en-US"),
                  },
                )}
                disabled={complete}
                onChange={(event) => setPoint(point.id, event.target.value)}
                value={points[point.id]}
              >
                {DIGITS.map((digit) => <option key={digit} value={digit}>{digit}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>
      <button className="primary-button" disabled={complete} onClick={checkClock} type="button">
        <LocalizedText translationKey="copy.0e87c9dd" fallback={"SPRAWDŹ TARCZĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
