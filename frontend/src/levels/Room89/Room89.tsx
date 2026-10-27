import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room89Props = {
  onComplete: (proof: string) => void;
};

const MEMORIES = [
  { id: "clock", room: 34, label: "ZATRZYMANA WSKAZÓWKA" },
  { id: "blindspot", room: 11, label: "ŚLEPA PLAMKA" },
  { id: "first-light", room: 1, label: "PIERWSZE ŚWIATŁO" },
  { id: "letter", room: 27, label: "GABINET STRATY" },
  { id: "choir", room: 17, label: "CHÓR GŁOSÓW" },
  { id: "film", room: 5, label: "KINO RODZINNE" },
  { id: "labyrinth", room: 33, label: "LABIRYNT AMIGDALI" },
  { id: "radio", room: 22, label: "SZUM SZUMÓW" },
  { id: "vibration", room: 12, label: "CISZA ABSOLUTNA" },
  { id: "tension", room: 23, label: "POKÓJ NAPIĘCIA" },
] as const;

const MEMORY_ORDER = [
  "first-light",
  "film",
  "blindspot",
  "vibration",
  "choir",
  "radio",
  "tension",
  "letter",
  "labyrinth",
  "clock",
];

export default function Room89({ onComplete }: Room89Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [restored, setRestored] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const nextMemory = MEMORY_ORDER[restored.length];

  function restoreMemory(memoryId: string) {
    if (complete || restored.includes(memoryId)) return;

    if (memoryId !== nextMemory) {
      setRestored([]);
      setFeedback(localizeAttribute("copy.07efd5a8", "Ta synapsa nie pasuje do kolejności zachowanych wspomnień. Światła wróciły na miejsce — spróbuj ponownie."));
      return;
    }

    const nextRestored = [...restored, memoryId];
    setRestored(nextRestored);
    setFeedback(localizeAttribute("copy.5b0b9ea1", "Światło przywrócone: {value1}/{value2}.", { value1: nextRestored.length, value2: MEMORY_ORDER.length }));

    if (nextRestored.length === MEMORY_ORDER.length) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.a886a52c", "Dziesięć synaps rozbłysło spokojnym światłem. Punkt Omega jest dostępny."));
      window.setTimeout(() => onComplete(JSON.stringify(nextRestored)), 700);
    }
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.bf5f2918" fallback={"POKOJE 89–98 / JĄDRO ŚWIADOMOŚCI"} /></div>
        <h1>
          <LocalizedText translationKey="copy.a3115957" fallback={"BIAŁE "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.5dc4740f" fallback={"POKOJE"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.468e23c4" fallback={"„Jedno światło za drugim. Każde należy do wspomnienia, nie do błędu.” "} /></p>
        <div className="mission-art white-rooms-mission-art" role="img" aria-label={localizeAttribute("copy.d91a6bd8", "Dziesięć spokojnych świateł synaps prowadzących do centrum archiwum.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.1fa00d79" fallback={"OSTATNIE WSPOMNIENIE // 10 SYNAPS "} /></div>
          <div className="white-rooms-art" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <i key={index}>{String(index + 89)}</i>
            ))}
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.0e4cb532" fallback={"POKOJE: 89–98"} /></span>
            <span><LocalizedText translationKey="copy.338857cd" fallback={"ŚWIATŁA: 10"} /></span>
            <span><LocalizedText translationKey="copy.1067d582" fallback={"EFEKTY: BEZ MIGANIA"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.704092f7" fallback={"W dziesięciu białych pokojach gaśnie po jednym świetle synapsy. Każde zachowało fragment drogi, którą przeszliście przez archiwum. "} /></p>
          <p>
            <LocalizedText translationKey="copy.5d0cda9c" fallback={"Przywróć światła w kolejności wspomnień: pierwszy impuls, film, brakujący punkt, wibracje, głosy, radio, rytm, list, labirynt i zegar. Pomyłka nie ma limitu ani kary — sekwencję można zacząć od nowa. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.90b4941c" fallback={"WEJDŹ DO BIAŁYCH POKOI "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.bf5f2918" fallback={"POKOJE 89–98 / JĄDRO ŚWIADOMOŚCI"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.1bb3e492" fallback={"PRZYWRÓĆ "} /><span className="accent"><LocalizedText translationKey="copy.0a0f8b9c" fallback={"SYNAPSY"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.efcbaa67" fallback={"Wybieraj wspomnienia w kolejności wskazanej przez archiwum. Nie ma limitu czasu. "} /></p>
      <div
        className="synapse-progress"
        aria-label={localizeAttribute(
          "copy.8fb0d5a6",
          "Przywrócono {done} z {total} świateł",
          { done: restored.length, total: MEMORY_ORDER.length },
        )}
      >
        {MEMORY_ORDER.map((memoryId, index) => (
          <span
            aria-label={localizeAttribute(
              "copy.cdfcad49",
              "Synapsa {number}{status}",
              {
                number: index + 1,
                status: restored[index]
                  ? localizeAttribute(
                      translationKeyFor(", światło przywrócone"),
                      ", światło przywrócone",
                    )
                  : localizeAttribute(
                      translationKeyFor(", światło zgaszone"),
                      ", światło zgaszone",
                    ),
              },
            )}
            className={`synapse-light${restored[index] ? " is-restored" : ""}`}
            key={memoryId}
          />
        ))}
      </div>
      <div className="white-memory-grid">
        {MEMORIES.map((memory) => {
          const isRestored = restored.includes(memory.id);
          return (
            <button
              aria-pressed={isRestored}
              className={`white-memory-card${isRestored ? " is-restored" : ""}`}
              disabled={isRestored || complete}
              key={memory.id}
              onClick={() => restoreMemory(memory.id)}
              type="button"
            >
              <span className="white-memory-room"><LocalizedText translationKey="copy.ab0ab32c" fallback={"POKÓJ "} />{memory.room}</span>
              <strong><LocalizedText fallback={memory.label} /></strong>
              <span className="white-memory-status">
                {isRestored ? <LocalizedText translationKey="copy.0d4d9394" fallback={"ŚWIATŁO PRZYWRÓCONE"} /> : <LocalizedText translationKey="copy.5dbb190d" fallback={"SYNAPSA ZGASZONA"} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="small-note">
        <LocalizedText translationKey="copy.b5da99dc" fallback={"PRZYWRÓCONE ŚWIATŁA: "} />{restored.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{MEMORY_ORDER.length}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
