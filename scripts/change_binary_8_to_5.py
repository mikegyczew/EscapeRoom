from pathlib import Path
from datetime import datetime
import sys

FILE = Path("frontend/src/App.tsx")

if not FILE.exists():
    sys.exit(f"BLAD: Nie znaleziono pliku {FILE}")

source = FILE.read_text(encoding="utf-8")
updated = source

# Zmiana liczby wyświetlanych bitów z 8 na 5.
old_display = "Array.from({ length: 8 }, (_, index) => ("
new_display = "Array.from({ length: 5 }, (_, index) => ("

# Zmiana kodowania znaków:
# A = 00000, B = 00001, ..., Z = 11001.
old_encoding = (
    "character.charCodeAt(0).toString(2).padStart(8, \"0\")"
)
new_encoding = (
    "(character.toUpperCase().charCodeAt(0) - 65)"
    ".toString(2).padStart(5, \"0\")"
)

changes = [
    (old_display, new_display, "Wyświetlanie 5 bitów"),
    (old_encoding, new_encoding, "Kodowanie liter na 5 bitach"),
]

for old, new, description in changes:
    count = updated.count(old)

    if count != 1:
        sys.exit(
            f"BLAD: {description}: oczekiwano 1 wystapienia, "
            f"znaleziono {count}. Plik nie zostal zmieniony."
        )

    updated = updated.replace(old, new, 1)

# Kopia zapasowa przed zapisem.
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = FILE.with_name(f"{FILE.name}.before-binary5-{timestamp}.bak")
backup.write_text(source, encoding="utf-8")

FILE.write_text(updated, encoding="utf-8")

print("SUKCES: Zmieniono kodowanie na 5 bitow.")
print(f"Kopia zapasowa: {backup}")
print("Zmienione elementy:")
for _, _, description in changes:
    print(f"  - {description}")
