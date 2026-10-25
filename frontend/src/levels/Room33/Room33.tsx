import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room33Props = {
  onComplete: () => void;
};

const MAZE = [
  "..#####",
  "#.##..#",
  "#.##..#",
  "#.....#",
  "###.#.#",
  "#.....#",
  "#####..",
];

const START = { row: 0, column: 0 };
const EXIT = { row: 6, column: 6 };
const MOVES = [
  { id: "up", label: "GÓRA", symbol: "↑", row: -1, column: 0 },
  { id: "left", label: "LEWO", symbol: "←", row: 0, column: -1 },
  { id: "down", label: "DÓŁ", symbol: "↓", row: 1, column: 0 },
  { id: "right", label: "PRAWO", symbol: "→", row: 0, column: 1 },
] as const;

function cellKey(row: number, column: number) {
  return `${row}-${column}`;
}

export default function Room33({ onComplete }: Room33Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [position, setPosition] = useState(START);
  const [visited, setVisited] = useState([cellKey(START.row, START.column)]);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function move(rowDelta: number, columnDelta: number) {
    if (complete) return;

    const next = {
      row: position.row + rowDelta,
      column: position.column + columnDelta,
    };
    const nextCell = MAZE[next.row]?.[next.column];

    if (nextCell !== ".") {
      setFeedback(localizeAttribute("copy.908bbf46", "Ściana blokuje tę drogę. Spróbuj innego kierunku."));
      return;
    }

    setPosition(next);
    setVisited((cells) => [...new Set([...cells, cellKey(next.row, next.column)])]);
    setFeedback("");

    if (next.row === EXIT.row && next.column === EXIT.column) {
      setComplete(true);
      setFeedback(localizeAttribute("copy.ab2c61ad", "Wyjście odnalezione. Zespół przeszedł przez labirynt."));
      window.setTimeout(onComplete, 700);
    }
  }

  function resetMaze() {
    setPosition(START);
    setVisited([cellKey(START.row, START.column)]);
    setFeedback(localizeAttribute("copy.3321564c", "Impuls wrócił do wejścia. Znajdź inną drogę."));
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.3aab55f6" fallback={"POKÓJ 33 / UKŁAD LIMBICZNY"} /></div>
        <h1>
          <LocalizedText translationKey="copy.5e36bdd0" fallback={"LABIRYNT "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.565d9393" fallback={"AMIGDALI"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.12c77130" fallback={"„W nieznanym korytarzu szukajcie drogi razem, krok po kroku.” "} /></p>
        <div className="mission-art amygdala-mission-art" role="img" aria-label={localizeAttribute("copy.5f229f15", "Plan labiryntu z wejściem, rozwidleniami i wyjściem.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.d452bd5a" fallback={"MAPA PRZEJŚĆ // UKŁAD LIMBICZNY "} /></div>
          <div className="maze-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.05f724c0" fallback={"WEJŚCIE"} /></span><i /><i /><i /><span><LocalizedText translationKey="copy.05a6ae04" fallback={"WYJŚCIE"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.479c4bbe" fallback={"TRASA: DO ODNALEZIENIA"} /></span>
            <span><LocalizedText translationKey="copy.d7b79049" fallback={"RUCH: KROK PO KROKU"} /></span>
            <span><LocalizedText translationKey="copy.fa6662ca" fallback={"LIMIT CZASU: BRAK"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.f028d6b7" fallback={"Labirynt Amigdali to cyfrowa mapa korytarzy. Znajdź drogę od wejścia do wyjścia, kierując impulsem przez otwarte pola. "} /></p>
          <p>
            <LocalizedText translationKey="copy.d419744a" fallback={"Ślepe zaułki nie odbierają czasu ani postępu — możesz wrócić do wejścia i spróbować innej trasy. Nie ma migających świateł ani ograniczania widoku. "} /></p>
          <p>
            <LocalizedText translationKey="copy.88e58b1b" fallback={"Wspólnie uzgadniajcie kierunek przed każdym ruchem; zagadka nie wymaga pośpiechu ani fizycznego przemieszczania się. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.8c5613d1" fallback={"WEJDŹ DO LABIRYNTU "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.3aab55f6" fallback={"POKÓJ 33 / UKŁAD LIMBICZNY"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.4eeccf74" fallback={"ODNAJDŹ "} /><span className="accent"><LocalizedText translationKey="copy.05a6ae04" fallback={"WYJŚCIE"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.9993f3b3" fallback={"Poruszaj się po otwartych korytarzach. Dotarcie do ślepego zaułka nie kończy próby. "} /></p>
      <div className="amygdala-maze" role="grid" aria-label={localizeAttribute("copy.73a6302d", "Mapa labiryntu, rząd po rzędzie.")}>
        {MAZE.map((row, rowIndex) =>
          (
            <div className="maze-row" key={`row-${rowIndex}`} role="row">
              {[...row].map((cell, columnIndex) => {
            const key = cellKey(rowIndex, columnIndex);
            const isCurrent =
              position.row === rowIndex && position.column === columnIndex;
            const isStart = START.row === rowIndex && START.column === columnIndex;
            const isExit = EXIT.row === rowIndex && EXIT.column === columnIndex;

            return (
              <span
                aria-label={[
                  cell === "#" ? "Ściana" : "Korytarz",
                  isStart ? "wejście" : "",
                  isExit ? "wyjście" : "",
                  isCurrent ? "obecne położenie" : "",
                  visited.includes(key) ? "odwiedzone" : "",
                ].filter(Boolean).join(", ")}
                className={[
                  "maze-cell",
                  cell === "#" ? "is-wall" : "is-path",
                  visited.includes(key) ? "is-visited" : "",
                  isCurrent ? "is-current" : "",
                  isStart ? "is-start" : "",
                  isExit ? "is-exit" : "",
                ].filter(Boolean).join(" ")}
                key={key}
                role="gridcell"
                title={isCurrent ? "Położenie impulsu" : isStart ? "Wejście" : isExit ? "Wyjście" : undefined}
              >
                {isCurrent ? "●" : isStart ? "W" : isExit ? "X" : ""}
              </span>
            );
              })}
            </div>
          ),
        )}
      </div>
      <div aria-label={localizeAttribute("copy.f78c56cf", "Sterowanie ruchem po labiryncie")} className="maze-controls">
        {MOVES.map((direction) => (
          <button
            aria-label={localizeAttribute(translationKeyFor(direction.label), direction.label)}
            className={`maze-move maze-move-${direction.id}`}
            disabled={complete}
            key={direction.id}
            onClick={() => move(direction.row, direction.column)}
            type="button"
          >
            <span>{direction.symbol}</span>
          </button>
        ))}
      </div>
      <div className="maze-status">
        <LocalizedText translationKey="copy.16d11f6e" fallback={"KROKÓW: "} />{visited.length - 1} <span><LocalizedText translationKey="copy.b20bda76" fallback={"·"} /></span> <LocalizedText translationKey="copy.aaba3ce7" fallback={"ODKRYTE POLA: "} />{visited.length}
      </div>
      <button className="secondary-button maze-reset" disabled={complete} onClick={resetMaze} type="button">
        <LocalizedText translationKey="copy.fb78a15f" fallback={"WRÓĆ DO WEJŚCIA "} /></button>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
