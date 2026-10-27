import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room44Props = {
  onComplete: (proof: string) => void;
};

export default function Room44({ onComplete }: Room44Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function checkAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answer.trim().toLocaleLowerCase("pl-PL") !== "start") {
      setFeedback(localizeAttribute("copy.d7c34028", "Sygnał nie pasuje do pierwszego impulsu. Spróbuj odtworzyć zapis z początku archiwum."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.bf198a62", "Pierwszy sygnał odzyskany. Próg Zapomnienia ustępuje."));
    window.setTimeout(() => onComplete(answer.trim().toLocaleLowerCase("pl-PL")), 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.d4188324" fallback={"POKÓJ 44 / HIPOKAMP"} /></div>
        <h1>
          <LocalizedText translationKey="copy.be3e52f3" fallback={"PRÓG "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.c9e75da0" fallback={"ZAPOMNIENIA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.e8888223" fallback={"„Na początku wystarczyło jedno słowo, by uruchomić archiwum.” "} /></p>
        <div className="mission-art threshold-mission-art" role="img" aria-label={localizeAttribute("copy.613ff34b", "Zanikający zapis pamięci otwierający próg.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.71124e4f" fallback={"PAMIĘĆ KRÓTKOTRWAŁA // PIERWSZY IMPULS "} /></div>
          <div className="threshold-signal" aria-hidden="true">
            <span><LocalizedText translationKey="copy.d60c1322" fallback={"S"} /></span><i /><span><LocalizedText translationKey="copy.d10c0b43" fallback={"T"} /></span><i /><span><LocalizedText translationKey="copy.3a0cb08e" fallback={"?"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.c8fa0171" fallback={"ŹRÓDŁO: POKÓJ 1"} /></span>
            <span><LocalizedText translationKey="copy.52c59bf4" fallback={"ZAPIS: ZANIKAJĄCY"} /></span>
            <span><LocalizedText translationKey="copy.69b76fb1" fallback={"KLUCZ: SŁOWO"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.0363ba2c" fallback={"Na Progu Zapomnienia terminal prosi o pierwsze słowo, którym otworzyliście archiwum w Pokoju 1. "} /></p>
          <p>
            <LocalizedText translationKey="copy.e62a2753" fallback={"Odtwórzcie hasło z pamięci. Jeśli potrzebujecie przypomnienia, możecie odsłonić podpowiedź — bez kary i bez limitu czasu. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.7e36c77c" fallback={"OTWÓRZ TERMINAL "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.d4188324" fallback={"POKÓJ 44 / HIPOKAMP"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.0513777d" fallback={"PRZYPOMNIJ "} /><span className="accent"><LocalizedText translationKey="copy.30390d19" fallback={"PIERWSZE SŁOWO"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.89899d4c" fallback={"Wpisz hasło, którym uruchomiliście archiwum w Pokoju 1. "} /></p>
      <form className="guess-form" onSubmit={checkAnswer}>
        <input
          aria-label={localizeAttribute("copy.cfff013f", "Hasło z Pokoju 1")}
          autoComplete="off"
          maxLength={20}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={localizeAttribute("copy.e42f3af4", "Hasło")}
          value={answer}
        />
        <button disabled={!answer.trim() || complete} type="submit">
          <LocalizedText translationKey="copy.5952e273" fallback={"PRZYWRÓĆ ZAPIS "} /></button>
      </form>
      <button
        aria-expanded={showHint}
        className="secondary-button threshold-hint"
        onClick={() => setShowHint((visible) => !visible)}
        type="button"
      >
        {showHint ? <LocalizedText translationKey="copy.eb5ea284" fallback={"UKRYJ PODPOWIEDŹ"} /> : <LocalizedText translationKey="copy.20aadea3" fallback={"PODPOWIEDŹ"} />}
      </button>
      {showHint && (
        <p className="threshold-hint-copy" role="note">
          <LocalizedText translationKey="copy.3f8f5512" fallback={"W pierwszym pokoju hasło oznaczało początek czegoś nowego. Użyto go, by rozpocząć archiwum. "} /></p>
      )}
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
