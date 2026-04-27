# Wzornik Szydełkowy

Desktopowa aplikacja do projektowania, edycji i eksportu wzorów szydełkowych.

## Instalacja

### Linux

**AppImage (zalecane — działa na każdej dystrybucji):**
1. Pobierz `Wzornik Szydełkowy_0.1.0_amd64.AppImage`
2. Daj prawa do wykonywania:
   ```bash
   chmod +x "Wzornik Szydełkowy_0.1.0_amd64.AppImage"
   ```
3. Kliknij dwukrotnie aby uruchomić

**Debian / Ubuntu (.deb):**
```bash
sudo dpkg -i "Wzornik Szydełkowy_0.1.0_amd64.deb"
sudo apt-get install -f   # rozwiąż brakujące zależności
```

Wymagane biblioteki systemowe: `libwebkit2gtk-4.1-0`, `libgtk-3-0`.

### Windows

Pobierz `Wzornik Szydełkowy_0.1.0_x64-setup.exe` (NSIS) lub `.msi`. Kliknij dwukrotnie i przejdź przez kreator.

> **Uwaga:** instalator dla Windowsa nie powstał na tej maszynie (Linux). Aby go zbudować, zobacz sekcję "Budowanie" poniżej lub użyj GitHub Actions.

## Podstawowe użycie

1. **Ekran powitalny** — kliknij **„Stwórz nowy wzór"** lub **„Otwórz z dysku"**
2. Wybierz splot z górnej palety (`ch`, `sc`, `dc`, ...)
3. Wybierz kolor włóczki z drugiej palety
4. Klikaj komórki w siatce aby malować (lub użyj Spacji)
5. **Enter** dodaje nowy wiersz
6. **Ctrl+S** zapisuje, **Ctrl+E** eksportuje do Excela

Pełna lista skrótów dostępna pod ikoną klawiatury w prawym górnym rogu.

## Skróty klawiszowe

| Klawisz | Akcja |
|---|---|
| Spacja | Wstaw oczko |
| Backspace / Delete | Usuń oczko |
| Enter | Nowy wiersz |
| ↑ ↓ ← → | Ruch kursora |
| 1–9 | Wybór splotu |
| Ctrl+Z / Ctrl+Y | Cofnij / Powtórz |
| Ctrl+S | Zapisz |
| Ctrl+O | Otwórz |
| Ctrl+N | Nowy wzór |
| Ctrl+E | Eksport do Excela |

Wszystkie powyższe skróty można zmienić w **Ustawieniach** (ikona koła zębatego).

## Format pliku

Wzory zapisywane są jako pliki `.wzor` (czytelny JSON, aktualnie `schemaVersion: 2`).
Pliki w starszym formacie `schemaVersion: 1` są wczytywane bez problemu — są automatycznie migrowane przy zapisie.

Eksport do Excela tworzy plik `.xlsx` z dwoma arkuszami:
- **Pattern** — siatka oczek z kolorami i kodami splotów
- **Legend** — legenda kolorów i splotów (po angielsku + niestandardowe sploty zdefiniowane przez użytkownika)

### Niestandardowe sploty

W palecie splotów, po wbudowanych ściegach (`ch`, `sc`, `dc`, …) znajduje się kafelek z `+`. Po kliknięciu otwiera się okno biblioteki znaków, w którym można:
1. Wybrać symbol z biblioteki (~50 symboli z różnych dziedzin: zaawansowane szydełkowanie, dziewiarstwo, haft krzyżykowy, haft, geometria, motywy ozdobne).
2. Przypisać własny skrót literowy (1–3 litery; sprawdzana kolizja z wbudowanymi splotami i innymi custom).
3. Opcjonalnie podać polską / angielską nazwę.

Niestandardowe sploty zapisywane są wewnątrz pliku `.wzor` — wzór jest przenośny między komputerami nawet jeśli używa własnych znaków.

## Generowanie wzorów z LLM

Wzór `.wzor` to deklaratywny JSON — model językowy (Claude, ChatGPT, lokalny LLM) potrafi go wygenerować, jeśli ma dwa pliki kontekstowe:

- **`docs/LLM_PATTERN_GUIDE.md`** — pełny opis formatu, niezmienników, listy splotów wbudowanych, ID symboli z biblioteki i lista najczęstszych błędów.
- **`examples/*.wzor`** — gotowe wzory startowe do skopiowania i modyfikacji:
  - `scarf-stripes.wzor` — szalik 10×8 w trzech kolorowych pasach
  - `square-sampler.wzor` — próbnik wszystkich 9 wbudowanych splotów (6×6)
  - `motif-heart.wzor` — motyw serca 9×9 (dwa kolory)
  - `custom-stitch-demo.wzor` — pokazuje jak custom stitches z biblioteki + bez biblioteki wyglądają w pliku

**Typowy workflow:**

```
> Przeczytaj docs/LLM_PATTERN_GUIDE.md i examples/scarf-stripes.wzor.
> Stwórz dla mnie szalik 12×30 oczek, na przemian rzędy fioletowe i mietowe,
> co 4. rząd jeden custom stitch X. Zapisz jako moj-szalik.wzor.
```

LLM zwraca cały plik jako JSON. Zapisz go z rozszerzeniem `.wzor` i otwórz w aplikacji (`Ctrl+O`). Aplikacja waliduje plik przy otwarciu i pokaże konkretny błąd jeśli LLM się pomylił — wystarczy wkleić błąd z powrotem do LLM-a do poprawki.

## Domyślne lokalizacje

- Wzory: `~/Documents/Wzornik/`
- Eksport: `~/Documents/Wzornik/`
- Ostatnio otwarte: `~/.config/com.greencatstudio.wzornik/recents.json`

Domyślne foldery można zmienić w **Ustawieniach**.

## Budowanie ze źródeł

### Wymagania
- Node.js 18+ i npm
- Rust 1.70+ (`rustup install stable`)
- Linux: `webkit2gtk-4.1`, `gtk3`, `librsvg`
- Windows: WebView2 (preinstalowane na Win11)

### Komendy

```bash
npm install                    # zależności frontendowe
npm run tauri dev              # uruchom w trybie dev
npm test                       # testy jednostkowe (vitest)
npm run typecheck              # kontrola typów TS
npm run build                  # build produkcyjny frontendu
NO_STRIP=1 npm run tauri build # zbuduj instalatory dla bieżącej platformy
```

> **Linux + Arch / nowe ELF:** użyj `NO_STRIP=1` żeby ominąć błąd starego `strip` w linuxdeploy.

Artefakty trafiają do `src-tauri/target/release/bundle/`.

### Cross-platform (GitHub Actions)

Plik `.github/workflows/release.yml` buduje wszystkie artefakty (Linux + Windows) na każdy tag `v*`.

## Stack

- **Tauri 2** (Rust shell) + **React 19** + **TypeScript** + **Vite 7**
- **Zustand** + **Immer** dla stanu
- **Zod** dla walidacji plików
- **react-i18next** (PL/EN)
- **exceljs** (lazy-loaded) dla eksportu

## Licencja

MIT © 2026 GreenCatStudio
