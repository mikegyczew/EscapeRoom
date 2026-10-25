# Poziomy

Każdy zaimplementowany pokój ma folder `RoomNN` nazwany zgodnie z numerem
pokoju, z definicją w `index.ts`. Numer misji w kampanii nie musi odpowiadać
numerowi pokoju.
W definicji `enabled` można wyłączyć poziom bez usuwania jego kodu. Ustaw
`enabled: false` w folderze pokoju, aby pominąć jego misję w kampanii;
`enabled: true` ponownie ją udostępni. Zmiana jest konfiguracyjna — po
zmianie w produkcji przebuduj frontend.

Aktywne misje prowadzą kolejno przez Pokoje 1, 5, 11, 12, 17, 22, 23, 27, 33,
34, 40, 44, 45, 50, 55, 56, 61, 66, 76, 72, 77, 67, 78, 83, 88, 89–98 i 99.
Pokoje 89–98 są jednym zbiorczym poziomem, a Pokój 99 zamyka kampanię. Numery
pokoi są niezależne od kolejności misji. Pełna koncepcja znajduje się w
`docs/labirynt-99-pokoi.md`.

Kolejność kampanii ustala tablica `LEVELS` w `registry.ts`. Aby przestawić
poziomy, zmień kolejność wpisów w tej tablicy. Menu i przejścia korzystają
z aktywnych wpisów rejestru, więc pomijają poziomy wyłączone. Liczba
aktywnych poziomów jest obliczana z konfiguracji przy uruchomieniu i
wyświetlana na ekranie startowym.

Polski lektor korzysta z lokalnych nagrań neuronowego głosu Piper w
`frontend/public/audio/narration`, więc działa także w przeglądarkach bez
wbudowanego głosu polskiego. W archiwum znajdują się nagrania liczby poziomów
od 0 do 99 (`archive-N.mp3` i `active-levels-N.mp3`); przy zwiększeniu limitu
kampanii trzeba dodać pliki dla nowych wartości.

Kod nowych pokoi należy umieszczać w folderach nazwanych ich numerem, a
kolejność misji ustawiać niezależnie w rejestrze. Room 01 i Room 05 mają
własne ekrany, Room 11 zagadkę optyczną, Room 12 zagadkę wibracji, Room 17
kanały głosowe, Room 22 dostrajanie radia, Room 23 rytm mechanicznego zegara,
Room 27 chronologię listów, Room 33 cyfrowy labirynt, Room 34 dane i hook
`useRoom34`, Room 40 punkt stały pętli, Room 44 pamięć hasła, Room 45 tarczę
zegara, Room 50 kalibrację projekcji, Room 55 wyciszanie źródeł szumu, a Room
56 samodzielny komponent. Room 61 rekonstruuje partię, Room 66 decyzję etyczną,
Room 76 uzupełnia zdania, Room 72 używa symboli do komunikacji, a Room 77
składa ostatni list. Room 67 dopasowuje nazwy do opisów, Room 78 zmienia
perspektywę planu, Room 83 potwierdza nazwisko Profesora, a Room 88 prowadzi
przez trasę stabilnych podestów. Room 89 przywraca dziesięć świateł synaps na
podstawie kolejności wcześniejszych wspomnień, a Room 99 pozwala wybrać
zakończenie dotyczące prywatności i zachowania badań.
Powłoka aplikacji obsługuje menu kampanii, ekran zegara Room 34 i wspólne
przejścia.

Mapa kampanii pokazuje wyłącznie pokoje nazwane w koncepcji. Dziewięć stref
pozostaje widocznych, a Pokoje 89–98 są jednym grywalnym ciągiem białych pokoi.

## Room 56 — Złamany Algorytm (misja 16)

Room 56 składa się z czterech tropów do znalezienia w pokoju, czterech wejść
(A–D) oraz tablicy z ośmioma zworami. Reguła nowego protokołu to
`((NOT A) AND B) OR (C XOR D)`. Timer sześciu minut rozpoczyna się po
dotknięciu głównego panelu, a błędna zwora odejmuje 30 sekund.

Lokalne narracje znajdują się w `frontend/public/audio/narration`.
Pliki `roomNN-intro.mp3` zawierają wprowadzenia do odpowiednich pokoi, a
`room17-speaker-N.mp3` odtwarza nagrania kanałów z Pokoju 17.
Pliki `level03-expanded-*.mp3` obsługują Room 56:
wprowadzenie, panel, wynik, porażkę i komunikat błędu. `circuit-plan.mp3`,
`admin-glossary.mp3`,
`monitor-code.mp3` oraz `old-manual.mp3` odpowiadają czterem tropom.
