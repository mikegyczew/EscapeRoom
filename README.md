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
jest jeszcze skonfigurowana; konta są aktywne od razu po rejestracji.

Teksty gry są zapisywane w tabeli `LocalizedTexts` w tej samej bazie. API
`GET /api/translations/{język}` zwraca treści wybranego języka i uzupełnia
brakujące wpisy polską wersją. Przełącznik języka jest dostępny na ekranie
logowania i w nagłówku gry, a wybór zapamiętuje się w przeglądarce.

Katalog polski zawiera dotychczasowe opisy Pokoi 5, 11, 12, 17, 22 i 23 oraz
przeniesione teksty JSX, atrybuty dostępności, komunikaty i wyświetlane etykiety
danych pokoi. Katalog angielski jest nadal niekompletny; brakujące tłumaczenia
wyświetlą się po polsku, dlatego przełączenie języka nie oznacza jeszcze
ukończonej wersji angielskiej. Teksty odpowiedzi backendu i niektóre komunikaty
zależne od stanu wymagają dalszej migracji. Mechanika zagadek pozostaje w
komponentach frontendowych.

Po zalogowaniu wybierz dostępny escape room: **Laboratorium Profesora —
Labirynt 99 Pokoi**. Kolejne przygody można dodawać jako następne karty w
panelu wyboru.
