import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { useTranslation } from "../../shared/use-translation";



type Room77Props = {
  onComplete: () => void;
};

const FRAGMENTS = [
  { id: "if", text: "Jeśli kiedyś" },
  { id: "words", text: "zgubię własne słowa," },
  { id: "remind", text: "przypomnijcie mi," },
  { id: "love", text: "że byłem kochany." },
  { id: "forget", text: "zapomnijcie o wszystkim," },
  { id: "alone", text: "że zostałem sam." },
] as const;

const SENTENCE_ORDER = ["if", "words", "remind", "love"];

export default function Room77({ onComplete }: Room77Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function chooseFragment(fragmentId: string) {
    if (complete || selected.includes(fragmentId)) return;

    const nextSelection = [...selected, fragmentId];
    if (fragmentId !== SENTENCE_ORDER[selected.length]) {
      setSelected([]);
      setFeedback(localizeAttribute("copy.dc75096a", "Ta część nie pasuje do rozpoczętego zdania. Fragmenty wróciły do archiwum."));
      return;
    }

    setSelected(nextSelection);
    if (nextSelection.length === SENTENCE_ORDER.length) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.61389214", "Ostatnie zdanie zostało zachowane. Archiwum przechowuje myśl, nie ocenę."));
      window.setTimeout(onComplete, 700);
      return;
    }

    setFeedback(localizeAttribute("copy.1018ff35", "Fragment zachowany. Wybierz kolejny, aby domknąć zdanie."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.d8ed1652" fallback={"POKÓJ 77 / OBSZAR BROKI I WERNICKEGO"} /></div>
        <h1>
          <LocalizedText translationKey="copy.2c897060" fallback={"OSTATNIE "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.7093151a" fallback={"ZDANIE"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.4b8b793f" fallback={"„Najpierw warunek. Potem utrata słów. Na końcu przypomnienie o miłości.” "} /></p>
        <div className="mission-art final-sentence-mission-art" role="img" aria-label={localizeAttribute("copy.cfc0ba89", "Fragmenty listu Henry'ego, które można złożyć w ostatnie zdanie.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.f4d92b63" fallback={"LIST HENRY'EGO // FRAGMENTY ZDANIA "} /></div>
          <div className="final-sentence-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.0c063225" fallback={"JEŚLI"} /></span><i><LocalizedText translationKey="copy.233eec59" fallback={"…"} /></i><span><LocalizedText translationKey="copy.0abf2896" fallback={"PRZYPOMNIJCIE"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.c706bf50" fallback={"FRAGMENTY: 6"} /></span>
            <span><LocalizedText translationKey="copy.6fd98b04" fallback={"KOLEJNOŚĆ: DO ODTWORZENIA"} /></span>
            <span><LocalizedText translationKey="copy.b52011c0" fallback={"GŁOS: NIEPOTRZEBNY"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.0d7466cd" fallback={"Ostatni list Henry'ego zachował się w rozproszonych fragmentach. Ułóż cztery części w zdanie, które Profesor zapisał dla bliskich. "} /></p>
          <p>
            <LocalizedText translationKey="copy.c15b548a" fallback={"Dwie pozostałe części pochodzą z uszkodzonego innego zapisu. Możesz odczytać wszystkie fragmenty i ułożyć zdanie bez pośpiechu. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.13f6586a" fallback={"ODCZYTAJ FRAGMENTY "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.d8ed1652" fallback={"POKÓJ 77 / OBSZAR BROKI I WERNICKEGO"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.a530b03e" fallback={"ZŁÓŻ "} /><span className="accent"><LocalizedText translationKey="copy.7093151a" fallback={"ZDANIE"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.6d0e4561" fallback={"Wybierz części w kolejności czytania. Ułożone fragmenty pozostaną widoczne nad archiwum. "} /></p>
      <div aria-live="polite" className="sentence-assembly">
        {selected.length === 0
          ? <LocalizedText translationKey="copy.b2b16d7a" fallback={"ZDANIE CZEKA NA PIERWSZY FRAGMENT"} />
          : selected.map((id) => FRAGMENTS.find((fragment) => fragment.id === id)?.text).join(" ")}
      </div>
      <div className="sentence-fragments">
        {FRAGMENTS.map((fragment) => {
          const isSelected = selected.includes(fragment.id);
          return (
            <button
              aria-pressed={isSelected}
              className={`sentence-fragment${isSelected ? " is-selected" : ""}`}
              disabled={isSelected || complete}
              key={fragment.id}
              onClick={() => chooseFragment(fragment.id)}
              type="button"
            >
              <LocalizedText fallback={fragment.text} />
            </button>
          );
        })}
      </div>
      <div className="small-note"><LocalizedText translationKey="copy.7093d504" fallback={"ZACHOWANE FRAGMENTY: "} />{selected.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{SENTENCE_ORDER.length}</div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
