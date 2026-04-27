# Wzornik Szydełkowy — przewodnik dla LLM

Ten dokument opisuje format pliku `.wzor` wystarczająco szczegółowo, żeby model językowy mógł generować poprawne wzory bez interakcji z aplikacją. Plik `.wzor` to zwykły JSON, który aplikacja parsuje i waliduje schematem Zod (`schemaVersion: 2`).

## Workflow z LLM

1. Użytkownik opisuje wzór („szalik 12×30 oczek, paski fioletowo-mietowe, co 4. rząd jeden custom stitch X").
2. LLM:
   - czyta przykład najbliższy żądaniu (`examples/scarf-stripes.wzor` itp.),
   - modyfikuje go zgodnie z opisem,
   - zwraca cały plik `.wzor` jako JSON.
3. Użytkownik zapisuje plik i otwiera w aplikacji (`Ctrl+O`).

Aplikacja zawsze waliduje plik. Jeśli walidacja zawiedzie, użytkownik dostaje konkretny błąd (np. „colors[0] must be the base color"). Wtedy LLM dostaje treść błędu i poprawia.

## Pełny schemat

```jsonc
{
  "id": "string-non-empty",                    // Stabilny ID wzoru (UUID albo dowolny string)
  "name": "string-non-empty",                  // Nazwa pokazywana w aplikacji
  "schemaVersion": 2,                           // ZAWSZE 2
  "createdAt": "2026-04-27T20:00:00.000Z",     // ISO 8601 z offsetem (Z lub +HH:MM)
  "updatedAt": "2026-04-27T20:00:00.000Z",     // jw.
  "displayMode": "symbol",                     // "symbol" | "code" | "both"
  "colors": [                                   // ≥1 kolor; colors[0] musi mieć isBase=true
    {
      "id": "base",                             // Stabilny ID koloru (używany w cells.colorId)
      "name": "Kremowy",                        // Nazwa pokazywana w UI
      "hex": "#F5EDE0",                         // ZAWSZE 7 znaków: # + 6 hex (wielkość liter dowolna, ale przy zapisie używamy upper)
      "isBase": true                            // Tylko colors[0]
    },
    {
      "id": "rose",
      "name": "Bordo",
      "hex": "#C97B84",
      "isBase": false                           // Każdy kolor poza colors[0] musi mieć isBase: false
    }
  ],
  "rows": [                                     // ≥1 wiersz; WSZYSTKIE wiersze muszą mieć identyczną długość cells[]
    {
      "id": "r1",
      "direction": "rtl",                       // "rtl" (prawo→lewo) lub "ltr" (lewo→prawo)
      "cells": [                                // Tablica długości = ilość kolumn wzoru
        { "stitch": "sc", "colorId": "base" },  // Wypełniona komórka
        null,                                   // Pusta komórka
        { "stitch": "custom:abc", "colorId": "rose" }
      ]
    }
  ],
  "customStitches": [                           // [] jeśli wzór nie używa custom stitches
    {
      "key": "custom:abc",                     // ZAWSZE prefix "custom:" + dowolny [A-Za-z0-9-]+
      "code": "X",                              // 1–3 ASCII litery, unikalny w wzorze, nie koliduje z built-in
      "labelPl": "moja sztuczka",              // opcjonalne
      "labelEn": "my trick",                    // opcjonalne
      "symbolRef": "lib-popcorn",              // opcjonalne; ID symbolu z biblioteki (patrz niżej)
      "createdAt": "2026-04-27T20:00:00.000Z"
    }
  ]
}
```

## Niezmienniki (LLM musi je zachować)

1. **`schemaVersion` = 2** — żadne inne wartości nie są akceptowane.
2. **`colors[0].isBase = true`** — i żaden inny kolor nie może mieć `isBase: true`.
3. **Wszystkie wiersze mają tę samą długość** — to jest ilość kolumn wzoru.
4. **Każde `cell.colorId`** musi istnieć w `colors[].id` (inaczej walidacja rzuca błąd).
5. **Każde `cell.stitch` z prefiksem `custom:`** musi mieć odpowiadający wpis w `customStitches[]`. Sieroty są automatycznie czyszczone przy ładowaniu (toast warning), ale lepiej ich nie generować.
6. **`customStitches[].key` i `.code` są unikalne** w obrębie pliku (case-insensitive porównanie kodu).
7. **`customStitches[].code` nie może kolidować** z kodami wbudowanymi (`ch`, `sl st`, `sc`, `hdc`, `dc`, `tr`, `dtr`, `inc`, `dec`).
8. **Daty** zawsze ISO 8601 z offsetem (np. `2026-04-27T20:00:00.000Z`).

## Konwencja kierunku wierszy

Aplikacja zachęca do naprzemiennego kierunku (mama dziergając wzór czyta zygzakiem):

- Wiersz 1: `rtl`
- Wiersz 2: `ltr`
- Wiersz 3: `rtl`
- …

Nie jest to wymagane przez schemat — wzór może mieć wszystkie wiersze w jednym kierunku jeśli to jest faktyczny zamysł (np. dziergany w okrąglakach). Ale dla typowego szalika/płaskiego wzoru: na przemian.

## Wbudowane sploty (built-in stitches)

Te 9 splotów ZAWSZE jest dostępne, niezależnie od `customStitches`:

| `stitch` | Kod (US) | Polski | Angielski |
|----------|----------|--------|-----------|
| `ch`     | `ch`     | łańcuszek | chain |
| `slst`   | `sl st`  | oczko zamknięte | slip stitch |
| `sc`     | `sc`     | półsłupek | single crochet |
| `hdc`    | `hdc`    | półsłupek nawijany | half double crochet |
| `dc`     | `dc`     | słupek | double crochet |
| `tr`     | `tr`     | słupek podwójny | treble crochet |
| `dtr`    | `dtr`    | słupek potrójny | double treble |
| `inc`    | `inc`    | przybranie | increase |
| `dec`    | `dec`    | ubranie | decrease |

W `cell.stitch` używaj zawsze klucza z lewej kolumny (`"sc"`, nie `"single crochet"`).

## Biblioteka symboli (dla custom stitches)

`customStitches[].symbolRef` może wskazywać na jeden z poniższych ID symboli SVG. Każdy ID zaczyna się od `lib-`. Jeśli `symbolRef` jest pominięty lub wskazuje nieznany ID, custom stitch renderuje się jako litera w okręgu (fallback).

### Szydełkowanie zaawansowane

`lib-fpdc`, `lib-bpdc`, `lib-fphdc`, `lib-bphdc`, `lib-trtr`, `lib-picot`, `lib-magic`, `lib-popcorn`, `lib-bobble`, `lib-puff`, `lib-shell`, `lib-vstitch`, `lib-cluster3`, `lib-cluster4`, `lib-revsc`, `lib-fsc`, `lib-fdc`

Przykłady semantyczne: `lib-fpdc` = front post double crochet (warkocz), `lib-popcorn` = popcorn stitch, `lib-magic` = magic ring (amigurumi start).

### Dziewiarstwo

`lib-knit`, `lib-purl`, `lib-k2tog`, `lib-ssk`, `lib-yo`, `lib-cableL`, `lib-cableR`

### Haft krzyżykowy

`lib-xfull` (pełny krzyż), `lib-xhalf` (pół krzyż), `lib-xquarter` (ćwierć), `lib-back` (backstitch).

### Haft tradycyjny

`lib-chain`, `lib-french` (supełek francuski), `lib-satin`, `lib-stem`.

### Geometryczne

`lib-circle`, `lib-circleF` (filled), `lib-square`, `lib-squareF`, `lib-triangle`, `lib-diamond`, `lib-hex`, `lib-star`, `lib-cross`, `lib-plus`.

### Dekoracyjne

`lib-heart`, `lib-flower`, `lib-leaf`, `lib-snowflake`, `lib-sun`, `lib-moon`, `lib-wave`, `lib-dot`.

## Domyślna paleta kolorów

Te kolory są dostępne w nowo tworzonych wzorach. Jeśli LLM modyfikuje istniejący wzór, używa istniejących `id`, ale przy tworzeniu od zera może użyć tych:

| `id`       | Nazwa         | Hex       |
|------------|---------------|-----------|
| `base`     | Kremowy       | `#F5EDE0` |
| `pink`     | Pudrowy róż   | `#E8B4B8` |
| `rose`     | Bordo         | `#C97B84` |
| `sage`     | Szałwia       | `#A8B89C` |
| `mustard`  | Musztardowy   | `#C9A961` |
| `lavender` | Lawenda       | `#B8A8D4` |

`base` jest specjalny: zawsze `isBase: true`, zawsze `colors[0]`.

## Przepis na nowy kolor

Każdy nowy kolor musi mieć:
- unikalny `id` (kebab-case, np. `"mint"`, `"navy-blue"`)
- niepustą `name`
- `hex` w formacie `#RRGGBB` (7 znaków razem z `#`)
- `isBase: false`

LLM może wymyślić kolor adekwatny do opisu („mietowy" → `#A6E5D2`, „granatowy" → `#1F2D5C`).

## Trzy strategie tworzenia wzoru

### Strategia A — modyfikacja istniejącego przykładu (zalecana)

1. Zacznij od `examples/scarf-stripes.wzor`, `examples/square-sampler.wzor` itp.
2. Zmień `name`, `id`, `createdAt`, `updatedAt`.
3. Dostosuj `colors` (dodaj/usuń, zmień hexy).
4. Zmień `rows` (dodaj/usuń wiersze, przemaluj komórki).
5. Sprawdź niezmienniki (lista wyżej).

### Strategia B — generowanie od zera

1. Zacznij od pustej struktury (patrz `Minimalny szkielet` poniżej).
2. Wypełnij `colors` (zawsze z `base` jako pierwszy).
3. Wygeneruj `rows[]` programowo (np. dla pasiastego szalika 12×30):
   - 30 wierszy
   - długość każdego = 12
   - direction naprzemiennie rtl/ltr
   - komórki = `sc` z naprzemiennym colorId co N wierszy
4. Daj `customStitches: []`.

### Strategia C — wzór z custom stitches

1. Zaplanuj custom stitches: ile ich będzie, jakie kody, jakie symbole.
2. Zarejestruj je w `customStitches[]`:
   ```json
   {
     "key": "custom:bobble01",
     "code": "Bo",
     "labelPl": "bobel",
     "symbolRef": "lib-bobble",
     "createdAt": "2026-04-27T20:00:00.000Z"
   }
   ```
3. W `cells[]` użyj `"stitch": "custom:bobble01"`.
4. Sprawdź unikalność `code` i brak kolizji z built-in.

## Minimalny szkielet (pusta siatka 5×1)

```json
{
  "id": "skeleton-001",
  "name": "Pusty wzór",
  "schemaVersion": 2,
  "createdAt": "2026-04-27T20:00:00.000Z",
  "updatedAt": "2026-04-27T20:00:00.000Z",
  "displayMode": "symbol",
  "colors": [
    { "id": "base", "name": "Kremowy", "hex": "#F5EDE0", "isBase": true }
  ],
  "rows": [
    {
      "id": "r1",
      "direction": "rtl",
      "cells": [null, null, null, null, null]
    }
  ],
  "customStitches": []
}
```

## Przykład 1 — kwadrat 4×4 z naprzemiennym rzędem

```json
{
  "id": "demo-square-4x4",
  "name": "Kwadrat 4×4",
  "schemaVersion": 2,
  "createdAt": "2026-04-27T20:00:00.000Z",
  "updatedAt": "2026-04-27T20:00:00.000Z",
  "displayMode": "symbol",
  "colors": [
    { "id": "base", "name": "Kremowy", "hex": "#F5EDE0", "isBase": true },
    { "id": "rose", "name": "Bordo",   "hex": "#C97B84", "isBase": false }
  ],
  "rows": [
    { "id": "r1", "direction": "rtl", "cells": [
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" }
    ] },
    { "id": "r2", "direction": "ltr", "cells": [
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" }
    ] },
    { "id": "r3", "direction": "rtl", "cells": [
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" }
    ] },
    { "id": "r4", "direction": "ltr", "cells": [
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" },
      { "stitch": "sc", "colorId": "rose" }
    ] }
  ],
  "customStitches": []
}
```

## Przykład 2 — szalik z custom stitch

```json
{
  "id": "demo-scarf-custom",
  "name": "Szalik z popcornem",
  "schemaVersion": 2,
  "createdAt": "2026-04-27T20:00:00.000Z",
  "updatedAt": "2026-04-27T20:00:00.000Z",
  "displayMode": "symbol",
  "colors": [
    { "id": "base",    "name": "Kremowy", "hex": "#F5EDE0", "isBase": true },
    { "id": "mustard", "name": "Musztardowy", "hex": "#C9A961", "isBase": false }
  ],
  "rows": [
    { "id": "r1", "direction": "rtl", "cells": [
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" }
    ] },
    { "id": "r2", "direction": "ltr", "cells": [
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "custom:popcorn1", "colorId": "mustard" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "custom:popcorn1", "colorId": "mustard" },
      { "stitch": "sc", "colorId": "base" }
    ] },
    { "id": "r3", "direction": "rtl", "cells": [
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" },
      { "stitch": "sc", "colorId": "base" }
    ] }
  ],
  "customStitches": [
    {
      "key": "custom:popcorn1",
      "code": "Po",
      "labelPl": "popcorn",
      "labelEn": "popcorn",
      "symbolRef": "lib-popcorn",
      "createdAt": "2026-04-27T20:00:00.000Z"
    }
  ]
}
```

## Najczęstsze błędy LLM (i jak ich uniknąć)

1. **`schemaVersion: 1`** zamiast `2` — zawsze 2. Stare pliki też się wczytają, ale generuj 2.
2. **Różna długość wierszy** — wszystkie `rows[].cells` muszą mieć tę samą długość. Kontroluj programowo.
3. **`colors[0].isBase: false`** — pierwszy kolor MUSI mieć `isBase: true`.
4. **Drugi kolor z `isBase: true`** — TYLKO `colors[0]` ma `isBase: true`.
5. **`colorId` którego nie ma w `colors[]`** — w komórkach używaj tylko zadeklarowanych ID.
6. **`stitch: "custom:abc"` bez wpisu w `customStitches[]`** — sierota.
7. **Custom code = `sc`** — kolizja z built-in.
8. **Daty bez offsetu** (`"2026-04-27"` zamiast `"2026-04-27T20:00:00.000Z"`) — Zod wymaga datetime z offsetem.
9. **Polskie litery w `customStitches[].code`** — tylko ASCII A-Z.
10. **`hex: "F5EDE0"`** bez `#` — musi być `"#F5EDE0"`.

## Walidacja po stronie aplikacji

Plik `.wzor` jest walidowany przez `parsePatternJson()` (`src/domain/validation.ts`) z użyciem Zod. Aplikacja:
1. Próbuje sparsować jako schemaVersion 2.
2. Jeśli to nie jest v2, próbuje v1 i migruje.
3. Sprawdza unikalność/kolizje custom stitches.
4. Czyści sieroce referencje (toast).
5. Wyrzuca `PatternFileError` z polskim opisem przy fatalnym błędzie.

LLM może uruchomić walidację offline (jeśli ma dostęp do node + repo):

```bash
node -e "const { parsePatternJson } = require('./src/domain/validation'); console.log(parsePatternJson(require('fs').readFileSync(process.argv[1], 'utf8')))" my-pattern.wzor
```

## Końcowa lista kontrolna

Zanim zwrócisz plik użytkownikowi, sprawdź:

- [ ] `schemaVersion === 2`
- [ ] `colors[0].isBase === true`, reszta `colors[].isBase === false`
- [ ] Wszystkie wiersze mają tę samą długość
- [ ] Każda `cell.colorId` istnieje w `colors[]`
- [ ] Każda `cell.stitch === "custom:..."` ma wpis w `customStitches[]`
- [ ] Brak duplikatów `customStitches[].key` i `.code`
- [ ] Żaden `customStitches[].code` nie koliduje z built-in
- [ ] `name`, wszystkie `id`, hexy są niepuste
- [ ] Daty w ISO 8601 z offsetem
- [ ] JSON jest poprawny składniowo
