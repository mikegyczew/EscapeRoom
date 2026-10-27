import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room78Props = {
  onComplete: (proof: string) => void;
};

const PERSPECTIVES = ["0°", "90°", "180°", "270°"];

export default function Room78({ onComplete }: Room78Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function rotate(delta: number) {
    setRotation((current) => (current + delta + 4) % 4);
    setFeedback("");
  }

  function checkPerspective() {
    if (rotation !== 1) {
      setFeedback(localizeAttribute("copy.291e3695", "Korytarz nadal nie łączy oznaczonych punktów. Zmień perspektywę i sprawdź ponownie."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.71e9d089", "Korytarz połączył wejście i wyjście. Zmiana perspektywy odsłoniła drogę."));
    window.setTimeout(() => onComplete(PERSPECTIVES[rotation]), 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.1d62596f" fallback={"POKÓJ 78 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
        <h1>
          <LocalizedText translationKey="copy.5e36bdd0" fallback={"LABIRYNT "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.8248ecf1" fallback={"BEZ WYJŚCIA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.fcd381ed" fallback={"„Droga jest na planie. Trzeba tylko spojrzeć na niego z właściwej strony.” "} /></p>
        <div className="mission-art perspective-mission-art" role="img" aria-label={localizeAttribute("copy.c0fd22d7", "Plan korytarza widziany z boku.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.d8c6165d" fallback={"PLAN PRZESTRZENI // ZMIANA PERSPEKTYWY "} /></div>
          <div className="perspective-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.05f724c0" fallback={"WEJŚCIE"} /></span><i /><i /><i /><span><LocalizedText translationKey="copy.05a6ae04" fallback={"WYJŚCIE"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.c0075bc5" fallback={"PLAN: OBRÓCONY"} /></span>
            <span><LocalizedText translationKey="copy.4b7fa93c" fallback={"DROGA: UKRYTA"} /></span>
            <span><LocalizedText translationKey="copy.1067d582" fallback={"EFEKTY: BEZ MIGANIA"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.09dd29a4" fallback={"Korytarz wygląda jak zamknięta pętla. Na jego planie wejście znajduje się od północy, a wyjście od południa. "} /></p>
          <p>
            <LocalizedText translationKey="copy.80e09e49" fallback={"Obróć plan aż prosty korytarz połączy oba oznaczone punkty. Zmiana perspektywy jest przedstawiona spokojnie, bez migania i ruchomego tła. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.f626c2a5" fallback={"OBEJRZYJ PLAN "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.1d62596f" fallback={"POKÓJ 78 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.25e2ecb1" fallback={"ZMIEŃ "} /><span className="accent"><LocalizedText translationKey="copy.321ece9f" fallback={"PERSPEKTYWĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.f2019055" fallback={"Wejście ma być u góry, a wyjście na dole. Obróć plan o ćwierć obrotu, aby połączyć oznaczone punkty. "} /></p>
      <div className="perspective-endpoints">
        <span><LocalizedText translationKey="copy.54e42423" fallback={"WEJŚCIE ↑"} /></span>
        <strong aria-live="polite">{PERSPECTIVES[rotation]}</strong>
        <span><LocalizedText translationKey="copy.07711c2d" fallback={"WYJŚCIE ↓"} /></span>
      </div>
      <div
        aria-label={localizeAttribute(
          "copy.586fee98",
          "Plan korytarza obrócony o {angle}",
          { angle: PERSPECTIVES[rotation] },
        )}
        className="perspective-scene"
        role="img"
      >
        <div className="perspective-corridor" style={{ transform: `rotate(${rotation * 90}deg)` }}>
          <span className="perspective-marker"><LocalizedText translationKey="copy.4a35b7be" fallback={"●"} /></span>
          <i />
          <i />
          <i />
          <span className="perspective-marker"><LocalizedText translationKey="copy.4e35be0a" fallback={"○"} /></span>
        </div>
      </div>
      <div className="perspective-controls">
        <button aria-label={localizeAttribute("copy.bf55c363", "Obróć plan w lewo")} className="secondary-button" disabled={complete} onClick={() => rotate(-1)} type="button">
          <LocalizedText translationKey="copy.6d2eb293" fallback={"↶ OBRÓĆ W LEWO "} /></button>
        <button aria-label={localizeAttribute("copy.8336069d", "Obróć plan w prawo")} className="secondary-button" disabled={complete} onClick={() => rotate(1)} type="button">
          <LocalizedText translationKey="copy.7f831198" fallback={"OBRÓĆ W PRAWO ↷ "} /></button>
      </div>
      <button className="primary-button" disabled={complete} onClick={checkPerspective} type="button">
        <LocalizedText translationKey="copy.89c34923" fallback={"SPRAWDŹ PRZEJŚCIE "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
