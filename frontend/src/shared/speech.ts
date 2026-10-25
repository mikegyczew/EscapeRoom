export function activeLevelPhrase(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (count === 1) return "1 aktywny poziom";
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${count} aktywne poziomy`;
  }
  return `${count} aktywnych poziomów`;
}

let activeAudio: HTMLAudioElement | null = null;
let playbackId = 0;

export function archiveIntroNarrationFiles(count: number): string[] {
  const activeLevelsFile = `/audio/narration/active-levels-${count}.mp3`;

  return [
    `/audio/narration/archive-${count}.mp3`,
    activeLevelsFile,
    "/audio/narration/intro-middle.mp3",
    activeLevelsFile,
    "/audio/narration/intro-end.mp3",
  ];
}

export function playPolishAudio(files: string[]): void {
  stopPolishAudio();
  const currentPlaybackId = playbackId;
  let fileIndex = 0;

  const playNext = () => {
    if (currentPlaybackId !== playbackId || fileIndex >= files.length) return;

    const file = files[fileIndex];
    const audio = new Audio(file);
    activeAudio = audio;

    const reportError = (error: unknown) => {
      if (activeAudio !== audio) return;
      activeAudio = null;
      console.error(`Nie udało się odtworzyć lektora: ${file}`, error);
    };

    audio.onended = () => {
      if (activeAudio !== audio) return;
      activeAudio = null;
      fileIndex += 1;
      playNext();
    };
    audio.onerror = () =>
      reportError(new Error(`Nie można wczytać nagrania ${file}.`));
    void audio.play().catch(reportError);
  };

  playNext();
}

export function stopPolishAudio(): void {
  playbackId += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio = null;
  }
}
