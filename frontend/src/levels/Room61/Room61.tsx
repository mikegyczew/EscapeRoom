import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room61Props = {
  onComplete: (proof: string) => void;
};

const MOVES = [
  {
    clue: "Biały pion ruszył z E2 o dwa pola naprzód.",
    answer: "E2 → E4",
    options: ["E2 → E4", "D2 → D4"],
  },
  {
    clue: "Czarny pion odpowiedział ruchem z E7 na E5.",
    answer: "E7 → E5",
    options: ["C7 → C5", "E7 → E5"],
  },
  {
    clue: "Biały skoczek z G1 rozwinął się na F3.",
    answer: "G1 → F3",
    options: ["G1 → F3", "B1 → C3"],
  },
] as const;

export default function Room61({ onComplete }: Room61Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [solvedMoves, setSolvedMoves] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const currentMove = MOVES[moveIndex];

  function chooseMove(move: string) {
    if (move !== currentMove.answer) {
      setFeedback(localizeAttribute("copy.8b41e5aa", "Ten ruch nie pasuje do zachowanego zapisu. Sprawdź pole startowe i kierunek."));
      return;
    }

    if (moveIndex === MOVES.length - 1) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.3850e07f", "Partia odzyskana. Ostatni ruch odsłania kolejne połączenie."));
      window.setTimeout(
        () => onComplete(JSON.stringify([...solvedMoves, move])),
        700,
      );
      return;
    }

    setSolvedMoves((previous) => [...previous, move]);
    setMoveIndex((index) => index + 1);
    setFeedback(localizeAttribute("copy.5346cb54", "Ruch potwierdzony. Odczytaj następny fragment partii."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.317c7714" fallback={"POKÓJ 61 / PŁAT CZOŁOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.0c6b1c71" fallback={"SZACHY "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.2504c875" fallback={"Z CIENIEM"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.128fd432" fallback={"„Nie szukaj zwycięzcy. Odzyskaj kolejność myśli.” "} /></p>
        <div className="mission-art chess-mission-art" role="img" aria-label={localizeAttribute("copy.52eae601", "Szachownica z niepełnym zapisem trzech ruchów.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.cbcdef8e" fallback={"ZAPIS PARTII // 3 BRAKUJĄCE RUCHY "} /></div>
          <div className="chess-art-board" aria-hidden="true">
            <span><LocalizedText translationKey="copy.d93b51db" fallback={"♜"} /></span><i /><span><LocalizedText translationKey="copy.da3b536e" fallback={"♟"} /></span><i />
            <i /><span><LocalizedText translationKey="copy.dd3b5827" fallback={"♘"} /></span><i /><span><LocalizedText translationKey="copy.dc3b5694" fallback={"♙"} /></span>
            <span><LocalizedText translationKey="copy.dc3b5694" fallback={"♙"} /></span><i /><span><LocalizedText translationKey="copy.da3b536e" fallback={"♟"} /></span><i />
            <i /><span><LocalizedText translationKey="copy.dc3b5694" fallback={"♙"} /></span><i /><span><LocalizedText translationKey="copy.d33b4869" fallback={"♖"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.6f424296" fallback={"ARCHIWUM: NIEPEŁNE"} /></span>
            <span><LocalizedText translationKey="copy.e2593065" fallback={"RUCHY: 3"} /></span>
            <span><LocalizedText translationKey="copy.acd839be" fallback={"TRYB: ODTWARZANIE"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.98550b5a" fallback={"Terminal zachował trzy krótkie opisy z partii Profesora, ale notacja ruchów zniknęła. "} /></p>
          <p>
            <LocalizedText translationKey="copy.1b2cceb5" fallback={"Przeczytaj fragmenty po kolei i wybierz ruch pasujący do każdego opisu. To rekonstrukcja zapisu, nie pojedynek z algorytmem. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.72474920" fallback={"ODTWÓRZ PARTIĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.317c7714" fallback={"POKÓJ 61 / PŁAT CZOŁOWY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.7c95b5c4" fallback={"ODTWÓRZ "} /><span className="accent"><LocalizedText translationKey="copy.08ef306d" fallback={"PARTIĘ"} /></span>
      </h1>
      <p className="lead"><LocalizedText translationKey="copy.bd1f3459" fallback={"RUCH "} />{moveIndex + 1} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{MOVES.length}</p>
      <div className="chess-move-clue">
        <span><LocalizedText translationKey="copy.3eb92d2d" fallback={"FRAGMENT ZAPISU"} /></span>
        <strong><LocalizedText fallback={currentMove.clue} /></strong>
      </div>
      <div className="chess-move-options">
        {currentMove.options.map((move) => (
          <button
            className="chess-move-option"
            disabled={complete}
            key={move}
            onClick={() => chooseMove(move)}
            type="button"
          >
            {move}
          </button>
        ))}
      </div>
      <div className="small-note">
        <LocalizedText translationKey="copy.f510f84f" fallback={"ODTWORZONE RUCHY: "} />{complete ? MOVES.length : moveIndex}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{MOVES.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
