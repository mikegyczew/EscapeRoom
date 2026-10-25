import { useState } from "react";
import { LocalizedText } from "../../shared/localized-text";
import { translationKeyFor } from "../../shared/translation-key";
import { useTranslation } from "../../shared/use-translation";



type Room83Props = {
  onComplete: () => void;
};

const NAMES = [
  {
    name: "Henry Armitage",
    clue: "Podpis na notatkach badawczych",
    isAuthor: true,
  },
  {
    name: "Henry Morgan",
    clue: "Nazwisko z rejestru dawnego personelu",
    isAuthor: false,
  },
  {
    name: "Henry Alden",
    clue: "Nazwisko z listy gości laboratorium",
    isAuthor: false,
  },
  {
    name: "Harold Armitage",
    clue: "Imię z niepowiązanego aktu własności",
    isAuthor: false,
  },
] as const;

export default function Room83({ onComplete }: Room83Props) {
  const { text: localizeAttribute } = useTranslation();
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);

  function chooseName(isAuthor: boolean) {
    if (!isAuthor) {
      setFeedback(localizeAttribute("copy.2c393dae", "Ten zapis pochodzi z innego dokumentu. Sprawdź opis źródła przy nazwisku."));
      return;
    }

    setComplete(true);
    setFeedback(localizeAttribute("copy.471b655e", "Sygnatura potwierdzona. Notatki należą do profesora Henry'ego Armitage'a."));
    window.setTimeout(onComplete, 700);
  }

  if (!started) {
    return (
      <section className="screen story-screen">
        <div className="eyebrow"><LocalizedText translationKey="copy.e53ec145" fallback={"POKÓJ 83 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
        <h1>
          <LocalizedText translationKey="copy.d8dba427" fallback={"ZGUBIŁEM "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.24f18c79" fallback={"NAZWISKO"} /></span>
        </h1>
        <p className="story-quote">
          <LocalizedText translationKey="copy.aa31bbb5" fallback={"„Wśród obcych zapisów odnajdź ten, który pasuje do jego własnych notatek.” "} /></p>
        <div className="mission-art identity-mission-art" role="img" aria-label={localizeAttribute("copy.0e397ee9", "Archiwalne karty z nazwiskami i pochodzeniem zapisów.")}>
          <div className="mission-art-heading">
            <span className="logic-led is-on" />
            <LocalizedText translationKey="copy.c3b16769" fallback={"ARCHIWUM OSOBOWE // WERYFIKACJA ŹRÓDŁA "} /></div>
          <div className="identity-art" aria-hidden="true">
            <span><LocalizedText translationKey="copy.5c7ef1ca" fallback={"H. A."} /></span><i><LocalizedText translationKey="copy.3a0cb08e" fallback={"?"} /></i><span><LocalizedText translationKey="copy.b6e8c231" fallback={"SYGNATURA"} /></span>
          </div>
          <div className="mission-art-footer">
            <span><LocalizedText translationKey="copy.991f3051" fallback={"WPISY: 4"} /></span>
            <span><LocalizedText translationKey="copy.9dec9f2e" fallback={"ŹRÓDŁA: RÓŻNE"} /></span>
            <span><LocalizedText translationKey="copy.455100d0" fallback={"AUTOR: DO POTWIERDZENIA"} /></span>
          </div>
        </div>
        <div className="story-body">
          <p>
            <LocalizedText translationKey="copy.ee3d4390" fallback={"Katalog pomieszał nazwiska z list personelu, gości i notatek badawczych. Odszukaj nazwisko widniejące na dokumentach Profesora. "} /></p>
          <p>
            <LocalizedText translationKey="copy.7e73efcd" fallback={"Sprawdź źródło każdej karty. Błędny wybór nie usuwa postępu ani nie nakłada kary. "} /></p>
        </div>
        <button className="primary-button" onClick={() => setStarted(true)}>
          <LocalizedText translationKey="copy.f988ac59" fallback={"OTWÓRZ KATALOG "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <div className="eyebrow"><LocalizedText translationKey="copy.e53ec145" fallback={"POKÓJ 83 / GŁĘBOKA ISTOTA BIAŁA"} /></div>
      <h1 className="section-title">
        <LocalizedText translationKey="copy.4eeccf74" fallback={"ODNAJDŹ "} /><span className="accent"><LocalizedText translationKey="copy.fde79ef6" fallback={"SYGNATURĘ"} /></span>
      </h1>
      <p className="lead">
        <LocalizedText translationKey="copy.0d498fb3" fallback={"Wybierz nazwisko podpisane pod notatkami badawczymi Profesora. "} /></p>
      <div className="identity-name-grid">
        {NAMES.map((entry) => (
          <button
            className="identity-name-card"
            disabled={complete}
            key={localizeAttribute(translationKeyFor(entry.name), entry.name)}
            onClick={() => chooseName(entry.isAuthor)}
            type="button"
          >
            <strong><LocalizedText fallback={entry.name} /></strong>
            <span><LocalizedText fallback={entry.clue} /></span>
          </button>
        ))}
      </div>
      <p className="feedback" role="status">{feedback}</p>
    </section>
  );
}
