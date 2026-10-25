import { useEffect, useRef, useState } from "react";
import {
  ITEMS,
  LEVEL2_SECONDS,
  MEMORIZE_MS,
  POS,
  REMIND_MS,
  ROTATE_MS,
  ROUND_TIMES,
  TOTAL_ROUNDS,
  makeClockRounds,
  type ClockRound,
  type FoundItem,
} from "./index";

type UseRoom34Options = {
  active: boolean;
  onBegin: () => void;
  onComplete: () => void;
  onFailure: () => void;
};

export default function useRoom34({
  active,
  onBegin,
  onComplete,
  onFailure,
}: UseRoom34Options) {
  const [found, setFound] = useState<string[]>([]);
  const [selectedObject, setSelectedObject] = useState<FoundItem | null>(null);
  const [clockSlots, setClockSlots] = useState<string[]>(Array(4).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(LEVEL2_SECONDS);
  const [level2Attempts, setLevel2Attempts] = useState(0);
  const [clockMessage, setClockMessage] = useState("");
  const [clockRound, setClockRound] = useState(1);
  const [clockRounds, setClockRounds] = useState<ClockRound[]>(() =>
    makeClockRounds(),
  );
  const [clockMemorizing, setClockMemorizing] = useState(false);
  const [clockRotating, setClockRotating] = useState(false);
  const [clockReading, setClockReading] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [clockRoundsCompleted, setClockRoundsCompleted] = useState(0);
  const [handSpins, setHandSpins] = useState(0);
  const [missionFinishing, setMissionFinishing] = useState(false);

  const timeoutsRef = useRef<number[]>([]);

  function clearTimers() {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }

  function schedule(callback: () => void, delay: number) {
    const id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((timer) => timer !== id);
      callback();
    }, delay);
    timeoutsRef.current.push(id);
  }

  useEffect(() => {
    if (!active) {
      clearTimers();
      return;
    }
    if (missionFinishing) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, missionFinishing]);

  useEffect(() => {
    if (!active || missionFinishing || secondsLeft > 0) return;

    clearTimers();
    onFailure();
  }, [active, missionFinishing, secondsLeft, onFailure]);

  useEffect(() => clearTimers, []);

  function beginMemorization(
    round: number,
    message: string,
    duration = MEMORIZE_MS,
  ) {
    clearTimers();
    setClockRound(round);
    setClockSlots(Array(4).fill(""));
    setClockRotating(false);
    setClockReading(false);
    setClockMemorizing(true);
    setClockMessage(message);

    schedule(() => {
      setClockMemorizing(false);
      setClockMessage(
        "Zapomniałem… gdzie które stało? Ułóż liczby na swoich miejscach.",
      );
    }, duration);
  }

  function reset() {
    clearTimers();
    setFound([]);
    setSelectedObject(null);
    setClockSlots(Array(4).fill(""));
    setClockRounds(makeClockRounds());
    setClockRound(1);
    setClockRoundsCompleted(0);
    setClockMemorizing(false);
    setClockRotating(false);
    setClockReading(false);
    setSelectedTime("");
    setSecondsLeft(LEVEL2_SECONDS);
    setLevel2Attempts(0);
    setClockMessage("");
    setHandSpins(0);
    setMissionFinishing(false);
  }

  function beginMission() {
    setSecondsLeft(LEVEL2_SECONDS);
    setClockRoundsCompleted(0);
    setLevel2Attempts(0);
    setClockRounds(makeClockRounds());
    setSelectedTime("");
    setMissionFinishing(false);
    onBegin();
    beginMemorization(
      1,
      `Runda 1/${TOTAL_ROUNDS}. Pamiętam… zapamiętaj liczby!`,
    );
  }

  function collectItem(item: FoundItem) {
    if (found.includes(item.id)) {
      setSelectedObject(item);
      return;
    }

    setFound((previous) => [...previous, item.id]);
    setSelectedObject(item);
    if (!clockMemorizing) {
      setClockMessage(`Odnaleziono: ${item.name}`);
    }
  }

  function setClockSlot(index: number, value: string) {
    setClockSlots((previous) => {
      if (value && previous.some((slot, i) => i !== index && slot === value)) {
        return previous;
      }
      return previous.map((slot, i) => (i === index ? value : slot));
    });
  }

  function resetClockShuffle() {
    if (clockRotating) return;
    setClockRounds(makeClockRounds());
    setClockRoundsCompleted(0);
    setSelectedTime("");
    beginMemorization(
      1,
      `Runda 1/${TOTAL_ROUNDS}. Pamiętam… zapamiętaj nowy układ!`,
    );
  }

  const currentRound = clockRounds[Math.min(clockRound, TOTAL_ROUNDS) - 1];
  const clockTarget = POS.map((pos) => String(currentRound[pos]));

  function checkClock() {
    if (clockMemorizing || clockRotating || clockReading) {
      setClockMessage("Poczekaj, aż zegar zakończy ruch.");
      return;
    }

    if (!ITEMS.every((item) => found.includes(item.id))) {
      setClockMessage("Najpierw odnajdź wszystkie elementy w pokoju.");
      return;
    }

    if (clockSlots.some((slot) => slot === "")) {
      setClockMessage("Uzupełnij wszystkie 4 pozycje.");
      return;
    }

    setLevel2Attempts((previous) => previous + 1);

    const correct = clockSlots.every(
      (slot, index) => slot === clockTarget[index],
    );

    if (!correct) {
      beginMemorization(
        clockRound,
        "Nie tak. Henryk przypomina układ jeszcze raz…",
        REMIND_MS,
      );
      return;
    }

    setSelectedTime("");
    setHandSpins((previous) => previous + 1);
    setClockRotating(true);
    setClockMessage("Dobrze! Mechanizm obraca wskazówki...");

    schedule(() => {
      setClockRotating(false);
      setClockReading(true);
      setClockMessage(
        clockRound === 1
          ? "Odczytaj godzinę z tarczy. Zwróć uwagę na obie wskazówki."
          : `Ustaw godzinę ${ROUND_TIMES[clockRound - 1]} z notatki Henryka.`,
      );
    }, ROTATE_MS);
  }

  function answerTime(value: string) {
    if (!clockReading) return;

    setLevel2Attempts((previous) => previous + 1);
    const expected = ROUND_TIMES[clockRound - 1];

    if (value !== expected) {
      setClockMessage(
        clockRound === 1
          ? "Nieprawidłowy odczyt. Sprawdź położenie krótkiej i długiej wskazówki."
          : "To nie ta godzina. Sprawdź notatkę Henryka i ustaw obie wskazówki.",
      );
      return;
    }

    setClockReading(false);
    setSelectedTime("");
    const completed = clockRoundsCompleted + 1;
    setClockRoundsCompleted(completed);
    setClockSlots(Array(4).fill(""));

    if (completed >= TOTAL_ROUNDS) {
      setClockMessage("TIK... TAK... MECHANIZM ZASKOCZYŁ!");
      setMissionFinishing(true);
      schedule(onComplete, 1200);
      return;
    }

    beginMemorization(
      completed + 1,
      `Runda ${completed + 1}/${TOTAL_ROUNDS}. Pamiętam… zapamiętaj nowe liczby!`,
    );
  }

  const choices = [...clockTarget].sort((a, b) => Number(a) - Number(b));
  const usedDigits = new Set(clockSlots.filter(Boolean));
  const showDigits = clockMemorizing || clockRotating || clockReading;
  const targetTime = ROUND_TIMES[clockRound - 1];
  const displayedTime =
    clockRound === 1 ? targetTime : selectedTime || "12:00";
  const [displayHour, displayMinute] = displayedTime.split(":").map(Number);
  const minuteAngle = displayMinute * 6 + handSpins * 360 * 12;
  const hourAngle =
    (displayHour % 12) * 30 + displayMinute * 0.5 + handSpins * 360;
  const handTransition = `transform ${ROTATE_MS}ms ease-in-out, opacity 0.4s`;
  const handOpacity =
    clockRound === 1
      ? clockRotating || clockReading
        ? 1
        : 0.15
      : clockReading && selectedTime
        ? 1
        : 0.15;

  return {
    reset,
    found,
    selectedObject,
    setSelectedObject,
    clockSlots,
    secondsLeft,
    level2Attempts,
    clockMessage,
    clockRound,
    clockRoundsCompleted,
    clockMemorizing,
    clockRotating,
    clockReading,
    selectedTime,
    setSelectedTime,
    clockTarget,
    choices,
    usedDigits,
    showDigits,
    targetTime,
    minuteAngle,
    hourAngle,
    handTransition,
    handOpacity,
    collectItem,
    setClockSlot,
    resetClockShuffle,
    beginMission,
    checkClock,
    answerTime,
  };
}
