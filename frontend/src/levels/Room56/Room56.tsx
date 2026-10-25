import { useEffect, useState } from "react";
import { playPolishAudio, stopPolishAudio } from "../../shared/speech";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room56Props = {
  onComplete: () => void;
  voiceEnabled: boolean;
};

type Phase = "intro" | "puzzle" | "complete" | "failed";
type ClueId = "circuit-plan" | "admin-glossary" | "monitor-code" | "old-manual";
type InputId = "A" | "B" | "C" | "D";
type OutputId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "NOT.OUT"
  | "AND.OUT"
  | "XOR.OUT"
  | "OR.OUT";
type TargetId =
  | "NOT.IN"
  | "AND.A"
  | "AND.B"
  | "XOR.A"
  | "XOR.B"
  | "OR.A"
  | "OR.B"
  | "DOOR.IN";

const CLUES: { id: ClueId; title: string; symbol: string; location: string }[] = [
  {
    id: "circuit-plan",
    title: "Kredowy schemat",
    symbol: "⌁",
    location: "SZAFA SERWISOWA",
  },
  {
    id: "admin-glossary",
    title: "Słowniczek administratora",
    symbol: "📓",
    location: "FARTUCH MANEKINA",
  },
  {
    id: "monitor-code",
    title: "Zapis z monitora",
    symbol: "▤",
    location: "MONITOR GŁÓWNY",
  },
  {
    id: "old-manual",
    title: "Instrukcja z 2010 roku",
    symbol: "📜",
    location: "SZUFLADA BIURKA",
  },
];

const CLUE_TEXT: Record<ClueId, string> = {
  "circuit-plan":
    "Schemat pokazuje połączenia: A przechodzi przez trójkąt NOT do bramki D-kształtnej. B trafia do drugiego wejścia tej bramki. C i D łączą się z bramką o podwójnym łuku. Wyjścia obu ścieżek prowadzą do zakrzywionej bramki przy zamku. Legenda kształtów została starta.",
  "admin-glossary":
    "Słowniczek administratora: spójnik JEDNOCZEŚNIE oznacza AND; WYKLUCZAJĄCE LUB oznacza XOR i daje 1 tylko wtedy, gdy wejścia są różne; PRZECIWIEŃSTWO oznacza NOT, czyli odwrócenie sygnału. Trójkąt to NOT, kształt D to AND, podwójny łuk to XOR, a zakrzywiona bramka to OR.",
  "monitor-code":
    "MODEL DECYZJI: WYJŚCIE = (PRZECIWIEŃSTWO A JEDNOCZEŚNIE B) LUB (C WYKLUCZAJĄCE LUB D). A to alarm, B to brama, C to czujnik dymu, D to drzwi serwisowe. A=1 samodzielnie nie odtwarza wyjścia.",
  "old-manual":
    "INSTRUKCJA 2010: „Zawsze włączaj alarm A, aby odblokować wyjście”. Uwaga na datę — to wcześniejsza wersja modelu. Monitor wymaga PRZECIWIEŃSTWA stanu A, a więc alarmu wyłączonego na ścieżce AND.",
};

const MISSION_SECONDS = 6 * 60;
const CABLE_PENALTY_SECONDS = 30;
const REQUIRED_CABLES: { from: OutputId; to: TargetId }[] = [
  { from: "A", to: "NOT.IN" },
  { from: "NOT.OUT", to: "AND.A" },
  { from: "B", to: "AND.B" },
  { from: "AND.OUT", to: "OR.A" },
  { from: "C", to: "XOR.A" },
  { from: "D", to: "XOR.B" },
  { from: "XOR.OUT", to: "OR.B" },
  { from: "OR.OUT", to: "DOOR.IN" },
];

const INPUTS: { id: InputId; name: string; symbol: string }[] = [
  { id: "A", name: "ALARM", symbol: "🔴" },
  { id: "B", name: "BRAMA", symbol: "🟡" },
  { id: "C", name: "CZUJNIK DYMU", symbol: "🔵" },
  { id: "D", name: "DRZWI SERWISOWE", symbol: "⚪" },
];

const OUTPUTS: { id: OutputId; label: string }[] = [
  { id: "A", label: "A · ALARM" },
  { id: "B", label: "B · BRAMA" },
  { id: "C", label: "C · CZUJNIK DYMU" },
  { id: "D", label: "D · DRZWI SERWISOWE" },
  { id: "NOT.OUT", label: "NOT · WYJŚCIE" },
  { id: "AND.OUT", label: "AND · WYJŚCIE" },
  { id: "XOR.OUT", label: "XOR · WYJŚCIE" },
  { id: "OR.OUT", label: "OR · WYJŚCIE" },
];

