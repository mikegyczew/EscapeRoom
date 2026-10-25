import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room40Props = {
  onComplete: () => void;
};

const MEMORIES = [
  { id: "clock", label: "ZEGAR", symbol: "◷" },
  { id: "letter", label: "LIST ROSE", symbol: "✉" },
  { id: "record", label: "PŁYTA", symbol: "◉" },
] as const;
const MEMORY_CYCLES = [
  ["clock", "letter", "record"],
  ["record", "letter", "clock"],
  ["clock", "letter", "record"],
  ["record", "letter", "clock"],
];

export default function Room40({ onComplete }: Room40Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function repeatLoop() {
    setCycles((count) => Math.min(count + 1, 3));
    setFeedback(localizeAttribute("copy.b73569a2", "Obraz wrócił do początku. Sprawdź, które wspomnienie pozostało w tym samym miejscu."));
  }

  function chooseMemory(memoryId: string) {
    if (cycles < 2) {
      setFeedback(localizeAttribute("copy.e5fc1fcc", "Obserwuj przynajmniej dwa obroty pętli, zanim wskażesz stały punkt."));
      return;
    }

    if (memoryId !== "letter") {
      setFeedback(localizeAttribute("copy.893058c2", "To wspomnienie zmieniło położenie w kolejnej pętli. Przyjrzyj się pozostałym."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.437e328f", "List Rose pozostał na miejscu. Stały punkt przerwał pętlę czasu."));
    window.setTimeout(onComplete, 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.c82efcf8" fallback={"POKÓJ 40 / HIPOKAMP"} /></div>
        <h1>
          <LocalizedText translationKey="copy.aac2b2ec" fallback={"PĘTLA "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.91e42f25" fallback={"CZASOWA"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.93fa977f" fallback={"„Ten sam pokój oglądany od drugiej strony nie jest już tym samym pokojem.” "} /></p>
        <div className="mission-art loop-mission-art" role="img" aria-label={localizeAttribute("copy.ba884ad7", "Trzy wspomnienia krążące wokół stałego punktu.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.f89c4e12" fallback={"ZAPIS HIPOKAMPA // POWTÓRZENIE "} /></div>
          <div className="loop-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.7235f6b6" fallback={"◷"} /></span><i><LocalizedText translationKey="copy.be3cba5a" fallback={"↻"} /></i><span><LocalizedText translationKey="copy.0c3a0f24" fallback={"✉"} /></span><i><LocalizedText translationKey="copy.be3cba5a" fallback={"↻"} /></i><span><LocalizedText translationKey="copy.4c35bae4" fallback={"◉"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.060ab170" fallback={"POWTÓRZENIA: 3"} /></span>
            <span><LocalizedText translationKey="copy.9282a0dc" fallback={"PERSPEKTYWY: ZMIENNE"} /></span>
            <span><LocalizedText translationKey="copy.9f4eb12f" fallback={"PUNKT STAŁY: NIEZNANY"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.7bf03e30" fallback={"Pokój 40 zapętla obraz trzech wspomnień. Z każdą kolejną pętlą zegar i płyta zmieniają położenie, gdy patrzysz na nie z drugiej strony. "} /></p>
          <p>
            <LocalizedText translationKey="copy.545c44ef" fallback={"List Rose pozostaje w tym samym miejscu. Obejrzyj co najmniej dwa obroty i wskaż element, który nie zmienia położenia. "} /></p>
          <p>
            <LocalizedText translationKey="copy.088b38b1" fallback={"Pętla nie odlicza czasu — możesz porównywać obrazy tak długo, jak potrzebujesz. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.70a856a9" fallback={"WEJDŹ W PĘTLĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.c82efcf8" fallback={"POKÓJ 40 / HIPOKAMP"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.4eeccf74" fallback={"ODNAJDŹ "} /><span className="accent"><LocalizedText translationKey="copy.f80524eb" fallback={"PUNKT STAŁY"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.036c5b3b" fallback={"Porównaj położenie trzech wspomnień po kolejnych obrotach. Co najmniej dwa powtórzenia wystarczą, by odpowiedzieć. "} /></p>
      <div className="loop-cycle-count" aria-live="polite">
        <LocalizedText translationKey="copy.ca88a450" fallback={"OBRÓT PĘTLI: "} />{cycles}<LocalizedText translationKey="copy.bc2e4015" fallback={"/3 "} /></div>
      <div className="loop-memory-track">
        {[0, 1, 2].map((position) => {
          const memory = MEMORIES.find(
            (item) => MEMORY_CYCLES[cycles].indexOf(item.id) === position,
          );
          return memory ? (
            <button
              aria-label={localizeAttribute(
                "copy.f53af754",
                "Wskaż wspomnienie: {memory}",
                {
                  memory: localizeAttribute(
                    translationKeyFor(memory.label),
                    memory.label,
                  ),
                },
              )}
              className="loop-memory-card"
              disabled={complete}
              key={memory.id}
              onClick={() => chooseMemory(memory.id)}
              type="button"
            >
              <span aria-hidden="true">{memory.symbol}</span>
              <strong><LocalizedText fallback={memory.label} /></strong>
              <small><LocalizedText translationKey="copy.1b9e3f81" fallback={"POZYCJA "} />{position + 1}</small>
            </button>
          ) : null;
        })}
      </div>
      <button
        className="secondary-button loop-repeat"
        disabled={cycles >= 3 || complete}
        onClick={repeatLoop}
        type="button"
      >
        <LocalizedText translationKey="copy.3fa1adaf" fallback={"↻ POWTÓRZ PĘTLĘ "} /></button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
