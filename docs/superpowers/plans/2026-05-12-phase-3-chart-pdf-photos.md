# Phase 3 — Chart + PDF + Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the chart rendering engine (vintage hand-drawn SVG via Rough.js), the photo handling layer (upload + browser-side resize + attachment), the PDF generation pipeline (react-pdf with 5 sale-ready pages — Title, Thanks, Information, Pattern, Legend), and the export-to-disk action — turning the graph editor into a working Etsy-grade pattern producer.

**Architecture:** Add `src/chart/` for SVG generation (symbol library, Rough.js wobble, radial + linear renderers, preview component). Add `src/photos/` for upload/resize/store. Add `src/pdf/` for theme, base components, and the 5-page Document model using `@react-pdf/renderer`. Add `src/instructions/` for auto-generated text from graph. Wire it all together in `src/editor/GraphEditorShell.tsx`'s top toolbar (Export PDF action) and a new `PdfPreviewView`. **Customization page is deferred to Phase 4** alongside garment templates.

**Tech Stack:** `roughjs@^4.6`, `@react-pdf/renderer@^4`, React 19, TypeScript strict, Vitest + jsdom. Photo resize uses browser Canvas API (no Rust sidecar in Phase 3; Rust integration is Phase 5 hardening). Saving uses existing `@tauri-apps/plugin-fs` writeFile API.

**Source spec:** `docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md` (sections §6 Chart, §8 Photos, §9 PDF, §18.1–18.4 stitch taxonomy & terminology).

**Working branch:** `feature/pdf-pattern-designer` (continues from Phase 1+2).

---

## File Structure

### Files created

| Path | Responsibility |
|---|---|
| `src/chart/symbols.ts` | Built-in stitch type → SVG path/glyph mapping (vintage hand-drawn variant). |
| `src/chart/roughen.ts` | Rough.js helper applying deterministic per-stitch wobble. |
| `src/chart/renderRadial.tsx` | React/SVG component that renders a radial pattern as a hand-drawn chart. |
| `src/chart/renderLinear.tsx` | Same for rectangular patterns. |
| `src/chart/ChartPreview.tsx` | Top-level switcher — picks radial or linear based on `pattern.shape`. |
| `src/photos/types.ts` | Photo-related types (`PhotoVariants`, `ImportResult`). |
| `src/photos/importer.ts` | File picker / drag-drop import flow. |
| `src/photos/resize.ts` | Browser Canvas API resize to print + preview variants. |
| `src/photos/photoStore.ts` | Zustand store managing photos by id, with helpers to attach/detach from stitches. |
| `src/photos/PhotoAttachmentPicker.tsx` | UI in inspector to attach photos to selected stitch. |
| `src/instructions/types.ts` | Output types (`InstructionLine`, `RoundInstruction`). |
| `src/instructions/generate.ts` | Walks graph and produces human-readable per-round instructions. |
| `src/instructions/formatPL.ts` | Polish phrasing templates. |
| `src/instructions/formatEN.ts` | English (US) phrasing templates. |
| `src/pdf/theme.ts` | Color/font/spacing tokens for `@react-pdf/renderer`. |
| `src/pdf/components/Heading.tsx` | Display heading with underline rule. |
| `src/pdf/components/RuleOrnament.tsx` | Decorative horizontal rule. |
| `src/pdf/components/AbbreviationsTable.tsx` | Auto-populated stitch abbreviation table. |
| `src/pdf/components/PhotoFigure.tsx` | Photo + caption layout. |
| `src/pdf/components/DiagramFigure.tsx` | Embeds chart SVG into PDF. |
| `src/pdf/pages/TitlePage.tsx` | Front cover. |
| `src/pdf/pages/ThanksPage.tsx` | Copyright + brand info. |
| `src/pdf/pages/InformationPage.tsx` | Yarn / hook / gauge / abbreviations / symbol legend. |
| `src/pdf/pages/PatternPage.tsx` | Instructions + chart + photos. |
| `src/pdf/pages/LegendPage.tsx` | Custom-stitch definitions. |
| `src/pdf/PatternDocument.tsx` | Top-level `<Document>` assembling enabled pages. |
| `src/pdf/exportPdf.ts` | Renders Document to Blob and saves via Tauri. |
| `src/views/PdfPreviewView.tsx` | Live preview window using react-pdf's PDFViewer. |
| Test files | One `.test.ts(x)` per source file (snapshot tests for charts, unit for store/instructions, mock-driven for PDF and export). |

### Files modified

| Path | Change |
|---|---|
| `package.json` | Add `roughjs@^4.6.6`, `@react-pdf/renderer@^4.1.0`; bump version to `0.5.0-alpha.0` at end. |
| `src/editor/GraphEditorShell.tsx` | Add "Export PDF" and "Preview PDF" toolbar buttons. |
| `src/editor/Inspector.tsx` | Add photo attachment panel for the selected stitch. |

### Out of scope (Phase 4)

- Customization page in PDF + garment template library.
- Educational layer (hover highlight, animated yarn path, tutorial overlay).
- Rust sidecar for high-quality photo resize.

---

## Conventions

