import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room55Props = {
  onComplete: () => void;
};

const SOUND_SOURCES = [
  { id: "clock", label: "ZEGAR", detail: "Miara: 40 jednostek szumu", volume: 40 },
  { id: "radio", label: "RADIO", detail: "Miara: 70 jednostek szumu", volume: 70 },
  { id: "tape", label: "TAŚMA", detail: "Miara: 20 jednostek szumu", volume: 20 },
] as const;

const QUIET_ORDER = ["radio", "clock", "tape"];

export default function Room55({ onComplete }: Room55Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [silenced, setSilenced] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function silenceSource(sourceId: string) {
    if (complete || silenced.includes(sourceId)) return;

    const expectedSource = QUIET_ORDER[silenced.length];
    if (sourceId !== expectedSource) {
      setSilenced([]);
      setFeedback(localizeAttribute("copy.58c4df80", "Pomyśl o ciszy jako stopniowym wyciszaniu. Źródła wróciły — wybierz najgłośniejsze jako pierwsze."));
      return;
    }

    const nextSilenced = [...silenced, sourceId];
    setSilenced(nextSilenced);
    setFeedback(localizeAttribute("copy.ce184d2b", "Źródło wyciszone: {value1}/{value2}.", { value1: nextSilenced.length, value2: SOUND_SOURCES.length }));

    if (nextSilenced.length === SOUND_SOURCES.length) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.7cf2aeb4", "Pokój ucichł. W ciszy zachował się ostatni zapis snu."));
      window.setTimeout(onComplete, 700);
    }
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.b75c5a40" fallback={"POKÓJ 55 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.abbd1c37" fallback={"PARALIŻ "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.c2e1309c" fallback={"SENNY"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.3a475462" fallback={"„Cisza nie wymaga bezruchu. Wystarczy usłyszeć, co można wyciszyć.” "} /></p>
        <div className="mission-art sleep-mission-art" role="img" aria-label={localizeAttribute("copy.70ede87a", "Trzy źródła dźwięku wokół spokojnego zapisu.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.f09a9983" fallback={"ARCHIWUM SNU // ŹRÓDŁA SZUMU "} /></div>
          <div className="sleep-art-silence" aria-hidden="true">
            <span><LocalizedText translationKey="copy.7235f6b6" fallback={"◷"} /></span><span><LocalizedText translationKey="copy.3525d8af" fallback={"〰"} /></span><span><LocalizedText translationKey="copy.a13640b3" fallback={"▤"} /></span><i><LocalizedText translationKey="copy.4e35be0a" fallback={"○"} /></i>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.2c763902" fallback={"ŹRÓDŁA: 3"} /></span>
            <span><LocalizedText translationKey="copy.ff2d65e4" fallback={"WYMAGANA CISZA: NIE"} /></span>
            <span><LocalizedText translationKey="copy.fa6662ca" fallback={"LIMIT CZASU: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.82015a95" fallback={"W nagraniu ze snu mieszają się trzy dźwięki: zegar, radio i stara taśma. Notatka podaje ich siłę. Wycisz je od najgłośniejszego do najcichszego. "} /></p>
          <p>
            <LocalizedText translationKey="copy.1e7ade04" fallback={"Cyfrowa zagadka nie nasłuchuje mikrofonu ani nie wymaga ciszy, bezruchu czy wstrzymywania oddechu. Wystarczy wybrać źródła na ekranie. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.6f82a6f9" fallback={"OTWÓRZ ZAPIS SNU "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.b75c5a40" fallback={"POKÓJ 55 / PŁAT CZUCIOWO-RUCHOWY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.4eeccf74" fallback={"ODNAJDŹ "} /><span className="accent"><LocalizedText translationKey="copy.05913a94" fallback={"CISZĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.f4241339" fallback={"Wycisz źródła szumu w kolejności od największej wartości do najmniejszej. "} /></p>
      <div className="sleep-sources">
        {SOUND_SOURCES.map((source) => {
          const isSilenced = silenced.includes(source.id);
          return (
            <button
              aria-pressed={isSilenced}
              className={`sleep-source${isSilenced ? " is-silenced" : ""}`}
              disabled={isSilenced || complete}
              key={source.id}
              onClick={() => silenceSource(source.id)}
              type="button"
            >
              <span className="sleep-source-heading">
                <strong><LocalizedText fallback={source.label} /></strong>
                <small><LocalizedText fallback={source.detail} /></small>
              </span>
              <span aria-hidden="true" className="sleep-noise-meter">
                {Array.from({ length: 7 }, (_, index) => (
                  <i
                    className={!isSilenced && index < Math.ceil(source.volume / 10) ? "is-lit" : ""}
                    key={index}
                  />
                ))}
              </span>
              <span className="sleep-source-action">
                {isSilenced ? <LocalizedText translationKey="copy.6b10f260" fallback={"WYCISZONE"} /> : <LocalizedText translationKey="copy.018fd394" fallback={"WYCISZ ŹRÓDŁO"} />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="small-note"><LocalizedText translationKey="copy.faa94a80" fallback={"WYCISZONE ŹRÓDŁA: "} />{silenced.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{SOUND_SOURCES.length}</p>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
