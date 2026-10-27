import { useState } from "react";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room23Props = {
  onComplete: (proof: string) => void;
};

const BREATH_STEPS = [4, 2, 6] as const;

export default function Room23({ onComplete }: Room23Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState([0, 0, 0]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function changeValue(index: number, delta: number) {
    setValues((current) =>
      current.map((value, valueIndex) =>
        valueIndex === index ? (value + delta + 10) % 10 : value,
      ),
    );
    setFeedback("");
  }

  function stabilizeClock() {
    if (values.join("") !== "426") {
      setFeedback(text("room23.feedback.incorrect", "Mechanizm nadal się waha. Odczytaj wskazówkę z notatki."));
      return;
    }

    setComplete(true);
    setFeedback(text("room23.feedback.complete", "Rytm odzyskany. Zegar cichnie, a przejście się otwiera."));
    window.setTimeout(() => onComplete(JSON.stringify(values)), 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room23.roomLabel", "POKÓJ 23 / UKŁAD LIMBICZNY")}</div>
        <h1>
          {text("room23.titleFirst", "POKÓJ")}
          <br />
          <span className="accent">{text("room23.titleSecond", "NAPIĘCIA")}</span>
        </h1>
        <p className="story-quote">
          {text("room23.quote", "„Zegar nie prosi o pośpiech. Przypomina o równym rytmie.”")}
        </p>
        <div className="mission-art tension-mission-art" role="img" aria-label={text("room23.artLabel", "Mechaniczny zegar z trzema tarczami rytmu.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room23.artHeading", "MECHANIZM ARCHIWUM // RYTM ODDECHU")}
          </div>
          <div className="tension-clock" aria-hidden="true">
            <span><LocalizedText translationKey="copy.1deb2d6a" fallback={"12"} /></span><span><LocalizedText translationKey="copy.360caa42" fallback={"3"} /></span><span><LocalizedText translationKey="copy.330ca589" fallback={"6"} /></span><span><LocalizedText translationKey="copy.3c0cb3b4" fallback={"9"} /></span>
            <i />
          </div>
          <div className="mission-art-footer">
            <span>{text("room23.artDrive", "NAPĘD: MECHANICZNY")}</span>
            <span>{text("room23.artRhythm", "RYTM: NIEUSTALONY")}</span>
            <span>{text("room23.artMode", "TRYB: BEZ PRESJI CZASU")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room23.story1", "W Pokoju 23 mechaniczny zegar odmierza chwile, ale nie ogranicza czasu na rozwiązanie. Jego trzy tarcze czekają na rytm zapisany przez Henry'ego na marginesie notatki.")}</p>
          <p>{text("room23.story2", "Wskazówka brzmi: „Wdech przez cztery uderzenia, pauza przez dwa, wydech przez sześć”.")}</p>
          <p>{text("room23.story3", "Ustaw wartości w tej kolejności, aby przywrócić spokojny rytm mechanizmu.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room23.startButton", "ODCZYTAJ MECHANIZM")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow">{text("room23.roomLabel", "POKÓJ 23 / UKŁAD LIMBICZNY")}</div>
      <h1 className="section-title">
        {text("room23.screenTitle", "PRZYWRÓĆ")} <span className="accent">{text("room23.screenTitleAccent", "RYTM")}</span>
      </h1>
      <p className="lead">
        {text("room23.instruction", "Ustaw wdech, pauzę i wydech według wskazówki. Możesz spokojnie eksperymentować — nie ma limitu czasu ani kar.")}
      </p>
      <div className="tension-console">
        {BREATH_STEPS.map((_, index) => {
          const stepLabel = text([
            "room23.breath.inhale",
            "room23.breath.pause",
            "room23.breath.exhale",
          ][index], ["WDECH", "PAUZA", "WYDECH"][index]);
          return (
            <div className="tension-step" key={index}>
              <span>{stepLabel}</span>
              <div className="tension-value">
                <button
                  aria-label={text("room23.decreaseValue", "Zmniejsz wartość: {step}", { step: stepLabel.toLocaleLowerCase() })}
                  disabled={complete}
                  onClick={() => changeValue(index, -1)}
                  type="button"
                >
                  <LocalizedText translationKey="copy.f1e4f2cf" fallback={"− "} /></button>
                <strong aria-live="polite">{values[index]}</strong>
                <button
                  aria-label={text("room23.increaseValue", "Zwiększ wartość: {step}", { step: stepLabel.toLocaleLowerCase() })}
                  disabled={complete}
                  onClick={() => changeValue(index, 1)}
                  type="button"
                >
                  <LocalizedText translationKey="copy.07dc003e" fallback={"+ "} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        className="primary-button"
        disabled={complete}
        onClick={stabilizeClock}
        type="button"
      >
        {text("room23.stabilizeButton", "USTABILIZUJ ZEGAR")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
