import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room76Props = {
  onComplete: (proof: string) => void;
};

const SENTENCES = [
  {
    prompt: "„Przed wyjściem przekręcam ___ w zamku.”",
    answer: "klucz",
    options: ["klucz", "ogród", "sen"],
  },
  {
    prompt: "„O poranku przez okno wpada ___.”",
    answer: "światło",
    options: ["cisza", "światło", "list"],
  },
  {
    prompt: "„Na stole leży ___, w którym zapisuję myśli.”",
    answer: "notatnik",
    options: ["notatnik", "drzwi", "zegar"],
  },
] as const;

export default function Room76({ onComplete }: Room76Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [solvedWords, setSolvedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const sentence = SENTENCES[sentenceIndex];

  function chooseWord(word: string) {
    if (word !== sentence.answer) {
      setFeedback(localizeAttribute("copy.46685a3b", "To słowo nie pasuje do zdania. Skorzystaj z otaczających je wskazówek."));
      return;
    }

    if (sentenceIndex === SENTENCES.length - 1) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.ec7add91", "Znaczenia wróciły na swoje miejsce. Słownik Pamięci został odtworzony."));
      window.setTimeout(
        () => onComplete(JSON.stringify([...solvedWords, word])),
        700,
      );
      return;
    }

    setSolvedWords((previous) => [...previous, word]);
    setSentenceIndex((index) => index + 1);
    setFeedback(localizeAttribute("copy.389f0d42", "Znaczenie odzyskane. Przeczytaj kolejny fragment."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.2f64601d" fallback={"POKÓJ 76 / OBSZAR BROKI I WERNICKEGO"} /></div>
        <h1>
          <LocalizedText translationKey="copy.ae35832d" fallback={"SŁOWNIK "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.852591d4" fallback={"PAMIĘCI"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.1c0c745e" fallback={"„Gdy słowo znika, czasem zostaje zdanie, które je pamięta.” "} /></p>
        <div className="mission-art word-memory-mission-art" role="img" aria-label={localizeAttribute("copy.97e2c5f8", "Rozsypane wyrazy układające się w zdanie z kontekstu.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.a942dc82" fallback={"ARCHIWUM JĘZYKA // BRAKUJĄCE ZNACZENIA "} /></div>
          <div className="word-memory-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.233eec59" fallback={"…"} /></span><i><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></i><span><LocalizedText translationKey="copy.3a0cb08e" fallback={"?"} /></span><i><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></i><span><LocalizedText translationKey="copy.7093151a" fallback={"ZDANIE"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.cc06c72f" fallback={"FRAGMENTY: 3"} /></span>
            <span><LocalizedText translationKey="copy.962b3328" fallback={"ŹRÓDŁO: KONTEKST"} /></span>
            <span><LocalizedText translationKey="copy.b52011c0" fallback={"GŁOS: NIEPOTRZEBNY"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.5431d87a" fallback={"W notatkach z Pokoju 76 część słów zniknęła. Uzupełnij krótkie zdania, odczytując znaczenie z kontekstu. "} /></p>
          <p>
            <LocalizedText translationKey="copy.90f835ae" fallback={"Nie musisz niczego wypowiadać na głos. Możesz wspólnie przeczytać fragment i wybrać pasujące słowo. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.5e903cb4" fallback={"OTWÓRZ SŁOWNIK "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.2f64601d" fallback={"POKÓJ 76 / OBSZAR BROKI I WERNICKEGO"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.7c95b5c4" fallback={"ODTWÓRZ "} /><span className="accent"><LocalizedText translationKey="copy.e39bd818" fallback={"ZNACZENIE"} /></span>
      </h1>
      <p className="lead"><LocalizedText translationKey="copy.f95fb147" fallback={"FRAGMENT "} />{sentenceIndex + 1} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{SENTENCES.length}</p>
      <div className="word-memory-sentence">
        <LocalizedText fallback={sentence.prompt} />
      </div>
      <div className="word-memory-options">
        {sentence.options.map((word) => (
          <button
            className="word-memory-option"
            disabled={complete}
            key={word}
            onClick={() => chooseWord(word)}
            type="button"
          >
            {word}
          </button>
        ))}
      </div>
      <div className="small-note">
        <LocalizedText translationKey="copy.7a4d3c48" fallback={"ODZYSKANE ZNACZENIA: "} />{complete ? SENTENCES.length : sentenceIndex}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{SENTENCES.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
