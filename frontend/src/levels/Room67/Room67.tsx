import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room67Props = {
  onComplete: (proof: string) => void;
};

const DEFINITIONS = [
  {
    clue: "„Przedmiot z uchwytem, który otwiera zamek.”",
    answer: "klucz",
    options: ["klucz", "łyżka", "lustro"],
  },
  {
    clue: "„Przedmiot z kartkami, w którym zapisano słowa.”",
    answer: "książka",
    options: ["poduszka", "książka", "butelka"],
  },
  {
    clue: "„Miejsce, przez które wchodzi się do pokoju.”",
    answer: "drzwi",
    options: ["drzwi", "zegarek", "ołówek"],
  },
] as const;

export default function Room67({ onComplete }: Room67Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [solvedWords, setSolvedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const definition = DEFINITIONS[step];

  function chooseWord(word: string) {
    if (word !== definition.answer) {
      setFeedback(localizeAttribute("copy.96e8277f", "Nazwa nie pasuje do opisu. Porównaj cechy przedmiotu z każdym słowem."));
      return;
    }

    if (step === DEFINITIONS.length - 1) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.523dec13", "Wspólny słownik uzgodniony. Nazwy i przedmioty znów do siebie pasują."));
      window.setTimeout(
        () => onComplete(JSON.stringify([...solvedWords, word])),
        700,
      );
      return;
    }

    setSolvedWords((previous) => [...previous, word]);
    setStep((current) => current + 1);
    setFeedback(localizeAttribute("copy.6d7daefb", "Znaczenie uzgodnione. Przejdź do kolejnego przedmiotu."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.694ff647" fallback={"POKÓJ 67 / OBSZAR BROKI I WERNICKEGO"} /></div>
        <h1>
          <LocalizedText translationKey="copy.3e22a638" fallback={"WIEŻA "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.59594903" fallback={"BABEL"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.799a08b9" fallback={"„Nazwy się pomieszały. Rzeczy wciąż pamiętają, czym są.” "} /></p>
        <div className="mission-art babel-mission-art" role="img" aria-label={localizeAttribute("copy.e2163080", "Przedmioty i słowa, które trzeba ponownie uzgodnić.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.23e70ac0" fallback={"WSPÓLNY SŁOWNIK // 3 HASŁA "} /></div>
          <div className="babel-art-words" aria-hidden="true">
            <span><LocalizedText translationKey="copy.90e3b558" fallback={"KLUCZ"} /></span><i><LocalizedText translationKey="copy.913c7383" fallback={"↔"} /></i><span><LocalizedText translationKey="copy.d6ae6fc7" fallback={"DRZWI"} /></span><i><LocalizedText translationKey="copy.913c7383" fallback={"↔"} /></i><span><LocalizedText translationKey="copy.55c4a620" fallback={"SŁOWO"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.c68bf528" fallback={"ETYKIETY: POMIESZANE"} /></span>
            <span><LocalizedText translationKey="copy.2c285703" fallback={"OPISY: ZACHOWANE"} /></span>
            <span><LocalizedText translationKey="copy.551a39fa" fallback={"GŁOS: OPCJONALNY"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.be59d3a2" fallback={"W Wieży Babel nazwy przedmiotów zostały pomieszane. Krótkie opisy pozwolą ponownie uzgodnić wspólny słownik. "} /></p>
          <p>
            <LocalizedText translationKey="copy.0fa38a81" fallback={"Przeczytaj opis i wybierz pasujące słowo. Możecie rozmawiać albo wskazywać odpowiedzi — żadna forma komunikacji nie jest wymagana. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.5e903cb4" fallback={"OTWÓRZ SŁOWNIK "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.694ff647" fallback={"POKÓJ 67 / OBSZAR BROKI I WERNICKEGO"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.a796fe63" fallback={"UZGODNIJ "} /><span className="accent"><LocalizedText translationKey="copy.9d60f476" fallback={"NAZWY"} /></span>
      </h1>
      <p className="lead"><LocalizedText translationKey="copy.bf5362b1" fallback={"HASŁO "} />{step + 1} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{DEFINITIONS.length}</p>
      <div className="babel-definition"><LocalizedText fallback={definition.clue} /></div>
      <div className="babel-options">
        {definition.options.map((word) => (
          <button
            className="babel-option"
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
        <LocalizedText translationKey="copy.6e9cd870" fallback={"UZGODNIONE NAZWY: "} />{complete ? DEFINITIONS.length : step}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{DEFINITIONS.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