const TARGETS: { id: TargetId; label: string }[] = [
  { id: "NOT.IN", label: "NOT · WEJŚCIE" },
  { id: "AND.A", label: "AND · WEJŚCIE A" },
  { id: "AND.B", label: "AND · WEJŚCIE B" },
  { id: "XOR.A", label: "XOR · WEJŚCIE A" },
  { id: "XOR.B", label: "XOR · WEJŚCIE B" },
  { id: "OR.A", label: "OR · WEJŚCIE A" },
  { id: "OR.B", label: "OR · WEJŚCIE B" },
  { id: "DOOR.IN", label: "ZAMEK · WEJŚCIE" },
];

function LogicCircuitIllustration() {
  const { text: localizeAttribute } = useTranslation();
  return (
    <div
      className="mission-art level3-intro-art"
      role="img"
      aria-label={localizeAttribute("copy.7f6cdaa9", "Schemat czterech wejść A, B, C i D. Alarm A przechodzi przez bramkę NOT i łączy się z bramką AND oraz bramą B. Czujniki C i D łączy bramka XOR. Wyjścia AND i XOR łączy bramka OR prowadząca do zamka.")}
    >
      <div className="level3-intro-art-label">
        <span className="logic-led is-on" />
        <LocalizedText translationKey="copy.b476ae25" fallback={"ARCHITEKTURA LOGICZNA // SYSTEM ONLINE "} /></div>
      <svg
        viewBox="0 0 760 260"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="level3-circuit-flow">
            <stop offset="0" stopColor="#6a9b70" stopOpacity=".2" />
            <stop offset=".5" stopColor="#8effa8" />
            <stop offset="1" stopColor="#6a9b70" stopOpacity=".2" />
          </linearGradient>
          <filter id="level3-circuit-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="level3-circuit-traces">
          <path d="M52 45h74" />
          <path d="M52 98h163" />
          <path d="M52 151h348" />
          <path d="M52 204h348" />
          <path d="M170 45h19v23h26" />
          <path d="M265 76h75v29h225" />
          <path d="M470 165h60v-20h35" />
          <path d="M605 125h85" />
        </g>
        <g className="level3-circuit-inputs">
          <circle cx="44" cy="45" r="6" />
          <circle cx="44" cy="98" r="6" />
          <circle cx="44" cy="151" r="6" />
          <circle cx="44" cy="204" r="6" />
          <text x="25" y="34"><LocalizedText translationKey="copy.c40bf6cc" fallback={"A"} /></text>
          <text x="25" y="87"><LocalizedText translationKey="copy.c70bfb85" fallback={"B"} /></text>
          <text x="25" y="140"><LocalizedText translationKey="copy.c60bf9f2" fallback={"C"} /></text>
          <text x="25" y="193"><LocalizedText translationKey="copy.c10bf213" fallback={"D"} /></text>
        </g>
        <g className="level3-circuit-gate">
          <path d="M128 31l27 14-27 14z" />
          <circle cx="160" cy="45" r="4" />
          <text x="128" y="28"><LocalizedText translationKey="copy.abee47aa" fallback={"NOT"} /></text>
          <path d="M215 51h23a25 25 0 0 1 0 50h-23z" />
          <text x="221" y="80"><LocalizedText translationKey="copy.91666dc6" fallback={"AND"} /></text>
          <path d="M400 135q30 0 51 27-21 27-51 27 12-27 0-54z" />
          <path d="M394 135q-16 27 0 54" />
          <text x="409" y="166"><LocalizedText translationKey="copy.4f46575e" fallback={"XOR"} /></text>
          <path d="M565 100q20 0 35 25-15 25-35 25 9-25 0-50z" />
          <text x="573" y="129"><LocalizedText translationKey="copy.7ce4aa04" fallback={"OR"} /></text>
        </g>
        <g className="level3-circuit-output">
          <circle cx="700" cy="128" r="13" />
          <circle cx="700" cy="128" r="5" />
          <text x="679" y="101"><LocalizedText translationKey="copy.647a6a13" fallback={"ZAMEK"} /></text>
        </g>
        <path
          className="level3-circuit-pulse"
          d="M44 45h84l28 14v-14h59v31h23a25 25 0 0 1 0 50h-23v-28H52m348 53h70v14h60q20 0 35-25h35l85-2"
        />
      </svg>
      <div className="level3-intro-art-footer">
        <span><LocalizedText translationKey="copy.9173fd36" fallback={"WEJŚCIA: 4"} /></span>
        <span><LocalizedText translationKey="copy.522d615c" fallback={"BRAMKI: AND · NOT · XOR · OR"} /></span>
        <span><LocalizedText translationKey="copy.fe50e31e" fallback={"WYJŚCIE: ZAMEK"} /></span>
      </div>
    </div>
  );
}

