import { useState, type FormEvent } from "react";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room05Props = {
  onComplete: () => void;
};

const FILM_FRAME_DIGITS = ["2", "7", "4", "1"];

export default function Room05({ onComplete }: Room05Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [revealedFrames, setRevealedFrames] = useState<number[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (revealedFrames.length !== FILM_FRAME_DIGITS.length) {
      setFeedback(text("room05.incomplete", "Najpierw obejrzyj wszystkie cztery klatki taśmy."));
      return;
    }

    if (answer === FILM_FRAME_DIGITS.join("")) {
      setFeedback(text("room05.complete", "Zapis z 1945 roku odtworzony. Projektor odzyskał ciąg."));
      window.setTimeout(onComplete, 700);
      return;
    }

    setFeedback(text("room05.incorrect", "To nie ten ciąg. Zachowaj kolejność od początku rolki do końca."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room05.roomLabel", "POKÓJ 05 / PŁAT POTYLICZNY")}</div>
        <h1>
          {text("room05.titleFirst", "KINO")}
          <br />
          <span className="accent">{text("room05.titleSecond", "RODZINNE")}</span>
        </h1>
        <p className="story-quote">
          {text("room05.quote", "„Niektóre obrazy znikają, ale światło zostawia ślad.”")}
        </p>
        <div className="mission-art film-mission-art" role="img" aria-label={text("room05.artLabel", "Stara taśma filmowa z rodzinnymi kadrami.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room05.artHeading", "ARCHIWUM OBRAZU // ROLKA 1945")}
          </div>
          <div className="film-art-strip" aria-hidden="true">
            <span><LocalizedText translationKey="copy.a2364246" fallback={"▧"} /></span><span><LocalizedText translationKey="copy.ad365397" fallback={"▨"} /></span><span><LocalizedText translationKey="copy.a2364246" fallback={"▧"} /></span><span><LocalizedText translationKey="copy.ad365397" fallback={"▨"} /></span>
          </div>
          <div className="mission-art-footer">
            <span>{text("room05.artTape", "TAŚMA: USZKODZONA")}</span>
            <span>{text("room05.artFrames", "KADRY: 4")}</span>
            <span>{text("room05.artReadout", "ODCZYT: OCZEKIWANIE")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room05.story1", "W pierwszej strefie archiwum zachował się fragment rodzinnego filmu z 1945 roku. Cztery klatki skrywają cyfry pod warstwą uszkodzonej emulsji.")}</p>
          <p>{text("room05.story2", "Wywołaj każdy kadr i odczytaj cyfry od początku rolki do jej końca. Ułóż je w tej samej kolejności, by przywrócić zapis projektora.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room05.startButton", "WYWOŁAJ TAŚMĘ")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow">{text("room05.roomLabel", "POKÓJ 05 / PŁAT POTYLICZNY")}</div>
      <h1 className="section-title">
        {text("room05.screenTitle", "KINO")} <span className="accent">{text("room05.screenTitleAccent", "RODZINNE")}</span>
      </h1>
      <p className="lead">
        {text("room05.instruction", "Obejrzyj każdy kadr, a potem wpisz czterocyfrowy ciąg od początku rolki.")}
      </p>
      <div className="film-frame-grid">
        {FILM_FRAME_DIGITS.map((digit, index) => {
          const isRevealed = revealedFrames.includes(index);
          const frameScene = text(`room05.frame${index + 1}.scene`, [
            "Projektor rozświetla pustą ścianę.",
            "Na stole czeka nietknięta filiżanka.",
            "W oknie odbija się światło popołudnia.",
            "Rodzina znika za bramą ogrodu.",
          ][index]);
          return (
            <button
              aria-label={text(
                "copy.8672c036",
                "{action} {number}",
                {
                  action: text("room05.frameAria", "Wywołaj kadr"),
                  number: index + 1,
                },
              )}
              className={`film-frame${isRevealed ? " is-revealed" : ""}`}
              key={index}
              onClick={() => {
                setRevealedFrames((previous) =>
                  previous.includes(index) ? previous : [...previous, index],
                );
              }}
              type="button"
            >
              <span className="film-frame-number">{text("room05.frameLabel", "KLATKA")} <LocalizedText translationKey="copy.350ca8af" fallback={"0"} />{index + 1}</span>
              <span aria-hidden="true" className="film-frame-image">
                {isRevealed ? digit : "?"}
              </span>
              <span>{isRevealed ? frameScene : text("room05.revealButton", "Kliknij, aby wywołać obraz")}</span>
            </button>
          );
        })}
      </div>
      <p className="small-note" aria-live="polite">
        {text("room05.readFrames", "ODCZYTANE KADRY:")} {revealedFrames.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{FILM_FRAME_DIGITS.length}
      </p>
      <form className="guess-form" onSubmit={checkAnswer}>
        <input
          aria-label={text("room05.answerLabel", "Kod z taśmy filmowej")}
          autoComplete="off"
          inputMode="numeric"
          maxLength={4}
          onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))}
          placeholder={text("room05.answerPlaceholder", "Wpisz cztery cyfry...")}
          value={answer}
        />
        <button type="submit" disabled={answer.length !== 4}>
          {text("room05.submit", "ODTWÓRZ ZAPIS")}
        </button>
      </form>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
