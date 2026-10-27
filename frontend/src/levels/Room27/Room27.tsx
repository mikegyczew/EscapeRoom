import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room27Props = {
  onComplete: (proof: string) => void;
};

const LETTERS = [
  {
    id: "first-walk",
    date: "14 maja 1948",
    sender: "HENRY DO ROSE",
    text: "„Pamiętam nasz pierwszy spacer nad rzeką. Chcę zachować ten dzień.”",
  },
  {
    id: "wedding",
    date: "2 września 1949",
    sender: "ROSE DO HENRY'EGO",
    text: "„Wróciliśmy z podróży. W kieszeni płaszcza wciąż mam bilet z tamtego lata.”",
  },
  {
    id: "new-home",
    date: "6 czerwca 1951",
    sender: "HENRY DO ROSE",
    text: "„Dziś po raz pierwszy otworzyliśmy drzwi naszego nowego domu.”",
  },
  {
    id: "garden",
    date: "3 kwietnia 1953",
    sender: "ROSE DO HENRY'EGO",
    text: "„W ogrodzie zakwitły irysy. Zostawiłam jeden zasuszony w tym liście.”",
  },
] as const;

const CORRECT_ORDER = ["first-walk", "wedding", "new-home", "garden"];

export default function Room27({ onComplete }: Room27Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function selectLetter(letterId: string) {
    if (selectedIds.includes(letterId) || complete) return;

    const nextSelection = [...selectedIds, letterId];
    setSelectedIds(nextSelection);

    if (nextSelection.length !== LETTERS.length) {
      setFeedback(localizeAttribute("copy.8230a814", "Zachowano {value1} z {value2} listów. Czytaj daty i wspomnienia.", { value1: nextSelection.length, value2: LETTERS.length }));
      return;
    }

    if (nextSelection.every((id, index) => id === CORRECT_ORDER[index])) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.90862d27", "Chronologia odzyskana. W listach pozostała opowieść o wspólnym życiu."));
      window.setTimeout(() => onComplete(JSON.stringify(nextSelection)), 700);
      return;
    }

    setSelectedIds([]);
    setFeedback(localizeAttribute("copy.eb532cce", "Daty nie układają się w tę kolejność. Listy wróciły na biurko — spróbuj ponownie."));
  }

  function resetLetters() {
    setSelectedIds([]);
    setFeedback(localizeAttribute("copy.f0f3a925", "Wybierz listy od najwcześniejszego do najpóźniejszego."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.36de35d3" fallback={"POKÓJ 27 / UKŁAD LIMBICZNY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.e8ec125d" fallback={"GABINET "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.59150e24" fallback={"STRATY"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.97046041" fallback={"„Nie oceniaj uczuć. Ocal kolejność chwil, które po sobie zostawili.” "} /></p>
        <div className="mission-art letters-mission-art" role="img" aria-label={localizeAttribute("copy.bfecb9b2", "Cztery zachowane listy ułożone na drewnianym biurku.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.17916d95" fallback={"ARCHIWUM OSOBISTE // KORESPONDENCJA "} /></div>
          <div className="letters-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.cd0c04f7" fallback={"H"} /></span><span><LocalizedText translationKey="copy.d70c14b5" fallback={"R"} /></span><span><LocalizedText translationKey="copy.cd0c04f7" fallback={"H"} /></span><span><LocalizedText translationKey="copy.d70c14b5" fallback={"R"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.b773d97e" fallback={"NADAWCY: HENRY I ROSE"} /></span>
            <span><LocalizedText translationKey="copy.530ee762" fallback={"LISTY: 4"} /></span>
            <span><LocalizedText translationKey="copy.5dafdbe4" fallback={"DATY: DO ODTWORZENIA"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.0da8636d" fallback={"W gabinecie zachowały się cztery listy Henry'ego i Rose. Każdy opisuje inną wspólną chwilę, a daty pozwalają odtworzyć ich kolejność. "} /></p>
          <p>
            <LocalizedText translationKey="copy.b94d1bdc" fallback={"Ułóż korespondencję od najwcześniejszej do najpóźniejszej. To ćwiczenie z chronologii — nie ma tu właściwej ani niewłaściwej oceny ich relacji. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.1e38cad9" fallback={"OTWÓRZ KORESPONDENCJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.36de35d3" fallback={"POKÓJ 27 / UKŁAD LIMBICZNY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.f12b8e83" fallback={"UŁÓŻ "} /><span className="accent"><LocalizedText translationKey="copy.d1f15048" fallback={"LISTY"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.7d019428" fallback={"Wybieraj od najstarszego listu do najnowszego. Kolejność zapisano w datach i wspomnieniach. "} /></p>
      <div className="letter-order-progress" aria-live="polite">
        <LocalizedText translationKey="copy.9434006f" fallback={"KOLEJNOŚĆ: "} />{selectedIds.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{LETTERS.length}
      </div>
      <div className="letter-order-grid">
        {LETTERS.map((letter) => {
          const order = selectedIds.indexOf(letter.id);
          return (
            <button
              aria-pressed={order >= 0}
              className={`letter-card${order >= 0 ? " is-selected" : ""}`}
              disabled={order >= 0 || complete}
              key={letter.id}
              onClick={() => selectLetter(letter.id)}
              type="button"
            >
              <span className="letter-card-date">{letter.date}</span>
              <strong>{letter.sender}</strong>
              <span><LocalizedText fallback={letter.text} /></span>
              {order >= 0 && <i>{order + 1}</i>}
            </button>
          );
        })}
      </div>
      <button
        className="secondary-button letter-reset"
        disabled={selectedIds.length === 0 || complete}
        onClick={resetLetters}
        type="button"
      >
        <LocalizedText translationKey="copy.7b877a5f" fallback={"WYCZYŚĆ KOLEJNOŚĆ "} /></button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