export default function Room56({ onComplete, voiceEnabled }: Room56Props) {
  const { text: localizeAttribute } = useTranslation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [secondsLeft, setSecondsLeft] = useState(MISSION_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [foundClues, setFoundClues] = useState<ClueId[]>([]);
  const [selectedClue, setSelectedClue] = useState<ClueId | null>(null);
  const [inputs, setInputs] = useState<Record<InputId, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
  });
  const [selectedOutput, setSelectedOutput] = useState<OutputId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetId | null>(null);
  const [cables, setCables] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [doorUnlocked, setDoorUnlocked] = useState(false);

  const conditionAnd = !inputs.A && inputs.B;
  const conditionXor = inputs.C !== inputs.D;
  const finalOutput = conditionAnd || conditionXor;
  const allCluesFound = foundClues.length === CLUES.length;
  const allCablesConnected = cables.length === REQUIRED_CABLES.length;

  useEffect(() => {
    if (!voiceEnabled) {
      stopPolishAudio();
      return;
    }

    if (phase === "intro") {
      playPolishAudio(["/audio/narration/level03-expanded-intro.mp3"]);
    } else if (phase === "puzzle" && selectedClue) {
      playPolishAudio([`/audio/narration/${selectedClue}.mp3`]);
    } else if (phase === "puzzle") {
      playPolishAudio([
        timerStarted
          ? "/audio/narration/level03-expanded-room.mp3"
          : "/audio/narration/level03-find-clues.mp3",
      ]);
    } else if (phase === "complete") {
      playPolishAudio(["/audio/narration/level03-expanded-complete.mp3"]);
    } else {
      playPolishAudio(["/audio/narration/level03-expanded-failed.mp3"]);
    }

    return () => stopPolishAudio();
  }, [voiceEnabled, phase, selectedClue, timerStarted]);

  useEffect(() => {
    if (phase !== "puzzle" || !timerStarted) return;

    const timer = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        setSecondsLeft(0);
        setMessage(localizeAttribute("copy.5f89d929", "Minął limit czasu. Zamek awaryjny pozostał zablokowany."));
        setPhase("failed");
        return;
      }

      setSecondsLeft((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [localizeAttribute, phase, secondsLeft, timerStarted]);

  function startMission() {
    setSecondsLeft(MISSION_SECONDS);
    setTimerStarted(false);
    setFoundClues([]);
    setSelectedClue(null);
    setInputs({ A: false, B: false, C: false, D: false });
    setSelectedOutput(null);
    setSelectedTarget(null);
    setCables([]);
    setAlarmTriggered(false);
    setDoorUnlocked(false);
    setMessage("");
    setPhase("puzzle");
  }

  function touchMainPanel() {
    if (timerStarted) return;
    setTimerStarted(true);
    setAlarmTriggered(true);
    setMessage(localizeAttribute("copy.dc142ec9", "ALARM AWARYJNY AKTYWNY. Nowy protokół załadowany."));
  }

  function searchClue(clueId: ClueId) {
    setFoundClues((previous) =>
      previous.includes(clueId) ? previous : [...previous, clueId],
    );
    setSelectedClue(clueId);
    setMessage("");
  }

  function reportTestError(text: string, shortedLine?: string) {
    setMessage(text);
    if (voiceEnabled) {
      playPolishAudio(["/audio/narration/level03-expanded-error.mp3"]);
    }

    if (shortedLine && timerStarted) {
      const nextSeconds = Math.max(0, secondsLeft - CABLE_PENALTY_SECONDS);
      setSecondsLeft(nextSeconds);
      setMessage(localizeAttribute("copy.7d24cb08", "{value1} Kara: −30 sekund za zwarcie na linii {value2}.", { value1: text, value2: shortedLine }));
      if (nextSeconds === 0) {
        setPhase("failed");
      }
    }
  }

  function connectCable() {
    if (!selectedOutput || !selectedTarget) {
      setMessage(localizeAttribute("copy.c6378454", "Wybierz najpierw wyjście źródłowe i gniazdo docelowe."));
      return;
    }

    const cableId = `${selectedOutput}>${selectedTarget}`;
    if (cables.includes(cableId)) {
      setMessage(localizeAttribute("copy.3142c6dd", "Ta zwora jest już podłączona."));
      return;
    }

    const expectedCable = REQUIRED_CABLES.find(
      (cable) => cable.from === selectedOutput && cable.to === selectedTarget,
    );
    setSelectedOutput(null);
    setSelectedTarget(null);

    if (!expectedCable) {
      const targetLabel =
        TARGETS.find((target) => target.id === selectedTarget)?.label ??
        selectedTarget;
      reportTestError(
        localizeAttribute("copy.b9e9fd44", "BŁĄD LOGICZNY: ZWARCIE NA LINII {value1}. Zwora odjęta; popraw połączenie.", { value1: targetLabel }),
        targetLabel,
      );
      return;
    }

    setCables((previous) => [...previous, cableId]);
    setMessage(localizeAttribute("copy.cb30a145", "Zwora {value1} → {value2} osadzona poprawnie.", { value1: selectedOutput, value2: selectedTarget }));
  }

  function testLogic() {
    if (!allCluesFound) {
      reportTestError(
        localizeAttribute("copy.b2555e36", "Najpierw znajdź wszystkie cztery tropy w pomieszczeniu."),
      );
      return;
    }

    if (!timerStarted) {
      reportTestError(localizeAttribute("copy.89c75c6a", "Dotknij głównego panelu, aby rozpocząć weryfikację."));
      return;
    }

    if (!allCablesConnected) {
      const expected = REQUIRED_CABLES.find(
        (cable) => !cables.includes(`${cable.from}>${cable.to}`),
      );
      reportTestError(
        localizeAttribute("copy.a1463568", "Brakuje połączenia {value1} → {value2}. Sprawdź schemat i osadź wszystkie zwory.", { value1: expected?.from ?? "", value2: expected?.to ?? "" }),
      );
      return;
    }

    if (inputs.A && !conditionXor) {
      reportTestError(
        localizeAttribute("copy.a01a0f1e", "BŁĄD: NOWY PROTOKÓŁ WYMAGA NEGACJI STANU A (NIE A). Instrukcja z 2010 roku jest nieaktualna."),
      );
      return;
    }

    if (finalOutput) {
      setDoorUnlocked(true);
      setMessage(localizeAttribute("copy.a2226837", "Sygnał przeszedł przez OR. Elektromagnes zwolnił drzwi!"));
      setPhase("complete");
      return;
    }

    if (!conditionAnd && !conditionXor) {
      reportTestError(
        localizeAttribute("copy.35bab5e3", "Bramka OR niespełniona: ścieżka AND wymaga alarmu A=0 i bramy B=1; ścieżka XOR wymaga różnych stanów C i D."),
      );
    }
  }

  function formatTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60,
    ).padStart(2, "0")}`;
  }

  if (phase === "intro") {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.04da8e62" fallback={"POKÓJ 56 / PŁAT CZOŁOWY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.9c5b1a38" fallback={"ZŁAMANY "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.58c14bcc" fallback={"ALGORYTM"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.0bab3b18" fallback={"„Decyzja jest sumą warunków. Odtwórz je, zanim znikną.” "} /></p>
        <LogicCircuitIllustration />
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.246fd86f" fallback={"Skrót synaptyczny prowadzi do Pokoju 56, w sektorze płata czołowego. W rekonstrukcji starego modelu decyzyjnego pulsuje komunikat: "} /><strong> <LocalizedText translationKey="copy.4feb376d" fallback={"ZAPIS USZKODZONY — ODTWÓRZ REGUŁY LOGICZNE."} /></strong>
          </p>
          <p>
            <LocalizedText translationKey="copy.0882822e" fallback={"Znajdź cztery tropy, odczytaj protokół Profesora i połącz osiem zwór na tablicy mikroprocesora. To odzyskany węzeł archiwum, połączony ze wcześniejszymi pokojami skrótem synaptycznym. "} /></p>
          <p>
            <LocalizedText translationKey="copy.780da612" fallback={"Masz "} /><strong><LocalizedText translationKey="copy.3eaebc33" fallback={"6 minut od dotknięcia panelu"} /></strong><LocalizedText translationKey="copy.c9aecda8" fallback={". Każda źle podłączona zwora kosztuje 30 sekund. Dawna instrukcja może nie pasować do nowszego modelu. "} /></p>
        </div>
        <div className="mission-card unlocked">
          <div className="mission-number"><LocalizedText translationKey="copy.1eed6d94" fallback={"03"} /></div>
          <div>
            <div className="eyebrow"><LocalizedText translationKey="copy.5690c61a" fallback={"SEKTOR VI // PŁAT CZOŁOWY"} /></div>
            <h2><LocalizedText translationKey="copy.35a31410" fallback={"Pokój 56: Złamany Algorytm"} /></h2>
            <p><LocalizedText translationKey="copy.b41fdcd1" fallback={"Odtwórz reguły decyzji i przywróć połączenie."} /></p>
          </div>
          <span className="mission-lock"><LocalizedText translationKey="copy.dd2d280e" fallback={"🔒"} /></span>
        </div>
        <button className="primary-button" onClick={startMission}>
          <LocalizedText translationKey="copy.e53f9c40" fallback={"ROZPOCZNIJ MISJĘ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  if (phase === "complete") {
    return (
      <section className="screen ending-screen">
        <div className="success-icon"><LocalizedText translationKey="copy.163a1ee2" fallback={"✓"} /></div>
        <div className="eyebrow"><LocalizedText translationKey="copy.eaeed64a" fallback={"POKÓJ 56 // POŁĄCZENIE ODTWORZONE"} /></div>
        <h1>
          <LocalizedText translationKey="copy.03872bf8" fallback={"LOGIKA "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.c43a0b32" fallback={"ZADZIAŁAŁA."} /></span>
        </h1>
        <p className="lead">
          <LocalizedText translationKey="copy.3e2522ba" fallback={"Co najmniej jedna ścieżka logiczna odtworzyła wyjście modelu. Archiwum odzyskało połączenie z kolejną strefą. "} /></p>
        <div className="logic-solution-summary">
          <span>
            {conditionAnd && conditionXor
              ? <LocalizedText translationKey="copy.2bd70d2a" fallback={"AND + XOR"} />
              : conditionAnd
                ? <LocalizedText translationKey="copy.962e23cc" fallback={"ŚCIEŻKA AND"} />
                : <LocalizedText translationKey="copy.1a52ef50" fallback={"ŚCIEŻKA XOR"} />}
          </span>
          <strong>
            <LocalizedText translationKey="copy.8ad5b584" fallback={"A "} />{Number(inputs.A)} <LocalizedText translationKey="copy.83c357c0" fallback={"· B "} />{Number(inputs.B)} <LocalizedText translationKey="copy.a9c5d229" fallback={"· C "} />{Number(inputs.C)} <LocalizedText translationKey="copy.e9952ad2" fallback={"· D"} />{" "}
            {Number(inputs.D)}
          </strong>
          <small><LocalizedText translationKey="copy.d2986264" fallback={"CZAS POZOSTAŁY: "} />{formatTime(secondsLeft)}</small>
        </div>
        <blockquote>
          <LocalizedText translationKey="copy.3252cc70" fallback={"NOT A odwraca stan alarmu. AND wymaga A=0 i B=1. XOR zwraca 1, gdy C i D mają różne stany. OR odtwarza wyjście, gdy zadziała choć jedna ścieżka. "} /></blockquote>
        <button className="primary-button" onClick={onComplete}>
          <LocalizedText translationKey="copy.42766236" fallback={"KONTYNUUJ "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
        <button className="text-button" onClick={startMission}>
          <LocalizedText translationKey="copy.5c7e12f0" fallback={"↻ Zagraj w Level 3 ponownie "} /></button>
      </section>
    );
  }

  if (phase === "failed") {
    return (
      <section className="screen ending-screen">
        <div className="failure-icon"><LocalizedText translationKey="copy.520b4356" fallback={"×"} /></div>
        <div className="eyebrow"><LocalizedText translationKey="copy.74af7a15" fallback={"POKÓJ 56 // ZAPIS NIEKOMPLETNY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.2eb2f71c" fallback={"ZAPIS "} /><br />
          <span className="danger-text"><LocalizedText translationKey="copy.06b33a46" fallback={"NIEKOMPLETNY."} /></span>
        </h1>
        <p className="lead">{message}</p>
        <p className="lead">
          <LocalizedText translationKey="copy.b29621f6" fallback={"Sprawdź model decyzji na monitorze, stan wejść i połączenia zwór. Zwarcie na wejściu odejmuje 30 sekund. "} /></p>
        <button className="primary-button" onClick={startMission}>
          <LocalizedText translationKey="copy.be71f905" fallback={"SPRÓBUJ PONOWNIE "} /><span><LocalizedText translationKey="copy.be3cba5a" fallback={"↻"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen level3-screen">
      <div className="level3-heading">
        <div>
          <div className="eyebrow"><LocalizedText translationKey="copy.04da8e62" fallback={"POKÓJ 56 / PŁAT CZOŁOWY"} /></div>
          <h1 className="section-title">
            <LocalizedText translationKey="copy.9c5b1a38" fallback={"ZŁAMANY "} /><span className="accent"><LocalizedText translationKey="copy.58c14bcc" fallback={"ALGORYTM"} /></span>
          </h1>
        </div>
        <div
          className={`countdown ${secondsLeft <= 60 ? "danger" : ""}`}
          aria-label={localizeAttribute(
            "copy.27e03976",
            "Pozostały czas: {time}",
            { time: formatTime(secondsLeft) },
          )}
        >
          <LocalizedText translationKey="copy.fbd6fdb4" fallback={"⏱ "} />{formatTime(secondsLeft)}
        </div>
      </div>
      <p className="lead">
        <LocalizedText translationKey="copy.5909a13f" fallback={"Odtwórz cztery tropy i reguły decyzji, zanim zapis w Pokoju 56 zaniknie. "} /></p>

      <div
        className={`level3-alarm ${alarmTriggered ? "alarm-triggered" : ""}`}
        role="status"
      >
        <span className={`logic-led ${alarmTriggered ? "is-on" : "is-zero"}`} />
        <strong>
          {alarmTriggered
            ? <LocalizedText translationKey="copy.a6be568d" fallback={"ZAPIS AKTYWNY — ODTWARZANIE REGUŁ"} />
            : <LocalizedText translationKey="copy.c8bef6d4" fallback={"ZAPIS USZKODZONY — PANEL W TRYBIE CZUWANIA"} />}
        </strong>
      </div>

      <div className="smart-room">
        <div className="smart-room-window"><LocalizedText translationKey="copy.07405345" fallback={"⌂"} /></div>
        <div className="smart-room-label">
          <LocalizedText translationKey="copy.911f4494" fallback={"POKÓJ 56 // ZNAJDŹ CZTERY TROPY "} /></div>
        <div className="smart-room-door">
          <span className={`logic-led ${doorUnlocked ? "is-on" : "is-zero"}`} />
          <strong><LocalizedText translationKey="copy.0a6a26cc" fallback={"WYJŚCIE Z ARCHIWUM"} /></strong>
          <small>{doorUnlocked ? <LocalizedText translationKey="copy.9004d761" fallback={"SKRÓT ODTWORZONY"} /> : <LocalizedText translationKey="copy.ea53f549" fallback={"POŁĄCZENIE ZERWANE"} />}</small>
        </div>
        <div className="smart-room-desk">
          <span><LocalizedText translationKey="copy.56b7cae1" fallback={"SZUFLADA // DAWNY PROTOKÓŁ"} /></span>
          <span><LocalizedText translationKey="copy.34a79409" fallback={"ARCHIWUM · ZAPIS STARSZY"} /></span>
        </div>
        <div className="smart-room-board">
          <span><LocalizedText translationKey="copy.643f0f56" fallback={"MONITOR // MODEL DECYZJI"} /></span>
          <strong><LocalizedText translationKey="copy.80e45a7c" fallback={"ERROR // A-B-C-D"} /></strong>
        </div>
        <div className="mannequin-clue"><LocalizedText translationKey="copy.ba07c98a" fallback={"FARTUCH // SŁOWNICZEK"} /></div>

        {CLUES.map((clue, index) => {
          const collected = foundClues.includes(clue.id);
          return (
            <button
              key={clue.id}
              type="button"
              className={`room-clue room-clue-${index + 1} ${collected ? "collected" : ""}`}
              onClick={() => searchClue(clue.id)}
              aria-label={localizeAttribute(
                "copy.f83017d3",
                "{readAction}: {title}",
                {
                  readAction: localizeAttribute(
                    translationKeyFor(collected ? "Przeczytaj" : "Znajdź"),
                    collected ? "Przeczytaj" : "Znajdź",
                  ),
                  title: localizeAttribute(
                    translationKeyFor(clue.title),
                    clue.title,
                  ),
                },
              )}
            >
              <span>{collected ? "✓" : clue.symbol}</span>
              <small>
                <LocalizedText
                  fallback={collected ? "ZNALEZIONO" : clue.location}
                />
              </small>
            </button>
          );
        })}
      </div>

      <button
        className="primary-button level3-panel-trigger"
        onClick={touchMainPanel}
        disabled={timerStarted}
      >
        <LocalizedText
          fallback={
            timerStarted
              ? "MODEL URUCHOMIONY"
              : "DOTKNIJ PANELU // URUCHOM MODEL"
          }
        />
        <span>{timerStarted ? "●" : "→"}</span>
      </button>

      <div className="level3-progress">
        <span><LocalizedText translationKey="copy.e866905f" fallback={"TROPY ODNALEZIONE"} /></span>
        <strong>{foundClues.length}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{CLUES.length}</strong>
      </div>
      <p className="level3-search-hint" aria-live="polite">
        {foundClues.length === 0
          ? <LocalizedText fallback="Szukaj w szafie serwisowej, fartuchu manekina, na monitorze i w szufladzie." />
          : foundClues.length < CLUES.length
            ? <LocalizedText
                translationKey="copy.62b1ae16"
                fallback="Odnaleziono {found} z {total} tropów. Sprawdź pozostałe miejsca."
                parameters={{ found: foundClues.length, total: CLUES.length }}
              />
            : <LocalizedText fallback="Wszystkie tropy zebrane. Przetłumacz schemat i nowy protokół." />}
      </p>

      {selectedClue && (
        <div className="discovery-panel level3-clue-panel">
          <span className="discovery-symbol">
            {CLUES.find((clue) => clue.id === selectedClue)?.symbol}
          </span>
          <div>
            <div className="eyebrow">
              <LocalizedText fallback={CLUES.find((clue) => clue.id === selectedClue)?.title ?? ""} />
            </div>
            <p><LocalizedText fallback={CLUE_TEXT[selectedClue]} /></p>
          </div>
          <button
            className="close-button"
            onClick={() => setSelectedClue(null)}
            aria-label={localizeAttribute("copy.a3ae4333", "Zamknij wskazówkę")}
          >
            <LocalizedText translationKey="copy.9dbb32c2" fallback={"× "} /></button>
        </div>
      )}

      {!allCluesFound ? (
        <p className="room-instruction">
          <LocalizedText translationKey="copy.074724dd" fallback={"Kliknij obiekty w pokoju, aby zebrać schemat, słowniczek, kod monitora i starą instrukcję. "} /></p>
      ) : (
        <div className="logic-panel smart-control-panel">
          <div className="workshop-label">
            <LocalizedText translationKey="copy.979294d5" fallback={"KONSOLA GŁÓWNA // NOWY PROTOKÓŁ "} /></div>
          {!timerStarted ? (
            <p className="level3-console-standby">
              <LocalizedText translationKey="copy.2786f87e" fallback={"Konsola czeka na aktywację. Najpierw możesz spokojnie znaleźć i przeczytać wszystkie tropy. "} /></p>
          ) : (
            <>
              <div className="logic-inputs logic-inputs-four">
                {INPUTS.map((input) => (
                  <button
                    key={input.id}
                    type="button"
                    className={`logic-switch ${inputs[input.id] ? "is-on" : ""}`}
                    aria-label={localizeAttribute(
                      "copy.70379f8e",
                      "{id} {name}: {state}",
                      {
                        id: input.id,
                        name: localizeAttribute(
                          translationKeyFor(input.name),
                          input.name,
                        ),
                        state: Number(inputs[input.id]),
                      },
                    )}
                    aria-pressed={inputs[input.id]}
                    onClick={() => {
                      setInputs((previous) => ({
                        ...previous,
                        [input.id]: !previous[input.id],
                      }));
                      setMessage("");
                    }}
                  >
                    <span className="logic-switch-name">
                      {input.symbol} {input.id} <LocalizedText translationKey="copy.9ea8b562" fallback={"· "} /><LocalizedText fallback={input.name} />
                    </span>
                    <span className="logic-switch-control" aria-hidden="true">
                      <span />
                    </span>
                    <strong>{Number(inputs[input.id])}</strong>
                  </button>
                ))}
              </div>

              <div className="logic-equation">
                <LocalizedText translationKey="copy.74482a91" fallback={"(NOT A AND B) OR (C XOR D) "} /></div>
              <div className="smart-logic-paths">
                <div className={`smart-logic-path ${conditionAnd ? "is-on" : ""}`}>
                  <strong><LocalizedText translationKey="copy.962e23cc" fallback={"ŚCIEŻKA AND"} /></strong>
                  <span><LocalizedText translationKey="copy.6113b1c7" fallback={"NOT A AND B = "} />{Number(!inputs.A)} <LocalizedText translationKey="copy.ca3f0112" fallback={"AND "} />{Number(inputs.B)}</span>
                  <b>{Number(conditionAnd)}</b>
                </div>
                <div className={`smart-logic-path ${conditionXor ? "is-on" : ""}`}>
                  <strong><LocalizedText translationKey="copy.1a52ef50" fallback={"ŚCIEŻKA XOR"} /></strong>
                  <span><LocalizedText translationKey="copy.1089ac84" fallback={"C XOR D = "} />{Number(inputs.C)} <LocalizedText translationKey="copy.49bbbb5a" fallback={"XOR "} />{Number(inputs.D)}</span>
                  <b>{Number(conditionXor)}</b>
                </div>
                <div className={`smart-logic-result ${finalOutput ? "is-on" : ""}`}>
                  <span><LocalizedText translationKey="copy.b2a4eb43" fallback={"AND OR XOR // WYJŚCIE ZAMKA"} /></span>
                  <strong><LocalizedText translationKey="copy.70e335ce" fallback={"WYJŚCIE: "} />{Number(finalOutput)}</strong>
                </div>
              </div>

              <div className="jumper-board">
                <div className="workshop-label">
                  <LocalizedText translationKey="copy.00997593" fallback={"TABLICA ZWOR // WYJŚCIA → WEJŚCIA "} /></div>
                <div className="jumper-endpoints">
                  <div>
                    <strong><LocalizedText translationKey="copy.1c2b6a90" fallback={"WYBIERZ WYJŚCIE"} /></strong>
                    <div className="jumper-socket-list">
                      {OUTPUTS.map((output) => (
                        <button
                          key={output.id}
                          type="button"
                          className={`jumper-socket ${selectedOutput === output.id ? "is-selected" : ""}`}
                          aria-pressed={selectedOutput === output.id}
                          onClick={() => setSelectedOutput(output.id)}
                        >
                          <i /> <LocalizedText fallback={output.label} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong><LocalizedText translationKey="copy.4a48ad39" fallback={"WYBIERZ GNIAZDO"} /></strong>
                    <div className="jumper-socket-list">
                      {TARGETS.map((target) => {
                        const connectedCable = cables.find((cable) =>
                          cable.endsWith(`>${target.id}`),
                        );
                        return (
                          <button
                            key={target.id}
                            type="button"
                            className={`jumper-socket ${selectedTarget === target.id ? "is-selected" : ""} ${connectedCable ? "is-connected" : ""}`}
                            aria-pressed={selectedTarget === target.id}
                            onClick={() => setSelectedTarget(target.id)}
                          >
                            <i />
                            <LocalizedText fallback={target.label} />
                            {connectedCable && (
                              <small>
                                <LocalizedText translationKey="copy.dd33f33d" fallback={"← "} />{connectedCable.split(">")[0]}
                              </small>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="secondary-button jumper-connect-button"
                  onClick={connectCable}
                  disabled={!selectedOutput || !selectedTarget}
                >
                  <LocalizedText translationKey="copy.6e4b4a89" fallback={"WPIJ ZWORĘ "} /></button>
                <div className="jumper-progress">
                  <LocalizedText translationKey="copy.5698223f" fallback={"POPRAWNE POŁĄCZENIA "} /><strong>{cables.length}<LocalizedText translationKey="copy.97d25592" fallback={"/8"} /></strong>
                </div>
                {cables.length > 0 && (
                  <div className="connected-cables">
                    {cables.map((cable) => (
                      <span key={cable}><LocalizedText translationKey="copy.70900dba" fallback={"● "} />{cable.replace(">", " → ")}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="primary-button level3-test-button"
                onClick={testLogic}
                disabled={!timerStarted}
              >
                <LocalizedText translationKey="copy.ef8285dc" fallback={"TESTUJ UKŁAD "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
              </button>
            </>
          )}
          <p className="feedback" role="status" aria-live="polite">
            {message ||
              (allCablesConnected
                ? <LocalizedText translationKey="copy.ccbac84e" fallback={"Połącz zwory i ustaw wejścia zgodnie z nowym protokołem."} />
                : `Znajdź tropy, poprawnie podłącz ${REQUIRED_CABLES.length} zwór i ustaw wejścia.`)}
          </p>
        </div>
      )}

      <div className="logic-legend">
        <div><strong><LocalizedText translationKey="copy.727434eb" fallback={"AND / JEDNOCZEŚNIE"} /></strong><span><LocalizedText translationKey="copy.bd3f52c2" fallback={"oba wejścia muszą być prawdziwe"} /></span></div>
        <div><strong><LocalizedText translationKey="copy.8adbd072" fallback={"XOR / WYKLUCZAJĄCE LUB"} /></strong><span><LocalizedText translationKey="copy.7b0acdd0" fallback={"wejścia muszą mieć różne stany"} /></span></div>
        <div><strong><LocalizedText translationKey="copy.d5e460bf" fallback={"NOT / PRZECIWIEŃSTWO"} /></strong><span><LocalizedText translationKey="copy.57cf8c24" fallback={"odwraca stan wejścia"} /></span></div>
        <div><strong><LocalizedText translationKey="copy.a1573046" fallback={"OR / LUB"} /></strong><span><LocalizedText translationKey="copy.cd31d232" fallback={"wystarczy jedna prawdziwa ścieżka"} /></span></div>
      </div>
    </section>
  );
}
