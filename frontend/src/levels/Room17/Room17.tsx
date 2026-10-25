import { useState } from "react";
import { playPolishAudio } from "../../shared/speech";
import { useTranslation } from "../../shared/use-translation";
import { LocalizedText } from "../../shared/localized-text";


type Room17Props = {
  onComplete: () => void;
  voiceEnabled: boolean;
};

const SPEAKERS = [
  { id: "speaker-a", file: "room17-speaker-1.mp3" },
  { id: "speaker-b", file: "room17-speaker-2.mp3" },
  { id: "speaker-c", file: "room17-speaker-3.mp3" },
] as const;

export default function Room17({ onComplete, voiceEnabled }: Room17Props) {
  const { text } = useTranslation();
  const [started, setStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [listenedTo, setListenedTo] = useState<string[]>([]);

  function listenToSpeaker(speakerId: string, file: string) {
    setListenedTo((previous) =>
      previous.includes(speakerId) ? previous : [...previous, speakerId],
    );
    if (voiceEnabled) playPolishAudio([`/audio/narration/${file}`]);
  }

  function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (listenedTo.length !== SPEAKERS.length) {
      setFeedback(text("room17.incomplete", "Odsłuchaj wszystkie kanały, zanim wybierzesz oryginalne nagranie."));
      return;
    }
    if (answer === "0830") {
      setFeedback(text("room17.complete", "Oryginalny wykład odzyskany. Chór ucichł, a zapis pozostał."));
      window.setTimeout(onComplete, 700);
      return;
    }
    setFeedback(text("room17.incorrect", "To nie sygnatura właściwego nagrania. Porównaj wszystkie głosy i wróć do notatki."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow">{text("room17.roomLabel", "POKÓJ 17 / PŁAT SKRONIOWY")}</div>
        <h1>
          {text("room17.titleFirst", "CHÓR")}
          <br />
          <span className="accent">{text("room17.titleSecond", "GŁOSÓW")}</span>
        </h1>
        <p className="story-quote">
          {text("room17.quote", "„Wśród ech rozpoznasz głos, który należy do zapisu.”")}
        </p>
        <div className="mission-art choir-mission-art" role="img" aria-label={text("room17.artLabel", "Trzy kanały archiwalnych nagrań zbiegające się w jednym sygnale.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            {text("room17.artHeading", "ARCHIWUM DŹWIĘKU // 3 KANAŁY")}
          </div>
          <div className="choir-art-wave" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="mission-art-footer">
            <span>{text("room17.artChannels", "KANAŁY: 3")}</span>
            <span>{text("room17.artOverlap", "ZAPISY: NAKŁADAJĄ SIĘ")}</span>
            <span>{text("room17.artSource", "ŹRÓDŁO: NIEUSTALONE")}</span>
          </div>
        </div>
        <div className="story-body">
          <p>{text("room17.story1", "W Pokoju 17 kilka archiwalnych nagrań odtwarza się jednocześnie. Tylko jeden kanał zawiera oryginalny wykład Henry'ego.")}</p>
          <p>{text("room17.story2", "Odsłuchaj każdy głos. Notatka technika podaje, że właściwym tropem jest godzina spotkania Henry'ego i Rose: 08:30.")}</p>
          <p>{text("room17.story3", "Wpisz cztery cyfry bez dwukropka, aby odfiltrować echo i odzyskać właściwy zapis.")}</p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          {text("room17.startButton", "OTWÓRZ KANAŁY")} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow">{text("room17.roomLabel", "POKÓJ 17 / PŁAT SKRONIOWY")}</div>
      <h1 className="section-title">
        {text("room17.screenTitle", "CHÓR")} <span className="accent">{text("room17.screenTitleAccent", "GŁOSÓW")}</span>
      </h1>
      <p className="lead">
        {text("room17.instruction", "Odsłuchaj wszystkie trzy kanały. Właściwe nagranie zawiera godzinę spotkania Henry'ego i Rose.")}
      </p>
      <div className="choir-speakers">
        {SPEAKERS.map((speaker, index) => {
          const listened = listenedTo.includes(speaker.id);
          const speakerNumber = index + 1;
          return (
            <article className={`choir-speaker${listened ? " is-listened" : ""}`} key={speaker.id}>
              <div className="choir-speaker-heading">
                <span className="logic-led is-on" />
                {text(`room17.speaker${speakerNumber}.heading`, `GŁOS 0${speakerNumber}`)}
              </div>
              <p>{listened ? text(`room17.speaker${speakerNumber}.transcript`, "") : text("room17.noiseTranscript", "Zapis zaszumiony. Odsłuchaj kanał.")}</p>
              <button
                className="secondary-button"
                onClick={() => listenToSpeaker(speaker.id, speaker.file)}
                type="button"
              >
                {voiceEnabled ? text("room17.listenButton", "▶ ODSŁUCHAJ") : text("room17.readButton", "ODCZYTAJ KANAŁ")}
              </button>
            </article>
          );
        })}
      </div>
      <form className="guess-form choir-answer" onSubmit={submitCode}>
        <input
          aria-label={text("room17.answerLabel", "Sygnatura nagrania")}
          autoComplete="off"
          inputMode="numeric"
          maxLength={4}
          onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))}
          placeholder={text("room17.answerPlaceholder", "Sygnatura, np. 0830")}
          value={answer}
        />
        <button disabled={answer.length !== 4} type="submit">
          {text("room17.submit", "ODFILTRUJ ZAPIS")}
        </button>
      </form>
      <p className="small-note">{text("room17.playedChannels", "ODTWORZONE KANAŁY:")} {listenedTo.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{SPEAKERS.length}</p>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