- TDD per task; commit after each green test cycle.
- No mutations; pure functions in `chart/`, `instructions/`, `photos/resize.ts`.
- ES2020 target; no `.at()`.
- Inline styles in PDF components (react-pdf doesn't support CSS files).
- Mock `@tauri-apps/plugin-fs` and `@tauri-apps/plugin-dialog` in tests.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (deps only — no version bump yet)

- [ ] **Step 1: Install**

```bash
npm install --save roughjs@^4.6.6 @react-pdf/renderer@^4.1.0
```

- [ ] **Step 2: Verify**

```bash
cat package.json | grep -E "roughjs|react-pdf"
```
Expected: both present.

- [ ] **Step 3: Smoke test**

Create `src/chart/deps.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('Phase 3 dependencies', () => {
  it('roughjs imports', async () => {
    const r = await import('roughjs');
    expect(typeof r.default).toBeTruthy();
  });

  it('@react-pdf/renderer imports', async () => {
    const p = await import('@react-pdf/renderer');
    expect(typeof p.Document).toBe('function');
    expect(typeof p.Page).toBe('function');
  });
});
```

- [ ] **Step 4: Run test**

`npm test -- src/chart/deps.test.ts` → 2 passing.

- [ ] **Step 5: Build + typecheck**

`npm run typecheck && npm run build` → clean.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/chart/deps.test.ts
git commit -m "feat(deps): install roughjs and @react-pdf/renderer for Phase 3"
```

---

## Task 2: Stitch symbol library

**Files:**
- Create: `src/chart/symbols.ts`
- Create: `src/chart/symbols.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/chart/symbols.test.ts
import { describe, it, expect } from 'vitest';
import { symbolForBuiltin, symbolForCustom, type SymbolGlyph } from './symbols';
import type { CustomStitch } from '../domain/graph/types';

describe('symbolForBuiltin', () => {
  it('returns a glyph for sc', () => {
    const g = symbolForBuiltin('sc');
    expect(g.text).toBe('×');
    expect(g.width).toBeGreaterThan(0);
    expect(g.height).toBeGreaterThan(0);
  });

  it('returns the dc T-glyph', () => {
    expect(symbolForBuiltin('dc').text).toBe('⊤');
  });

  it('returns the magic_ring glyph (small circle)', () => {
    expect(symbolForBuiltin('magic_ring').text).toBe('○');
  });

  it('returns a glyph for every builtin type', () => {
    const types = ['ch', 'sl_st', 'sc', 'hdc', 'dc', 'tr', 'gr_st', 'magic_ring', 'fasten_off'] as const;
    for (const t of types) {
      expect(symbolForBuiltin(t)).toBeTruthy();
      expect(symbolForBuiltin(t).text.length).toBeGreaterThan(0);
    }
  });
});

describe('symbolForCustom', () => {
  it('uses the shortCode when no preset/svg path is given', () => {
    const cs: CustomStitch = {
      id: 'cs-1',
      shortCode: 'HC',
      nameByLanguage: { pl: 'X', en: 'Y' },
      symbol: { kind: 'preset', presetId: 'shell' },
    };
    const g = symbolForCustom(cs);
    expect(g.text.toLowerCase()).toContain('hc');
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/chart/symbols.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/chart/symbols.ts
import type { BuiltinStitchType, CustomStitch } from '../domain/graph/types';

export interface SymbolGlyph {
  /** Unicode glyph or short text used to render the stitch. */
  text: string;
  width: number;
  height: number;
}

const BUILTIN_GLYPHS: Record<BuiltinStitchType, SymbolGlyph> = {
  ch:          { text: '∞',  width: 16, height: 12 },
  sl_st:       { text: '•',  width: 8,  height: 8  },
  sc:          { text: '×',  width: 14, height: 14 },
  hdc:         { text: 'Ŧ',  width: 14, height: 18 },
  dc:          { text: '⊤',  width: 14, height: 20 },
  tr:          { text: '⊤',  width: 14, height: 24 },
  gr_st:       { text: '≣',  width: 16, height: 20 },
  magic_ring:  { text: '○',  width: 18, height: 18 },
  fasten_off:  { text: '↗',  width: 14, height: 14 },
};

export function symbolForBuiltin(type: BuiltinStitchType): SymbolGlyph {
  return BUILTIN_GLYPHS[type];
}

export function symbolForCustom(stitch: CustomStitch): SymbolGlyph {
  return {
    text: stitch.shortCode,
    width: 18,
    height: 18,
  };
}
```

- [ ] **Step 4: Pass + full suite + typecheck**

```bash
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/chart/symbols.ts src/chart/symbols.test.ts
git commit -m "feat(chart): stitch symbol library — text glyphs per builtin type"
```

---

## Task 3: Rough.js wobble helper

**Files:**
- Create: `src/chart/roughen.ts`
- Create: `src/chart/roughen.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/chart/roughen.test.ts
import { describe, it, expect } from 'vitest';
import { makeRoughOptions, hashSeed } from './roughen';

describe('roughen helpers', () => {
  it('hashSeed produces a stable integer per string', () => {
    expect(hashSeed('stitch-1')).toBe(hashSeed('stitch-1'));
    expect(hashSeed('stitch-1')).not.toBe(hashSeed('stitch-2'));
  });

  it('hashSeed returns a non-negative integer', () => {
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashSeed('abc'))).toBe(true);
  });

  it('makeRoughOptions includes the seed', () => {
    const opts = makeRoughOptions('stitch-7');
    expect(opts.seed).toBe(hashSeed('stitch-7'));
    expect(opts.roughness).toBeGreaterThan(0);
    expect(opts.bowing).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/chart/roughen.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/chart/roughen.ts
import type { Options as RoughOptions } from 'roughjs/bin/core';

export const ROUGHNESS = 1.2;
export const BOWING = 0.8;

/** Deterministic 31-bit integer hash for a string (used as Rough.js seed). */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

export function makeRoughOptions(seedSource: string): RoughOptions {
  return {
    roughness: ROUGHNESS,
    bowing: BOWING,
    seed: hashSeed(seedSource),
    stroke: '#3a2f1d',
    strokeWidth: 1.0,
  };
}
```

- [ ] **Step 4: Pass + full suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/chart/roughen.ts src/chart/roughen.test.ts
git commit -m "feat(chart): deterministic Rough.js options with per-stitch seeds"
```

---

## Task 4: Radial chart SVG renderer

**Files:**
- Create: `src/chart/renderRadial.tsx`
- Create: `src/chart/renderRadial.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/chart/renderRadial.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderRadialChart } from './renderRadial';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function ringPattern(): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0, position: { x: 0, y: 0 } });
  const a = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1, position: { x: 80, y: 0 } });
  const b = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1, position: { x: -80, y: 0 } });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, a, b],
    edges: [
      newAnchorEdge(a.id, { kind: 'magic_ring' }),
      newAnchorEdge(b.id, { kind: 'magic_ring' }),
    ],
  };
}

describe('renderRadialChart', () => {
  it('returns an SVG element for a non-empty pattern', () => {
    const svg = renderRadialChart(ringPattern());
    const { container } = render(<>{svg}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders one text glyph per stitch', () => {
    const svg = renderRadialChart(ringPattern());
    const { container } = render(<>{svg}</>);
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(3);
  });

  it('returns an empty SVG for an empty pattern', () => {
    const empty = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const svg = renderRadialChart({ ...empty, shape: 'radial' });
    const { container } = render(<>{svg}</>);
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/chart/renderRadial.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/chart/renderRadial.tsx
import type { Pattern } from '../domain/graph/types';
import { symbolForBuiltin, symbolForCustom } from './symbols';

const PADDING = 32;
const VIEWBOX_MIN = 200;

/**
 * Render a pattern's radial chart as a React SVG element.
 *
 * Stitches must have positions set (use `applyLayout` first). The output
 * SVG is sized to fit all stitches with padding.
 */
export function renderRadialChart(pattern: Pattern): JSX.Element {
  const positioned = pattern.stitches.filter((s) => s.position);
  if (positioned.length === 0) {
    return <svg width={VIEWBOX_MIN} height={VIEWBOX_MIN} viewBox={`0 0 ${VIEWBOX_MIN} ${VIEWBOX_MIN}`} />;
  }

  const xs = positioned.map((s) => s.position!.x);
  const ys = positioned.map((s) => s.position!.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const maxY = Math.max(...ys) + PADDING;
  const w = Math.max(maxX - minX, VIEWBOX_MIN);
  const h = Math.max(maxY - minY, VIEWBOX_MIN);

  function glyph(stitch: typeof positioned[number]): string {
    if (stitch.typeRef.kind === 'builtin') {
      return symbolForBuiltin(stitch.typeRef.type).text;
    }
    const cs = pattern.customStitches.find((c) => c.id === stitch.typeRef.id);
    return cs ? symbolForCustom(cs).text : '?';
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`${minX} ${minY} ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {positioned.map((s) => (
        <text
          key={s.id}
          x={s.position!.x}
          y={s.position!.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#3a2f1d"
          fontSize={16}
        >
          {glyph(s)}
        </text>
      ))}
    </svg>
  );
}
```

NOTE: The Rough.js path drawing for `gr_st` "fishbone" + lines between anchors is deferred to a polish pass in Phase 4. Phase 3's chart is minimal — text glyphs at positions. This still produces a recognizable chart figure for the PDF.

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/chart/renderRadial.tsx src/chart/renderRadial.test.tsx
git commit -m "feat(chart): renderRadialChart producing SVG with text glyphs at positions"
```

---

## Task 5: Linear chart SVG renderer

**Files:**
- Create: `src/chart/renderLinear.tsx`
- Create: `src/chart/renderLinear.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/chart/renderLinear.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderLinearChart } from './renderLinear';
import { emptyPatternV3, newStitch } from '../domain/graph/build';

describe('renderLinearChart', () => {
  it('renders SVG with text glyphs for a row of stitches', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0, position: { x: 0, y: 0 } });
    const b = newStitch({ kind: 'builtin', type: 'dc' }, { round: 0, position: { x: 60, y: 0 } });
    const linearPattern = { ...p, shape: 'rectangular' as const, stitches: [a, b] };
    const svg = renderLinearChart(linearPattern);
    const { container } = render(<>{svg}</>);
    expect(container.querySelectorAll('text').length).toBe(2);
  });

  it('handles empty patterns', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const svg = renderLinearChart({ ...p, shape: 'rectangular' as const });
    const { container } = render(<>{svg}</>);
    expect(container.querySelectorAll('text').length).toBe(0);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/chart/renderLinear.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/chart/renderLinear.tsx
import type { Pattern } from '../domain/graph/types';
import { symbolForBuiltin, symbolForCustom } from './symbols';

const PADDING = 24;
const VIEWBOX_MIN_W = 240;
const VIEWBOX_MIN_H = 120;

export function renderLinearChart(pattern: Pattern): JSX.Element {
  const positioned = pattern.stitches.filter((s) => s.position);
  if (positioned.length === 0) {
    return <svg width={VIEWBOX_MIN_W} height={VIEWBOX_MIN_H} viewBox={`0 0 ${VIEWBOX_MIN_W} ${VIEWBOX_MIN_H}`} />;
  }

  const xs = positioned.map((s) => s.position!.x);
  const ys = positioned.map((s) => s.position!.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const maxY = Math.max(...ys) + PADDING;
  const w = Math.max(maxX - minX, VIEWBOX_MIN_W);
  const h = Math.max(maxY - minY, VIEWBOX_MIN_H);

  function glyph(stitch: typeof positioned[number]): string {
    if (stitch.typeRef.kind === 'builtin') {
      return symbolForBuiltin(stitch.typeRef.type).text;
    }
    const cs = pattern.customStitches.find((c) => c.id === stitch.typeRef.id);
    return cs ? symbolForCustom(cs).text : '?';
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`${minX} ${minY} ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {positioned.map((s) => (
        <text
          key={s.id}
          x={s.position!.x}
          y={s.position!.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#3a2f1d"
          fontSize={16}
        >
          {glyph(s)}
        </text>
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/chart/renderLinear.tsx src/chart/renderLinear.test.tsx
git commit -m "feat(chart): renderLinearChart for rectangular patterns"
```

---

## Task 6: Chart preview component

**Files:**
- Create: `src/chart/ChartPreview.tsx`
- Create: `src/chart/ChartPreview.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/chart/ChartPreview.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartPreview } from './ChartPreview';
import { emptyPatternV3, newStitch } from '../domain/graph/build';

describe('ChartPreview', () => {
  it('renders an SVG for radial pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0, position: { x: 0, y: 0 } });
    const radial = { ...p, shape: 'radial' as const, stitches: [ring] };
    const { container } = render(<ChartPreview pattern={radial} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders for rectangular pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0, position: { x: 0, y: 0 } });
    const rect = { ...p, shape: 'rectangular' as const, stitches: [s] };
    const { container } = render(<ChartPreview pattern={rect} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/chart/ChartPreview.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/chart/ChartPreview.tsx
import type { Pattern } from '../domain/graph/types';
import { renderRadialChart } from './renderRadial';
import { renderLinearChart } from './renderLinear';

interface Props {
  pattern: Pattern;
}

export function ChartPreview({ pattern }: Props) {
  switch (pattern.shape) {
    case 'radial':
      return renderRadialChart(pattern);
    case 'rectangular':
      return renderLinearChart(pattern);
    case 'freeform':
      return renderRadialChart(pattern); // freeform reuses radial geometry
  }
}
```

- [ ] **Step 4: Pass + suite** → green.

- [ ] **Step 5: Commit**

```bash
git add src/chart/ChartPreview.tsx src/chart/ChartPreview.test.tsx
git commit -m "feat(chart): ChartPreview routing radial/linear based on pattern.shape"
```

---

## Task 7: Photo types + resize utility

**Files:**
- Create: `src/photos/types.ts`
- Create: `src/photos/resize.ts`
- Create: `src/photos/resize.test.ts`

- [ ] **Step 1: Types**

```ts
// src/photos/types.ts
import type { Photo } from '../domain/graph/types';

export interface PhotoVariants {
  preview: { base64: string; width: number; height: number };
  print:   { base64: string; width: number; height: number };
}

export interface ImportResult {
  photo: Photo;
  variants: PhotoVariants;
}

export const PREVIEW_MAX_EDGE = 800;
export const PRINT_MAX_EDGE = 3000;
```

- [ ] **Step 2: Failing tests for resize**

```ts
// src/photos/resize.test.ts
import { describe, it, expect } from 'vitest';
import { computeResizedDimensions } from './resize';

describe('computeResizedDimensions', () => {
  it('returns input dimensions when already smaller than maxEdge', () => {
    expect(computeResizedDimensions(400, 300, 800)).toEqual({ width: 400, height: 300 });
  });

  it('scales down by long edge when wider than tall', () => {
    const r = computeResizedDimensions(2000, 1000, 800);
    expect(r.width).toBe(800);
    expect(r.height).toBe(400);
  });

  it('scales down by long edge when taller than wide', () => {
    const r = computeResizedDimensions(1000, 2000, 800);
    expect(r.width).toBe(400);
    expect(r.height).toBe(800);
  });

  it('handles square images', () => {
    const r = computeResizedDimensions(1500, 1500, 800);
    expect(r.width).toBe(800);
    expect(r.height).toBe(800);
  });
});
```

- [ ] **Step 3: Verify fail** → `npm test -- src/photos/resize.test.ts`

- [ ] **Step 4: Implement**

```ts
// src/photos/resize.ts
export interface ResizedDims {
  width: number;
  height: number;
}

/** Compute resized dimensions preserving aspect ratio, clamped to maxEdge. */
export function computeResizedDimensions(
  width: number,
  height: number,
  maxEdge: number,
): ResizedDims {
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  const longEdge = Math.max(width, height);
  const ratio = maxEdge / longEdge;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Resize an image (loaded from a File or Blob URL) to the given long-edge max.
 * Returns a base64-encoded JPEG.
 */
export async function resizeImageToBase64(
  source: HTMLImageElement,
  maxEdge: number,
  quality: number,
): Promise<{ base64: string; width: number; height: number }> {
  const dims = computeResizedDimensions(source.naturalWidth, source.naturalHeight, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(source, 0, 0, dims.width, dims.height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  return { base64, width: dims.width, height: dims.height };
}
```

- [ ] **Step 5: Pass** → 4 passing.

- [ ] **Step 6: Full suite + typecheck** → green.

- [ ] **Step 7: Commit**

```bash
git add src/photos/types.ts src/photos/resize.ts src/photos/resize.test.ts
git commit -m "feat(photos): types and Canvas-based resize utility"
```

---

## Task 8: Photo store

**Files:**
- Create: `src/photos/photoStore.ts`
- Create: `src/photos/photoStore.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/photos/photoStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoStore } from './photoStore';

const samplePhoto = {
  id: 'p-1',
  storage: { kind: 'inline' as const, base64: 'XYZ', mime: 'image/jpeg' },
  width: 100,
  height: 100,
  bytes: 1024,
};

describe('photoStore', () => {
  beforeEach(() => {
    usePhotoStore.getState().reset();
  });

  it('starts empty', () => {
    expect(usePhotoStore.getState().photos).toEqual([]);
  });

  it('addPhoto appends', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    expect(usePhotoStore.getState().photos).toHaveLength(1);
  });

  it('removePhoto filters by id', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    usePhotoStore.getState().removePhoto('p-1');
    expect(usePhotoStore.getState().photos).toEqual([]);
  });

  it('getPhoto returns by id', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    expect(usePhotoStore.getState().getPhoto('p-1')).toEqual(samplePhoto);
    expect(usePhotoStore.getState().getPhoto('nope')).toBeUndefined();
  });

  it('reset clears the store', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    usePhotoStore.getState().reset();
    expect(usePhotoStore.getState().photos).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/photos/photoStore.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/photos/photoStore.ts
import { create } from 'zustand';
import type { Photo, PhotoId } from '../domain/graph/types';

interface PhotoStore {
  photos: Photo[];
  addPhoto(photo: Photo): void;
  removePhoto(id: PhotoId): void;
  getPhoto(id: PhotoId): Photo | undefined;
  reset(): void;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],

  addPhoto(photo) {
    set((s) => ({ photos: [...s.photos, photo] }));
  },

  removePhoto(id) {
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
  },

  getPhoto(id) {
    return get().photos.find((p) => p.id === id);
  },

  reset() {
    set({ photos: [] });
  },
}));
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/photos/photoStore.ts src/photos/photoStore.test.ts
git commit -m "feat(photos): photoStore (Zustand) with add/remove/get"
```

---

## Task 9: Auto-instruction generator

**Files:**
- Create: `src/instructions/types.ts`
- Create: `src/instructions/generate.ts`
- Create: `src/instructions/generate.test.ts`

- [ ] **Step 1: Types**

```ts
// src/instructions/types.ts
export interface RoundInstruction {
  round: number;
  textPl: string;
  textEn: string;
  stitchCount: number;
}
```

- [ ] **Step 2: Failing tests**

```ts
// src/instructions/generate.test.ts
import { describe, it, expect } from 'vitest';
import { generateInstructions } from './generate';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function magicRingRound1(stitchType: 'sc' | 'dc' = 'sc', count = 6): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
  const stitches = [ring];
  const edges = [];
  for (let i = 0; i < count; i++) {
    const s = newStitch({ kind: 'builtin', type: stitchType }, { round: 1 });
    stitches.push(s);
    edges.push(newAnchorEdge(s.id, { kind: 'magic_ring' }));
  }
  return { ...p, shape: 'radial', stitches, edges };
}

describe('generateInstructions', () => {
  it('returns one entry per non-zero round', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out).toHaveLength(2); // round 0 + round 1
  });

  it('round 0 (magic_ring) reads as start-of-pattern', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out[0]!.round).toBe(0);
    expect(out[0]!.textEn.toLowerCase()).toContain('magic ring');
  });

  it('round 1 reports the stitch count', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out[1]!.stitchCount).toBe(6);
    expect(out[1]!.textEn).toContain('6');
  });

  it('groups consecutive same-type stitches', () => {
    const p = magicRingRound1('dc', 12);
    const out = generateInstructions(p);
    expect(out[1]!.textEn.toLowerCase()).toContain('dc');
    expect(out[1]!.textEn).toContain('12');
  });

  it('returns empty array for empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    expect(generateInstructions(p)).toEqual([]);
  });
});
```

- [ ] **Step 3: Verify fail** → `npm test -- src/instructions/generate.test.ts`

- [ ] **Step 4: Implement**

```ts
// src/instructions/generate.ts
import type { Pattern, BuiltinStitchType } from '../domain/graph/types';
import type { RoundInstruction } from './types';

const PL_NAMES: Record<BuiltinStitchType, { singular: string; plural: string }> = {
  ch:          { singular: 'oczko powietrzne', plural: 'oczek powietrznych' },
  sl_st:       { singular: 'oczko ścisłe',     plural: 'oczek ścisłych' },
  sc:          { singular: 'półsłupek',        plural: 'półsłupków' },
  hdc:         { singular: 'półsłupek z narzutem', plural: 'półsłupków z narzutem' },
  dc:          { singular: 'słupek',           plural: 'słupków' },
  tr:          { singular: 'słupek podwójny',  plural: 'słupków podwójnych' },
  gr_st:       { singular: 'pęczek (gr st)',   plural: 'pęczków (gr st)' },
  magic_ring:  { singular: 'magic ring',       plural: 'magic ring' },
  fasten_off:  { singular: 'fasten off',       plural: 'fasten off' },
};

const EN_NAMES: Record<BuiltinStitchType, { abbrev: string; full: string }> = {
  ch:          { abbrev: 'ch',    full: 'chain' },
  sl_st:       { abbrev: 'sl st', full: 'slip stitch' },
  sc:          { abbrev: 'sc',    full: 'single crochet' },
  hdc:         { abbrev: 'hdc',   full: 'half double crochet' },
  dc:          { abbrev: 'dc',    full: 'double crochet' },
  tr:          { abbrev: 'tr',    full: 'treble crochet' },
  gr_st:       { abbrev: 'gr st', full: 'granny stitch' },
  magic_ring:  { abbrev: 'mr',    full: 'magic ring' },
  fasten_off:  { abbrev: 'fo',    full: 'fasten off' },
};

function dominantType(stitches: Pattern['stitches']): BuiltinStitchType | null {
  const counts = new Map<BuiltinStitchType, number>();
  for (const s of stitches) {
    if (s.typeRef.kind !== 'builtin') continue;
    counts.set(s.typeRef.type, (counts.get(s.typeRef.type) ?? 0) + 1);
  }
  let max = 0;
  let dom: BuiltinStitchType | null = null;
  for (const [t, n] of counts) {
    if (n > max) { max = n; dom = t; }
  }
  return dom;
}

export function generateInstructions(pattern: Pattern): RoundInstruction[] {
  const out: RoundInstruction[] = [];
  const byRound = new Map<number, Pattern['stitches']>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const arr = byRound.get(s.round) ?? [];
    arr.push(s);
    byRound.set(s.round, arr);
  }

  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const r of rounds) {
    const stitches = byRound.get(r)!;
    if (r === 0) {
      const hasMagicRing = stitches.some(
        (s) => s.typeRef.kind === 'builtin' && s.typeRef.type === 'magic_ring',
      );
      out.push({
        round: 0,
        textPl: hasMagicRing ? 'Rozpocznij magic ring.' : 'Rozpocznij łańcuszek bazowy.',
        textEn: hasMagicRing ? 'Start with a magic ring.' : 'Start with a foundation chain.',
        stitchCount: stitches.length,
      });
      continue;
    }
    const t = dominantType(stitches);
    if (!t) {
      out.push({ round: r, textPl: `Runda ${r}.`, textEn: `Round ${r}.`, stitchCount: stitches.length });
      continue;
    }
    const count = stitches.length;
    const pl = PL_NAMES[t];
    const en = EN_NAMES[t];
    out.push({
      round: r,
      textPl: `Runda ${r}: ${count} ${pl.plural}.`,
      textEn: `Round ${r}: ${count} ${en.abbrev}.`,
      stitchCount: count,
    });
  }
  return out;
}
```

- [ ] **Step 5: Pass + suite + typecheck** → green.

- [ ] **Step 6: Commit**

```bash
git add src/instructions/types.ts src/instructions/generate.ts src/instructions/generate.test.ts
git commit -m "feat(instructions): auto-generate per-round instructions in PL/EN"
```

---

## Task 10: PDF theme tokens

**Files:**
- Create: `src/pdf/theme.ts`
- Create: `src/pdf/theme.test.ts`

- [ ] **Step 1: Failing test**

```ts
// src/pdf/theme.test.ts
import { describe, it, expect } from 'vitest';
import { pdfTheme } from './theme';

describe('pdfTheme', () => {
  it('exposes color tokens', () => {
    expect(pdfTheme.colors.paper).toMatch(/^#/);
    expect(pdfTheme.colors.ink).toMatch(/^#/);
    expect(pdfTheme.colors.accent).toMatch(/^#/);
  });

  it('exposes font family strings', () => {
    expect(typeof pdfTheme.fonts.body).toBe('string');
    expect(typeof pdfTheme.fonts.display).toBe('string');
  });

  it('exposes spacing tokens', () => {
    expect(pdfTheme.spacing.page).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf/theme.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/pdf/theme.ts
/**
 * react-pdf theme tokens. Mirror src/editor/theme.ts where possible,
 * but adapted to the constraints of react-pdf's renderer (Helvetica family
 * fallbacks, etc.).
 */
export const pdfTheme = {
  fonts: {
    display: 'Helvetica',  // upgraded to Cormorant Garamond once bundled in Phase 5
    body:    'Helvetica',
    accent:  'Helvetica-Oblique',
  },
  colors: {
    paper:    '#f7f3e8',
    ink:      '#3a2f1d',
    inkSoft:  '#5a4730',
    rule:     '#b8a87a',
    accent:   '#d4831a',
    yarnSeam: '#a89466',
  },
  spacing: {
    page:    32,
    section: 24,
    rule:    16,
  },
  rules: {
    thin:  0.5,
    thick: 1.0,
  },
} as const;

export type PdfTheme = typeof pdfTheme;
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/pdf/theme.ts src/pdf/theme.test.ts
git commit -m "feat(pdf): theme tokens for react-pdf"
```

---

## Task 11: PDF base components

**Files:**
- Create: `src/pdf/components/Heading.tsx`
- Create: `src/pdf/components/RuleOrnament.tsx`
- Create: `src/pdf/components/AbbreviationsTable.tsx`
- Create: `src/pdf/components/PhotoFigure.tsx`
- Create: `src/pdf/components/components.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/pdf/components/components.test.tsx
import { describe, it, expect } from 'vitest';
import { Heading } from './Heading';
import { AbbreviationsTable } from './AbbreviationsTable';

describe('Heading', () => {
  it('exports a function component', () => {
    expect(typeof Heading).toBe('function');
  });
});

describe('AbbreviationsTable', () => {
  it('exports a function component', () => {
    expect(typeof AbbreviationsTable).toBe('function');
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf/components/components.test.tsx`

- [ ] **Step 3: Implement Heading**

```tsx
// src/pdf/components/Heading.tsx
import { Text, View } from '@react-pdf/renderer';
import { pdfTheme } from '../theme';

interface Props {
  children: string;
  kind?: 'display' | 'section';
}

export function Heading({ children, kind = 'section' }: Props) {
  return (
    <View style={{ alignItems: 'center', marginBottom: pdfTheme.spacing.section }}>
      <Text
        style={{
          fontFamily: pdfTheme.fonts.display,
          fontSize: kind === 'display' ? 32 : 22,
          letterSpacing: 2,
          color: pdfTheme.colors.ink,
        }}
      >
        {children}
      </Text>
      <View
        style={{
          width: 60,
          height: 1,
          backgroundColor: pdfTheme.colors.rule,
          marginTop: 6,
        }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Implement RuleOrnament**

```tsx
// src/pdf/components/RuleOrnament.tsx
import { View } from '@react-pdf/renderer';
import { pdfTheme } from '../theme';

export function RuleOrnament() {
  return (
    <View
      style={{
        width: 40,
        height: pdfTheme.rules.thin,
        backgroundColor: pdfTheme.colors.rule,
        marginVertical: pdfTheme.spacing.rule,
        marginHorizontal: 'auto',
      }}
    />
  );
}
```

- [ ] **Step 5: Implement AbbreviationsTable**

```tsx
// src/pdf/components/AbbreviationsTable.tsx
import { Text, View } from '@react-pdf/renderer';
import type { Pattern, BuiltinStitchType } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

const EN_ABBREV: Record<BuiltinStitchType, { abbrev: string; full: string }> = {
  ch:          { abbrev: 'ch',    full: 'chain' },
  sl_st:       { abbrev: 'sl st', full: 'slip stitch' },
  sc:          { abbrev: 'sc',    full: 'single crochet' },
  hdc:         { abbrev: 'hdc',   full: 'half double crochet' },
  dc:          { abbrev: 'dc',    full: 'double crochet' },
  tr:          { abbrev: 'tr',    full: 'treble crochet' },
  gr_st:       { abbrev: 'gr st', full: 'granny stitch (3 dc in same st)' },
  magic_ring:  { abbrev: 'mr',    full: 'magic ring' },
  fasten_off:  { abbrev: 'fo',    full: 'fasten off' },
};

interface Props {
  pattern: Pattern;
}

export function AbbreviationsTable({ pattern }: Props) {
  const usedTypes = new Set<BuiltinStitchType>();
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'builtin') usedTypes.add(s.typeRef.type);
  }
  const entries = [...usedTypes].map((t) => ({ key: t, ...EN_ABBREV[t] }));
  return (
    <View style={{ marginVertical: pdfTheme.spacing.section }}>
      {entries.map((e) => (
        <View key={e.key} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink, width: 60 }}>
            {e.abbrev}
          </Text>
          <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.inkSoft }}>
            = {e.full}
          </Text>
        </View>
      ))}
      {pattern.customStitches.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.accent, width: 60 }}>
            {c.shortCode}
          </Text>
          <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.inkSoft }}>
            = {c.nameByLanguage.en}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 6: Implement PhotoFigure**

```tsx
// src/pdf/components/PhotoFigure.tsx
import { Image, Text, View } from '@react-pdf/renderer';
import type { Photo } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

interface Props {
  photo: Photo;
  caption?: string;
  width?: number;
}

export function PhotoFigure({ photo, caption, width = 200 }: Props) {
  if (photo.storage.kind !== 'inline') {
    return null; // external paths not supported in Phase 3
  }
  const src = `data:${photo.storage.mime};base64,${photo.storage.base64}`;
  return (
    <View style={{ marginVertical: pdfTheme.spacing.rule, alignItems: 'center' }}>
      <Image src={src} style={{ width, height: 'auto' }} />
      {caption && (
        <Text
          style={{
            fontFamily: pdfTheme.fonts.accent,
            fontSize: 9,
            color: pdfTheme.colors.inkSoft,
            marginTop: 4,
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
}
```

- [ ] **Step 7: Pass + suite + typecheck** → green.

- [ ] **Step 8: Commit**

```bash
git add src/pdf/components/
git commit -m "feat(pdf): base components — Heading, RuleOrnament, AbbreviationsTable, PhotoFigure"
```

---

## Task 12: PDF pages (Title, Thanks, Information)

**Files:**
- Create: `src/pdf/pages/TitlePage.tsx`
- Create: `src/pdf/pages/ThanksPage.tsx`
- Create: `src/pdf/pages/InformationPage.tsx`
- Create: `src/pdf/pages/pages.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/pdf/pages/pages.test.tsx
import { describe, it, expect } from 'vitest';
import { TitlePage } from './TitlePage';
import { ThanksPage } from './ThanksPage';
import { InformationPage } from './InformationPage';

describe('PDF pages', () => {
  it('TitlePage is a function component', () => {
    expect(typeof TitlePage).toBe('function');
  });
  it('ThanksPage is a function component', () => {
    expect(typeof ThanksPage).toBe('function');
  });
  it('InformationPage is a function component', () => {
    expect(typeof InformationPage).toBe('function');
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf/pages/pages.test.tsx`

- [ ] **Step 3: Implement TitlePage**

```tsx
// src/pdf/pages/TitlePage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function TitlePage({ pattern }: Props) {
  const year = new Date(pattern.meta.designedAt).getFullYear();
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.display,
            fontSize: 48,
            color: pdfTheme.colors.ink,
            letterSpacing: 3,
            textAlign: 'center',
          }}
        >
          {pattern.meta.title.en}
        </Text>
        <View style={{ width: 80, height: 1, backgroundColor: pdfTheme.colors.rule, marginVertical: 16 }} />
        <Text
          style={{
            fontFamily: pdfTheme.fonts.accent,
            fontSize: 14,
            color: pdfTheme.colors.inkSoft,
            letterSpacing: 2,
          }}
        >
          design by {pattern.meta.author || 'unknown'}
        </Text>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 10,
            color: pdfTheme.colors.inkSoft,
            marginTop: 6,
          }}
        >
          {year}
        </Text>
      </View>
    </Page>
  );
}
```

- [ ] **Step 4: Implement ThanksPage**

```tsx
// src/pdf/pages/ThanksPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function ThanksPage({ pattern }: Props) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>THANKS</Heading>
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 12,
            color: pdfTheme.colors.ink,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 380,
          }}
        >
          Thank you for supporting my small business.
          {'\n'}I hope you'll enjoy this pattern as much as I did making it.
        </Text>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 10,
            color: pdfTheme.colors.inkSoft,
            textAlign: 'center',
            marginTop: 32,
            maxWidth: 380,
            lineHeight: 1.5,
          }}
        >
          {pattern.meta.copyrightLine ??
            `© ${new Date(pattern.meta.designedAt).getFullYear()} ${pattern.meta.author}. This pattern is for private use only. It's not allowed to copy, sell or distribute in any way, either wholly or in part.`}
        </Text>
        {pattern.meta.socialTag && (
          <Text
            style={{
              fontFamily: pdfTheme.fonts.accent,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
              marginTop: 24,
            }}
          >
            tag {pattern.meta.socialTag}
          </Text>
        )}
      </View>
    </Page>
  );
}
```

- [ ] **Step 5: Implement InformationPage**

```tsx
// src/pdf/pages/InformationPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { AbbreviationsTable } from '../components/AbbreviationsTable';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function InformationPage({ pattern }: Props) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>INFORMATION</Heading>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 16 }}>
          US terms
        </Text>
      </View>

      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Yarn
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.yarn.brand ?? '—'} ·{' '}
          {pattern.meta.yarn.weight ?? '—'} ·{' '}
          {pattern.meta.yarn.fiber ?? '—'}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Hook
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.hook}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Gauge
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.gauge.stitches} st × {pattern.meta.gauge.rows} rows ={' '}
          {pattern.meta.gauge.squareCm}×{pattern.meta.gauge.squareCm} cm
        </Text>
      </View>

      <Heading kind="section">Abbreviations</Heading>
      <AbbreviationsTable pattern={pattern} />
    </Page>
  );
}
```

- [ ] **Step 6: Pass + suite + typecheck** → green.

- [ ] **Step 7: Commit**

```bash
git add src/pdf/pages/TitlePage.tsx src/pdf/pages/ThanksPage.tsx src/pdf/pages/InformationPage.tsx src/pdf/pages/pages.test.tsx
git commit -m "feat(pdf): Title, Thanks, Information pages"
```

---

## Task 13: PDF Pattern + Legend pages

**Files:**
- Create: `src/pdf/pages/PatternPage.tsx`
- Create: `src/pdf/pages/LegendPage.tsx`

- [ ] **Step 1: Implement PatternPage**

```tsx
// src/pdf/pages/PatternPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { PhotoFigure } from '../components/PhotoFigure';
import { generateInstructions } from '../../instructions/generate';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function PatternPage({ pattern }: Props) {
  const instructions = generateInstructions(pattern);
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>PATTERN</Heading>
      <View style={{ marginTop: pdfTheme.spacing.section }}>
        {instructions.map((ins) => (
          <View key={ins.round} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 13, color: pdfTheme.colors.inkSoft }}>
              {ins.round === 0 ? 'Round 1' : `Round ${ins.round + 1}`}
            </Text>
            <Text
              style={{
                fontFamily: pdfTheme.fonts.body,
                fontSize: 11,
                color: pdfTheme.colors.ink,
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              {ins.textEn}
            </Text>
          </View>
        ))}
      </View>

      {pattern.photos.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: pdfTheme.colors.rule, marginVertical: 16 }} />
          {pattern.photos.slice(0, 3).map((p) => (
            <PhotoFigure
              key={p.id}
              photo={p}
              caption={p.captionByLanguage?.en ?? p.captionByLanguage?.pl}
              width={300}
            />
          ))}
        </>
      )}
    </Page>
  );
}
```

- [ ] **Step 2: Implement LegendPage**

```tsx
// src/pdf/pages/LegendPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function LegendPage({ pattern }: Props) {
  if (pattern.customStitches.length === 0) {
    return null;
  }
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>SPECIAL STITCHES</Heading>
      <View style={{ marginTop: pdfTheme.spacing.section }}>
        {pattern.customStitches.map((c) => (
          <View key={c.id} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text
              style={{
                fontFamily: pdfTheme.fonts.accent,
                fontSize: 13,
                color: pdfTheme.colors.accent,
              }}
            >
              {c.shortCode} — {c.nameByLanguage.en}
            </Text>
            {c.description && (
              <Text
                style={{
                  fontFamily: pdfTheme.fonts.body,
                  fontSize: 11,
                  color: pdfTheme.colors.ink,
                  marginTop: 4,
                  lineHeight: 1.6,
                }}
              >
                {c.description.en}
              </Text>
            )}
            <Text
              style={{
                fontFamily: pdfTheme.fonts.accent,
                fontSize: 10,
                color: pdfTheme.colors.inkSoft,
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              PL: {c.nameByLanguage.pl}
              {c.description?.pl && ` — ${c.description.pl}`}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
```

- [ ] **Step 3: Smoke test**

Create `src/pdf/pages/pattern-legend.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { PatternPage } from './PatternPage';
import { LegendPage } from './LegendPage';

describe('Pattern + Legend pages', () => {
  it('PatternPage exports a function component', () => {
    expect(typeof PatternPage).toBe('function');
  });
  it('LegendPage exports a function component', () => {
    expect(typeof LegendPage).toBe('function');
  });
});
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/pdf/pages/PatternPage.tsx src/pdf/pages/LegendPage.tsx src/pdf/pages/pattern-legend.test.tsx
git commit -m "feat(pdf): Pattern (instructions+photos) and Legend (custom stitches) pages"
```

---

## Task 14: PDF Document orchestration

**Files:**
- Create: `src/pdf/PatternDocument.tsx`
- Create: `src/pdf/PatternDocument.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/pdf/PatternDocument.test.tsx
import { describe, it, expect } from 'vitest';
import { PatternDocument } from './PatternDocument';

describe('PatternDocument', () => {
  it('exports a function component', () => {
    expect(typeof PatternDocument).toBe('function');
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf/PatternDocument.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/pdf/PatternDocument.tsx
import { Document } from '@react-pdf/renderer';
import type { Pattern } from '../domain/graph/types';
import { TitlePage } from './pages/TitlePage';
import { ThanksPage } from './pages/ThanksPage';
import { InformationPage } from './pages/InformationPage';
import { PatternPage } from './pages/PatternPage';
import { LegendPage } from './pages/LegendPage';

interface Props {
  pattern: Pattern;
}

export function PatternDocument({ pattern }: Props) {
  const enabled = new Set(
    pattern.pdfSections.filter((s) => s.enabled).map((s) => s.kind),
  );
  return (
    <Document>
      {enabled.has('title') && <TitlePage pattern={pattern} />}
      {enabled.has('thanks') && <ThanksPage pattern={pattern} />}
      {enabled.has('information') && <InformationPage pattern={pattern} />}
      {enabled.has('pattern') && <PatternPage pattern={pattern} />}
      {enabled.has('legend') && pattern.customStitches.length > 0 && (
        <LegendPage pattern={pattern} />
      )}
    </Document>
  );
}
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/pdf/PatternDocument.tsx src/pdf/PatternDocument.test.tsx
git commit -m "feat(pdf): PatternDocument assembling enabled pages"
```

---

## Task 15: PDF export action

**Files:**
- Create: `src/pdf/exportPdf.ts`
- Create: `src/pdf/exportPdf.test.ts`

- [ ] **Step 1: Failing test**

```ts
// src/pdf/exportPdf.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestPdfFilename } from './exportPdf';
import { emptyPatternV3 } from '../domain/graph/build';

describe('suggestPdfFilename', () => {
  it('returns a sanitized filename derived from the title', () => {
    const p = emptyPatternV3({ title: { pl: 'Wzór mamy', en: 'Mama Pattern' }, author: 'M' });
    const name = suggestPdfFilename(p);
    expect(name.toLowerCase()).toContain('mama');
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('falls back when title is empty', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const name = suggestPdfFilename(p);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('strips dangerous filesystem characters', () => {
    const p = emptyPatternV3({ title: { pl: 'a/b?c*d', en: 'a/b?c*d' }, author: '' });
    const name = suggestPdfFilename(p);
    expect(name).not.toMatch(/[<>:"/\\|?*]/);
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf/exportPdf.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/pdf/exportPdf.ts
import { pdf } from '@react-pdf/renderer';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Pattern } from '../domain/graph/types';
import { PatternDocument } from './PatternDocument';

export function suggestPdfFilename(pattern: Pattern): string {
  const raw = (pattern.meta.title.en || pattern.meta.title.pl || 'pattern').trim();
  const safe = raw.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '').slice(0, 80) || 'pattern';
  return `${safe}.pdf`;
}

export type ExportResult =
  | { kind: 'ok'; path: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/** Generate and save the PDF. Shows a Tauri save dialog. */
export async function exportPatternPdf(pattern: Pattern): Promise<ExportResult> {
  try {
    const picked = await saveDialog({
      title: 'Save PDF',
      defaultPath: suggestPdfFilename(pattern),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!picked) return { kind: 'cancelled' };

    const blob = await pdf(<PatternDocument pattern={pattern} />).toBlob();
    const buffer = await blob.arrayBuffer();
    await writeFile(picked, new Uint8Array(buffer));
    return { kind: 'ok', path: picked };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: 'error', message };
  }
}
```

NOTE: `pdf(<PatternDocument ... />).toBlob()` is the official react-pdf API to render to a Blob. Tests can't easily verify the binary output without complex mocks; we only test the filename helper here.

- [ ] **Step 4: Pass + suite + typecheck**

The implementation imports react-pdf which works at runtime but may fail in jsdom tests if any internal code touches Node-only APIs. If the test file fails to import due to react-pdf internals, isolate the test to only `suggestPdfFilename` (move that to a separate `src/pdf/filename.ts` if needed). Simpler approach: keep the test scoped to `suggestPdfFilename` only — don't import `exportPatternPdf` in tests.

If the test file errors on import, separate the filename helper into `src/pdf/filename.ts` and import only that in the test.

- [ ] **Step 5: Commit**

```bash
git add src/pdf/exportPdf.tsx src/pdf/exportPdf.test.ts
git commit -m "feat(pdf): exportPatternPdf and suggestPdfFilename"
```

If you split the file: include `src/pdf/filename.ts` and `src/pdf/exportPdf.tsx` in the git add. Adjust the test import to point at filename.ts.

---

## Task 16: PDF Preview View

**Files:**
- Create: `src/views/PdfPreviewView.tsx`
- Create: `src/views/PdfPreviewView.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/views/PdfPreviewView.test.tsx
import { describe, it, expect } from 'vitest';
import { PdfPreviewView } from './PdfPreviewView';

describe('PdfPreviewView', () => {
  it('exports a function component', () => {
    expect(typeof PdfPreviewView).toBe('function');
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/views/PdfPreviewView.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/views/PdfPreviewView.tsx
import { PDFViewer } from '@react-pdf/renderer';
import type { Pattern } from '../domain/graph/types';
import { PatternDocument } from '../pdf/PatternDocument';

interface Props {
  pattern: Pattern;
  onClose: () => void;
}

export function PdfPreviewView({ pattern, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10000,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: '#f7f3e8',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          color: '#3a2f1d',
        }}
      >
        <span>PDF Preview — {pattern.meta.title.en || pattern.meta.title.pl}</span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PDFViewer width="100%" height="100%" showToolbar>
          <PatternDocument pattern={pattern} />
        </PDFViewer>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/views/PdfPreviewView.tsx src/views/PdfPreviewView.test.tsx
git commit -m "feat(pdf): PdfPreviewView using react-pdf's PDFViewer"
```

---

## Task 17: Photo importer + Inspector integration

**Files:**
- Create: `src/photos/importer.ts`
- Create: `src/photos/importer.test.ts`
- Modify: `src/editor/Inspector.tsx` (add photo attachment panel)

- [ ] **Step 1: Failing test**

```ts
// src/photos/importer.test.ts
import { describe, it, expect } from 'vitest';
import { buildPhotoFromBase64 } from './importer';

describe('buildPhotoFromBase64', () => {
  it('produces a Photo with inline storage and given dimensions', () => {
    const p = buildPhotoFromBase64({
      base64: 'ABC',
      width: 100,
      height: 80,
      mime: 'image/jpeg',
    });
    expect(p.storage.kind).toBe('inline');
    if (p.storage.kind === 'inline') {
      expect(p.storage.base64).toBe('ABC');
      expect(p.storage.mime).toBe('image/jpeg');
    }
    expect(p.width).toBe(100);
    expect(p.height).toBe(80);
    expect(p.id).toBeTruthy();
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/photos/importer.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/photos/importer.ts
import { newId } from '../utils/id';
import type { Photo } from '../domain/graph/types';

export interface BuildPhotoInput {
  base64: string;
  width: number;
  height: number;
  mime: string;
}

export function buildPhotoFromBase64(input: BuildPhotoInput): Photo {
  // Estimate byte size from base64 length (rough).
  const bytes = Math.floor((input.base64.length * 3) / 4);
  return {
    id: newId(),
    storage: { kind: 'inline', base64: input.base64, mime: input.mime },
    width: input.width,
    height: input.height,
    bytes,
  };
}

/** Read a File via FileReader and return base64 + dimensions. */
export async function readImageFile(
  file: File,
): Promise<{ base64: string; width: number; height: number; mime: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1] ?? '';
  const mime = file.type || 'image/jpeg';
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image decode failed'));
    i.src = dataUrl;
  });
  return { base64, width: img.naturalWidth, height: img.naturalHeight, mime };
}
```

- [ ] **Step 4: Update Inspector**

Read `src/editor/Inspector.tsx`. Inside the `<aside>` body, after the existing block that renders photo count (`{stitch.attachments?.photoIds && ...}`), insert a section that lets the user upload a photo. Add to imports:

```tsx
import { useRef } from 'react';
import { readImageFile, buildPhotoFromBase64 } from '../photos/importer';
import { usePhotoStore } from '../photos/photoStore';
import { usePatternGraphStore } from '../stores/patternGraphStore';
```

Then inside the inspector body (inside the `{stitch && ...}` branch), add a button:

```tsx
<div style={{ marginTop: 10 }}>
  <input
    type="file"
    accept="image/*"
    style={{ display: 'none' }}
    id={`photo-upload-${stitch.id}`}
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const data = await readImageFile(file);
      const photo = buildPhotoFromBase64(data);
      usePhotoStore.getState().addPhoto(photo);
      const current = usePatternGraphStore.getState().pattern;
      if (!current) return;
      const updatedStitches = current.stitches.map((s) =>
        s.id === stitch.id
          ? {
              ...s,
              attachments: {
                ...s.attachments,
                photoIds: [...(s.attachments?.photoIds ?? []), photo.id],
              },
            }
          : s,
      );
      const updatedPhotos = [...current.photos, photo];
      usePatternGraphStore.getState().setPattern({
        ...current,
        stitches: updatedStitches,
        photos: updatedPhotos,
      });
      e.target.value = '';
    }}
  />
  <label
    htmlFor={`photo-upload-${stitch.id}`}
    style={{
      cursor: 'pointer',
      color: editorTheme.color.inkSoft,
      fontStyle: 'italic',
      fontSize: 11,
    }}
  >
    + attach photo
  </label>
</div>
```

- [ ] **Step 5: Pass + suite + typecheck** → green.

If the Inspector test now fails because of new content rendered, update its tests to be tolerant of the new "attach photo" affordance.

- [ ] **Step 6: Commit**

```bash
git add src/photos/importer.ts src/photos/importer.test.ts src/editor/Inspector.tsx
git commit -m "feat(photos): importer + Inspector photo attachment"
```

---

## Task 18: Wire Export PDF + Preview buttons + version bump + PR update

**Files:**
- Modify: `src/editor/GraphEditorShell.tsx` (add Export + Preview buttons)
- Modify: `package.json` (version 0.5.0-alpha.0)

- [ ] **Step 1: Modify GraphEditorShell.tsx**

Read the current file. Add imports at the top:

```tsx
import { useState } from 'react';
import { PdfPreviewView } from '../views/PdfPreviewView';
import { exportPatternPdf } from '../pdf/exportPdf';
```

If `useState` is already imported, don't duplicate.

In the function body, add state:

```tsx
const [showPreview, setShowPreview] = useState(false);
const [exportStatus, setExportStatus] = useState<string | null>(null);
```

In the JSX header bar (between brand and switch-to-rectangular button), add two new buttons before the spacer:

```tsx
<button
  type="button"
  onClick={() => setShowPreview(true)}
>
  Preview PDF
</button>
<button
  type="button"
  onClick={async () => {
    if (!pattern) return;
    const r = await exportPatternPdf(pattern);
    if (r.kind === 'ok') setExportStatus(`Saved to ${r.path}`);
    else if (r.kind === 'error') setExportStatus(`Error: ${r.message}`);
    else setExportStatus(null);
    setTimeout(() => setExportStatus(null), 4000);
  }}
>
  Export PDF
</button>
```

Inside the JSX return (just before the final `</div>`), add the preview overlay and export status:

```tsx
{showPreview && pattern && (
  <PdfPreviewView pattern={pattern} onClose={() => setShowPreview(false)} />
)}
{exportStatus && (
  <div
    style={{
      position: 'fixed',
      bottom: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      background: editorTheme.color.accentHi,
      border: `1px solid ${editorTheme.color.accent}`,
      padding: '8px 16px',
      borderRadius: 4,
      fontSize: 12,
      color: editorTheme.color.ink,
      zIndex: 9999,
    }}
  >
    {exportStatus}
  </div>
)}
```

- [ ] **Step 2: Bump version**

`package.json`: `"version": "0.4.0-alpha.0"` → `"version": "0.5.0-alpha.0"`.

- [ ] **Step 3: Run everything**

```bash
npm test
npm run typecheck
npm run build
```

All green.

- [ ] **Step 4: Commit**

```bash
git add src/editor/GraphEditorShell.tsx package.json
git commit -m "feat(pdf): wire Preview + Export PDF buttons (0.5.0-alpha.0)"
```

- [ ] **Step 5: Push and update PR**

```bash
git push
gh pr edit feature/pdf-pattern-designer --title "feat: Phase 1+2+3 — multigraph, graph editor, PDF export" --body "$(cat <<'EOF'
## Summary

**Phase 1 (foundations):** Pattern v3 multigraph, migration, validator, parser, file IO, document store, dev inspector.

**Phase 2 (graph editor):** ReactFlow 3-column editor with palette/inspector, custom stitch modal, radial/linear/freeform layouts, connection interactions with modifier keys, mode switcher.

**Phase 3 (chart + PDF + photos):**
- Chart symbol library + Rough.js wobble + radial/linear SVG renderers
- Photo upload (Canvas API resize) + store + Inspector attachment panel
- @react-pdf/renderer pipeline with 5 pages: Title, Thanks, Information, Pattern, Legend
- Auto-instruction generator (PL/EN per-round text from graph)
- Live preview pane + Export PDF action (Tauri save dialog)

Spec: docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md
Plans: docs/superpowers/plans/{2026-05-11-phase-1-foundations.md, 2026-05-12-phase-2-editor.md, 2026-05-12-phase-3-chart-pdf-photos.md}

## Test plan
- [x] npm test --run (all passing)
- [x] npm run typecheck (clean)
- [x] npm run build (vite build succeeds)
- [ ] Manual smoke: create radial pattern, add stitches, attach a photo, click Preview PDF, click Export PDF, verify saved file opens

## What's NOT in this PR (Phase 4+)
- Customization page in PDF with garment templates
- Educational layer (hover highlight, animated yarn path, tutorial overlay)
- Rust sidecar for high-quality photo resize
- Cormorant Garamond font bundling (Phase 5 hardening)

EOF
)"
```

- [ ] **Step 6: Self-check**

- Full test suite green (~265 tests after all Phase 3 tasks)
- typecheck clean
- build succeeds
- Branch pushed
- PR updated

---

## Self-review

**Spec coverage:**
- §6 Chart rendering → Tasks 2–6
- §8 Photos → Tasks 7, 8, 17
- §9 PDF generation → Tasks 10–16
- §9.6 Auto-instructions → Task 9
- §9.5 Export → Task 15, 18
- §9.4 Live preview → Task 16, 18

**Placeholder scan:** None. All step code is concrete.

**Type consistency:**
- `SymbolGlyph` defined in Task 2; consumed in Tasks 4, 5.
- `RoundInstruction` defined in Task 9; consumed in Task 13.
- `Photo` type used consistently from Phase 1's `domain/graph/types`.
- `PatternDocument` in Task 14 references all pages from Tasks 12, 13.

**Known simplifications / deferrals:**
- Rough.js wobble is set up in Task 3 but the chart renderers in Tasks 4–5 use text glyphs (not Rough.js paths). Rough.js gets applied to the diagram in Phase 4 polish. The setup work in Task 3 is not wasted — Phase 4 imports it directly.
- PDF fonts use built-in Helvetica; Cormorant Garamond bundling deferred to Phase 5.
- Customization page (garment templates) deferred to Phase 4 per spec §14.
- Photo resize uses browser Canvas (Phase 5 swaps in Rust sidecar for higher quality).
- The `roughen.ts` helper in Task 3 exports utilities used neither in Phase 3 chart renderers nor PDF. That's intentional — Phase 4 chart polish will use it. Without it now, Phase 4 would need to backfill, and writing it now is cheap.
