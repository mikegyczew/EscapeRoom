import { useEffect, useRef, useState, type FormEvent } from "react";
import { type FirstPuzzleResponse, type GuessResponse } from "./index";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room01Props = {
  onComplete: () => void;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function BinaryCipherIllustration() {
  const { text: localizeAttribute } = useTranslation();
  return (
    <div
      className="mission-art binary-mission-art"
      role="img"
      aria-label={localizeAttribute("copy.137192bf", "Animowany terminal z ciągami zer i jedynek odszyfrowującymi zaszyfrowaną wiadomość.")}
    >
      <div className="mission-art-heading">
        <span className="logic-led is-on" />
        <LocalizedText translationKey="copy.3c652f2e" fallback={"TERMINAL DEKODUJĄCY // ODEBRANO SYGNAŁ "} /></div>
      <div className="binary-art-screen" aria-hidden="true">
        <div className="binary-art-stream binary-art-stream-left">
          <LocalizedText translationKey="copy.cf80447b" fallback={"01001000"} /><br /><LocalizedText translationKey="copy.2d850405" fallback={"11010010"} /><br /><LocalizedText translationKey="copy.c38230c5" fallback={"00101101"} /><br /><LocalizedText translationKey="copy.fc6a4881" fallback={"10100110 "} /></div>
        <div className="binary-art-stream binary-art-stream-right">
          <LocalizedText translationKey="copy.045c4e83" fallback={"10110010"} /><br /><LocalizedText translationKey="copy.50abab63" fallback={"01001101"} /><br /><LocalizedText translationKey="copy.77045c6f" fallback={"11100010"} /><br /><LocalizedText translationKey="copy.f045e09d" fallback={"01011001 "} /></div>
        <div className="binary-art-core">
          <div className="binary-art-core-ring">
            <span><LocalizedText translationKey="copy.20ed70ba" fallback={"01"} /></span>
            <span><LocalizedText translationKey="copy.1beb2a44" fallback={"10"} /></span>
            <span><LocalizedText translationKey="copy.1ceb2bd7" fallback={"11"} /></span>
            <span><LocalizedText translationKey="copy.21ed724d" fallback={"00"} /></span>
            <strong><LocalizedText translationKey="copy.3a0cb08e" fallback={"?"} /></strong>
          </div>
          <span className="binary-art-scanline" />
        </div>
      </div>
      <div className="mission-art-footer">
        <span><LocalizedText translationKey="copy.fac6df43" fallback={"FORMAT: BINARNY"} /></span>
        <span><LocalizedText translationKey="copy.cd56a6fa" fallback={"WIADOMOŚĆ: ZASZYFROWANA"} /></span>
        <span><LocalizedText translationKey="copy.aa100b9e" fallback={"STATUS: OCZEKIWANIE"} /></span>
      </div>
    </div>
  );
}

export default function Room01({ onComplete }: Room01Props) {
  const { text: localizeAttribute } = useTranslation();
  const [position, setPosition] = useState(0);
  const [guess, setGuess] = useState("");
  const [binaryCodes, setBinaryCodes] = useState<string[]>([]);
  const [puzzleError, setPuzzleError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [allFlipped, setAllFlipped] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const completionTimerRef = useRef<number | null>(null);
  const progress = Math.min(position, binaryCodes.length);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPuzzle() {
      try {
        const response = await fetch("/api/puzzles/first", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Błąd API: ${response.status}`);
        }

        const puzzle = (await response.json()) as FirstPuzzleResponse;
        if (
          !Number.isInteger(puzzle.length) ||
          puzzle.length < 1 ||
          puzzle.binaryCodes.length !== puzzle.length
        ) {
          throw new Error("Nieprawidłowa konfiguracja szyfru.");
        }
        setBinaryCodes(puzzle.binaryCodes);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPuzzleError(
          error instanceof Error
            ? `Nie udało się pobrać szyfru: ${error.message}`
            : "Nie udało się pobrać szyfru.",
        );
      }
    }

    void loadPuzzle();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (startedAt === null) return;

    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(
    () => () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
    },
    [],
  );

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = guess.trim().toLowerCase();
    if (!value) return;

    setAttempts((previous) => previous + 1);
    setFeedback("");

    let nextPosition = position;
    let hadError = false;
    try {
      for (const character of value) {
        if (nextPosition >= binaryCodes.length) break;

        const response = await fetch("/api/puzzles/first/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: nextPosition,
            letter: character,
          }),
        });

        if (!response.ok) {
          throw new Error(`Błąd API: ${response.status}`);
        }

        const result = (await response.json()) as GuessResponse;

        if (!result.correct) {
          hadError = true;
          setErrors((previous) => previous + 1);
          setFeedback(result.message || "BŁĘDNY ZNAK. SPRÓBUJ PONOWNIE.");
          break;
        }

        nextPosition += 1;
      }

      setPosition(nextPosition);
      setGuess("");

      if (nextPosition >= binaryCodes.length) {
        setFeedback(localizeAttribute("copy.1e72ab2b", "SZYFR ZŁAMANY. DRZWI ZOSTAŁY OTWARTE."));
        completionTimerRef.current = window.setTimeout(onComplete, 1000);
      } else if (!hadError && nextPosition > position) {
        setFeedback(localizeAttribute("copy.556e7dad", "ZNAK ZAAKCEPTOWANY. KONTYNUUJ."));
      }
    } catch {
      setFeedback(
        localizeAttribute("copy.bbfa60c3", "Nie można połączyć się z API. Sprawdź, czy backend działa na porcie 5166."),
      );
    }
  }

  if (startedAt === null) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.d81af0b9" fallback={"POKÓJ 01 / PŁAT POTYLICZNY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.c53e110a" fallback={"PIERWSZE "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.ca58f586" fallback={"ŚWIATŁO."} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.0a7d4271" fallback={"„Jeśli potrafisz odczytać sygnał, światło jeszcze nie zgasło.” "} /></p>
        <BinaryCipherIllustration />
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.1747c310" fallback={"Jesteście naprawczym impulsem w pierwszym sektorze archiwum Profesora Henry'ego Armitage'a. W Pokoju Pierwszego Światła projektor wyświetla binarny sygnał startowy. "} /></p>
          <p>
            <LocalizedText translationKey="copy.9a00246f" fallback={"Odczytaj kod, aby uruchomić pierwszą synapsę i przywrócić połączenie z archiwum. Wszystkie kody są widoczne od początku; wpisz całe hasło albo znane kolejne litery. "} /></p>
        </div>
        <button
          className="primary-button"
          onClick={() => setStartedAt(Date.now())}
          disabled={binaryCodes.length === 0 || Boolean(puzzleError)}
        >
          {puzzleError
            ? <LocalizedText translationKey="copy.124ff9b8" fallback={"SZYFR NIEDOSTĘPNY"} />
            : binaryCodes.length === 0
              ? <LocalizedText translationKey="copy.38383a15" fallback={"ŁADOWANIE SZYFRU..."} />
              : <LocalizedText translationKey="copy.a17fbda0" fallback={"URUCHOM PIERWSZY SYGNAŁ"} />}
          <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
        {puzzleError && <p className="feedback" role="alert">{puzzleError}</p>}
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.d81af0b9" fallback={"POKÓJ 01 / PŁAT POTYLICZNY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.56b7d003" fallback={"ODCZYTAJ "} /><span className="accent"><LocalizedText translationKey="copy.6ad99d4a" fallback={"SYGNAŁ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.c28b28e2" fallback={"Sygnał startowy ma "} />{binaryCodes.length} <LocalizedText translationKey="copy.6c292f88" fallback={"znaków. Wpisz całe hasło lub kolejne znaki, które udało ci się odczytać. "} /></p>

      <div className="stats-grid">
        <div className="stat-card">
          <span><LocalizedText translationKey="copy.3466c338" fallback={"CZAS"} /></span>
          <strong>{formatTime(seconds)}</strong>
        </div>
        <div className="stat-card">
          <span><LocalizedText translationKey="copy.2bb0a3a7" fallback={"POSTĘP"} /></span>
          <strong>{progress}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{binaryCodes.length}</strong>
        </div>
        <div className="stat-card">
          <span><LocalizedText translationKey="copy.3945d059" fallback={"PRÓBY"} /></span>
          <strong>{attempts}</strong>
        </div>
        <div className="stat-card">
          <span><LocalizedText translationKey="copy.9272b763" fallback={"BŁĘDY"} /></span>
          <strong>{errors}</strong>
        </div>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${binaryCodes.length ? (progress / binaryCodes.length) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="terminal-panel">
        <div className="terminal-heading">
          <span><LocalizedText translationKey="copy.37d6e2e7" fallback={"TERMINAL ODSZYFROWUJĄCY"} /></span>
          <span className="live-label"><LocalizedText translationKey="copy.ee00ecc0" fallback={"● LIVE"} /></span>
        </div>
        <div className="binary-display">
          {binaryCodes.map((binaryCode, index) => (
            <span
              key={index}
              aria-label={localizeAttribute("copy.2a68b133", "Znak {index}", {
                index: index + 1,
              })}
            >
              {binaryCode}
            </span>
          ))}
        </div>
        <div className="terminal-hint">
          <LocalizedText translationKey="copy.a4ddb74f" fallback={"Wpisz całe hasło albo znane kolejne litery od aktualnej pozycji. "} /></div>
        <form className="guess-form" onSubmit={submitGuess}>
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder={localizeAttribute("copy.5fbe186b", "Wpisz hasło lub znane litery...")}
            autoComplete="off"
            disabled={progress >= binaryCodes.length || Boolean(puzzleError)}
          />
          <button type="submit" disabled={!guess.trim()}>
            <LocalizedText translationKey="copy.7fe31edd" fallback={"SPRAWDŹ "} /></button>
        </form>
        <p className="feedback" role="status">{feedback}</p>
      </div>

      <div className="decoded-panel">
        <div className="decoded-heading">
          <div>
            <div className="eyebrow"><LocalizedText translationKey="copy.f5b160a2" fallback={"ODKRYTE ZNAKI"} /></div>
            <h2><LocalizedText translationKey="copy.4bd41cd0" fallback={"Ślady szyfru"} /></h2>
          </div>
          <button
            className="secondary-button"
            onClick={() => setAllFlipped((previous) => !previous)}
          >
            {allFlipped ? <LocalizedText translationKey="copy.c868aca7" fallback={"UKRYJ LITERY"} /> : <LocalizedText translationKey="copy.43525d81" fallback={"ODWRÓĆ WSZYSTKIE"} />}
          </button>
        </div>

        <div className="flip-grid">
          {binaryCodes.map((binaryCode, index) => (
            <button
              key={`${index}-${binaryCode}`}
              className={`flip-card ${allFlipped || index < progress || flippedCards.includes(index) ? "is-flipped" : ""}`}
              onClick={() =>
                setFlippedCards((previous) =>
                  previous.includes(index)
                    ? previous.filter((cardIndex) => cardIndex !== index)
                    : [...previous, index],
                )
              }
              title={localizeAttribute(
                "copy.8cb850e4",
                "Znak {index} z {total}. Kliknij, aby odwrócić kartę.",
                { index: index + 1, total: binaryCodes.length },
              )}
              aria-label={localizeAttribute(
                "copy.20ef8b67",
                "Znak {index}, kod binarny {code}",
                { index: index + 1, code: binaryCode },
              )}
            >
              <span className="flip-inner">
                <span className="flip-front">{binaryCode}</span>
                <span className="flip-back">
                  {String.fromCharCode(Number.parseInt(binaryCode, 2)).toUpperCase()}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
