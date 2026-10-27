# EscapeRoom

Główna fabuła projektu i plan 99 pokoi są opisane w dokumencie
[Labirynt 99 Pokoi — Umysł Henry'ego](./docs/labirynt-99-pokoi.md).

## Uruchomienie lokalne

Uruchom aplikację poleceniem `docker compose up --build`. Frontend będzie
dostępny pod adresem `http://localhost:3001`, a API pod `http://localhost:5167`.
Przy pierwszym wejściu można utworzyć konto e-mail i hasło. Konta oraz sesje
uwierzytelniania obsługuje backend, a dane kont są przechowywane w wolumenie
Docker `escape-room-data`. Hasło musi mieć co najmniej 8 znaków i zawierać
cyfrę. Wysyłka wiadomości do potwierdzania adresu ani odzyskiwania hasła nie
jest dostępna, dopóki nie skonfigurujesz Resend; konta są aktywne od razu po
rejestracji.

Odzyskiwanie hasła używa API Resend przez HTTPS. W `.env` ustaw
`RESEND_API_KEY`, `RESEND_FROM_ADDRESS` (adres nadawcy zweryfikowany w Resend)
i `FRONTEND_BASE_URL` (`http://localhost:3001` lokalnie). W Render dodaj
`Resend__ApiKey` i `Resend__FromAddress` jako sekrety, a
`Resend__FrontendBaseUrl` ustaw na publiczny adres frontendu. Bez klucza API i
zweryfikowanego nadawcy link do odzyskiwania hasła pozostaje niedostępny.
Użytkownik dostaje jednorazowy link; reset jest obsługiwany przez wbudowane
endpointy ASP.NET Identity. Klucz Resend trzymaj wyłącznie w `.env` lokalnie
lub w sekretach Rendera — nie zapisuj go w repozytorium. Przykładowe żądania
API znajdują się w [PasswordRecovery.http](./Backend/PasswordRecovery.http).

Aby utworzyć konto administratora przy starcie, skopiuj `.env.example` do
`.env` i ustaw `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_PASSWORD` oraz
opcjonalnie `ADMIN_BOOTSTRAP_EMAIL` (domyślnie używany jest techniczny adres
`<login>@admin.invalid`; dla loginu `MikeGMsc2` domyślny adres to
`mikegyczew@gmail.com`). Istniejące konto `mgyczew@gmail.com` zachowuje adres
e-mail i przy starcie otrzymuje login `mgyczew`; logowanie przez e-mail nadal
działa. Wartość hasła w pliku `.env` ujmij w apostrofy, aby
znaki `$` nie zostały zinterpretowane przez Docker Compose. Plik `.env` jest
ignorowany przez Git i nie należy umieszczać sekretów w repozytorium.
Ustawienia są stosowane przy starcie backendu: tworzą konto tylko wtedy, gdy
podany login jeszcze nie istnieje, oraz przypisują mu rolę `Admin`. Ponowne
uruchomienie nie zmienia istniejącego hasła. Administrator może logować się
loginem lub adresem e-mail; zwykłe konta nadal rejestrują się przez e-mail.

Po zalogowaniu administrator ma dostęp do panelu, który pozwala edytować
publikację i opisy scenariuszy, kolejność i aktywność pokoi, treści i
tłumaczenia interfejsu oraz konfigurację i instrukcje istniejących zagadek.
Panel udostępnia też stronicowany podgląd bazy. Tekst można edytować wyłącznie
w tabelach tłumaczeń scenariuszy, treści pokoi, instrukcji i podpowiedzi oraz
tekstów interfejsu; pozostałe tabele są tylko do odczytu. Podgląd użytkowników
pokazuje wyłącznie podstawowe pola kont. Hashy haseł, tokenów, znaczników
bezpieczeństwa ani postępów graczy nie udostępnia przeglądarka bazy. Zmiany
konfiguracji zagadek nadal przechodzą walidację formatu i typu handlera przed
zapisem.

## Wdrożenie na Render

`render.yaml` kieruje frontend przez Nginx do publicznego adresu API
`https://escaperoom-xlzw.onrender.com`. Jest to celowe: usługi Render w planie
Free mogą wysyłać żądania przez prywatną sieć, ale nie mogą ich tam odbierać.
Dzięki reverse proxy przeglądarka widzi API pod tym samym originem co
frontend, więc nie trzeba dodawać publicznego adresu API do CORS. Render
sprawdza gotowość API pod `/healthz`, a proxy ma wydłużony limit czasu żądania.

Aktualny bezpłatny plan Render usypia nieaktywne usługi, a po wybudzeniu
pierwsza odpowiedź może potrwać około minuty. Jego system plików jest
nietrwały: plik SQLite i dane lokalne znikają przy restarcie, wdrożeniu lub
uśpieniu. Nie należy traktować konfiguracji `plan: free` jako produkcyjnej
bazy danych; dla trwałych kont i postępów potrzebny jest trwały dysk (plan
obsługujący dyski) albo migracja do zarządzanej bazy danych. Obecna aplikacja
używa SQLite i migracja do innego silnika wymaga dostosowania dostawcy EF Core
oraz skryptów inicjalizacji schematu.

Jeśli frontend nadal zwraca 502, sprawdź logi obu usług w Render i upewnij się,
że blueprint wdrożył najnowszy commit oraz obie usługi są w tym samym regionie.
Jeżeli 502 występuje nadal, do dalszej diagnozy potrzebny jest dokładny
publiczny adres frontendu i wpis z logów wdrożenia.

Treści i tłumaczenia interfejsu nadal są dostępne w tabeli `LocalizedTexts`.
API `GET /api/translations/{język}` zwraca wybrany język z zapasową wersją
polską. Nowy katalog gry jest przechowywany w tabelach `Stories`,
`StoryTranslations`, `RoomDefinitions`, `StoryRooms`, `RoomContents` i ich
tabelach tłumaczeń. `GET /api/stories/{język}` zwraca opublikowane scenariusze,
pokoje w kolejności przejścia i ich treści; frontend używa tego katalogu przy
wyborze scenariusza i kolejnych misji.

Uruchomienie nadal korzysta z istniejącej bazy SQLite. Start aplikacji dodaje
brakujące tabele i indeksy bez usuwania ani przebudowy istniejących tabel,
inicjalizuje scenariusz Labirynt 99 Pokoi, a pokojowe klucze `roomXX.*`
kopiuje idempotentnie do nowego modelu. Stary słownik pozostaje na miejscu
jako warstwa kompatybilności. Przed aktualizacją produkcyjną należy wykonać
spójną kopię zapasową SQLite (np. przez SQLite Online Backup API/`.backup`) albo
zatrzymać backend i skopiować cały wolumen danych. Nie kopiuj wyłącznie pliku
bazy podczas pracy SQLite w trybie WAL. Kod migracji nie tworzy kopii
automatycznie.

Definicje zagadek i ich wystąpienia są rozdzielone w `PuzzleDefinitions` i
`PuzzleInstances`. Handlery `word-answer`, `numeric-code`, `solution-proof`
i `maze-route` są wybierane przez `PuzzleType`. Konfiguracja zagadek nie jest
zwracana graczom przez API katalogu; panel administratora udostępnia ją wyłącznie
po autoryzacji rolą `Admin`. Dotychczasowy endpoint pierwszej zagadki zachowuje
swój kontrakt. Pozostałe interaktywne mechaniki pozostają na razie w istniejących
komponentach React i mogą być migrowane stopniowo.

Katalogi polski i angielski zawierają ten sam zestaw 964 kluczy, w tym opisy
pokoi, teksty JSX, atrybuty dostępności, komunikaty i etykiety. Przy brakującym
tekście w bazie API używa polskiego tłumaczenia zapasowego. Polski lektor
korzysta z lokalnych nagrań Piper. Darmowym kandydatem o wyższej deklarowanej
jakości jest polski model
[`pl_PL-bass-high`](https://huggingface.co/blackbartblues/piper-pl-bass-high)
(Apache-2.0); przed pełną podmianą nagrań warto odsłuchać próbkę, bo to męski
głos i dobór barwy jest subiektywny.

Po zalogowaniu wybierz opublikowany scenariusz. Dodanie kolejnej historii i
użycie w niej istniejącej definicji pokoju nie wymaga duplikowania definicji
pokoju ani postępu.
