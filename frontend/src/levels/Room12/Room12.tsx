import { useEffect, useState } from "react";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room12Props = {
  onComplete: (proof: string) => void;
};

const DIRECTIONS = [
  { id: "north", symbol: "↑" },
  { id: "east", symbol: "→" },
  { id: "south", symbol: "↓" },
  { id: "west", symbol: "←" },
] as const;

const VIBRATION_ROUNDS = [
  ["north", "west", "north"],
  ["east", "south", "west", "east"],
  ["south", "north", "east", "west", "south"],
] as const;

export default function Room12({ onComplete }: Room12Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePulse, setActivePulse] = useState(-1);
  const [response, setResponse] = useState<string[]>([]);
  const [solvedDirections, setSolvedDirections] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  const pattern = VIBRATION_ROUNDS[round];

  useEffect(() => {
    if (!isPlaying) return;

    let pulseIndex = -1;
    const intervalId = window.setInterval(() => {
      pulseIndex += 1;
      if (pulseIndex >= pattern.length) {
        window.clearInterval(intervalId);
        setActivePulse(-1);
        setIsPlaying(false);
        return;
      }

      setActivePulse(pulseIndex);
      window.setTimeout(() => setActivePulse(-1), 350);
    }, 700);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, pattern]);

  function repeatPattern() {
    if (isPlaying) return;
    setResponse([]);
    setFeedback("");
    setIsPlaying(true);
  }

  function chooseDirection(direction: string) {
    if (isPlaying) return;

    const nextResponse = [...response, direction];
    const expectedDirection = pattern[nextResponse.length - 1];
    if (direction !== expectedDirection) {
      setResponse([]);
      setFeedback(text("room12.error", "Wibracja nie pasuje do śladu. Odtwórz sekwencję ponownie."));
      return;
    }

    setResponse(nextResponse);
    if (nextResponse.length !== pattern.length) return;

    if (round === VIBRATION_ROUNDS.length - 1) {
      setFeedback(text("room12.complete", "Ostatni ślad zapisany. Śluza akustyczna otwiera przejście."));
      const fullSequence = [...solvedDirections, ...nextResponse];
      setSolvedDirections(fullSequence);
      window.setTimeout(() => onComplete(JSON.stringify(fullSequence)), 700);
      return;
    }

    setSolvedDirections((previous) => [...previous, ...nextResponse]);
    setRound((previous) => previous + 1);
    setResponse([]);
    setFeedback(text("room12.roundComplete", "Sekwencja zachowana. Odczytaj kolejny ślad podłogi."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room12.roomLabel", "POKÓJ 12 / PŁAT SKRONIOWY")}</div>
        <h1>
          {text("room12.titleFirst", "CISZA")}
          <br />
          <span className="accent">{text("room12.titleSecond", "ABSOLUTNA")}</span>
        </h1>
        <p className="story-quote">
          {text("room12.quote", "„Gdy dźwięk zanika, podłoga wciąż pamięta rytm.”")}
        </p>
        <div className="mission-art vibration-mission-art" role="img" aria-label={text("room12.artLabel", "Cztery kierunki śladu wibracji na podłodze komory.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room12.artHeading", "KOMORA WYCISZONA // ODCZYT DRGAŃ")}
          </div>
          <div className="vibration-compass" aria-hidden="true">
            <span><LocalizedText translationKey="copy.943c783c" fallback={"↑"} /></span><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span><span><LocalizedText translationKey="copy.963c7b62" fallback={"↓"} /></span><span><LocalizedText translationKey="copy.953c79cf" fallback={"←"} /></span>
            <i />
          </div>
          <div className="mission-art-footer">
            <span>{text("room12.artSound", "DŹWIĘK: WYCISZONY")}</span>
            <span>{text("room12.artTraces", "ŚLADY: 3 SEKWENCJE")}</span>
            <span>{text("room12.artCarrier", "NOŚNIK: PODŁOGA")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room12.story1", "W komorze Pokoju 12 nie można polegać na dźwięku. Archiwum zachowało trzy sekwencje wibracji przesuwających się pod podłogą.")}</p>
          <p>{text("room12.story2", "Obserwuj kierunki rozświetlających się pól i powtórz każdy ślad na panelu. Sekwencje stopniowo się wydłużają.")}</p>
          <p>{text("room12.story3", "Wibracje przedstawia animacja światła — gra nie wymaga słuchu ani fizycznego sprzężenia zwrotnego.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room12.startButton", "WEJDŹ DO KOMORY")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow">{text("room12.roomLabel", "POKÓJ 12 / PŁAT SKRONIOWY")}</div>
      <h1 className="section-title">
        {text("room12.screenTitle", "ODCZYTAJ")} <span className="accent">{text("room12.screenTitleAccent", "WIBRACJE")}</span>
      </h1>
      <p className="lead">
        {text("room12.instruction", "Sekwencja {round} z {total}. Zapamiętaj kierunki, a potem powtórz je na panelu.", {
          round: round + 1,
          total: VIBRATION_ROUNDS.length,
        })}
      </p>
      <div className="vibration-display" aria-live="polite">
        <div className="vibration-compass">
          {DIRECTIONS.map((direction) => (
            <span
              className={pattern[activePulse] === direction.id ? "is-pulsing" : ""}
              key={direction.id}
            >
              {direction.symbol}
            </span>
          ))}
          <i />
        </div>
        <p>{isPlaying ? text("room12.pulsingStatus", "ODCZYT DRGAŃ...") : text("room12.mutedStatus", "PODŁOGA WYCISZONA")}</p>
      </div>
      {!isPlaying && (
        <button className="secondary-button" onClick={repeatPattern}>
          {text("room12.repeatButton", "↻ ODTWÓRZ SEKWENCJĘ")}
        </button>
      )}
      <div className="vibration-controls">
        {DIRECTIONS.map((direction) => (
          <button
            className="vibration-direction"
            disabled={isPlaying}
            key={direction.id}
            onClick={() => chooseDirection(direction.id)}
            type="button"
          >
            <span>{direction.symbol}</span>
            {text(`room12.direction.${direction.id}`, {
              north: "PÓŁNOC",
              east: "WSCHÓD",
              south: "POŁUDNIE",
              west: "ZACHÓD",
            }[direction.id])}
          </button>
        ))}
      </div>
      <p className="small-note">
        {text("room12.savedTraces", "ZAPISANE DRGANIA:")} {response.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{pattern.length}
      </p>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
