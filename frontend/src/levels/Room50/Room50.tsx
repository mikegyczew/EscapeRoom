import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room50Props = {
  onComplete: () => void;
};

const CALIBRATION_POINTS = [
  { id: "start", label: "PUNKT WEJŚCIA", target: 25 },
  { id: "center", label: "ŚRODEK TORU", target: 55 },
  { id: "finish", label: "PUNKT KOŃCOWY", target: 80 },
] as const;

export default function Room50({ onComplete }: Room50Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState([50, 50, 50]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const alignedCount = values.filter(
    (value, index) => value === CALIBRATION_POINTS[index].target,
  ).length;

  function checkSignal() {
    if (alignedCount !== CALIBRATION_POINTS.length) {
      setFeedback(localizeAttribute("copy.abbbb41f", "Sygnał nadal drży. Dopasuj każdy punkt do wartości z notatki technika."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.a0bc6297", "Projekcja ustabilizowana. Zapis zachował pełną ścieżkę."));
    window.setTimeout(onComplete, 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.dbd6f29b" fallback={"POKÓJ 50 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.44509e54" fallback={"DRŻĄCA "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.518e80cf" fallback={"RĘKA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.cef344ac" fallback={"„Nie walcz z ruchem. Znajdź punkty odniesienia i ustaw tor cierpliwie.” "} /></p>
        <div className="mission-art tremor-mission-art" role="img" aria-label={localizeAttribute("copy.7c7afe53", "Trzy punkty kalibracji na linii drżącej projekcji.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.9012ed63" fallback={"LABORATORIUM RUCHU // KALIBRACJA SYGNAŁU "} /></div>
          <div className="tremor-art-track" aria-hidden="true">
            <i /><i /><i /><span><LocalizedText translationKey="copy.3525d8af" fallback={"〰"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.c120a0bd" fallback={"PUNKTY KONTROLNE: 3"} /></span>
            <span><LocalizedText translationKey="copy.9f9051c0" fallback={"STEROWANIE: SUWAKI"} /></span>
            <span><LocalizedText translationKey="copy.fa6662ca" fallback={"LIMIT CZASU: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.58f63b56" fallback={"Projekcja w Pokoju 50 drży i rozmywa ścieżkę. Trzy punkty kontrolne z notatki technika pozwalają ją skalibrować. "} /></p>
          <p>
            <LocalizedText translationKey="copy.b0cbba4f" fallback={"Ustaw wejście na 25, środek toru na 55, a punkt końcowy na 80. Możesz używać strzałek klawiatury, suwaków dotykowych lub przycisków urządzenia wspomagającego. "} /></p>
          <p>
            <LocalizedText translationKey="copy.ff873b39" fallback={"To spokojna łamigłówka sterowania — nie mierzy szybkości ani sprawności dłoni. Błędne ustawienia nie powodują kar. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.04854b1f" fallback={"OTWÓRZ KALIBRACJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.dbd6f29b" fallback={"POKÓJ 50 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.e8b7336f" fallback={"USTABILIZUJ "} /><span className="accent"><LocalizedText translationKey="copy.e20f8a95" fallback={"PROJEKCJĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.e58b4756" fallback={"Dopasuj trzy punkty toru do notatki kalibracyjnej. Wartość możesz zmieniać klawiszami strzałek. "} /></p>
      <p className="small-note">
        <LocalizedText translationKey="copy.113662d4" fallback={"NOTATKA TECHNIKA: WEJŚCIE 25 · ŚRODEK 55 · PUNKT KOŃCOWY 80 "} /></p>
      <div className="tremor-console">
        {CALIBRATION_POINTS.map((point, index) => (
          <label className="tremor-control" key={point.id}>
            <span><LocalizedText fallback={point.label} /></span>
            <strong>{values[index]}</strong>
            <input
              aria-label={localizeAttribute(translationKeyFor(point.label), point.label)}
              disabled={complete}
              max="100"
              min="0"
              onChange={(event) =>
                setValues((current) =>
                  current.map((value, valueIndex) =>
                    valueIndex === index ? Number(event.target.value) : value,
                  ),
                )
              }
              step="1"
              type="range"
              value={values[index]}
            />
            <small><LocalizedText translationKey="copy.e7bb312f" fallback={"USTAW WARTOŚĆ Z NOTATKI TECHNIKA"} /></small>
          </label>
        ))}
      </div>
      <p className="small-note"><LocalizedText translationKey="copy.991e1f4a" fallback={"PUNKTY SKALIBROWANE: "} />{alignedCount}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{CALIBRATION_POINTS.length}</p>
      <button className="primary-button" disabled={complete} onClick={checkSignal} type="button">
        <LocalizedText translationKey="copy.afd1ea69" fallback={"ZAPISZ KALIBRACJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
