import { useState } from "react";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room11Props = {
  onComplete: (proof: string) => void;
};

const DIRECTIONS = [
  { id: "top", x: 110, y: 24 },
  { id: "right", x: 196, y: 110 },
  { id: "bottom", x: 110, y: 196 },
  { id: "left", x: 24, y: 110 },
] as const;

const MISSING_DIRECTIONS = ["right", "top", "left"] as const;

function BlindSpotDiagram({ missing }: { missing: string }) {
  const { text } = useTranslation();
  return (
    <svg
      aria-label={text("room11.diagramLabel", "Optyczny ślad z czterema możliwymi pozycjami i jednym brakującym punktem światła.")}
      className="blindspot-diagram"
      role="img"
      viewBox="0 0 220 220"
    >
      <circle className="blindspot-ring" cx="110" cy="110" r="82" />
      <circle className="blindspot-ring inner" cx="110" cy="110" r="55" />
      {DIRECTIONS.filter((direction) => direction.id !== missing).map((direction) => (
        <circle
          className="blindspot-light"
          cx={direction.x}
          cy={direction.y}
          key={direction.id}
          r="9"
        />
      ))}
      <circle className="blindspot-center" cx="110" cy="110" r="4" />
      <path className="blindspot-crosshair" d="M110 5v24m0 162v24M5 110h24m162 0h24" />
    </svg>
  );
}

export default function Room11({ onComplete }: Room11Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [solvedDirections, setSolvedDirections] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  function chooseDirection(direction: string) {
    if (direction !== MISSING_DIRECTIONS[round]) {
      setFeedback(text("room11.error", "Ślad nie domyka się. Spójrz na przerwę między światłami i spróbuj ponownie."));
      return;
    }

    if (round === MISSING_DIRECTIONS.length - 1) {
      setFeedback(text("room11.complete", "Ukryte przejście ujawnione. Ślepa plamka przestała zasłaniać wyjście."));
      window.setTimeout(
        () => onComplete(JSON.stringify([...solvedDirections, direction])),
        700,
      );
      return;
    }

    setSolvedDirections((previous) => [...previous, direction]);
    setRound((previous) => previous + 1);
    setFeedback(text("room11.roundComplete", "Optyczny ślad odzyskany. Następny układ pojawia się w ciemności."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room11.roomLabel", "POKÓJ 11 / PŁAT POTYLICZNY")}</div>
        <h1>
          {text("room11.titleFirst", "ŚLEPA")}
          <br />
          <span className="accent">{text("room11.titleSecond", "PLAMKA")}</span>
        </h1>
        <p className="story-quote">
          {text("room11.quote", "„Nie szukaj drzwi. Zauważ, czego brakuje w obrazie.”")}
        </p>
        <div className="mission-art blindspot-mission-art" role="img" aria-label={text("room11.artLabel", "Ciemny układ świetlnych punktów z ukrytym przejściem.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room11.artHeading", "ARCHIWUM OBRAZU // OPTYCZNY ŚLAD")}
          </div>
          <BlindSpotDiagram missing="bottom" />
          <div className="mission-art-footer">
            <span>{text("room11.artLighting", "OŚWIETLENIE: MINIMALNE")}</span>
            <span>{text("room11.artTraces", "ŚLADY: 3")}</span>
            <span>{text("room11.artExit", "WYJŚCIE: UKRYTE")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room11.story1", "W Pokoju 11 nie ma widocznych drzwi. Zapis optyczny zachował trzy układy punktów światła, ale w każdym brakuje jednego elementu.")}</p>
          <p>{text("room11.story2", "Odszukaj przerwę w każdym układzie, zamiast podążać wzrokiem za świecącymi punktami. Każda poprawna odpowiedź odsłoni kolejny fragment drogi.")}</p>
          <p>{text("room11.story3", "Ciemność jest tu częścią obrazu, nie wymogiem dla gracza — ekran pozostaje czytelny i dostępny.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room11.startButton", "WEJDŹ W CIEMNIĘ")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  const missing = MISSING_DIRECTIONS[round];

  return (
    <section className="screen">
      <div className="eyebrow">{text("room11.roomLabel", "POKÓJ 11 / PŁAT POTYLICZNY")}</div>
      <h1 className="section-title">
        {text("room11.screenTitle", "ZNAJDŹ")} <span className="accent">{text("room11.screenTitleAccent", "PRZERWĘ")}</span>
      </h1>
      <p className="lead">
        {text("room11.instruction", "Optyczny ślad {round} z {total}: wskaż stronę, po której brakuje światła.", {
          round: round + 1,
          total: MISSING_DIRECTIONS.length,
        })}
      </p>
      <div className="blindspot-puzzle">
        <BlindSpotDiagram missing={missing} />
      </div>
      <div className="clock-choices">
        {DIRECTIONS.map((direction) => (
          <button
            className="clock-choice"
            key={direction.id}
            onClick={() => chooseDirection(direction.id)}
            type="button"
          >
            {text(`room11.direction.${direction.id}`, {
              top: "GÓRA",
              right: "PRAWO",
              bottom: "DÓŁ",
              left: "LEWO",
            }[direction.id])}
          </button>
        ))}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
