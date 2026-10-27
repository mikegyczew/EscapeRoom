import { useState } from "react";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room22Props = {
  onComplete: (proof: string) => void;
};

const TARGET_FREQUENCY = 98.4;
const MIN_FREQUENCY = 88;
const MAX_FREQUENCY = 108;

export default function Room22({ onComplete }: Room22Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [frequency, setFrequency] = useState(91.2);
  const [feedback, setFeedback] = useState("");
  const distance = Math.abs(frequency - TARGET_FREQUENCY);
  const signalStrength = Math.max(4, Math.round(100 - distance * 11));

  function tuneRadio() {
    if (distance <= 0.05) {
      setFeedback(text("room22.feedback.complete", "Sygnał odnaleziony. Ukryta wiadomość wraca do archiwum."));
      window.setTimeout(() => onComplete(frequency.toFixed(1)), 700);
      return;
    }
    setFeedback(
      frequency < TARGET_FREQUENCY
        ? text("room22.feedback.higher", "Sygnał jest wyżej. Przestroj radio w prawo.")
        : text("room22.feedback.lower", "Sygnał jest niżej. Przestroj radio w lewo."),
    );
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room22.roomLabel", "POKÓJ 22 / PŁAT SKRONIOWY")}</div>
        <h1>
          {text("room22.titleFirst", "SZUM")}
          <br />
          <span className="accent">{text("room22.titleSecond", "SZUMÓW")}</span>
        </h1>
        <p className="story-quote">
          {text("room22.quote", "„Prawidłowa częstotliwość przebija się przez zakłócenia.”")}
        </p>
        <div className="mission-art radio-mission-art" role="img" aria-label={text("room22.artLabel", "Retro odbiornik radiowy z zakłóconą falą i skalą częstotliwości.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room22.artHeading", "ODBIORNIK ARCHIWALNY // PASMO FM")}
          </div>
          <div className="radio-art">
            <span className="radio-art-dial">{text("room22.dialScale", "88 ── 94 ── 100 ── 108")}</span>
            <span className="radio-art-wave">{text("room22.waveNoise", "〰〰〰〰〰")}</span>
          </div>
          <div className="mission-art-footer">
            <span>{text("room22.artBand", "PASMO: FM")}</span>
            <span>{text("room22.artInterference", "ZAKŁÓCENIA: SILNE")}</span>
            <span>{text("room22.artSignal", "SYGNAŁ: NIEUSTABILIZOWANY")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room22.story1", "W Pokoju 22 stary odbiornik przechwytuje jedynie szum. Na marginesie taśmy technik zapisał częstotliwość, na której ukryto wiadomość: 98,4 MHz.")}</p>
          <p>{text("room22.story2", "Dostrój analogową skalę, obserwując siłę sygnału. Gdy trafisz w częstotliwość, zakłócenia ustąpią.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room22.startButton", "URUCHOM ODBIORNIK")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow">{text("room22.roomLabel", "POKÓJ 22 / PŁAT SKRONIOWY")}</div>
      <h1 className="section-title">
        {text("room22.screenTitle", "DOSTRÓJ")} <span className="accent">{text("room22.screenTitleAccent", "ODBIORNIK")}</span>
      </h1>
      <p className="lead">
        {text("room22.instruction", "Szukana częstotliwość to 98,4 MHz. Ustaw skalę i znajdź czysty sygnał.")}
      </p>
      <div className="radio-console">
        <div className="radio-frequency">
          <span><LocalizedText translationKey="copy.7fd3659c" fallback={"FM"} /></span>
          <strong>{frequency.toFixed(1)} <small><LocalizedText translationKey="copy.3842653e" fallback={"MHz"} /></small></strong>
        </div>
        <div aria-label={text("room22.signalAria", "Siła sygnału {strength} procent", { strength: signalStrength })} className="radio-signal-meter">
          {Array.from({ length: 10 }, (_, index) => (
            <i
              className={index < Math.ceil(signalStrength / 10) ? "is-lit" : ""}
              key={index}
            />
          ))}
        </div>
        <label className="radio-tuning">
          <span>{text("room22.scaleLabel", "SKALA CZĘSTOTLIWOŚCI")}</span>
          <input
            aria-label={text("room22.frequencyInputLabel", "Częstotliwość radia")}
            max={MAX_FREQUENCY}
            min={MIN_FREQUENCY}
            onChange={(event) => {
              setFrequency(Number(event.target.value));
              setFeedback("");
            }}
            step="0.1"
            type="range"
            value={frequency}
          />
          <span className="radio-frequency-range">
            <span>{MIN_FREQUENCY.toFixed(1)}</span>
            <span>{MAX_FREQUENCY.toFixed(1)} <LocalizedText translationKey="copy.3842653e" fallback={"MHz"} /></span>
          </span>
        </label>
        <div aria-hidden="true" className="radio-noise">
          {distance <= 0.05 ? text("room22.foundSignal", "♪  SYGNAŁ ODNALEZIONY  ♪") : text("room22.noise", "▓▒░  SZUM  ░▒▓")}
        </div>
      </div>
      <button className="primary-button" onClick={tuneRadio}>
        {text("room22.saveButton", "ZAPISZ CZĘSTOTLIWOŚĆ")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
      </button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
