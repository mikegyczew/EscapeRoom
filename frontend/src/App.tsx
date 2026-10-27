import { useEffect, useRef, useState, type FormEvent } from "react";
import "./App.css";
import {
  isLevelEnabled,
  LEVELS,
} from "./levels/registry";
import type { LevelDefinition, LevelId } from "./levels/types";
import Room01 from "./levels/Room01/Room01";
import Room05 from "./levels/Room05/Room05";
import Room11 from "./levels/Room11/Room11";
import Room12 from "./levels/Room12/Room12";
import Room17 from "./levels/Room17/Room17";
import Room22 from "./levels/Room22/Room22";
import Room23 from "./levels/Room23/Room23";
import Room27 from "./levels/Room27/Room27";
import Room33 from "./levels/Room33/Room33";
import Room40 from "./levels/Room40/Room40";
import Room44 from "./levels/Room44/Room44";
import Room45 from "./levels/Room45/Room45";
import Room50 from "./levels/Room50/Room50";
import Room55 from "./levels/Room55/Room55";
import Room56 from "./levels/Room56/Room56";
import Room61 from "./levels/Room61/Room61";
import Room66 from "./levels/Room66/Room66";
import Room76 from "./levels/Room76/Room76";
import Room72 from "./levels/Room72/Room72";
import Room77 from "./levels/Room77/Room77";
import Room67 from "./levels/Room67/Room67";
import Room78 from "./levels/Room78/Room78";
import Room83 from "./levels/Room83/Room83";
import Room88 from "./levels/Room88/Room88";
import Room89 from "./levels/Room89/Room89";
import Room99 from "./levels/Room99/Room99";
import {
  ITEMS,
  POS,
  POS_LABEL,
  POS_SLOT,
  ROUND_TIMES,
  TOTAL_ROUNDS,
} from "./levels/Room34";
import useRoom34 from "./levels/Room34/useRoom34";
import {
  activeLevelPhrase,
  archiveIntroNarrationFiles,
  playPolishAudio,
  stopPolishAudio,
} from "./shared/speech";
import { TranslationProvider } from "./shared/translations";
import { useTranslation } from "./shared/use-translation";
import { LocalizedText } from "./shared/localized-text";
import { translationKeyFor } from "./shared/translation-key";
import AdminPanel from "./admin/AdminPanel";
import {
  fetchStories,
  fetchStoryProgress,
  submitPuzzleAnswer,
  type StoryCatalogItem,
  type StoryProgress,
} from "./shared/stories";

type StoryLevel = LevelDefinition & { order: number; roomNumber: number };


type Screen =
  | "lobby"
  | "admin"
  | "intro"
  | "level1"
  | "room05"
  | "room11"
  | "room12"
  | "room17"
  | "room22"
  | "room23"
  | "room27"
  | "room33"
  | "room40"
  | "room44"
  | "room45"
  | "room50"
  | "room55"
  | "room61"
  | "room66"
  | "room76"
  | "room72"
  | "room77"
  | "room67"
  | "room78"
  | "room83"
  | "room88"
  | "room89"
  | "room99"
  | "transition"
  | "level2intro"
  | "level2"
  | "level3intro"
  | "success"
  | "failed";

type LoginScreenProps = {
  initialError?: string;
  onAuthenticated: (user: AuthenticatedUser) => void;
};

type PasswordResetLink = {
  email: string;
  code: string;
};

type BackendConnectionState = "checking" | "online" | "offline";

type AuthenticatedUser = {
  displayName: string;
  isAdmin: boolean;
};

function useBackendConnection(): BackendConnectionState {
  const [connectionState, setConnectionState] =
    useState<BackendConnectionState>("checking");

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    let requestController: AbortController | undefined;

    async function checkConnection() {
      requestController = new AbortController();
      const timeoutTimer = window.setTimeout(
        () => requestController?.abort(),
        15_000,
      );

      try {
        const response = await fetch("/healthz", {
          cache: "no-store",
          signal: requestController.signal,
        });
        if (!response.ok) {
          throw new Error(`Backend health check returned ${response.status}.`);
        }
        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !("status" in body) ||
          body.status !== "healthy"
        ) {
          throw new Error("Backend health check returned an unexpected response.");
        }
        if (active) setConnectionState("online");
      } catch {
        if (active) setConnectionState("offline");
      } finally {
        window.clearTimeout(timeoutTimer);
        if (active) {
          retryTimer = window.setTimeout(() => void checkConnection(), 10_000);
        }
      }
    }

    void checkConnection();
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      requestController?.abort();
    };
  }, []);

  return connectionState;
}

function BackendConnectionStatus() {
  const { language } = useTranslation();
  const connectionState = useBackendConnection();
  const label =
    connectionState === "online"
      ? "SYSTEM ONLINE"
      : connectionState === "checking"
        ? language === "pl" ? "ŁĄCZENIE..." : "CONNECTING..."
        : language === "pl" ? "BRAK POŁĄCZENIA" : "BACKEND OFFLINE";

  return (
    <div
      aria-live="polite"
      className={`system-status backend-status ${connectionState}`}
      role="status"
    >
      <span className={`status-dot ${connectionState}`} />
      {label}
    </div>
  );
}

async function getApiError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) {
      return "Nie udało się wykonać tej operacji.";
    }

    const details = body as {
      detail?: unknown;
      title?: unknown;
      message?: unknown;
      errors?: Record<string, string[]>;
    };
    const validationErrors = Object.values(details.errors ?? {}).flat();
    if (validationErrors.length > 0) return validationErrors.join(" ");
    if (typeof details.detail === "string") return details.detail;
    if (typeof details.message === "string") return details.message;
    if (typeof details.title === "string") return details.title;
  } catch {
    return "Nie udało się odczytać odpowiedzi serwera.";
  }

  return "Nie udało się wykonać tej operacji.";
}

async function getAuthenticatedUser(response: Response): Promise<AuthenticatedUser> {
  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("isAdmin" in body) ||
    typeof body.isAdmin !== "boolean" ||
    !("userName" in body) ||
    typeof body.userName !== "string" ||
    !("email" in body) ||
    !(typeof body.email === "string" || body.email === null)
  ) {
    throw new Error("Serwer zwrócił nieprawidłowe dane użytkownika.");
  }
  return {
    displayName: body.userName || body.email || "Użytkownik",
    isAdmin: body.isAdmin,
  };
}

