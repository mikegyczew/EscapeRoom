import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room88Props = {
  onComplete: (proof: string) => void;
};

const PATH = [
  { row: 1, answer: "left", clue: "Pierwszy podest ma trzy jednakowe linie." },
  { row: 2, answer: "center", clue: "Drugi podest jest oznaczony parą równoległych kresek." },
  { row: 3, answer: "right", clue: "Ostatni podest ma symbol pełnego koła." },
] as const;

const OPTIONS = [
  { id: "left", label: "LEWY PODEST", symbol: "≋" },
  { id: "center", label: "ŚRODKOWY PODEST", symbol: "Ⅱ" },
  { id: "right", label: "PRAWY PODEST", symbol: "○" },
] as const;

export default function Room88({ onComplete }: Room88Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [route, setRoute] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const currentStep = PATH[step];

  function choosePlatform(platformId: string) {
    if (platformId !== currentStep.answer) {
      setRoute([]);
      setStep(0);
      setFeedback(localizeAttribute("copy.19bb4699", "Ten podest nie jest stabilny. Wróć myślą do początku i przeczytaj oznaczenia; postęp nie jest karany."));
      return;
    }

    const nextRoute = [...route, platformId];
    setRoute(nextRoute);
    if (step === PATH.length - 1) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.5f81adb5", "Bezpieczne przejście odnalezione. Zespół opuścił iluzję krawędzi."));
      window.setTimeout(() => onComplete(JSON.stringify(nextRoute)), 700);
      return;
    }

    setStep((current) => current + 1);
    setFeedback(localizeAttribute("copy.71a98640", "Stabilny podest. Odczytaj oznaczenie kolejnego."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.454e45aa" fallback={"POKÓJ 88 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
        <h1>
          <LocalizedText translationKey="copy.7afb2701" fallback={"KRAWĘDŹ "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.62498dda" fallback={"ZSYPU"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.2dac777e" fallback={"„Nie idź za złudzeniem spadania. Czytaj znaki i wybieraj stabilne podesty.” "} /></p>
        <div className="mission-art chute-mission-art" role="img" aria-label={localizeAttribute("copy.dc4a4314", "Trzy oznaczone podesty prowadzące nad iluzją głębi.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.c6794a95" fallback={"BEZPIECZNA TRASA // ODCZYT SYMBOLI "} /></div>
          <div className="chute-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.ce418c8a" fallback={"≋"} /></span><i><LocalizedText translationKey="copy.963c7b62" fallback={"↓"} /></i><span><LocalizedText translationKey="copy.e43cf62c" fallback={"Ⅱ"} /></span><i><LocalizedText translationKey="copy.963c7b62" fallback={"↓"} /></i><span><LocalizedText translationKey="copy.4e35be0a" fallback={"○"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.31325b82" fallback={"PODSTOPY: 3"} /></span>
            <span><LocalizedText translationKey="copy.708dd042" fallback={"WSKAZÓWKI: WIDOCZNE"} /></span>
            <span><LocalizedText translationKey="copy.f69ed41f" fallback={"EFEKT SPADANIA: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.a71ae097" fallback={"Krawędź Zsypu sprawia wrażenie, jakby podłoga opadała w ciemność. To tylko iluzja — bezpieczny szlak prowadzi przez trzy oznaczone podesty. "} /></p>
          <p>
            <LocalizedText translationKey="copy.2c22fe0a" fallback={"Odczytaj wskazówkę przy każdym etapie i wybierz pasujący symbol. Możesz wrócić do początku bez kary; ekran nie używa migania ani efektów ruchu. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.13e20e1d" fallback={"ODCZYTAJ TRASĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.454e45aa" fallback={"POKÓJ 88 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.589e4717" fallback={"ZNAJDŹ "} /><span className="accent"><LocalizedText translationKey="copy.f68f2b46" fallback={"STABILNY PODEST"} /></span>
      </h1>
      <p className="lead"><LocalizedText translationKey="copy.0d9b8a0f" fallback={"ETAP "} />{step + 1} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{PATH.length}</p>
      <div className="chute-clue"><LocalizedText fallback={currentStep.clue} /></div>
      <div aria-label={localizeAttribute("copy.5a60de68", "Postęp przez trzy stabilne podesty")} className="chute-route">
        {PATH.map((path, index) => (
          <span
            aria-label={localizeAttribute(
              "copy.03ef636a",
              "Etap {number}{status}",
              {
                number: index + 1,
                status: route[index]
                  ? localizeAttribute(
                      "copy.249c9af6",
                      ", przejście potwierdzone",
                    )
                  : "",
              },
            )}
            className={`chute-route-step${route[index] ? " is-cleared" : ""}${index === step ? " is-current" : ""}`}
            key={path.row}
          >
            {route[index] ? "✓" : index + 1}
          </span>
        ))}
      </div>
      <div className="chute-platform-options">
        {OPTIONS.map((option) => (
          <button
            aria-label={localizeAttribute(
              "copy.8b821833",
              "{label}: symbol {symbol}",
              {
                label: localizeAttribute(
                  translationKeyFor(option.label),
                  option.label,
                ),
                symbol: option.symbol,
              },
            )}
            className="chute-platform"
            disabled={complete}
            key={option.id}
            onClick={() => choosePlatform(option.id)}
            type="button"
          >
            <strong aria-hidden="true">{option.symbol}</strong>
            <span><LocalizedText fallback={option.label} /></span>
          </button>
        ))}
      </div>
      <div className="small-note">
        <LocalizedText translationKey="copy.2f1a59c9" fallback={"POTWIERDZONE PODESTY: "} />{route.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{PATH.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