function LoginScreen({ initialError, onAuthenticated }: LoginScreenProps) {
  const { text: localizeAttribute } = useTranslation();
  const { language, setLanguage } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);
  const [passwordRecoveryAvailable, setPasswordRecoveryAvailable] = useState(false);
  const [passwordRecoveryStatusChecked, setPasswordRecoveryStatusChecked] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(initialError ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/password-recovery/status")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getApiError(response));
        }
        const body: unknown = await response.json();
        if (
          typeof body !== "object" ||
          body === null ||
          !("available" in body) ||
          typeof body.available !== "boolean"
        ) {
          throw new Error("Serwer zwrócił nieprawidłowy status odzyskiwania hasła.");
        }
        if (active) setPasswordRecoveryAvailable(body.available);
      })
      .catch(() => {
        if (active) setPasswordRecoveryAvailable(false);
      })
      .finally(() => {
        if (active) setPasswordRecoveryStatusChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (isRequestingPasswordReset) {
      setSubmitting(true);
      try {
        const response = await fetch("/api/auth/forgotPassword", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        });
        if (!response.ok) {
          setMessage(await getApiError(response));
          return;
        }
        setMessage(
          language === "pl"
            ? "Jeśli konto jest powiązane z tym adresem, wysłaliśmy link do zmiany hasła."
            : "If an account is associated with this address, a password reset link has been sent.",
        );
      } catch {
        setMessage(
          language === "pl"
            ? "Nie udało się połączyć z serwerem. Spróbuj ponownie."
            : "Could not connect to the server. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setMessage(localizeAttribute("copy.2438937c", "Hasła nie są takie same."));
      return;
    }

    setSubmitting(true);
    try {
      if (isRegistering) {
        const registration = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, password }),
        });
        if (!registration.ok) {
          setMessage(await getApiError(registration));
          return;
        }
      }

      const login = await fetch("/api/auth/login-identifier", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (!login.ok) {
        setMessage(
          login.status === 401
            ? "Nieprawidłowy adres e-mail lub hasło."
            : isRegistering
            ? "Konto utworzono, ale nie udało się zalogować. Spróbuj zalogować się ręcznie."
            : await getApiError(login),
        );
        if (isRegistering) setIsRegistering(false);
        return;
      }

      const currentUser = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!currentUser.ok) {
        setMessage(localizeAttribute("copy.9af9808d", "Logowanie nie zostało potwierdzone przez serwer."));
        return;
      }
      onAuthenticated(await getAuthenticatedUser(currentUser));
    } catch {
      setMessage(
        localizeAttribute("copy.44fbdce3", "Nie można połączyć się z serwerem. Sprawdź, czy aplikacja działa, i spróbuj ponownie."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="game-shell">
      <MatrixRain />
      <header className="game-header auth-header">
        <div className="brand">
          <span className="brand-mark"><LocalizedText translationKey="copy.1d4075e7" fallback={"⌘"} /></span>
          <span><LocalizedText translationKey="copy.a1be99c2" fallback={"LABORATORIUM "} /><span className="accent"><LocalizedText translationKey="copy.39dcb3b2" fallback={"PROFESORA"} /></span></span>
        </div>
        <BackendConnectionStatus />
        <button
          aria-label={language === "pl" ? "Switch language to English" : "Zmień język na polski"}
          className="language-toggle"
          onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
          type="button"
        >
          {language === "pl" ? "EN" : "PL"}
        </button>
      </header>
      <section className="auth-panel">
        <div className="eyebrow"><LocalizedText translationKey="copy.3517ba87" fallback={"ARCHIWUM HENRY'EGO ARMITAGE'A"} /></div>
        <h1>
          <LocalizedText translationKey="copy.e7acfd19" fallback={"WEJDŹ DO "} /><br />
          <span className="accent"><LocalizedText translationKey="copy.6b76a056" fallback={"LABORATORIUM"} /></span>
        </h1>
        <p className="lead">
          {isRequestingPasswordReset
            ? language === "pl"
              ? "Podaj adres e-mail powiązany z kontem."
              : "Enter the email address associated with your account."
            : <LocalizedText translationKey="copy.b32efa5a" fallback={"Zaloguj się lub utwórz konto, aby wybrać escape room i kontynuować przygodę. "} />}
        </p>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <label>
            <LocalizedText
              translationKey={isRegistering || isRequestingPasswordReset ? "copy.8fa0f8dd" : "auth.loginIdentifier"}
              fallback={isRegistering || isRequestingPasswordReset ? "ADRES E-MAIL " : "LOGIN LUB E-MAIL "}
            /><input
              autoComplete={isRegistering || isRequestingPasswordReset ? "email" : "username"}
              autoFocus
              onChange={(event) => setIdentifier(event.target.value)}
              required
              type={isRegistering || isRequestingPasswordReset ? "email" : "text"}
              value={identifier}
            />
          </label>
          {!isRequestingPasswordReset && (
            <label>
              <LocalizedText translationKey="copy.bf5362b1" fallback={"HASŁO "} /><input
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
          )}
          {isRegistering && !isRequestingPasswordReset && (
            <label>
              <LocalizedText translationKey="copy.19d993d8" fallback={"POWTÓRZ HASŁO "} /><input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          )}
          <p className="auth-message" aria-live="polite" role="status">
            {message}
          </p>
          <button className="primary-button auth-submit" disabled={submitting} type="submit">
            {submitting
              ? <LocalizedText translationKey="copy.80bcdd86" fallback={"ŁĄCZENIE Z ARCHIWUM..."} />
              : isRequestingPasswordReset
                ? language === "pl" ? "WYŚLIJ LINK DO RESETU" : "SEND RESET LINK"
                : isRegistering
                ? <LocalizedText translationKey="copy.0eca5487" fallback={"UTWÓRZ KONTO"} />
                : <LocalizedText translationKey="copy.d52c13d1" fallback={"ZALOGUJ SIĘ"} />}
            {!submitting && <span> <LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>}
          </button>
        </form>
        {isRequestingPasswordReset ? (
          <button
            className="text-button auth-mode-toggle"
            disabled={submitting}
            onClick={() => {
              setIsRequestingPasswordReset(false);
              setMessage("");
            }}
            type="button"
          >
            {language === "pl" ? "Wróć do logowania" : "Back to sign in"}
          </button>
        ) : (
          <>
            <button
              className="text-button auth-mode-toggle"
              disabled={submitting}
              onClick={() => {
                setIsRegistering((registering) => !registering);
                setMessage("");
              }}
              type="button"
            >
              {isRegistering ? <LocalizedText translationKey="copy.d4453a62" fallback={"Masz już konto? Zaloguj się."} /> : <LocalizedText translationKey="copy.73b9a228" fallback={"Nie masz konta? Utwórz je."} />}
            </button>
            {!isRegistering && passwordRecoveryAvailable && (
              <button
                className="text-button auth-mode-toggle"
                disabled={submitting}
                onClick={() => {
                  setIsRequestingPasswordReset(true);
                  setMessage("");
                }}
                type="button"
              >
                {language === "pl" ? "Nie pamiętasz hasła?" : "Forgot your password?"}
              </button>
            )}
            {!isRegistering && passwordRecoveryStatusChecked && !passwordRecoveryAvailable && (
              <p className="auth-password-hint">
                {language === "pl"
                  ? "Odzyskiwanie hasła jest chwilowo niedostępne."
                  : "Password recovery is currently unavailable."}
              </p>
            )}
          </>
        )}
        {isRegistering && (
          <p className="auth-password-hint">
            <LocalizedText translationKey="copy.c4d88102" fallback={"Hasło musi mieć co najmniej 8 znaków, w tym jedną cyfrę. "} /></p>
        )}
      </section>
    </main>
  );
}

function PasswordResetScreen({
  resetLink,
  onComplete,
}: {
  resetLink: PasswordResetLink;
  onComplete: () => void;
}) {
  const { language, setLanguage } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password !== confirmPassword) {
      setMessage(language === "pl" ? "Hasła nie są takie same." : "The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetLink.email,
          resetCode: resetLink.code,
          newPassword: password,
        }),
      });
      if (!response.ok) {
        setMessage(await getApiError(response));
        return;
      }
      setCompleted(true);
    } catch {
      setMessage(
        language === "pl"
          ? "Nie udało się połączyć z serwerem. Spróbuj ponownie."
          : "Could not connect to the server. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="game-shell">
      <MatrixRain />
      <header className="game-header auth-header">
        <div className="brand">
          <span className="brand-mark">⌘</span>
          <span>LABORATORIUM <span className="accent">PROFESORA</span></span>
        </div>
        <BackendConnectionStatus />
        <button
          aria-label={language === "pl" ? "Switch language to English" : "Zmień język na polski"}
          className="language-toggle"
          onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
          type="button"
        >
          {language === "pl" ? "EN" : "PL"}
        </button>
      </header>
      <section className="auth-panel">
        <div className="eyebrow">ESCAPE ROOM</div>
        <h1>
          {language === "pl" ? "USTAW NOWE " : "SET A NEW "}
          <span className="accent">{language === "pl" ? "HASŁO" : "PASSWORD"}</span>
        </h1>
        {completed ? (
          <>
            <p className="auth-message" role="status">
              {language === "pl" ? "Hasło zostało zmienione." : "Your password has been changed."}
            </p>
            <button className="primary-button auth-submit" onClick={onComplete} type="button">
              {language === "pl" ? "WRÓĆ DO LOGOWANIA" : "RETURN TO SIGN IN"}
            </button>
          </>
        ) : (
          <>
            <p className="lead">{resetLink.email}</p>
            <p className="auth-password-hint">
              {language === "pl"
                ? "Hasło musi mieć co najmniej 8 znaków i zawierać cyfrę."
                : "Password must be at least 8 characters and contain a digit."}
            </p>
            <form className="auth-form" onSubmit={(event) => void submit(event)}>
              <label>
                {language === "pl" ? "NOWE HASŁO" : "NEW PASSWORD"}
                <input
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              <label>
                {language === "pl" ? "POWTÓRZ HASŁO" : "CONFIRM PASSWORD"}
                <input
                  autoComplete="new-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
              <p className="auth-message" aria-live="polite" role="status">{message}</p>
              <button className="primary-button auth-submit" disabled={submitting} type="submit">
                {submitting
                  ? language === "pl" ? "ZAPISYWANIE..." : "SAVING..."
                  : language === "pl" ? "ZMIEŃ HASŁO" : "RESET PASSWORD"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

function MatrixRain({ speed = 1 }: { speed?: number }) {
  return (
    <div className="matrix-rain" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 47) % 100}%`,
            animationDuration: `${Math.max(2, 12 / speed + (i % 4))}s`,
            animationDelay: `${-(i % 12)}s`,
          }}
        >
          {Array.from({ length: 15 }, (_, j) =>
            ((i * 7 + j * 3) % 2).toString(),
          ).join("\n")}
        </span>
      ))}
    </div>
  );
}

const MEMORY_WORDS = ["Pamiętam…", "Zapomniałem…", "Która jest godzina?"];

type RoomMapEntry = {
  label: string;
  title: string;
  roomNumbers: number[];
  levelId?: LevelId;
};

const ROOM_MAP_SECTORS: {
  title: string;
  rooms: RoomMapEntry[];
}[] = [
  {
    title: "PŁAT POTYLICZNY · ZMYSŁY I OBRAZY",
    rooms: [
      { label: "01", title: "Pokój Pierwszego Światła", roomNumbers: [1], levelId: "room01" },
      { label: "05", title: "Kino Rodzinne", roomNumbers: [5], levelId: "room05" },
      { label: "11", title: "Ślepa Plamka", roomNumbers: [11], levelId: "room11" },
    ],
  },
  {
    title: "PŁAT SKRONIOWY · SŁUCH I JĘZYK",
    rooms: [
      { label: "12", title: "Cisza Absolutna", roomNumbers: [12], levelId: "room12" },
      { label: "17", title: "Chór Głosów", roomNumbers: [17], levelId: "room17" },
      { label: "22", title: "Szum Szumów", roomNumbers: [22], levelId: "room22" },
    ],
  },
  {
    title: "UKŁAD LIMBICZNY · EMOCJE",
    rooms: [
      { label: "23", title: "Pokój Napięcia", roomNumbers: [23], levelId: "room23" },
      { label: "27", title: "Gabinet Straty", roomNumbers: [27], levelId: "room27" },
      { label: "33", title: "Labirynt Amigdali", roomNumbers: [33], levelId: "room33" },
    ],
  },
  {
    title: "HIPOKAMP · CZAS I ZAPIS",
    rooms: [
      { label: "34", title: "Zatrzymana Wskazówka", roomNumbers: [34], levelId: "room34" },
      { label: "40", title: "Pętla Czasowa", roomNumbers: [40], levelId: "room40" },
      { label: "44", title: "Próg Zapomnienia", roomNumbers: [44], levelId: "room44" },
    ],
  },
  {
    title: "PŁAT CZUCIOWO-RUCHOWY · RUCH",
    rooms: [
      { label: "45", title: "Test Rysowania Zegara", roomNumbers: [45], levelId: "room45" },
      { label: "50", title: "Drżąca Ręka", roomNumbers: [50], levelId: "room50" },
      { label: "55", title: "Paraliż Senny", roomNumbers: [55], levelId: "room55" },
    ],
  },
  {
    title: "PŁAT CZOŁOWY · LOGIKA I DECYZJE",
    rooms: [
      { label: "56", title: "Złamany Algorytm", roomNumbers: [56], levelId: "room56" },
      { label: "61", title: "Szachy z Cieniem", roomNumbers: [61], levelId: "room61" },
      { label: "66", title: "Granice Eksperymentu", roomNumbers: [66], levelId: "room66" },
    ],
  },
  {
    title: "OBSZAR BROKI I WERNICKEGO · JĘZYK",
    rooms: [
      { label: "67", title: "Wieża Babel", roomNumbers: [67], levelId: "room67" },
      { label: "72", title: "Afazja", roomNumbers: [72], levelId: "room72" },
      { label: "76", title: "Słownik Pamięci", roomNumbers: [76], levelId: "room76" },
      { label: "77", title: "Ostatnie Zdanie", roomNumbers: [77], levelId: "room77" },
    ],
  },
  {
    title: "ISTOTA BIAŁA · CHAOS I DEGENERACJA",
    rooms: [
      { label: "78", title: "Labirynt bez Wyjścia", roomNumbers: [78], levelId: "room78" },
      { label: "83", title: "Zgubiłem Nazwisko", roomNumbers: [83], levelId: "room83" },
      { label: "88", title: "Krawędź Zsypu", roomNumbers: [88], levelId: "room88" },
    ],
  },
  {
    title: "JĄDRO ŚWIADOMOŚCI · OSTATNIE WSPOMNIENIE",
    rooms: [
      {
        label: "89–98",
        title: "Białe pokoje — gasnące synapsy",
        roomNumbers: Array.from({ length: 10 }, (_, index) => index + 89),
        levelId: "room89",
      },
      { label: "99", title: "Punkt Omega", roomNumbers: [99], levelId: "room99" },
    ],
  },
];

const ROOM_TRANSITIONS: Partial<Record<LevelId, Partial<Record<LevelId, string>>>> = {
  room01: {
    room05: "Impuls prowadzi do Pokoju 5 — rodzinnego filmu ukrytego w płacie potylicznym.",
  },
  room05: {
    room11: "Odzyskane klatki filmu ujawniają drogę do optycznej zagadki Pokoju 11.",
  },
  room11: {
    room12: "Ukryte przejście prowadzi do Pokoju 12 i zapisu wibracji z wyciszonej komory.",
  },
  room12: {
    room17: "Odtworzony rytm otwiera kanał do Pokoju 17, gdzie nakładają się archiwalne głosy.",
  },
  room17: {
    room22: "Oryginalny głos wskazuje częstotliwość ukrytą w szumie Pokoju 22.",
  },
  room22: {
    room23: "Odnaleziony sygnał prowadzi do Pokoju 23, gdzie zegar przechowuje rytm wspomnień.",
  },
  room23: {
    room27: "Uspokojony mechanizm odsłania listy Henry'ego i Rose w Pokoju 27.",
  },
  room27: {
    room33: "Ułożone chronologicznie listy wskazują drogę przez Labirynt Amigdali.",
  },
  room33: {
    room34: "Odnaleziony korytarz łączy układ limbiczny z zapisem czasu w Pokoju 34.",
  },
  room34: {
    room40: "Odtworzony zegar otwiera pętlę czasu w Pokoju 40.",
  },
  room40: {
    room44: "Przerwana pętla odsłania Próg Zapomnienia w Pokoju 44.",
  },
  room44: {
    room45: "Odzyskany pierwszy impuls wskazuje tarczę do odtworzenia w Pokoju 45.",
  },
  room45: {
    room50: "Ustawiona tarcza prowadzi do próby stabilizacji sygnału w Pokoju 50.",
  },
  room50: {
    room55: "Ustabilizowany zapis pozwala wejść w cichy sen Pokoju 55.",
  },
  room55: {
    room56: "Odnaleziony spokojny rytm otwiera drogę do Pokoju 56.",
  },
  room56: {
    room61: "Odzyskany algorytm wyznacza kolejną ścieżkę do partii szachów Profesora.",
  },
  room61: {
    room66: "Odtworzona partia prowadzi do etycznej decyzji w Pokoju 66.",
  },
  room66: {
    room76: "Decyzja o ochronie wspomnień pozwala odczytać Słownik Pamięci.",
  },
  room76: {
    room72: "Odzyskane znaczenia otwierają komunikację symbolami w Pokoju 72.",
  },
  room72: {
    room77: "Uzgodniony słownik pozwala połączyć fragmenty Ostatniego Zdania.",
  },
  room77: {
    room67: "Ostatnie zdanie przywraca słowa i prowadzi do pomieszanego słownika Pokoju 67.",
  },
  room67: {
    room78: "Uzgodnione nazwy odsłaniają nową perspektywę w Labiryncie bez Wyjścia.",
  },
  room78: {
    room83: "Odnaleziona droga prowadzi do archiwum nazwisk Profesora.",
  },
  room83: {
    room88: "Potwierdzona sygnatura otwiera bezpieczne przejście przez Krawędź Zsypu.",
  },
  room88: {
    room89: "Bezpieczny szlak prowadzi do ostatnich białych pokoi, gdzie gasnące synapsy czekają na przywrócenie.",
  },
  room89: {
    room99: "Odzyskane światła zbiegają się w Punkcie Omega — ostatnim zapisie świadomości Henry'ego.",
  },
};

function RoomMapModal({
  isAdmin,
  currentRoomNumber,
  onClose,
  onSelectRoom,
}: {
  isAdmin: boolean;
  currentRoomNumber?: number;
  onClose: () => void;
  onSelectRoom?: (levelId: LevelId) => void;
}) {
  const { language, text: localizeAttribute } = useTranslation();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="room-map-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="room-map-title"
        aria-modal="true"
        className="room-map-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="room-map-heading">
          <div>
            <p className="eyebrow"><LocalizedText translationKey="copy.41442f68" fallback={"ARCHIWUM PAMIĘCI // MAPA POŁĄCZEŃ"} /></p>
            <h2 id="room-map-title"><LocalizedText translationKey="copy.be77c00c" fallback={"LABIRYNT 99 POKOI"} /></h2>
          </div>
          <button
            aria-label={localizeAttribute("copy.9d4733dc", "Zamknij mapę pokoi")}
            className="room-map-close"
            onClick={onClose}
            type="button"
          >
            <LocalizedText translationKey="copy.9dbb32c2" fallback={"× "} /></button>
        </div>
        <p className="room-map-description">
          <LocalizedText translationKey="copy.e04387ba" fallback={"Mapa pokazuje tylko pokoje opisane w koncepcji. Wyróżnione pozycje są grywalnymi misjami; skróty synaptyczne łączą odległe strefy. "} /></p>
        {isAdmin && (
          <p className="room-map-description">
            {language === "en"
              ? "Administrator mode: select a room to open it without campaign locks."
              : "Tryb administratora: kliknij pokój, aby otworzyć go bez blokad kampanii."}
          </p>
        )}
        <div className="room-map-legend">
          <span><i className="room-map-legend-active" /> <LocalizedText translationKey="copy.a4e5eb5c" fallback={"MISJA W KAMPANII"} /></span>
          {currentRoomNumber && (
            <span><i className="room-map-legend-current" /> <LocalizedText translationKey="copy.a51250d1" fallback={"TWOJA LOKALIZACJA"} /></span>
          )}
        </div>
        <div className="room-map-sectors">
          {ROOM_MAP_SECTORS.map((sector, sectorIndex) => (
            <section className="room-map-sector" key={localizeAttribute(translationKeyFor(sector.title), sector.title)}>
              <h3>
                <LocalizedText translationKey="copy.bf981b3a" fallback={"STREFA "} />{String(sectorIndex + 1).padStart(2, "0")}{" "}
                <span><LocalizedText fallback={sector.title} /></span>
              </h3>
              <div className="room-map-grid">
                {sector.rooms.map((room) => {
                  const levelId = room.levelId;
                  const isActive = room.levelId
                    ? isLevelEnabled(room.levelId)
                    : false;
                  const isCurrent = room.roomNumbers.includes(currentRoomNumber ?? -1);
                  const classes = [
                    "room-map-cell",
                    isActive ? "is-active" : "",
                    isCurrent ? "is-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    isAdmin && levelId ? (
                      <button
                        aria-current={isCurrent ? "location" : undefined}
                        aria-label={[
                          `Pokój ${room.label}`,
                          room.title,
                          isActive ? "misja w kampanii" : "",
                          isCurrent ? "twoja lokalizacja" : "",
                          language === "en" ? "click to open room" : "kliknij, aby otworzyć pokój",
                        ]
                          .filter(Boolean)
                          .join(" — ")}
                        className={classes}
                        key={localizeAttribute(translationKeyFor(room.label), room.label)}
                        onClick={() => onSelectRoom?.(levelId)}
                        title={localizeAttribute("copy.8e3d6307", "Pokój {number} — {title}", {
                          number: room.label,
                          title: localizeAttribute(translationKeyFor(room.title), room.title),
                        })}
                        type="button"
                      >
                        <span><LocalizedText fallback={room.label} /></span>
                        <small><LocalizedText fallback={room.title} /></small>
                      </button>
                    ) : (
                      <div
                        aria-current={isCurrent ? "location" : undefined}
                        aria-label={[
                          `Pokój ${room.label}`,
                          room.title,
                          isActive ? "misja w kampanii" : "",
                          isCurrent ? "twoja lokalizacja" : "",
                        ]
                          .filter(Boolean)
                          .join(" — ")}
                        className={classes}
                        key={localizeAttribute(translationKeyFor(room.label), room.label)}
                        title={localizeAttribute("copy.8e3d6307", "Pokój {number} — {title}", {
                          number: room.label,
                          title: localizeAttribute(translationKeyFor(room.title), room.title),
                        })}
                      >
                        <span><LocalizedText fallback={room.label} /></span>
                        <small><LocalizedText fallback={room.title} /></small>
                      </div>
                    )
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

// Unoszące się w tle cyfry 1–12, które układają się w tarczę zegara.
// mode="cycle": napisy zmieniają się co kilka sekund, cyfry tworzą zegar,
// potem pojawiają się wskazówki. mode="clock": od razu gotowy zegar.
function ClockMemoryBackdrop({ mode }: { mode: "cycle" | "clock" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(mode === "clock" ? 2 : 0);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (mode !== "cycle") return;

    const ids = [
      window.setTimeout(() => setStep(1), 2600),
      window.setTimeout(() => setStep(2), 5200),
    ];

    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [mode]);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    const ctxNode = canvasNode?.getContext("2d");
    if (!canvasNode || !ctxNode) return;

    const canvas: HTMLCanvasElement = canvasNode;
    const ctx: CanvasRenderingContext2D = ctxNode;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = window.devicePixelRatio || 1;

    let w = 0;
    let h = 0;
    let raf = 0;
    let morph = stepRef.current >= 1 ? 1 : 0;
    let hands = stepRef.current >= 2 ? 1 : 0;

    const digits = Array.from({ length: 12 }, (_, i) => ({
      n: i + 1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
    }));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      digits.forEach((d) => {
        d.x = Math.random() * w;
        d.y = Math.random() * h;
        d.vx = reduce ? 0 : (Math.random() - 0.5) * 0.6;
        d.vy = reduce ? 0 : (Math.random() - 0.5) * 0.6;
        d.size = 30 + Math.random() * 30;
      });
    };

    const tick = () => {
      morph += ((stepRef.current >= 1 ? 1 : 0) - morph) * (reduce ? 1 : 0.035);
      hands += ((stepRef.current >= 2 ? 1 : 0) - hands) * (reduce ? 1 : 0.06);

      ctx.clearRect(0, 0, w, h);

      const radius = Math.min(w, h) * 0.34;
      const cx = w / 2;
      const cy = h * 0.5;
      const e =
        morph < 0.5
          ? 2 * morph * morph
          : 1 - Math.pow(-2 * morph + 2, 2) / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#55ff9a";

      digits.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -40) d.x = w + 40;
        if (d.x > w + 40) d.x = -40;
        if (d.y < -40) d.y = h + 40;
        if (d.y > h + 40) d.y = -40;

        const angle = (d.n / 12) * Math.PI * 2 - Math.PI / 2;
        const tx = cx + Math.cos(angle) * radius;
        const ty = cy + Math.sin(angle) * radius;

        ctx.globalAlpha = 0.25 + 0.4 * e;
        ctx.font = `${d.size + (26 - d.size) * e}px "Courier New", monospace`;
        ctx.fillText(String(d.n), d.x + (tx - d.x) * e, d.y + (ty - d.y) * e);
      });

      if (hands > 0.02) {
        ctx.strokeStyle = "#e5c47b";
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.7 * hands;

        const drawHand = (deg: number, length: number, width: number) => {
          const a = ((deg - 90) * Math.PI) / 180;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(
            cx + Math.cos(a) * length * hands,
            cy + Math.sin(a) * length * hands,
          );
          ctx.stroke();
        };

        drawHand(305, radius * 0.55, 5);
        drawHand(60, radius * 0.8, 3);
      }

      ctx.globalAlpha = 1;
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="memory-backdrop" aria-hidden="true" />
      {mode === "cycle" && (
        <p className="memory-words" aria-live="polite">
          {MEMORY_WORDS[step]}
        </p>
      )}
    </>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function AppContent() {
  const { text: localizeAttribute } = useTranslation();
  const { error: translationError, language, setLanguage } = useTranslation();
  const [screen, setScreen] = useState<Screen>("lobby");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [passwordResetLink, setPasswordResetLink] = useState<PasswordResetLink | null>(() => {
    const parameters = new URLSearchParams(window.location.hash.slice(1));
    const email = parameters.get("resetEmail");
    const code = parameters.get("resetCode");
    return email && code ? { email, code } : null;
  });
  const [completedLevelId, setCompletedLevelId] = useState<LevelId>("room01");
  const [ethicalChoice, setEthicalChoice] = useState<"privacy" | "research" | null>(null);
  const [finalDecision, setFinalDecision] = useState<"privacy" | "research" | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [roomMapOpen, setRoomMapOpen] = useState(false);
  const [backendWarming, setBackendWarming] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");
  const [storyCatalog, setStoryCatalog] = useState<StoryCatalogItem[] | null>(null);
  const [storyCatalogError, setStoryCatalogError] = useState("");
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [storyProgress, setStoryProgress] = useState<StoryProgress | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchStories(language, controller.signal)
      .then((stories) => {
        setStoryCatalog(stories);
        setStoryCatalogError("");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStoryCatalog(null);
        setStoryCatalogError(
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać scenariuszy.",
        );
      });

    return () => controller.abort();
  }, [language]);

  const selectedStory =
    storyCatalog?.find((story) => story.id === selectedStoryId) ?? storyCatalog?.[0];
  const storyLevels: StoryLevel[] = (selectedStory?.rooms ?? [])
    .map((room) => {
      const definition = LEVELS.find((level) => level.id === room.key);
      if (!definition || !definition.enabled) return undefined;
      const title = room.contents.find((content) => content.contentKey === "title")?.text;
      const description = room.contents.find(
        (content) => content.contentKey === "description",
      )?.text;
      return {
        ...definition,
        number: room.order,
        order: room.order,
        roomNumber: room.roomNumber,
        title: title ?? definition.title,
        description: description ?? definition.description,
      };
    })
    .filter((level): level is StoryLevel => level !== undefined)
    .sort((left, right) => left.order - right.order);
  const hasUnsupportedRooms = (selectedStory?.rooms ?? []).some(
    (room) => !LEVELS.some((level) => level.id === room.key),
  );
  const activeLevelCount = storyLevels.length;
  const firstEnabledLevel = storyLevels[0];
  const completedLevelIndex = storyLevels.findIndex(
    (level) => level.id === completedLevelId,
  );
  const nextEnabledLevel =
    completedLevelIndex >= 0 ? storyLevels[completedLevelIndex + 1] : undefined;
  const progressRoom = storyProgress?.currentStoryRoomId
    ? selectedStory?.rooms.find(
        (room) => room.id === storyProgress.currentStoryRoomId,
      )
    : undefined;
  const progressLevel = storyLevels.find((level) => level.id === progressRoom?.key);
  const resumeLevel = progressLevel
    ? storyProgress?.completedAt
      ? progressLevel
      : storyLevels.find((level) => level.order > progressLevel.order) ?? progressLevel
    : firstEnabledLevel;
  const activeMissionLabel =
    activeLevelCount === 1
      ? "aktywna misja"
      : activeLevelCount >= 2 && activeLevelCount <= 4
        ? "aktywne misje"
        : "aktywnych misji";
  const activeLevelDescription = activeLevelPhrase(activeLevelCount);
  const level2 = useRoom34({
    active: screen === "level2",
    onBegin: () => setScreen("level2"),
    onComplete: () => {
      void continueAfterLevel(
        "room34",
        "clock-reconstruction-complete",
        "success",
      );
    },
    onFailure: () => setScreen("failed"),
  });
  const {
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
    beginMission: beginClockMission,
    checkClock,
    answerTime,
  } = level2;
  const currentLevelId =
    screen === "level1"
      ? "room01"
      : screen === "level2intro" || screen === "level2"
        ? "room34"
        : screen === "level3intro"
          ? "room56"
          : LEVELS.find((level) => level.id === screen)?.id ??
            (screen === "transition" || screen === "success" || screen === "failed"
              ? completedLevelId
              : undefined);
  const currentRoomNumber = storyLevels.find(
    (level) => level.id === currentLevelId,
  )?.roomNumber;

    useEffect(() => {
      let active = true;
      void fetch("/api/auth/me", { credentials: "include" })
        .then(async (response) => {
          if (!active) return;
          if (response.status === 401) {
            setUserEmail(null);
            return;
          }
          if (!response.ok) {
            throw new Error(await getApiError(response));
          }
          const user = await getAuthenticatedUser(response);
          setUserEmail(user.displayName);
          setUserIsAdmin(user.isAdmin);
        })
        .catch((error: unknown) => {
          if (active) {
            setUserEmail(null);
            setUserIsAdmin(false);
            setAuthNotice(error instanceof Error
              ? error.message
              : "Nie można połączyć się z serwerem logowania. Sprawdź, czy aplikacja działa.");
          }
        })
        .finally(() => {
          if (active) setAuthChecked(true);
        });

      return () => {
        active = false;
      };
    }, []);

    useEffect(() => {
      if (!authChecked || !userEmail || !voiceEnabled) {
        stopPolishAudio();
        return;
    }

    switch (screen) {
      case "lobby":
        stopPolishAudio();
        break;

      case "intro":
        playPolishAudio(archiveIntroNarrationFiles(activeLevelCount));
        break;

      case "level1":
        playPolishAudio(["/audio/narration/room01-intro.mp3"]);
        break;

      case "room05":
        playPolishAudio(["/audio/narration/room05-intro.mp3"]);
        break;

      case "room11":
        playPolishAudio(["/audio/narration/room11-intro.mp3"]);
        break;

      case "room12":
        playPolishAudio(["/audio/narration/room12-intro.mp3"]);
        break;

      case "room17":
        playPolishAudio(["/audio/narration/room17-intro.mp3"]);
        break;

      case "room22":
        playPolishAudio(["/audio/narration/room22-intro.mp3"]);
        break;

      case "room23":
        playPolishAudio(["/audio/narration/room23-intro.mp3"]);
        break;

      case "room27":
        playPolishAudio(["/audio/narration/room27-intro.mp3"]);
        break;

      case "room33":
        playPolishAudio(["/audio/narration/room33-intro.mp3"]);
        break;

      case "room40":
        playPolishAudio(["/audio/narration/room40-intro.mp3"]);
        break;

      case "room44":
        playPolishAudio(["/audio/narration/room44-intro.mp3"]);
        break;

      case "room45":
        playPolishAudio(["/audio/narration/room45-intro.mp3"]);
        break;

      case "room50":
        playPolishAudio(["/audio/narration/room50-intro.mp3"]);
        break;

      case "room55":
        playPolishAudio(["/audio/narration/room55-intro.mp3"]);
        break;

      case "room61":
        playPolishAudio(["/audio/narration/room61-intro.mp3"]);
        break;

      case "room66":
        playPolishAudio(["/audio/narration/room66-intro.mp3"]);
        break;

      case "room76":
        playPolishAudio(["/audio/narration/room76-intro.mp3"]);
        break;

      case "room72":
        playPolishAudio(["/audio/narration/room72-intro.mp3"]);
        break;

      case "room77":
        playPolishAudio(["/audio/narration/room77-intro.mp3"]);
        break;

      case "room67":
        playPolishAudio(["/audio/narration/room67-intro.mp3"]);
        break;

      case "room78":
        playPolishAudio(["/audio/narration/room78-intro.mp3"]);
        break;

      case "room83":
        playPolishAudio(["/audio/narration/room83-intro.mp3"]);
        break;

      case "room88":
        playPolishAudio(["/audio/narration/room88-intro.mp3"]);
        break;

      case "room89":
        playPolishAudio(["/audio/narration/room89-intro.mp3"]);
        break;

      case "room99":
        playPolishAudio(["/audio/narration/room99-intro.mp3"]);
        break;

      case "level2intro":
        playPolishAudio(["/audio/narration/room34-intro.mp3"]);
        break;

      case "level3intro":
        break;

      default:
        stopPolishAudio();
        break;
    }

    return () => {
      stopPolishAudio();
    };
  }, [screen, voiceEnabled, activeLevelDescription, activeLevelCount, authChecked, userEmail]);

  async function warmBackendAndStart() {
    if (backendWarming) return;

    setBackendWarming(true);
    setBackendMessage(localizeAttribute("copy.9056d45f", "INICJALIZACJA SYSTEMU..."));

    let lastError = "";

    try {
      for (let attempt = 1; attempt <= 5; attempt++) {
        setBackendMessage(
          attempt === 1
            ? "ŁĄCZENIE Z ARCHIWUM..."
            : `PONAWIAM POŁĄCZENIE... PRÓBA ${attempt}/5`
        );

        const controller = new AbortController();
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          2500
        );

        try {
          const response = await fetch("/api/puzzles/first", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Backend odpowiedział kodem ${response.status}.`);
          }

          // Sprawdźmy, czy odpowiedź jest prawidłowym JSON-em.
          await response.json();

          setBackendMessage(localizeAttribute("copy.41760c1a", "SYSTEM GOTOWY. OTWIERAM PIERWSZĄ MISJĘ..."));
          startLevel1();
          return;
        } catch (error) {
          lastError =
            error instanceof Error
              ? error.message
              : "Nieznany błąd połączenia.";
        } finally {
          window.clearTimeout(timeoutId);
        }

        if (attempt < 5) {
          await new Promise((resolve) => window.setTimeout(resolve, 900));
        }
      }

      setBackendMessage(
        "NIE UDAŁO SIĘ POŁĄCZYĆ Z BACKENDEM. " +
        "Sprawdź połączenie i spróbuj ponownie. " +
        lastError
      );
    } finally {
      setBackendWarming(false);
    }
  }

  function startLevel1() {
    if (!isLevelEnabled("room01") || !storyLevels.some((level) => level.id === "room01")) return;
    setScreen("level1");
  }

  function startLevelById(levelId: LevelId, adminMapAccess = false) {
    const canSkipCampaignLocks = adminMapAccess && userIsAdmin;
    if (
      !LEVELS.some((level) => level.id === levelId) ||
      (!canSkipCampaignLocks &&
        (!isLevelEnabled(levelId) || !storyLevels.some((level) => level.id === levelId)))
    ) return;

    switch (levelId) {
      case "room01":
        void warmBackendAndStart();
        break;
      case "room34":
        startLevel2(canSkipCampaignLocks);
        break;
      case "room56":
        startLevel3(canSkipCampaignLocks);
        break;
      case "room05":
        setScreen("room05");
        break;
      case "room11":
        setScreen("room11");
        break;
      case "room12":
        setScreen("room12");
        break;
      case "room17":
        setScreen("room17");
        break;
      case "room22":
        setScreen("room22");
        break;
      case "room23":
        setScreen("room23");
        break;
      case "room27":
        setScreen("room27");
        break;
      case "room33":
        setScreen("room33");
        break;
      case "room40":
        setScreen("room40");
        break;
      case "room44":
        setScreen("room44");
        break;
      case "room45":
        setScreen("room45");
        break;
      case "room50":
        setScreen("room50");
        break;
      case "room55":
        setScreen("room55");
        break;
      case "room61":
        setScreen("room61");
        break;
      case "room66":
        setScreen("room66");
        break;
      case "room76":
        setScreen("room76");
        break;
      case "room72":
        setScreen("room72");
        break;
      case "room77":
        setScreen("room77");
        break;
      case "room67":
        setScreen("room67");
        break;
      case "room78":
        setScreen("room78");
        break;
      case "room83":
        setScreen("room83");
        break;
      case "room88":
        setScreen("room88");
        break;
      case "room89":
        setScreen("room89");
        break;
      case "room99":
        setScreen("room99");
        break;
    }
  }

  function startFirstEnabledLevel() {
    if (!resumeLevel) return;
    if (resumeLevel.id === "room01") {
      void warmBackendAndStart();
      return;
    }
    startLevelById(resumeLevel.id);
  }

  function startNextEnabledLevel() {
    if (!nextEnabledLevel) return;
    startLevelById(nextEnabledLevel.id);
  }

  async function continueAfterLevel(
    levelId: LevelId,
    proof?: string,
    destination: Screen = "transition",
  ) {
    if (!selectedStoryId) {
      setAuthNotice("Nie można zapisać postępu bez wybranego scenariusza.");
      return;
    }

    setAuthNotice("");
    try {
      const puzzleInstanceId = `${selectedStoryId}:${levelId}:puzzle01`;
      if (levelId !== "room01") {
        if (proof === undefined) {
          throw new Error("Brak potwierdzenia rozwiązania zagadki.");
        }
        const valid = await submitPuzzleAnswer(puzzleInstanceId, proof);
        if (!valid) {
          setAuthNotice("Serwer nie potwierdził rozwiązania. Spróbuj ponownie.");
          return;
        }
      }

      const progress = await fetchStoryProgress(
        selectedStoryId,
        new AbortController().signal,
      );
      if (!progress.completedPuzzleInstanceIds.includes(puzzleInstanceId)) {
        setAuthNotice("Serwer nie zapisał postępu tej zagadki.");
        return;
      }

      setStoryProgress(progress);
      setCompletedLevelId(levelId);
      setScreen(destination);
    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Nie udało się potwierdzić ani zapisać postępu zagadki.",
      );
    }
  }

  function continueAfterEthicalChoice(choice: "privacy" | "research") {
    setEthicalChoice(choice);
    void continueAfterLevel("room66", choice);
  }

  function startLevel2(adminMapAccess = false) {
    if (
      !adminMapAccess &&
      (!isLevelEnabled("room34") || !storyLevels.some((level) => level.id === "room34"))
    ) return;
    level2.reset();
    setScreen("level2intro");
  }

  function startLevel3(adminMapAccess = false) {
    if (
      !adminMapAccess &&
      (!isLevelEnabled("room56") || !storyLevels.some((level) => level.id === "room56"))
    ) return;
    setScreen("level3intro");
  }

  async function chooseStory(story: StoryCatalogItem) {
    const firstRoom = [...story.rooms].sort((left, right) => left.order - right.order)[0];
    const firstLevel = LEVELS.find((level) => level.id === firstRoom?.key);
    if (!firstRoom || !firstLevel || !firstLevel.enabled) return;

    setAuthNotice("");
    try {
      const progress = await fetchStoryProgress(
        story.id,
        new AbortController().signal,
      );
      const currentRoom = story.rooms.find(
        (room) => room.id === progress.currentStoryRoomId,
      );
      const currentLevel = LEVELS.find((level) => level.id === currentRoom?.key);
      setStoryProgress(progress);
      setSelectedStoryId(story.id);
      setCompletedLevelId(currentLevel?.id ?? firstLevel.id);
      setEthicalChoice(null);
      setFinalDecision(null);
      setRoomMapOpen(false);
      setScreen("intro");
    } catch (error) {
      setAuthNotice(
        error instanceof Error
          ? error.message
          : "Nie udało się pobrać postępu scenariusza.",
      );
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        setAuthNotice(await getApiError(response));
        return;
      }
      setUserEmail(null);
      setUserIsAdmin(false);
      setAuthNotice("");
      setRoomMapOpen(false);
      setScreen("lobby");
    } catch {
      setAuthNotice(localizeAttribute("copy.f516ed10", "Nie udało się wylogować. Sprawdź połączenie z serwerem."));
    }
  }

  if (passwordResetLink) {
    return (
      <PasswordResetScreen
        resetLink={passwordResetLink}
        onComplete={() => {
          setPasswordResetLink(null);
          setUserEmail(null);
          setUserIsAdmin(false);
          setAuthNotice("");
        }}
      />
    );
  }

  if (!authChecked) {
    return (
      <main className="game-shell">
        <MatrixRain />
        <p className="auth-loading" role="status"><LocalizedText translationKey="copy.51bc0105" fallback={"ŁĄCZENIE Z LABORATORIUM..."} /></p>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <LoginScreen
        initialError={authNotice}
        onAuthenticated={(user) => {
          setUserEmail(user.displayName);
          setUserIsAdmin(user.isAdmin);
          setAuthNotice("");
          setScreen("lobby");
        }}
      />
    );
  }

  return (
    <main className="game-shell">
      <MatrixRain speed={screen === "level1" ? 1.7 : 0.7} />

      <header className="game-header">
        <div className="brand">
          <span className="brand-mark"><LocalizedText translationKey="copy.1d4075e7" fallback={"⌘"} /></span>
          <span><LocalizedText translationKey="copy.a1be99c2" fallback={"LABORATORIUM "} /><span className="accent"><LocalizedText translationKey="copy.39dcb3b2" fallback={"PROFESORA"} /></span></span>
        </div>
        <div className="header-controls">
          <BackendConnectionStatus />
          <button
            aria-label={language === "pl" ? "Switch language to English" : "Zmień język na polski"}
            className="language-toggle"
            onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
            type="button"
          >
            {language === "pl" ? "EN" : "PL"}
          </button>
          <span className="account-email" title={userEmail}>{userEmail}</span>
          {screen !== "lobby" && (
            <button
              className="room-map-toggle"
              onClick={() => {
                setRoomMapOpen(false);
                setScreen("lobby");
              }}
              type="button"
            >
              <LocalizedText translationKey="copy.2d6aef44" fallback={"WYBÓR GRY "} /></button>
          )}
          {userIsAdmin && (
            <button
              className="room-map-toggle"
              onClick={() => {
                setRoomMapOpen(false);
                setScreen("admin");
              }}
              type="button"
            >
              {language === "en" ? "ADMIN PANEL" : "PANEL ADMINA"}
            </button>
          )}
          {screen !== "lobby" && (
            <button
              aria-haspopup="dialog"
              className="room-map-toggle"
              onClick={() => setRoomMapOpen(true)}
              type="button"
            >
              <LocalizedText translationKey="copy.daebca4c" fallback={"⌖ MAPA POKOI "} /></button>
          )}
          <button
            type="button"
            className="voice-toggle"
            onClick={() => setVoiceEnabled((enabled) => !enabled)}
            aria-label={voiceEnabled ? "Wyłącz głos" : "Włącz głos"}
            aria-pressed={voiceEnabled}
          >
            {voiceEnabled ? <LocalizedText translationKey="copy.22902847" fallback={"🔇 WYŁĄCZ GŁOS"} /> : <LocalizedText translationKey="copy.dc79d50b" fallback={"🔊 WŁĄCZ GŁOS"} />}
          </button>
          <button className="room-map-toggle" onClick={() => void logout()} type="button">
            <LocalizedText translationKey="copy.8ff21c7e" fallback={"WYLOGUJ "} /></button>
        </div>
      </header>

      {roomMapOpen && (
        <RoomMapModal
          isAdmin={userIsAdmin}
          currentRoomNumber={currentRoomNumber}
          onClose={() => setRoomMapOpen(false)}
          onSelectRoom={userIsAdmin
            ? (levelId) => {
                setRoomMapOpen(false);
                startLevelById(levelId, true);
              }
            : undefined}
        />
      )}

      {(authNotice || translationError || storyCatalogError || hasUnsupportedRooms) && (
        <p className="auth-global-message" role="alert">
          {authNotice ||
            (translationError && `Nie udało się pobrać tekstów z bazy: ${translationError}`) ||
            storyCatalogError ||
            "Scenariusz zawiera pokój, którego mechaniki nie obsługuje ta wersja aplikacji."}
        </p>
      )}

      {screen === "lobby" && (
        <section className="screen lobby-screen">
          <div className="eyebrow"><LocalizedText translationKey="copy.d73d6f32" fallback={"PANEL WYBORU ESCAPE ROOMU"} /></div>
          <h1>
            <LocalizedText translationKey="copy.a1be99c2" fallback={"LABORATORIUM "} /><br />
            <span className="accent"><LocalizedText translationKey="copy.39dcb3b2" fallback={"PROFESORA"} /></span>
          </h1>
          <p className="lead">
            <LocalizedText translationKey="copy.cbaecf20" fallback={"Witaj, "} />{userEmail}<LocalizedText translationKey="copy.a923e98b" fallback={". Wybierz archiwum i rozpocznij swoją wyprawę. "} /></p>
          <div className="escape-room-list">
            {storyCatalog?.map((story) => {
              const supportedRoomCount = story.rooms.filter((room) =>
                LEVELS.some((level) => level.id === room.key && level.enabled),
              ).length;
              const unsupported = supportedRoomCount !== story.rooms.length;

              return (
                <article className="escape-room-card" key={story.id}>
                  <div className="escape-room-art" aria-hidden="true">
                    <span><LocalizedText translationKey="copy.ac0d6404" fallback={"Ω"} /></span>
                    <i />
                  </div>
                  <div className="escape-room-copy">
                    <div className="eyebrow">
                      {localizeAttribute(
                        "story.availableCount",
                        language === "en"
                          ? "AVAILABLE STORIES · {count}"
                          : "DOSTĘPNE SCENARIUSZE · {count}",
                        { count: storyCatalog.length },
                      )}

                    </div>
                    <h2>{story.name}</h2>
                    <p>{story.description}</p>
                    <div className="escape-room-meta">
                      <span>{supportedRoomCount} <LocalizedText translationKey="copy.d77a511f" fallback={"AKTYWNYCH MISJI"} /></span>
                      <span><LocalizedText translationKey="copy.b8cbf324" fallback={"JĄDRO ŚWIADOMOŚCI"} /></span>
                    </div>
                    <button
                      className="primary-button"
                      disabled={unsupported || supportedRoomCount === 0}
                      onClick={() => chooseStory(story)}
                      type="button"
                    >
                      <LocalizedText translationKey="copy.66e56804" fallback={"WYBIERZ LABIRYNT "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
                    </button>
                  </div>
                </article>
              );
            })}
            {storyCatalog === null && !storyCatalogError && (
              <p className="auth-loading" role="status">ŁADOWANIE SCENARIUSZY…</p>
            )}
            {storyCatalog?.length === 0 && (
              <p className="feedback" role="status">Brak opublikowanych scenariuszy.</p>
            )}
          </div>
        </section>
      )}

      {screen === "admin" && userIsAdmin && (
        <AdminPanel
          language={language}
          onBack={() => setScreen("lobby")}
        />
      )}

      {screen === "intro" && (
        <section className="screen intro-screen">
          <div className="eyebrow">
            <LocalizedText translationKey="copy.cd80da87" fallback={"SYSTEM ZAGADEK // 001 / "} />{activeLevelCount}{" "}
            {activeMissionLabel.toLocaleUpperCase("pl-PL")}
          </div>
          <h1>
            <LocalizedText translationKey="copy.79decb85" fallback={"KAŻDY KOD "} /><br />
            <span className="accent"><LocalizedText translationKey="copy.2fe1ead1" fallback={"MA SWOJĄ TAJEMNICĘ."} /></span>
          </h1>
          <p className="lead">
            <LocalizedText translationKey="copy.d0d9e2bc" fallback={"Jesteś zamknięty w systemie. Odszyfruj wiadomość, znajdź wyjście i odkryj, co czeka za kolejnymi drzwiami. "} /></p>

          <div className="intro-story">
            <p>
              <strong>
                <LocalizedText translationKey="copy.3affcfd5" fallback={"ARCHIWUM "} />{activeLevelCount} <LocalizedText translationKey="copy.8492a839" fallback={"// WIADOMOŚĆ ODEBRANA "} /></strong>
            </p>
            <p>
              <LocalizedText translationKey="copy.86a5a793" fallback={"Witaj, naprawczy impulsie. Jesteś wewnątrz Labiryntu 99 Pokoi — archiwum pamięci stworzonego przez profesora Henry'ego Armitage'a. Zachowane zapisy są niekompletne, a połączenia między nimi zaczynają zanikać. "} /></p>
            <p>
              <LocalizedText translationKey="copy.2c30f5c0" fallback={"Wraz ze swoim zespołem przywracaj sygnały i łącz ślady z różnych stref. Każdy pokój przechowuje fragment życia, pracy lub wspomnień Profesora — nie traktuj ich jak błędów do wymazania. "} /></p>
            <p>
              <LocalizedText translationKey="copy.408b526a" fallback={"Przed tobą "} /><strong>{activeLevelDescription}</strong><LocalizedText translationKey="copy.f2792005" fallback={". To odzyskane węzły większej mapy; niektóre sektory łączą skróty synaptyczne. Ostateczny cel znajduje się w Pokoju 99: zabezpieczyć ukryte badania i zdecydować, jak uszanować prywatność ich autora. "} /></p>
            <p>
              <LocalizedText translationKey="copy.dee4a42e" fallback={"Choroba nie jest przeciwnikiem tej historii. Liczą się uważność, współpraca i empatia — wobec siebie nawzajem oraz wobec człowieka, którego ślady odtwarzacie. "} /></p>
            <p>
              <LocalizedText translationKey="copy.aa1e5071" fallback={"W ostatnim zachowanym pliku Profesor zapisał: "} /><strong> <LocalizedText translationKey="copy.7b38861b" fallback={"„Nie ufaj pierwszej odpowiedzi”."} /></strong>
            </p>
          </div>

          <div className="active-level-counter" aria-live="polite">
            <span><LocalizedText translationKey="copy.dde775c1" fallback={"AKTYWNE POZIOMY"} /></span>
            <strong>{activeLevelCount}</strong>
            <span><LocalizedText translationKey="copy.801abc60" fallback={"W REJESTRZE KAMPANII"} /></span>
          </div>

          {firstEnabledLevel ? (
            <div className="mission-card">
              <div className="mission-number">
                {String(firstEnabledLevel.number).padStart(2, "0")}
              </div>
              <div>
                <div className="eyebrow"><LocalizedText translationKey="copy.7619e99b" fallback={"PIERWSZA DOSTĘPNA MISJA"} /></div>
                <h2><LocalizedText fallback={firstEnabledLevel.title} /></h2>
                <p><LocalizedText fallback={firstEnabledLevel.description} /></p>
              </div>
              <span className="mission-lock"><LocalizedText translationKey="copy.de2d29a1" fallback={"🔓"} /></span>
            </div>
          ) : (
            <p className="feedback" role="status">
              <LocalizedText translationKey="copy.f6346058" fallback={"Brak aktywnych poziomów. Włącz przynajmniej jeden poziom w rejestrze. "} /></p>
          )}

          <button
            className="primary-button"
            onClick={startFirstEnabledLevel}
            disabled={backendWarming || !firstEnabledLevel}
          >
            {backendWarming ? <LocalizedText translationKey="copy.2903c9fc" fallback={"URUCHAMIAM SYSTEM..."} /> : <LocalizedText translationKey="copy.2a049ae0" fallback={"ROZPOCZNIJ MISJĘ"} />}
            {!backendWarming && <span> <LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!voiceEnabled}
            onClick={() =>
              playPolishAudio(archiveIntroNarrationFiles(activeLevelCount))
            }
          >
            <LocalizedText translationKey="copy.c3cb90fa" fallback={"▶ ODTWÓRZ LEKTORA "} /></button>
          <p className="small-note" role="status" aria-live="polite">
            {backendMessage ||
              (firstEnabledLevel
                ? localizeAttribute("copy.8315ef2a", "MISJA {number} // {title}", {
                    number: String(firstEnabledLevel.number).padStart(2, "0"),
                    title: localizeAttribute(
                      translationKeyFor(firstEnabledLevel.title),
                      firstEnabledLevel.title,
                    ).toLocaleUpperCase(language === "pl" ? "pl-PL" : "en-US"),
                  })
                : localizeAttribute("copy.7921e115", "BRAK AKTYWNYCH MISJI"))}
          </p>
        </section>
      )}

      {screen === "level1" && (
        <Room01 onComplete={() => continueAfterLevel("room01")} />
      )}

      {screen === "room05" && (
        <Room05         onComplete={(proof) => void continueAfterLevel("room05", proof)} />
      )}

      {screen === "room11" && (
        <Room11         onComplete={(proof) => void continueAfterLevel("room11", proof)} />
      )}

      {screen === "room12" && (
        <Room12         onComplete={(proof) => void continueAfterLevel("room12", proof)} />
      )}

      {screen === "room17" && (
        <Room17
          onComplete={(proof) => void continueAfterLevel("room17", proof)}
          voiceEnabled={voiceEnabled}
        />
      )}

      {screen === "room22" && (
        <Room22         onComplete={(proof) => void continueAfterLevel("room22", proof)} />
      )}

      {screen === "room23" && (
        <Room23         onComplete={(proof) => void continueAfterLevel("room23", proof)} />
      )}

      {screen === "room27" && (
        <Room27         onComplete={(proof) => void continueAfterLevel("room27", proof)} />
      )}

      {screen === "room33" && (
        <Room33         onComplete={(proof) => void continueAfterLevel("room33", proof)} />
      )}

      {screen === "room40" && (
        <Room40         onComplete={(proof) => void continueAfterLevel("room40", proof)} />
      )}

      {screen === "room44" && (
        <Room44         onComplete={(proof) => void continueAfterLevel("room44", proof)} />
      )}

      {screen === "room45" && (
        <Room45         onComplete={(proof) => void continueAfterLevel("room45", proof)} />
      )}

      {screen === "room50" && (
        <Room50         onComplete={(proof) => void continueAfterLevel("room50", proof)} />
      )}

      {screen === "room55" && (
        <Room55         onComplete={(proof) => void continueAfterLevel("room55", proof)} />
      )}

      {screen === "room61" && (
        <Room61         onComplete={(proof) => void continueAfterLevel("room61", proof)} />
      )}

      {screen === "room66" && (
        <Room66         onComplete={(choice) => continueAfterEthicalChoice(choice)} />
      )}

      {screen === "room76" && (
        <Room76         onComplete={(proof) => void continueAfterLevel("room76", proof)} />
      )}

      {screen === "room72" && (
        <Room72         onComplete={(proof) => void continueAfterLevel("room72", proof)} />
      )}

      {screen === "room77" && (
        <Room77         onComplete={(proof) => void continueAfterLevel("room77", proof)} />
      )}

      {screen === "room67" && (
        <Room67         onComplete={(proof) => void continueAfterLevel("room67", proof)} />
      )}

      {screen === "room78" && (
        <Room78         onComplete={(proof) => void continueAfterLevel("room78", proof)} />
      )}

      {screen === "room83" && (
        <Room83         onComplete={(proof) => void continueAfterLevel("room83", proof)} />
      )}

      {screen === "room88" && (
        <Room88         onComplete={(proof) => void continueAfterLevel("room88", proof)} />
      )}

      {screen === "room89" && (
        <Room89         onComplete={(proof) => void continueAfterLevel("room89", proof)} />
      )}

      {screen === "room99" && (
        <Room99
          onComplete={(choice) => {
            setFinalDecision(choice);
            void continueAfterLevel("room99", choice);
          }}
        />
      )}

      {screen === "transition" && (
        <section className="screen story-screen">
          <div className="success-icon"><LocalizedText translationKey="copy.163a1ee2" fallback={"✓"} /></div>
          <div className="eyebrow">
            <LocalizedText translationKey="copy.b843a487" fallback={"MISJA "} />{String(storyLevels.find((level) => level.id === completedLevelId)?.number ?? 0).padStart(2, "0")} <LocalizedText translationKey="copy.ed49ce86" fallback={"// ZAKOŃCZONA "} /></div>
          <h1>
            {nextEnabledLevel ? <LocalizedText translationKey="copy.d2ea6b3b" fallback={"KOLEJNE DRZWI"} /> : <LocalizedText translationKey="copy.a350ce15" fallback={"KAMPANIA"} />}
            <br />
            <span className="accent">{nextEnabledLevel ? <LocalizedText translationKey="copy.42be077c" fallback={"SĄ OTWARTE."} /> : <LocalizedText translationKey="copy.4e930fc8" fallback={"ZAKOŃCZONA."} />}</span>
          </h1>
          <p className="story-quote">
            {nextEnabledLevel
              ? <LocalizedText translationKey="copy.0dc5f01b" fallback={"Impuls odnajduje połączenie. Przed tobą kolejny odzyskany węzeł."} />
              : completedLevelId === "room99" && finalDecision === "privacy"
                ? <LocalizedText translationKey="copy.57051d54" fallback={"Archiwum osobistych wspomnień Henry'ego zostało zamknięte. Pozostał anonimowy ślad jego badań."} />
                : completedLevelId === "room99" && finalDecision === "research"
                  ? <LocalizedText translationKey="copy.a749f36c" fallback={"Pełne badania Henry'ego zostały zabezpieczone. Ich przyszłość będzie wymagała odpowiedzialności."} />
                  : <LocalizedText translationKey="copy.4fa32bfb" fallback={"Przywróciłeś wszystkie dostępne połączenia archiwum."} />}
          </p>
          {nextEnabledLevel && (
            <>
              <p className="lead">
                {completedLevelId === "room66" && ethicalChoice === "privacy"
                  ? <LocalizedText translationKey="copy.94e709fa" fallback={"Wybrano ochronę prywatności. Osobiste zapisy pozostają zamknięte; w Pokoju 76 pracujecie wyłącznie na anonimowych znaczeniach."} />
                  : completedLevelId === "room66" && ethicalChoice === "research"
                    ? <LocalizedText translationKey="copy.439eda3a" fallback={"Wybrano zachowanie badań z ograniczonym dostępem i udokumentowaną zgodą. W Pokoju 76 archiwum przechodzi do odzyskiwania znaczeń."} />
                    : ROOM_TRANSITIONS[completedLevelId]?.[nextEnabledLevel.id] ??
                      <LocalizedText translationKey="copy.0f89a2c9" fallback={"Przed tobą kolejny odzyskany węzeł archiwum."} />}
              </p>
              <div className="mission-card unlocked">
                <div className="mission-number">
                  {String(nextEnabledLevel.number).padStart(2, "0")}
                </div>
                <div>
                  <div className="eyebrow"><LocalizedText translationKey="copy.6afa9d24" fallback={"NASTĘPNA MISJA"} /></div>
                  <h2><LocalizedText fallback={nextEnabledLevel.title} /></h2>
                  <p><LocalizedText fallback={nextEnabledLevel.description} /></p>
                </div>
                <span className="mission-lock"><LocalizedText translationKey="copy.de2d29a1" fallback={"🔓"} /></span>
              </div>
              <button className="primary-button" onClick={startNextEnabledLevel}>
                <LocalizedText translationKey="copy.c4f27c1b" fallback={"PRZEJDŹ DO LEVELU "} />{nextEnabledLevel.number} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
              </button>
            </>
          )}
          {!nextEnabledLevel && (
            <>
              {completedLevelId === "room99" && (
                <p className="lead">
                  <LocalizedText translationKey="copy.72548b71" fallback={"Labirynt 99 Pokoi dobiegł końca. Wasza decyzja pozostaje częścią zakończenia — żadna z dróg nie jest oceniana jako błędna. "} /></p>
              )}
              <button className="primary-button" onClick={() => setScreen("intro")}>
                <LocalizedText translationKey="copy.0e2c2227" fallback={"WRÓĆ DO MENU "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
              </button>
            </>
          )}
          {isLevelEnabled(completedLevelId) && (
            <button
              className="text-button"
              onClick={() => startLevelById(completedLevelId)}
            >
              <LocalizedText translationKey="copy.600e19f5" fallback={"↻ Powtórz Level "} />{storyLevels.find((level) => level.id === completedLevelId)?.number}
            </button>
          )}
        </section>
      )}

      {screen === "level2intro" && (
        <section className="screen story-screen">
          <ClockMemoryBackdrop mode="cycle" />
          <div className="eyebrow"><LocalizedText translationKey="copy.fc037441" fallback={"POKÓJ 34 / HIPOKAMP"} /></div>
          <h1>
            <LocalizedText translationKey="copy.8dac9ea8" fallback={"ZATRZYMANA "} /><br />
            <span className="accent"><LocalizedText translationKey="copy.b6675d7d" fallback={"WSKAZÓWKA"} /></span>
          </h1>

          <p className="story-quote">
            <LocalizedText translationKey="copy.8b9d56c4" fallback={"„Jeśli układ się rozsypie, zacznij od jednej chwili.” "} /></p>

          <div
            className="mission-art clock-mission-art"
            role="img"
            aria-label={localizeAttribute("copy.2f46318a", "Animowana tarcza starego zegara z poruszającymi się wskazówkami i cyframi.")}
          >
            <div className="mission-art-heading">
              <span className="logic-led is-on" />
              <LocalizedText translationKey="copy.d81bcd1d" fallback={"POKÓJ 34 // REKONSTRUKCJA ZEGARA "} /></div>
            <div className="clock-art-face" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => {
                const angle = index * 30;
                const radius = 76;
                const x = 50 + Math.sin((angle * Math.PI) / 180) * radius;
                const y = 50 - Math.cos((angle * Math.PI) / 180) * radius;
                return (
                  <span
                    className="clock-art-number"
                    key={index}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {index === 0 ? 12 : index}
                  </span>
                );
              })}
              <span className="clock-art-hand clock-art-hour" />
              <span className="clock-art-hand clock-art-minute" />
              <span className="clock-art-pivot" />
            </div>
            <div className="mission-art-footer">
              <span><LocalizedText translationKey="copy.ce7a017f" fallback={"WSKAZÓWKI: 2"} /></span>
              <span><LocalizedText translationKey="copy.1997a37f" fallback={"MECHANIZM: NIESTABILNY"} /></span>
              <span><LocalizedText translationKey="copy.0db5f608" fallback={"STATUS: ZATRZYMANY"} /></span>
            </div>
          </div>

          <div className="story-body">
            <p>
              <LocalizedText translationKey="copy.1bffbdb6" fallback={"Pokój 34 należy do sektora hipokampa — strefy zapisu czasu i wspomnień. W archiwum zachował się warsztat Profesora Henry'ego Armitage'a i niedokończona rekonstrukcja jego zegara. "} /></p>
            <p>
              <LocalizedText translationKey="copy.1f4e2150" fallback={"Układ cyfr i godzin jest niepełny. Odtwórz go z zachowanych elementów, a następnie odczytaj wskazówki. To zapis do zrekonstruowania, nie test ani ocena pamięci Profesora. "} /></p>
            <p>
              <LocalizedText translationKey="copy.8883960a" fallback={"Na marginesie zachowanej notatki widnieje zdanie: "} /></p>
            <blockquote>
              <LocalizedText translationKey="copy.cbc19ca3" fallback={"„Jeśli układ się rozsypie, zacznij od jednej chwili. Potem odnajdź następną.” "} /></blockquote>
            <p>
              <LocalizedText translationKey="copy.bf68f39a" fallback={"Zapis zaczyna zanikać. Masz "} /><strong><LocalizedText translationKey="copy.c51ed01d" fallback={"5 minut"} /></strong><LocalizedText translationKey="copy.e52534ac" fallback={", by odtworzyć go i otworzyć skrót synaptyczny. "} /></p>
            <p>
              <LocalizedText translationKey="copy.a55ba6c8" fallback={"Znajdź części zegara, ułóż kolejne układy cyfr i przejdź dalej, gdy wskazówki pokażą właściwe godziny. "} /></p>
          </div>

          <div className="warning-box">
            <span><LocalizedText translationKey="copy.743f6bdc" fallback={"⏱"} /></span>
            <div>
              <strong><LocalizedText translationKey="copy.f0468f11" fallback={"LIMIT CZASU: 05:00"} /></strong>
              <p><LocalizedText translationKey="copy.884a0be9" fallback={"Po rozpoczęciu misji zegar nie zatrzyma się."} /></p>
            </div>
          </div>

          <button className="primary-button" onClick={beginClockMission}>
            <LocalizedText translationKey="copy.9b39ccf3" fallback={"ZROZUM I ZŁÓŻ ZEGAR "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
          </button>
        </section>
      )}

      {screen === "level2" && (
        <section className="screen level2-screen">
          <div className="eyebrow"><LocalizedText translationKey="copy.fc037441" fallback={"POKÓJ 34 / HIPOKAMP"} /></div>
          <div className="level2-title-row">
            <h1 className="section-title">
              <LocalizedText translationKey="copy.2eb2f71c" fallback={"ZAPIS "} /><span className="accent"><LocalizedText translationKey="copy.eac5a497" fallback={"CZASU"} /></span>
            </h1>
            <div className={`countdown ${secondsLeft <= 60 ? "danger" : ""}`}>
              <LocalizedText translationKey="copy.fbd6fdb4" fallback={"⏱ "} />{formatTime(secondsLeft)}
            </div>
          </div>

          <p className="lead">
            <LocalizedText translationKey="copy.9bbcbfbd" fallback={"Przeszukaj zapisany warsztat. Znajdź cyfry i wskazówki, a następnie odtwórz kolejne układy zegara. "} /></p>

          <div className="stats-grid">
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.14175bca" fallback={"ELEMENTY"} /></span>
              <strong>{found.length}<LocalizedText translationKey="copy.99d258b8" fallback={"/6"} /></strong>
            </div>
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.8905a3bb" fallback={"PRÓBY ZEGARA"} /></span>
              <strong>{level2Attempts}</strong>
            </div>
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.63641a89" fallback={"RUNDY"} /></span>
              <strong>{clockRoundsCompleted}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{TOTAL_ROUNDS}</strong>
            </div>
          </div>

          <div className="workshop">
            <div className="workshop-label"><LocalizedText translationKey="copy.d2b5712b" fallback={"POKÓJ 34 // ODNAJDŹ FRAGMENTY ZAPISU"} /></div>
            <div className="room-scene">
              <div className="room-window"><LocalizedText translationKey="copy.d82f5ec6" fallback={"🌙"} /></div>
              <div className="room-shelf"><LocalizedText translationKey="copy.0fdb08cf" fallback={"📚 🕰️ 📚"} /></div>
              <button
                className={`room-object paper-object ${found.includes("note") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[0])}
                aria-label={localizeAttribute("copy.73e1a258", "Znajdź notatkę")}
              >
                <LocalizedText translationKey="copy.fb206534" fallback={"📜 "} /><small>{found.includes("note") ? <LocalizedText translationKey="copy.1a929848" fallback={"ZNALEZIONO"} /> : <LocalizedText translationKey="copy.4df01f67" fallback={"NOTATKA"} />}</small>
              </button>
              <button
                className={`room-object number-object object-12 ${found.includes("number12") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[1])}
              >
                <LocalizedText translationKey="copy.63384b7e" fallback={"12 "} /><small>{found.includes("number12") ? "✓" : <LocalizedText translationKey="copy.4ff4c70c" fallback={"CYFRA"} />}</small>
              </button>
              <button
                className={`room-object number-object object-3 ${found.includes("number3") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[2])}
              >
                <LocalizedText translationKey="copy.77f03846" fallback={"3 "} /><small>{found.includes("number3") ? "✓" : <LocalizedText translationKey="copy.4ff4c70c" fallback={"CYFRA"} />}</small>
              </button>
              <button
                className={`room-object number-object object-6 ${found.includes("number6") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[3])}
              >
                <LocalizedText translationKey="copy.05e8c90b" fallback={"6 "} /><small>{found.includes("number6") ? "✓" : <LocalizedText translationKey="copy.4ff4c70c" fallback={"CYFRA"} />}</small>
              </button>
              <button
                className={`room-object number-object object-9 ${found.includes("number9") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[4])}
              >
                <LocalizedText translationKey="copy.1bfeb1fc" fallback={"9 "} /><small>{found.includes("number9") ? "✓" : <LocalizedText translationKey="copy.4ff4c70c" fallback={"CYFRA"} />}</small>
              </button>
              <button
                className={`room-object hands-object ${found.includes("hands") ? "collected" : ""}`}
                onClick={() => collectItem(ITEMS[5])}
              >
                <LocalizedText translationKey="copy.45f684ff" fallback={"🕰️ "} /><small>{found.includes("hands") ? "✓" : <LocalizedText translationKey="copy.ae6750e5" fallback={"WSKAZÓWKI"} />}</small>
              </button>
              <div className="desk">
                <span><LocalizedText translationKey="copy.27c71fc4" fallback={"STARE BIURKO"} /></span>
                <span><LocalizedText translationKey="copy.ca66f5c1" fallback={"⚙️"} /></span>
                <span><LocalizedText translationKey="copy.ef986ea0" fallback={"🗝️"} /></span>
              </div>
            </div>
            <p className="room-instruction">
              <LocalizedText translationKey="copy.8176a4ad" fallback={"Klikaj przedmioty w pokoju, aby je zbierać i czytać notatki. "} /></p>
          </div>

          {selectedObject && (
            <div className="discovery-panel">
              <span className="discovery-symbol">{selectedObject.symbol}</span>
              <div>
                <div className="eyebrow"><LocalizedText translationKey="copy.5d8c9f59" fallback={"ODKRYCIE"} /></div>
                <strong><LocalizedText fallback={selectedObject.name} /></strong>
                <p><LocalizedText fallback={selectedObject.description} /></p>
              </div>
              <button
                className="close-button"
                onClick={() => setSelectedObject(null)}
                aria-label={localizeAttribute("copy.8a599cdc", "Zamknij opis")}
              >
                <LocalizedText translationKey="copy.9dbb32c2" fallback={"× "} /></button>
            </div>
          )}

          <div className="inventory-panel">
            <div className="eyebrow"><LocalizedText translationKey="copy.8ee01acc" fallback={"EKWIPUNEK — "} />{found.length}<LocalizedText translationKey="copy.99d258b8" fallback={"/6"} /></div>
            <div className="inventory-items">
              {ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`inventory-item ${found.includes(item.id) ? "found" : ""}`}
                >
                  <span>{found.includes(item.id) ? item.symbol : "?"}</span>
                  <small>
                    <LocalizedText
                      fallback={found.includes(item.id) ? item.name : "Nieodkryte"}
                    />
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div className="clock-puzzle">
            <div className="eyebrow"><LocalizedText translationKey="copy.4c8a43fd" fallback={"UKŁADANKA // PAMIĘĆ ZEGARA"} /></div>

            <h2><LocalizedText translationKey="copy.08ca07ba" fallback={"Pamiętam… zapomniałem… która godzina?"} /></h2>

            <p className="puzzle-hint">
              <LocalizedText translationKey="copy.3a205f83" fallback={"Runda "} />{Math.min(clockRound, TOTAL_ROUNDS)}<LocalizedText translationKey="copy.2a0c975e" fallback={"/"} />{TOTAL_ROUNDS} <LocalizedText translationKey="copy.140c9dde" fallback={"— Henryk pokazuje cztery liczby: po lewej, na górze, po prawej i na dole. Zapamiętaj je, potem ułóż je na swoich miejscach (do wyboru masz tylko te cztery). Gdy układ będzie dobry, odczytaj godzinę ze wskazówek. Wszystkie liczby od 1 do 12 pojawią się w trzech rundach. "} /></p>

            <div className="clock-round-status" aria-live="polite">
              <span><LocalizedText translationKey="copy.af81c003" fallback={"RUNDA "} />{Math.min(clockRound, TOTAL_ROUNDS)} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{TOTAL_ROUNDS}</span>
              <span><LocalizedText translationKey="copy.f48941fc" fallback={"ZALICZONE: "} />{clockRoundsCompleted} <LocalizedText translationKey="copy.afd27b5a" fallback={"/ "} />{TOTAL_ROUNDS}</span>
            </div>

            <div className="clock-board">
              <div
                className="clock-face"
                aria-label={localizeAttribute("copy.b953cfb4", "Tarcza zegara")}
              >
                {POS.map((pos, index) => (
                  <div
                    key={`${clockRound}-${pos}`}
                    className={`clock-number clock-position clock-position-${POS_SLOT[pos]}`}
                  >
                    {showDigits ? clockTarget[index] : "?"}
                  </div>
                ))}

                {found.includes("hands") && (
                  <>
                    <div
                      className="clock-hand hour-hand"
                      style={{
                        transform: `translateX(-50%) rotate(${hourAngle}deg)`,
                        transformOrigin: "50% 100%",
                        transition: handTransition,
                        opacity: handOpacity,
                      }}
                    />
                    <div
                      className="clock-hand minute-hand"
                      style={{
                        transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
                        transformOrigin: "50% 100%",
                        transition: handTransition,
                        opacity: handOpacity,
                      }}
                    />
                  </>
                )}
                <div className="clock-center" />
              </div>

              <div className="clock-answer-area">
                <div className="eyebrow">
                  {clockMemorizing
                    ? <LocalizedText translationKey="copy.366b423f" fallback={"PAMIĘTAM... ZAPAMIĘTUJ"} />
                    : clockRotating
                      ? <LocalizedText translationKey="copy.02f283f5" fallback={"WSKAZÓWKI SIĘ OBRACAJĄ..."} />
                      : clockReading
                        ? <LocalizedText translationKey="copy.43bc825c" fallback={"ODCZYTAJ GODZINĘ"} />
                        : <LocalizedText translationKey="copy.bc249a24" fallback={"ZAPOMNIAŁEM... ODTWÓRZ UKŁAD"} />}
                </div>

                {clockReading ? (
                  clockRound === 1 ? (
                    <div className="clock-choices">
                      {ROUND_TIMES.map((time) => (
                        <button
                          key={time}
                          className="clock-choice"
                          onClick={() => answerTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="clock-time-setting">
                      <p>
                        <LocalizedText translationKey="copy.a340768b" fallback={"Ustaw godzinę z notatki Henryka: "} /><strong> {targetTime}</strong>
                      </p>
                      <label>
                        <LocalizedText translationKey="copy.76da0262" fallback={"Twoje ustawienie "} /><input
                          className="clock-time-input"
                          type="time"
                          value={selectedTime}
                          onChange={(event) => setSelectedTime(event.target.value)}
                          aria-label={localizeAttribute("copy.f81cc766", "Ustaw godzinę i minuty")}
                        />
                      </label>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => answerTime(selectedTime)}
                        disabled={!selectedTime}
                      >
                        <LocalizedText translationKey="copy.e7baed55" fallback={"ZATWIERDŹ GODZINĘ → "} /></button>
                    </div>
                  )
                ) : (
                  <div className="clock-shuffle-grid">
                    {POS.map((pos, index) => (
                      <label key={pos} className="clock-answer-slot">
                        <span>
                          <LocalizedText fallback={POS_LABEL[pos]} />
                        </span>

                        <select
                          aria-label={localizeAttribute(
                            "copy.6bc55131",
                            "Liczba: {value}",
                            {
                              value: localizeAttribute(
                                translationKeyFor(POS_LABEL[pos]),
                                POS_LABEL[pos],
                              ).toLocaleLowerCase(
                                language === "pl" ? "pl-PL" : "en-US",
                              ),
                            },
                          )}
                          value={clockSlots[index] ?? ""}
                          onChange={(event) =>
                            setClockSlot(index, event.target.value)
                          }
                          disabled={clockMemorizing || clockRotating}
                        >
                          <option value=""><LocalizedText translationKey="copy.3a0cb08e" fallback={"?"} /></option>

                          {choices.map((digit) => (
                            <option
                              key={digit}
                              value={digit}
                              disabled={
                                usedDigits.has(digit) &&
                                clockSlots[index] !== digit
                              }
                            >
                              {digit}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="clock-actions">
              <button
                className="secondary-button"
                onClick={resetClockShuffle}
                disabled={clockRotating}
              >
                <LocalizedText translationKey="copy.ab2ed2d5" fallback={"↻ RESETUJ ROZSYPANKĘ "} /></button>

              <button
                className="primary-button"
                onClick={checkClock}
                disabled={
                  found.length !== ITEMS.length ||
                  clockMemorizing ||
                  clockRotating ||
                  clockReading
                }
              >
                <LocalizedText translationKey="copy.a934ad77" fallback={"SPRAWDŹ UKŁAD "} /><span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
              </button>
            </div>

            <p className="feedback" role="status">
              {clockMessage}
            </p>
          </div>
        </section>
      )}

      {screen === "level3intro" && (
        <Room56
          onComplete={(proof) => void continueAfterLevel("room56", proof)}
          voiceEnabled={voiceEnabled}
        />
      )}

      {screen === "success" && (
        <section className="screen ending-screen">
          <ClockMemoryBackdrop mode="clock" />
          <div className="success-icon"><LocalizedText translationKey="copy.163a1ee2" fallback={"✓"} /></div>
          <div className="eyebrow"><LocalizedText translationKey="copy.bc4c1959" fallback={"POKÓJ 34 // ZAPIS ODTWORZONY"} /></div>
          <h1>
            <LocalizedText translationKey="copy.95c51ec8" fallback={"CZAS "} /><br />
            <span className="accent"><LocalizedText translationKey="copy.1b5acbd1" fallback={"RUSZYŁ DALEJ."} /></span>
          </h1>
          <p className="lead">
            <LocalizedText translationKey="copy.e7a31ba9" fallback={"Tik... tak... Wskazówki zatrzymują się na właściwej godzinie. Rekonstrukcja zapisu jest kompletna, a skrót synaptyczny otwarty. "} /></p>
          <blockquote>
            <LocalizedText translationKey="copy.07a10929" fallback={"Na odwrocie tarczy znajduje się notatka Profesora: „Jeśli układ się rozsypie, zacznij od jednej chwili.” "} /></blockquote>
          <div className="stats-grid">
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.c2b02f8a" fallback={"POZOSTAŁY CZAS"} /></span>
              <strong>{formatTime(secondsLeft)}</strong>
            </div>
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.a6199a97" fallback={"ODNALEZIONE"} /></span>
              <strong>{found.length}<LocalizedText translationKey="copy.99d258b8" fallback={"/6"} /></strong>
            </div>
            <div className="stat-card">
              <span><LocalizedText translationKey="copy.3945d059" fallback={"PRÓBY"} /></span>
              <strong>{level2Attempts}</strong>
            </div>
          </div>
          {nextEnabledLevel ? (
            <>
              <div className="mission-card unlocked">
                <div className="mission-number">
                  {String(nextEnabledLevel.number).padStart(2, "0")}
                </div>
                <div>
                  <div className="eyebrow"><LocalizedText translationKey="copy.6afa9d24" fallback={"NASTĘPNA MISJA"} /></div>
                  <h2><LocalizedText fallback={nextEnabledLevel.title} /></h2>
                  <p><LocalizedText fallback={nextEnabledLevel.description} /></p>
                </div>
                <span className="mission-lock"><LocalizedText translationKey="copy.de2d29a1" fallback={"🔓"} /></span>
              </div>
              <button
                className="primary-button"
                onClick={startNextEnabledLevel}
              >
                <LocalizedText translationKey="copy.c4f27c1b" fallback={"PRZEJDŹ DO LEVELU "} />{nextEnabledLevel.number} <span><LocalizedText translationKey="copy.973c7cf5" fallback={"→"} /></span>
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              onClick={() => continueAfterLevel("room34")}
            >
              <LocalizedText translationKey="copy.9c35c82f" fallback={"ZAKOŃCZ KAMPANIĘ "} /><span><LocalizedText translationKey="copy.163a1ee2" fallback={"✓"} /></span>
            </button>
          )}
          <button className="text-button" onClick={() => setScreen("intro")}>
            <LocalizedText translationKey="copy.0e3cfa96" fallback={"Wróć do menu "} /></button>
          <button className="text-button" onClick={() => startLevel2()}>
            <LocalizedText translationKey="copy.49637383" fallback={"↻ Zagraj w Level 2 ponownie "} /></button>
        </section>
      )}

      {screen === "failed" && (
        <section className="screen ending-screen">
          <div className="failure-icon"><LocalizedText translationKey="copy.520b4356" fallback={"×"} /></div>
          <div className="eyebrow"><LocalizedText translationKey="copy.32061109" fallback={"POKÓJ 34 // ZAPIS NIEKOMPLETNY"} /></div>
          <h1>
            <LocalizedText translationKey="copy.5fb52e49" fallback={"ZAMEK "} /><br />
            <span className="danger-text"><LocalizedText translationKey="copy.baf1f1bd" fallback={"ZATRZAŚNIĘTY."} /></span>
          </h1>
          <p className="lead">
            <LocalizedText translationKey="copy.9b1244a3" fallback={"Rekonstrukcja czasu nie została ukończona. Zachowane ślady nadal są dostępne — możesz spróbować ponownie. "} /></p>
          <button className="primary-button" onClick={() => startLevel2()}>
            <LocalizedText translationKey="copy.be71f905" fallback={"SPRÓBUJ PONOWNIE "} /><span><LocalizedText translationKey="copy.be3cba5a" fallback={"↻"} /></span>
          </button>
          <button className="text-button" onClick={() => setScreen("transition")}>
            <LocalizedText translationKey="copy.2dc690c6" fallback={"Wróć do przejścia między misjami "} /></button>
        </section>
      )}

      <footer className="game-footer">
        <span><LocalizedText translationKey="copy.a10d5c99" fallback={"ESCAPE ROOM // INTERACTIVE PUZZLE EXPERIENCE"} /></span>
        <span><LocalizedText translationKey="copy.0ffdb80a" fallback={"BUILD 0.3.0"} /></span>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  );
}