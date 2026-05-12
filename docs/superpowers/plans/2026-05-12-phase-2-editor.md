# Phase 2 — Graph Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land a working node-graph editor for crochet patterns: ReactFlow canvas, palette, inspector, layout engine (radial + linear + freeform), connection interactions with modifier keys, custom-stitch creation modal, and a mode switcher that routes between the existing rectangular editor and the new graph editor.

**Architecture:** Add a new `src/editor/` directory holding the ReactFlow-based graph editor (canvas, nodes, edges, palette, inspector, top-level shell) plus a new `src/layout/` directory with auto-layout algorithms. Mount the new editor at `src/views/GraphEditorView.tsx` and wire `src/App.tsx` to switch between `EditorView` (rectangular, v2) and `GraphEditorView` (graph, v3) based on `useDocumentStore().mode`. Add a `patternGraphStore` (Zustand) for live editing of v3 patterns. The existing rectangular editor and Phase 1 graph layer are untouched.

**Tech Stack:** `reactflow@11`, React 19, TypeScript strict, Zustand 5 + Immer 11 (already deps), Vitest + React Testing Library, jsdom. No new Rust changes in Phase 2.

**Source spec:** `docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md` (especially §3.2, §5, §7).

**Working branch:** `feature/pdf-pattern-designer` (continues from Phase 1 — Phase 1 PR not merged yet; Phase 2 commits stack on the same branch).

---

## File Structure

### Files created

| Path | Responsibility |
|---|---|
| `src/domain/customStitch/types.ts` | Draft types used by the creation modal (partial `CustomStitch` shape during editing) and constants. |
| `src/domain/customStitch/registry.ts` | Pure functions: `addCustomStitch`, `removeCustomStitch`, `findByShortCode`, `isShortCodeAvailable`. Operates on a `CustomStitch[]`. |
| `src/layout/types.ts` | `Position`, `LayoutResult`, `LayoutAlgorithm` discriminator. |
| `src/layout/radial.ts` | `computeRadialLayout(pattern)` — places magic_ring at origin and rounds 1..N on expanding circles. |
| `src/layout/linear.ts` | `computeLinearLayout(pattern)` — row-based 2-D grid, alternating direction. |
| `src/layout/applyLayout.ts` | `applyLayout(pattern)` — picks algorithm by `pattern.shape` and returns a new pattern with positions filled. |
| `src/stores/patternGraphStore.ts` | Zustand store for live v3 editing: stitches, edges, selection, palette draft state, validator memo. |
| `src/editor/canvas/StitchNode.tsx` | ReactFlow custom node for a stitch — circle + symbol + label, with 4 handles (top/bottom/left/right). |
| `src/editor/canvas/ChainSpaceNode.tsx` | ReactFlow custom node for a chain-space anchor target. |
| `src/editor/canvas/edges/AnchorEdge.tsx` | ReactFlow custom edge in vintage tan. |
| `src/editor/canvas/edges/YarnFlowEdge.tsx` | ReactFlow custom edge in green dashed (yarn flow). |
| `src/editor/canvas/edges/JoinEdge.tsx` | ReactFlow custom edge in orange dashed (sl st join). |
| `src/editor/canvas/GraphCanvas.tsx` | ReactFlow wrapper with custom node/edge types, vintage background, controls, minimap. |
| `src/editor/interactions/connectEdge.ts` | Decides which edge kind to create on a connect attempt (modifier keys); validates pre-creation. |
| `src/editor/NodePalette.tsx` | Left sidebar — palette of built-in + custom stitches + colors + "+" custom-stitch button. |
| `src/editor/Inspector.tsx` | Right sidebar — selected stitch details + validator badges. |
| `src/editor/CustomStitchModal.tsx` | Modal for defining a new custom stitch (name pl/en, shortCode, symbol picker). |
| `src/editor/GraphEditorShell.tsx` | Top-level 3-column layout (palette / canvas / inspector) + top toolbar with mode switch + bottom status bar. |
| `src/views/GraphEditorView.tsx` | View-level wrapper, equivalent of existing `EditorView` but for the graph mode. |
| Test files | One `.test.ts(x)` per source file above. Snapshot tests for layout and ReactFlow node components; behavioral tests for store and interactions. |

### Files modified

| Path | Change |
|---|---|
| `package.json` | Add `reactflow@^11.11.0`; bump version to `0.4.0-alpha.0` at end of phase. |
| `src/App.tsx` | Read `useDocumentStore().mode` and render either existing `EditorView` (rectangular, when `pattern` exists in v2 store) or new `GraphEditorView` (graph, when `graphPattern` exists in document store). The existing `EmptyView` flow gains a "radial pattern" entry. |
| `src/views/EmptyView.tsx` | Welcome screen gains a "Stwórz wzór radialny" button that seeds an empty v3 pattern and switches `documentStore.mode = 'graph'`. |

### Files explicitly NOT touched in Phase 2

- `src/domain/graph/*` — Phase 1 data layer is stable.
- `src/domain/validation*` — validator unchanged; we only consume it.
- `src/domain/pattern.ts`, `src/stores/patternStore.ts` — rectangular v2 editor untouched.
- `src/services/fileIo.ts` — v3 IO already added in Phase 1.
- `src-tauri/**` — no Rust changes.

---

## Conventions

- **TDD per task.** Failing test → minimum impl → confirm green → commit.
- **No mutations.** Stores use Immer; pure functions return new objects.
- **Strict types.** No `any`. ReactFlow nodes/edges are typed via `Node<Data, Type>` / `Edge<Data, Type>`.
- **ES2020 target.** No `.at(-1)` — use `[arr.length - 1]`.
- **i18n.** Skip translating new UI in Phase 2; English/Polish strings can be hard-coded in components for now. Phase 4 wires i18next.
- **Visual style.** Vintage palette — paper (`#f4f1ea`), ink (`#3a2f1d`), accent (`#d4831a`), rule (`#b8a87a`). Inline `style={{ }}` is fine in Phase 2; theme tokens land in Phase 3.

---

## Task 1: Install ReactFlow and shared style tokens

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/editor/theme.ts`

- [ ] **Step 1: Install reactflow**

```bash
npm install --save reactflow@^11.11.0
```

Verify it landed:

```bash
cat package.json | grep reactflow
```
Expected: `"reactflow": "^11.11.0",`

- [ ] **Step 2: Create the shared theme module**

```ts
// src/editor/theme.ts
/**
 * Vintage palette tokens used across the Phase 2 editor.
 * Same tokens will be consumed by Phase 3 PDF theme.
 */
export const editorTheme = {
  color: {
    paper:    '#f4f1ea',
    paperHi:  '#fafaf7',
    ink:      '#3a2f1d',
    inkSoft:  '#5a4730',
    rule:     '#b8a87a',
    accent:   '#d4831a',
    accentHi: '#fffcef',
    yarnSeam: '#a89466',
    yarnFlow: '#7a8a55',
  },
  font: {
    display:  'Georgia, serif',
    body:     'Georgia, serif',
    mono:     'JetBrains Mono, monospace',
  },
  spacing: {
    xs: 4,
    s:  8,
    m:  12,
    l:  16,
    xl: 24,
  },
  radius: {
    s: 3,
    m: 6,
    l: 10,
  },
} as const;

export type EditorTheme = typeof editorTheme;
```

- [ ] **Step 3: Quick test that reactflow imports compile**

```ts
// src/editor/theme.test.ts
import { describe, it, expect } from 'vitest';
import { editorTheme } from './theme';

describe('editorTheme', () => {
  it('exposes expected color tokens', () => {
    expect(editorTheme.color.paper).toMatch(/^#/);
    expect(editorTheme.color.ink).toMatch(/^#/);
    expect(editorTheme.color.accent).toMatch(/^#/);
  });

  it('imports from reactflow without crashing', async () => {
    const rf = await import('reactflow');
    expect(typeof rf.ReactFlow).toBe('function');
  });
});
```

- [ ] **Step 4: Run test**

```bash
npm test -- src/editor/theme.test.ts
```
Expected: 2 passing.

- [ ] **Step 5: Run typecheck + build**

```bash
npm run typecheck && npm run build
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/editor/theme.ts src/editor/theme.test.ts
git commit -m "feat(editor): install reactflow@11 and add vintage theme tokens"
```

---

## Task 2: Custom stitch registry

**Files:**
- Create: `src/domain/customStitch/types.ts`
- Create: `src/domain/customStitch/registry.ts`
- Create: `src/domain/customStitch/registry.test.ts`

- [ ] **Step 1: Define draft types**

```ts
// src/domain/customStitch/types.ts
import type { CustomStitch } from '../graph/types';

/** Draft state used by the creation modal — fields populated incrementally. */
export interface CustomStitchDraft {
  shortCode: string;
  namePl: string;
  nameEn: string;
  descriptionPl: string;
  descriptionEn: string;
  symbolPresetId?: string;
  symbolSvgPath?: string;
}

export const EMPTY_DRAFT: CustomStitchDraft = {
  shortCode: '',
  namePl: '',
  nameEn: '',
  descriptionPl: '',
  descriptionEn: '',
};

/** Final shape after validation — ready to insert into Pattern.customStitches. */
export type FinalizedCustomStitch = CustomStitch;
```

- [ ] **Step 2: Failing tests for registry**

```ts
// src/domain/customStitch/registry.test.ts
import { describe, it, expect } from 'vitest';
import {
  addCustomStitch,
  removeCustomStitch,
  findByShortCode,
  isShortCodeAvailable,
  finalizeDraft,
} from './registry';
import { EMPTY_DRAFT } from './types';
import type { CustomStitch } from '../graph/types';

function existing(): CustomStitch {
  return {
    id: 'cs-1',
    shortCode: 'HC',
    nameByLanguage: { pl: 'Pęczek kapturowy', en: 'Hood cluster' },
    symbol: { kind: 'svgPath', path: 'M0 0' },
  };
}

describe('customStitch/registry', () => {
  it('addCustomStitch appends to the list', () => {
    const list: CustomStitch[] = [];
    const stitch = existing();
    const next = addCustomStitch(list, stitch);
    expect(next).toHaveLength(1);
    expect(next[0]).toBe(stitch);
    expect(list).toHaveLength(0); // immutable
  });

  it('removeCustomStitch filters by id', () => {
    const a = existing();
    const b = { ...existing(), id: 'cs-2', shortCode: 'XY' };
    const next = removeCustomStitch([a, b], 'cs-1');
    expect(next).toEqual([b]);
  });

  it('findByShortCode is case-insensitive', () => {
    const list = [existing()];
    expect(findByShortCode(list, 'hc')?.id).toBe('cs-1');
    expect(findByShortCode(list, 'HC')?.id).toBe('cs-1');
    expect(findByShortCode(list, 'ZZ')).toBeUndefined();
  });

  it('isShortCodeAvailable rejects collisions with custom stitches', () => {
    const list = [existing()];
    expect(isShortCodeAvailable(list, 'HC')).toBe(false);
    expect(isShortCodeAvailable(list, 'hc')).toBe(false);
    expect(isShortCodeAvailable(list, 'NEW')).toBe(true);
  });

  it('isShortCodeAvailable rejects built-in stitch shortcodes', () => {
    expect(isShortCodeAvailable([], 'sc')).toBe(false);
    expect(isShortCodeAvailable([], 'DC')).toBe(false);
    expect(isShortCodeAvailable([], 'ch')).toBe(false);
  });

  it('finalizeDraft returns a CustomStitch when valid', () => {
    const draft = {
      ...EMPTY_DRAFT,
      shortCode: 'HC',
      namePl: 'Pęczek',
      nameEn: 'Hood',
      symbolPresetId: 'shell',
    };
    const result = finalizeDraft(draft);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.shortCode).toBe('HC');
      expect(result.value.nameByLanguage).toEqual({ pl: 'Pęczek', en: 'Hood' });
      expect(result.value.symbol).toEqual({ kind: 'preset', presetId: 'shell' });
      expect(result.value.id).toBeTruthy();
    }
  });

  it('finalizeDraft returns errors on bad input', () => {
    const empty = finalizeDraft(EMPTY_DRAFT);
    expect(empty.kind).toBe('error');
  });

  it('finalizeDraft rejects shortCode with non-letters or wrong length', () => {
    const draft = {
      ...EMPTY_DRAFT,
      shortCode: 'A1',
      namePl: 'X',
      nameEn: 'X',
      symbolPresetId: 'x',
    };
    expect(finalizeDraft(draft).kind).toBe('error');
  });
});
```

- [ ] **Step 3: Run verify fail**

```bash
npm test -- src/domain/customStitch/registry.test.ts
```
Expected: FAIL with `Cannot find module './registry'`.

- [ ] **Step 4: Implement registry**

```ts
// src/domain/customStitch/registry.ts
import { newId } from '../../utils/id';
import type { CustomStitch } from '../graph/types';
import type { CustomStitchDraft } from './types';

const BUILTIN_SHORTCODES = new Set([
  'ch', 'sl', 'ss', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'trtr',
  'inc', 'dec', 'gr',
]);

export function addCustomStitch(
  list: ReadonlyArray<CustomStitch>,
  stitch: CustomStitch,
): CustomStitch[] {
  return [...list, stitch];
}

export function removeCustomStitch(
  list: ReadonlyArray<CustomStitch>,
  id: string,
): CustomStitch[] {
  return list.filter((c) => c.id !== id);
}

export function findByShortCode(
  list: ReadonlyArray<CustomStitch>,
  shortCode: string,
): CustomStitch | undefined {
  const norm = shortCode.toLowerCase();
  return list.find((c) => c.shortCode.toLowerCase() === norm);
}

export function isShortCodeAvailable(
  list: ReadonlyArray<CustomStitch>,
  shortCode: string,
): boolean {
  const norm = shortCode.toLowerCase();
  if (BUILTIN_SHORTCODES.has(norm)) return false;
  return !list.some((c) => c.shortCode.toLowerCase() === norm);
}

export type FinalizeResult =
  | { kind: 'ok'; value: CustomStitch }
  | { kind: 'error'; messages: string[] };

const SHORTCODE_RE = /^[A-Za-z]{1,3}$/;

export function finalizeDraft(draft: CustomStitchDraft): FinalizeResult {
  const errors: string[] = [];
  if (!SHORTCODE_RE.test(draft.shortCode)) {
    errors.push('shortCode must be 1–3 letters');
  }
  if (draft.namePl.trim() === '') errors.push('namePl is required');
  if (draft.nameEn.trim() === '') errors.push('nameEn is required');
  if (!draft.symbolPresetId && !draft.symbolSvgPath) {
    errors.push('symbol (presetId or svgPath) is required');
  }
  if (errors.length > 0) return { kind: 'error', messages: errors };

  const symbol = draft.symbolPresetId
    ? { kind: 'preset' as const, presetId: draft.symbolPresetId }
    : { kind: 'svgPath' as const, path: draft.symbolSvgPath! };

  const description =
    draft.descriptionPl.trim() || draft.descriptionEn.trim()
      ? { pl: draft.descriptionPl, en: draft.descriptionEn }
      : undefined;

  return {
    kind: 'ok',
    value: {
      id: newId(),
      shortCode: draft.shortCode,
      nameByLanguage: { pl: draft.namePl, en: draft.nameEn },
      description,
      symbol,
    },
  };
}
```

- [ ] **Step 5: Run pass**

```bash
npm test -- src/domain/customStitch/registry.test.ts
```
Expected: 8 passing.

- [ ] **Step 6: Full suite + typecheck**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/domain/customStitch/types.ts src/domain/customStitch/registry.ts src/domain/customStitch/registry.test.ts
git commit -m "feat(customStitch): registry with finalizeDraft and shortcode validation"
```

---

## Task 3: Layout types + radial algorithm

**Files:**
- Create: `src/layout/types.ts`
- Create: `src/layout/radial.ts`
- Create: `src/layout/radial.test.ts`

- [ ] **Step 1: Layout types**

```ts
// src/layout/types.ts
export interface Position {
  x: number;
  y: number;
}

export type LayoutAlgorithm = 'radial' | 'linear' | 'freeform';

/** Output of any layout algorithm — a map from stitchId to position. */
export type LayoutResult = Map<string, Position>;
```

- [ ] **Step 2: Failing tests for radial layout**

```ts
// src/layout/radial.test.ts
import { describe, it, expect } from 'vitest';
import { computeRadialLayout, RADIAL_RING_SPACING } from './radial';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function ringPattern(ringSize: number): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
  const stitches = [ring];
  const edges = [];
  let prev = ring.id;
  for (let i = 0; i < ringSize; i++) {
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
    stitches.push(s);
    edges.push(newAnchorEdge(s.id, { kind: 'magic_ring' }));
    edges.push(newYarnFlowEdge(prev, s.id));
    prev = s.id;
  }
  return { ...p, shape: 'radial', stitches, edges };
}

describe('computeRadialLayout', () => {
  it('returns an empty map for an empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const layout = computeRadialLayout(p);
    expect(layout.size).toBe(0);
  });

  it('places the magic_ring at the origin', () => {
    const p = ringPattern(3);
    const layout = computeRadialLayout(p);
    const ringId = p.stitches[0]!.id;
    expect(layout.get(ringId)).toEqual({ x: 0, y: 0 });
  });

  it('places round 1 stitches on a circle of radius RADIAL_RING_SPACING', () => {
    const p = ringPattern(6);
    const layout = computeRadialLayout(p);
    for (let i = 1; i <= 6; i++) {
      const pos = layout.get(p.stitches[i]!.id);
      expect(pos).toBeDefined();
      const r = Math.sqrt(pos!.x ** 2 + pos!.y ** 2);
      expect(r).toBeCloseTo(RADIAL_RING_SPACING, 3);
    }
  });

  it('distributes round N stitches evenly around the circle', () => {
    const p = ringPattern(4);
    const layout = computeRadialLayout(p);
    const angles = [1, 2, 3, 4]
      .map((i) => layout.get(p.stitches[i]!.id)!)
      .map((pos) => Math.atan2(pos.y, pos.x));
    // Pairwise angle differences should all equal Math.PI/2 (mod 2π)
    for (let i = 0; i < angles.length - 1; i++) {
      const diff = (angles[i + 1]! - angles[i]! + 2 * Math.PI) % (2 * Math.PI);
      expect(diff).toBeCloseTo(Math.PI / 2, 3);
    }
  });

  it('expands outward — round 2 radius > round 1 radius', () => {
    const p = ringPattern(3);
    // Add round 2 stitches anchored to round 1
    const extra = newStitch({ kind: 'builtin', type: 'sc' }, { round: 2 });
    const r2: Pattern = {
      ...p,
      stitches: [...p.stitches, extra],
      edges: [
        ...p.edges,
        newAnchorEdge(extra.id, { kind: 'stitch', id: p.stitches[1]!.id }),
      ],
    };
    const layout = computeRadialLayout(r2);
    const r1pos = layout.get(p.stitches[1]!.id)!;
    const r2pos = layout.get(extra.id)!;
    const r1 = Math.sqrt(r1pos.x ** 2 + r1pos.y ** 2);
    const r2dist = Math.sqrt(r2pos.x ** 2 + r2pos.y ** 2);
    expect(r2dist).toBeGreaterThan(r1);
  });
});
```

- [ ] **Step 3: Run verify fail**

```bash
npm test -- src/layout/radial.test.ts
```
Expected: FAIL `Cannot find module './radial'`.

- [ ] **Step 4: Implement radial layout**

```ts
// src/layout/radial.ts
import type { Pattern } from '../domain/graph/types';
import type { LayoutResult } from './types';

export const RADIAL_RING_SPACING = 80;

/**
 * Place stitches on concentric circles based on their `round` field.
 *
 * Round 0 (magic_ring) is placed at origin. Round N stitches are placed on a
 * circle of radius N * RADIAL_RING_SPACING, distributed evenly around the
 * circle in yarn-flow order.
 *
 * Stitches without a `round` field are skipped (no position assigned).
 */
export function computeRadialLayout(pattern: Pattern): LayoutResult {
  const result: LayoutResult = new Map();
  // Group stitches by round (preserves insertion order — which mirrors yarn-flow order in well-formed patterns).
  const byRound = new Map<number, string[]>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const ids = byRound.get(s.round) ?? [];
    ids.push(s.id);
    byRound.set(s.round, ids);
  }

  for (const [round, ids] of byRound) {
    if (round === 0) {
      for (const id of ids) result.set(id, { x: 0, y: 0 });
      continue;
    }
    const radius = round * RADIAL_RING_SPACING;
    const count = ids.length;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start at top (-π/2)
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      result.set(ids[i]!, { x, y });
    }
  }

  return result;
}
```

- [ ] **Step 5: Run pass**

```bash
npm test -- src/layout/radial.test.ts
```
Expected: 5 passing.

- [ ] **Step 6: Full suite**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/layout/types.ts src/layout/radial.ts src/layout/radial.test.ts
git commit -m "feat(layout): radial layout — concentric rings with even angular spacing"
```

---

## Task 4: Linear layout

**Files:**
- Create: `src/layout/linear.ts`
- Create: `src/layout/linear.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/layout/linear.test.ts
import { describe, it, expect } from 'vitest';
import { computeLinearLayout, LINEAR_CELL_W, LINEAR_CELL_H } from './linear';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function twoRows(): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const a0 = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0 });
  const a1 = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0 });
  const b0 = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
  const b1 = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
  return {
    ...p,
    shape: 'rectangular',
    stitches: [a0, a1, b0, b1],
    edges: [
      newYarnFlowEdge(a0.id, a1.id),
      newYarnFlowEdge(a1.id, b0.id),
      newYarnFlowEdge(b0.id, b1.id),
      newAnchorEdge(b0.id, { kind: 'stitch', id: a0.id }),
      newAnchorEdge(b1.id, { kind: 'stitch', id: a1.id }),
    ],
  };
}

describe('computeLinearLayout', () => {
  it('returns empty for empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    expect(computeLinearLayout(p).size).toBe(0);
  });

  it('places row 0 at y=0 and row 1 above it (negative y)', () => {
    const p = twoRows();
    const layout = computeLinearLayout(p);
    expect(layout.get(p.stitches[0]!.id)!.y).toBe(0);
    expect(layout.get(p.stitches[2]!.id)!.y).toBeLessThan(0);
  });

  it('spaces stitches in a row by LINEAR_CELL_W', () => {
    const p = twoRows();
    const layout = computeLinearLayout(p);
    const a0 = layout.get(p.stitches[0]!.id)!;
    const a1 = layout.get(p.stitches[1]!.id)!;
    expect(Math.abs(a1.x - a0.x)).toBeCloseTo(LINEAR_CELL_W, 3);
  });

  it('uses LINEAR_CELL_H for row spacing', () => {
    const p = twoRows();
    const layout = computeLinearLayout(p);
    const a0 = layout.get(p.stitches[0]!.id)!;
    const b0 = layout.get(p.stitches[2]!.id)!;
    expect(Math.abs(b0.y - a0.y)).toBeCloseTo(LINEAR_CELL_H, 3);
  });
});
```

- [ ] **Step 2: Run verify fail**

```bash
npm test -- src/layout/linear.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement linear layout**

```ts
// src/layout/linear.ts
import type { Pattern } from '../domain/graph/types';
import type { LayoutResult } from './types';

export const LINEAR_CELL_W = 60;
export const LINEAR_CELL_H = 70;

/**
 * Place stitches on a rectangular grid. Each row is anchored to y = -row * H
 * (so row 0 is at bottom, higher rows stack upward — matching how crochet
 * is usually read). Within a row, stitches are spaced left-to-right by W in
 * the order they appear in `pattern.stitches` for that round.
 */
export function computeLinearLayout(pattern: Pattern): LayoutResult {
  const result: LayoutResult = new Map();
  const byRound = new Map<number, string[]>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const ids = byRound.get(s.round) ?? [];
    ids.push(s.id);
    byRound.set(s.round, ids);
  }

  for (const [round, ids] of byRound) {
    const y = -round * LINEAR_CELL_H;
    for (let i = 0; i < ids.length; i++) {
      result.set(ids[i]!, { x: i * LINEAR_CELL_W, y });
    }
  }

  return result;
}
```

- [ ] **Step 4: Run pass**

```bash
npm test -- src/layout/linear.test.ts
```
Expected: 4 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/layout/linear.ts src/layout/linear.test.ts
git commit -m "feat(layout): linear (rectangular grid) layout"
```

---

## Task 5: applyLayout entry point

**Files:**
- Create: `src/layout/applyLayout.ts`
- Create: `src/layout/applyLayout.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/layout/applyLayout.test.ts
import { describe, it, expect } from 'vitest';
import { applyLayout } from './applyLayout';
import { emptyPatternV3, newStitch } from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

describe('applyLayout', () => {
  it('returns a new pattern with positions filled in (radial)', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
    const populated: Pattern = { ...p, shape: 'radial', stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
    expect(populated.stitches[0]!.position).toBeUndefined(); // input unchanged
  });

  it('uses linear layout when shape is rectangular', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0 });
    const populated: Pattern = { ...p, shape: 'rectangular', stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
  });

  it('preserves existing positions when option keepExisting is set', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch(
      { kind: 'builtin', type: 'sc' },
      { round: 0, position: { x: 999, y: 999 } },
    );
    const populated: Pattern = { ...p, shape: 'radial', stitches: [s] };
    const out = applyLayout(populated, { keepExisting: true });
    expect(out.stitches[0]!.position).toEqual({ x: 999, y: 999 });
  });

  it('overrides existing positions when keepExisting is false (default)', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch(
      { kind: 'builtin', type: 'magic_ring' },
      { round: 0, position: { x: 999, y: 999 } },
    );
    const populated: Pattern = { ...p, shape: 'radial', stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/layout/applyLayout.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/layout/applyLayout.ts
import type { Pattern } from '../domain/graph/types';
import { computeRadialLayout } from './radial';
import { computeLinearLayout } from './linear';
import type { LayoutResult } from './types';

export interface ApplyLayoutOptions {
  /** If true, preserve any existing `position` on stitches. */
  keepExisting?: boolean;
}

export function applyLayout(
  pattern: Pattern,
  options: ApplyLayoutOptions = {},
): Pattern {
  let layout: LayoutResult;
  switch (pattern.shape) {
    case 'radial':
      layout = computeRadialLayout(pattern);
      break;
    case 'rectangular':
      layout = computeLinearLayout(pattern);
      break;
    case 'freeform':
      // No auto-layout for freeform; respect user-placed positions.
      layout = new Map();
      break;
  }

  const stitches = pattern.stitches.map((s) => {
    if (options.keepExisting && s.position) return s;
    const pos = layout.get(s.id);
    if (!pos) return s;
    return { ...s, position: pos };
  });

  return { ...pattern, stitches };
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/layout/applyLayout.test.ts
```
Expected: 4 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/layout/applyLayout.ts src/layout/applyLayout.test.ts
git commit -m "feat(layout): applyLayout entry point routing radial/linear/freeform"
```

---

## Task 6: patternGraphStore

**Files:**
- Create: `src/stores/patternGraphStore.ts`
- Create: `src/stores/patternGraphStore.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/stores/patternGraphStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePatternGraphStore } from './patternGraphStore';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';

describe('patternGraphStore', () => {
  beforeEach(() => {
    usePatternGraphStore.getState().reset();
  });

  it('starts with null pattern and no selection', () => {
    const s = usePatternGraphStore.getState();
    expect(s.pattern).toBeNull();
    expect(s.selectedStitchId).toBeNull();
  });

  it('setPattern stores a pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    expect(usePatternGraphStore.getState().pattern?.schemaVersion).toBe(3);
  });

  it('addStitch appends a stitch to the pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    const stitch = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().addStitch(stitch);
    expect(usePatternGraphStore.getState().pattern!.stitches).toHaveLength(1);
  });

  it('removeStitch removes by id and prunes orphan edges', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({
      ...p,
      stitches: [a, b],
      edges: [newAnchorEdge(b.id, { kind: 'stitch', id: a.id })],
    });
    usePatternGraphStore.getState().removeStitch(a.id);
    const after = usePatternGraphStore.getState().pattern!;
    expect(after.stitches).toHaveLength(1);
    expect(after.edges).toHaveLength(0); // edge orphaned and removed
  });

  it('addEdge appends an edge', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({
      ...p,
      stitches: [a, b],
    });
    const e = newAnchorEdge(b.id, { kind: 'stitch', id: a.id });
    usePatternGraphStore.getState().addEdge(e);
    expect(usePatternGraphStore.getState().pattern!.edges).toHaveLength(1);
  });

  it('updateStitchPosition mutates only the targeted stitch', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({ ...p, stitches: [a, b] });
    usePatternGraphStore.getState().updateStitchPosition(b.id, { x: 50, y: 60 });
    const after = usePatternGraphStore.getState().pattern!;
    expect(after.stitches.find((s) => s.id === b.id)!.position).toEqual({ x: 50, y: 60 });
    expect(after.stitches.find((s) => s.id === a.id)!.position).toBeUndefined();
  });

  it('selectStitch updates the selection', () => {
    usePatternGraphStore.getState().selectStitch('xyz');
    expect(usePatternGraphStore.getState().selectedStitchId).toBe('xyz');
    usePatternGraphStore.getState().selectStitch(null);
    expect(usePatternGraphStore.getState().selectedStitchId).toBeNull();
  });

  it('reset clears the store', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    usePatternGraphStore.getState().selectStitch('x');
    usePatternGraphStore.getState().reset();
    expect(usePatternGraphStore.getState().pattern).toBeNull();
    expect(usePatternGraphStore.getState().selectedStitchId).toBeNull();
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/stores/patternGraphStore.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement store**

```ts
// src/stores/patternGraphStore.ts
import { create } from 'zustand';
import { produce } from 'immer';
import type { Edge, Pattern, Position, Stitch, StitchId } from '../domain/graph/types';

interface PatternGraphState {
  pattern: Pattern | null;
  selectedStitchId: StitchId | null;
  setPattern(pattern: Pattern | null): void;
  addStitch(stitch: Stitch): void;
  removeStitch(stitchId: StitchId): void;
  addEdge(edge: Edge): void;
  removeEdge(edgeId: string): void;
  updateStitchPosition(stitchId: StitchId, position: Position): void;
  selectStitch(stitchId: StitchId | null): void;
  reset(): void;
}

function pruneOrphanEdges(pattern: Pattern, removedStitchId: StitchId): Edge[] {
  return pattern.edges.filter((e) => {
    if (e.kind === 'anchor') {
      if (e.from === removedStitchId) return false;
      if (e.to.kind === 'stitch' && e.to.id === removedStitchId) return false;
      if (e.to.kind === 'chain_space' &&
          (e.to.betweenA === removedStitchId || e.to.betweenB === removedStitchId)) return false;
      if (e.to.kind === 'turning_chain' && e.to.ofStitch === removedStitchId) return false;
    }
    if (e.kind === 'yarn_flow') {
      if (e.from === removedStitchId || e.to === removedStitchId) return false;
    }
    if (e.kind === 'join') {
      if (e.stitch === removedStitchId) return false;
      if (e.targets.includes(removedStitchId)) return false;
    }
    return true;
  });
}

export const usePatternGraphStore = create<PatternGraphState>((set) => ({
  pattern: null,
  selectedStitchId: null,

  setPattern(pattern) {
    set({ pattern, selectedStitchId: null });
  },

  addStitch(stitch) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.stitches.push(stitch);
      }),
    );
  },

  removeStitch(stitchId) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        const prunedEdges = pruneOrphanEdges(draft.pattern as Pattern, stitchId);
        draft.pattern.stitches = draft.pattern.stitches.filter((x) => x.id !== stitchId);
        draft.pattern.edges = prunedEdges;
        if (draft.selectedStitchId === stitchId) draft.selectedStitchId = null;
      }),
    );
  },

  addEdge(edge) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.edges.push(edge);
      }),
    );
  },

  removeEdge(edgeId) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.edges = draft.pattern.edges.filter((e) => e.id !== edgeId);
      }),
    );
  },

  updateStitchPosition(stitchId, position) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        const found = draft.pattern.stitches.find((x) => x.id === stitchId);
        if (found) found.position = position;
      }),
    );
  },

  selectStitch(stitchId) {
    set({ selectedStitchId: stitchId });
  },

  reset() {
    set({ pattern: null, selectedStitchId: null });
  },
}));
```

NOTE: `Position` is imported from `domain/graph/types`. If `Position` isn't exported there yet (it's used inside `Stitch.position` as inline `{x,y}`), add it as a top-level export to `src/domain/graph/types.ts` near the other type aliases. The Phase 1 code uses an inline anonymous shape — promoting it to a named type is a non-breaking refactor.

Verify the export exists or add it. If you need to add it, edit `src/domain/graph/types.ts` and insert:

```ts
export interface Position { x: number; y: number }
```

…and change the `position?:` field on `Stitch` to use `Position`. Commit this edit as part of this task.

- [ ] **Step 4: Pass**

```bash
npm test -- src/stores/patternGraphStore.test.ts
```
Expected: 8 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/stores/patternGraphStore.ts src/stores/patternGraphStore.test.ts src/domain/graph/types.ts
git commit -m "feat(stores): patternGraphStore with stitch/edge ops, selection, and edge pruning"
```

---

## Task 7: StitchNode + ChainSpaceNode custom nodes

**Files:**
- Create: `src/editor/canvas/StitchNode.tsx`
- Create: `src/editor/canvas/ChainSpaceNode.tsx`
- Create: `src/editor/canvas/StitchNode.test.tsx`

- [ ] **Step 1: Failing test for StitchNode**

```tsx
// src/editor/canvas/StitchNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { StitchNode, type StitchNodeData } from './StitchNode';

function wrap(children: React.ReactNode) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

describe('StitchNode', () => {
  it('renders the builtin stitch shortcode label', () => {
    const data: StitchNodeData = {
      label: 'sc',
      symbol: '×',
      isSelected: false,
    };
    render(wrap(<StitchNode data={data} id="n1" selected={false} />));
    expect(screen.getByText('sc')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('applies the selected style when selected prop is true', () => {
    const data: StitchNodeData = {
      label: 'dc',
      symbol: '⊤',
      isSelected: true,
    };
    const { container } = render(wrap(<StitchNode data={data} id="n1" selected={true} />));
    const root = container.querySelector('[data-testid="stitch-node"]');
    expect(root?.getAttribute('data-selected')).toBe('true');
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/canvas/StitchNode.test.tsx
```
Expected: FAIL `Cannot find module './StitchNode'`.

- [ ] **Step 3: Implement StitchNode**

```tsx
// src/editor/canvas/StitchNode.tsx
import { Handle, Position } from 'reactflow';
import { editorTheme } from '../theme';

export interface StitchNodeData {
  label: string;
  symbol: string;
  color?: string;
  isSelected?: boolean;
}

interface Props {
  id: string;
  selected: boolean;
  data: StitchNodeData;
}

const SIZE = 44;

export function StitchNode({ selected, data }: Props) {
  const borderColor = selected ? editorTheme.color.accent : editorTheme.color.inkSoft;
  const background = data.color ?? editorTheme.color.paperHi;
  return (
    <div
      data-testid="stitch-node"
      data-selected={selected ? 'true' : 'false'}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background,
        border: `${selected ? 2 : 1.2}px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: editorTheme.font.body,
        color: editorTheme.color.ink,
        boxShadow: selected ? `0 0 0 3px ${editorTheme.color.accentHi}` : 'none',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 16, lineHeight: 1 }}>{data.symbol}</div>
      <div style={{ fontSize: 9, lineHeight: 1, marginTop: 2, color: editorTheme.color.inkSoft }}>
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="out" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="anchor" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="anchored-by" style={handleStyle} />
    </div>
  );
}

const handleStyle = {
  width: 6,
  height: 6,
  background: editorTheme.color.inkSoft,
  border: `1px solid ${editorTheme.color.paperHi}`,
};
```

- [ ] **Step 4: Implement ChainSpaceNode (no separate test file — covered by GraphCanvas integration in Task 9)**

```tsx
// src/editor/canvas/ChainSpaceNode.tsx
import { Handle, Position } from 'reactflow';
import { editorTheme } from '../theme';

export interface ChainSpaceNodeData {
  label?: string;
}

interface Props {
  id: string;
  selected: boolean;
  data: ChainSpaceNodeData;
}

export function ChainSpaceNode({ selected, data }: Props) {
  return (
    <div
      data-testid="chain-space-node"
      data-selected={selected ? 'true' : 'false'}
      style={{
        width: 56,
        height: 26,
        borderRadius: 4,
        background: editorTheme.color.paper,
        border: `1px dashed ${editorTheme.color.inkSoft}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: editorTheme.font.body,
        color: editorTheme.color.inkSoft,
        fontStyle: 'italic',
        fontSize: 10,
        position: 'relative',
      }}
    >
      <span>{data.label ?? 'ch-sp'}</span>
      <Handle type="target" position={Position.Top} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="anchor" style={handleStyle} />
    </div>
  );
}

const handleStyle = {
  width: 5,
  height: 5,
  background: editorTheme.color.inkSoft,
  border: `1px solid ${editorTheme.color.paper}`,
};
```

- [ ] **Step 5: Pass**

```bash
npm test -- src/editor/canvas/StitchNode.test.tsx
```
Expected: 2 passing.

- [ ] **Step 6: Full suite**

```bash
npm test && npm run typecheck
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/editor/canvas/StitchNode.tsx src/editor/canvas/ChainSpaceNode.tsx src/editor/canvas/StitchNode.test.tsx
git commit -m "feat(editor): StitchNode + ChainSpaceNode ReactFlow custom nodes"
```

---

## Task 8: Custom edge components

**Files:**
- Create: `src/editor/canvas/edges/AnchorEdge.tsx`
- Create: `src/editor/canvas/edges/YarnFlowEdge.tsx`
- Create: `src/editor/canvas/edges/JoinEdge.tsx`
- Create: `src/editor/canvas/edges/edges.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/editor/canvas/edges/edges.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { AnchorEdge } from './AnchorEdge';
import { YarnFlowEdge } from './YarnFlowEdge';
import { JoinEdge } from './JoinEdge';

function wrap(children: React.ReactNode) {
  return (
    <ReactFlowProvider>
      <svg>{children}</svg>
    </ReactFlowProvider>
  );
}

const baseProps = {
  id: 'e1',
  source: 's',
  target: 't',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: 'bottom' as const,
  targetPosition: 'top' as const,
};

describe('custom edges', () => {
  it('AnchorEdge renders a path with the anchor color', () => {
    const { container } = render(wrap(<AnchorEdge {...baseProps} />));
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke')).toBeTruthy();
  });

  it('YarnFlowEdge renders a dashed path', () => {
    const { container } = render(wrap(<YarnFlowEdge {...baseProps} />));
    const path = container.querySelector('path');
    expect(path?.getAttribute('stroke-dasharray')).toBeTruthy();
  });

  it('JoinEdge renders a path', () => {
    const { container } = render(wrap(<JoinEdge {...baseProps} />));
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/canvas/edges/edges.test.tsx
```

- [ ] **Step 3: Implement edges**

```tsx
// src/editor/canvas/edges/AnchorEdge.tsx
import { BaseEdge, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function AnchorEdge(props: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: editorTheme.color.rule,
        strokeWidth: 1.5,
      }}
      markerEnd="url(#anchor-arrow)"
    />
  );
}
```

```tsx
// src/editor/canvas/edges/YarnFlowEdge.tsx
import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function YarnFlowEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: editorTheme.color.yarnFlow,
        strokeWidth: 1.4,
        strokeDasharray: '5 4',
      }}
      markerEnd="url(#yarn-arrow)"
    />
  );
}
```

```tsx
// src/editor/canvas/edges/JoinEdge.tsx
import { BaseEdge, getStraightPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function JoinEdge(props: EdgeProps) {
  const [path] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: editorTheme.color.accent,
        strokeWidth: 1.3,
        strokeDasharray: '2 4',
      }}
    />
  );
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/editor/canvas/edges/edges.test.tsx
```
Expected: 3 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/canvas/edges/
git commit -m "feat(editor): custom edge components — anchor / yarn_flow / join with vintage colors"
```

---

## Task 9: GraphCanvas wrapper

**Files:**
- Create: `src/editor/canvas/GraphCanvas.tsx`
- Create: `src/editor/canvas/graphMapping.ts` — converts `Pattern` → ReactFlow nodes/edges
- Create: `src/editor/canvas/graphMapping.test.ts`

- [ ] **Step 1: Failing test for graphMapping**

```ts
// src/editor/canvas/graphMapping.test.ts
import { describe, it, expect } from 'vitest';
import { patternToReactFlow } from './graphMapping';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../../domain/graph/build';
import type { Pattern } from '../../domain/graph/types';

function withMagicRingAndChild(): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { position: { x: 0, y: 0 } });
  const sc = newStitch({ kind: 'builtin', type: 'sc' }, { position: { x: 50, y: -50 } });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, sc],
    edges: [
      newAnchorEdge(sc.id, { kind: 'stitch', id: ring.id }),
      newYarnFlowEdge(ring.id, sc.id),
    ],
  };
}

describe('patternToReactFlow', () => {
  it('returns empty arrays for empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const { nodes, edges } = patternToReactFlow(p);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('maps stitches to ReactFlow nodes with positions', () => {
    const p = withMagicRingAndChild();
    const { nodes } = patternToReactFlow(p);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.position).toEqual({ x: 0, y: 0 });
    expect(nodes[0]!.type).toBe('stitch');
  });

  it('maps anchor edges with type "anchor"', () => {
    const p = withMagicRingAndChild();
    const { edges } = patternToReactFlow(p);
    const anchorEdge = edges.find((e) => e.type === 'anchor');
    expect(anchorEdge).toBeDefined();
  });

  it('maps yarn_flow edges with type "yarn_flow"', () => {
    const p = withMagicRingAndChild();
    const { edges } = patternToReactFlow(p);
    const yarnEdge = edges.find((e) => e.type === 'yarn_flow');
    expect(yarnEdge).toBeDefined();
  });

  it('skips anchor edges to non-stitch targets (magic_ring, chain_space) — chain_space gets a virtual node', () => {
    // chain_space target should be rendered as a separate chain-space node + an anchor edge to it.
    // For now: anchor edge to magic_ring kind is dropped (no source node to connect to).
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'sc' }, { position: { x: 0, y: 0 } });
    const populated: Pattern = {
      ...p,
      shape: 'radial',
      stitches: [a],
      edges: [newAnchorEdge(a.id, { kind: 'magic_ring' })],
    };
    const { edges } = patternToReactFlow(populated);
    expect(edges).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/canvas/graphMapping.test.ts
```

- [ ] **Step 3: Implement graphMapping**

```ts
// src/editor/canvas/graphMapping.ts
import type { Node as RfNode, Edge as RfEdge } from 'reactflow';
import type { Pattern, Edge as PatternEdge, BuiltinStitchType, StitchTypeRef } from '../../domain/graph/types';
import type { StitchNodeData } from './StitchNode';
import { isAnchorEdge, isYarnFlowEdge, isJoinEdge, isStitchAnchor } from '../../domain/graph/types';

const BUILTIN_SYMBOL: Record<BuiltinStitchType, string> = {
  ch: '∞',
  sl_st: '•',
  sc: '×',
  hdc: 'Ŧ',
  dc: '⊤',
  tr: '⊤',
  gr_st: '≣',
  magic_ring: '○',
  fasten_off: '↗',
};

const BUILTIN_LABEL: Record<BuiltinStitchType, string> = {
  ch: 'ch',
  sl_st: 'sl',
  sc: 'sc',
  hdc: 'hdc',
  dc: 'dc',
  tr: 'tr',
  gr_st: 'gr',
  magic_ring: 'ring',
  fasten_off: 'off',
};

function symbolFor(typeRef: StitchTypeRef, pattern: Pattern): { symbol: string; label: string } {
  if (typeRef.kind === 'builtin') {
    return { symbol: BUILTIN_SYMBOL[typeRef.type], label: BUILTIN_LABEL[typeRef.type] };
  }
  const custom = pattern.customStitches.find((c) => c.id === typeRef.id);
  return { symbol: '?', label: custom?.shortCode ?? '??' };
}

function colorFor(colorRef: string | undefined, pattern: Pattern): string | undefined {
  if (!colorRef) return undefined;
  return pattern.colors.find((c) => c.id === colorRef)?.hex;
}

export interface MappedGraph {
  nodes: RfNode<StitchNodeData>[];
  edges: RfEdge[];
}

export function patternToReactFlow(pattern: Pattern): MappedGraph {
  const nodes: RfNode<StitchNodeData>[] = pattern.stitches.map((s) => {
    const { symbol, label } = symbolFor(s.typeRef, pattern);
    return {
      id: s.id,
      type: 'stitch',
      position: s.position ?? { x: 0, y: 0 },
      data: { label, symbol, color: colorFor(s.colorRef, pattern) },
    };
  });

  const edges: RfEdge[] = [];
  for (const e of pattern.edges) {
    if (isAnchorEdge(e)) {
      if (!isStitchAnchor(e.to)) continue; // skip magic_ring/turning_chain/chain_space — handled differently
      edges.push({
        id: e.id,
        type: 'anchor',
        source: e.to.id,
        target: e.from,
        sourceHandle: 'anchor',
        targetHandle: 'anchored-by',
      });
    } else if (isYarnFlowEdge(e)) {
      edges.push({
        id: e.id,
        type: 'yarn_flow',
        source: e.from,
        target: e.to,
        sourceHandle: 'out',
        targetHandle: 'in',
      });
    } else if (isJoinEdge(e)) {
      for (const target of e.targets) {
        edges.push({
          id: `${e.id}--${target}`,
          type: 'join',
          source: e.stitch,
          target,
        });
      }
    }
  }
  return { nodes, edges };
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/editor/canvas/graphMapping.test.ts
```
Expected: 5 passing.

- [ ] **Step 5: Implement GraphCanvas**

```tsx
// src/editor/canvas/GraphCanvas.tsx
import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StitchNode } from './StitchNode';
import { ChainSpaceNode } from './ChainSpaceNode';
import { AnchorEdge } from './edges/AnchorEdge';
import { YarnFlowEdge } from './edges/YarnFlowEdge';
import { JoinEdge } from './edges/JoinEdge';
import { patternToReactFlow } from './graphMapping';
import { editorTheme } from '../theme';
import { usePatternGraphStore } from '../../stores/patternGraphStore';

const nodeTypes: NodeTypes = {
  stitch: StitchNode,
  chainSpace: ChainSpaceNode,
};

const edgeTypes: EdgeTypes = {
  anchor: AnchorEdge,
  yarn_flow: YarnFlowEdge,
  join: JoinEdge,
};

interface Props {
  onNodeClick?: (stitchId: string) => void;
}

export function GraphCanvas({ onNodeClick }: Props) {
  const pattern = usePatternGraphStore((s) => s.pattern);
  const updatePos = usePatternGraphStore((s) => s.updateStitchPosition);
  const { nodes, edges } = useMemo(
    () => (pattern ? patternToReactFlow(pattern) : { nodes: [], edges: [] }),
    [pattern],
  );

  return (
    <div style={{ width: '100%', height: '100%', background: editorTheme.color.paper }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_e, node) => onNodeClick?.(node.id)}
        onNodeDragStop={(_e, node) => updatePos(node.id, node.position)}
        fitView
      >
        <Background gap={24} size={1} color={editorTheme.color.rule} />
        <Controls position="bottom-left" />
        <MiniMap position="bottom-right" pannable zoomable />
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <marker id="anchor-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8" fill="none" stroke={editorTheme.color.rule} strokeWidth="1" />
            </marker>
            <marker id="yarn-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8" fill="none" stroke={editorTheme.color.yarnFlow} strokeWidth="1" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 6: Full suite + typecheck**

```bash
npm test && npm run typecheck && npm run build
```
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/editor/canvas/GraphCanvas.tsx src/editor/canvas/graphMapping.ts src/editor/canvas/graphMapping.test.ts
git commit -m "feat(editor): GraphCanvas wrapper + Pattern->ReactFlow mapping"
```

---

## Task 10: Connection interaction logic

**Files:**
- Create: `src/editor/interactions/connectEdge.ts`
- Create: `src/editor/interactions/connectEdge.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/editor/interactions/connectEdge.test.ts
import { describe, it, expect } from 'vitest';
import { decideEdgeKind, validateConnection } from './connectEdge';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../../domain/graph/build';
import type { Pattern } from '../../domain/graph/types';

describe('decideEdgeKind', () => {
  it('returns "yarn_flow" when shift is held', () => {
    expect(decideEdgeKind({ shift: true })).toBe('yarn_flow');
  });

  it('returns "join" when alt is held', () => {
    expect(decideEdgeKind({ alt: true })).toBe('join');
  });

  it('returns "anchor" by default', () => {
    expect(decideEdgeKind({})).toBe('anchor');
    expect(decideEdgeKind({ shift: false, alt: false })).toBe('anchor');
  });

  it('prefers shift over alt when both are pressed', () => {
    expect(decideEdgeKind({ shift: true, alt: true })).toBe('yarn_flow');
  });
});

describe('validateConnection', () => {
  function withTwoStitches(): { pattern: Pattern; a: string; b: string } {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    return { pattern: { ...p, stitches: [a, b] }, a: a.id, b: b.id };
  }

  it('accepts a valid anchor connection', () => {
    const { pattern, a, b } = withTwoStitches();
    const r = validateConnection({ pattern, source: a, target: b, kind: 'anchor' });
    expect(r.kind).toBe('ok');
  });

  it('rejects self-connection', () => {
    const { pattern, a } = withTwoStitches();
    const r = validateConnection({ pattern, source: a, target: a, kind: 'anchor' });
    expect(r.kind).toBe('error');
  });

  it('rejects a duplicate anchor edge', () => {
    const { pattern, a, b } = withTwoStitches();
    const populated: Pattern = {
      ...pattern,
      edges: [newAnchorEdge(b, { kind: 'stitch', id: a })],
    };
    const r = validateConnection({ pattern: populated, source: a, target: b, kind: 'anchor' });
    expect(r.kind).toBe('error');
  });

  it('rejects yarn_flow that would create a cycle', () => {
    const { pattern, a, b } = withTwoStitches();
    const populated: Pattern = {
      ...pattern,
      edges: [newYarnFlowEdge(a, b)],
    };
    const r = validateConnection({ pattern: populated, source: b, target: a, kind: 'yarn_flow' });
    expect(r.kind).toBe('error');
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/interactions/connectEdge.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/editor/interactions/connectEdge.ts
import type { Pattern, StitchId, Edge } from '../../domain/graph/types';
import { isAnchorEdge, isYarnFlowEdge, isStitchAnchor } from '../../domain/graph/types';

export type EdgeKind = 'anchor' | 'yarn_flow' | 'join';

export interface ModifierState {
  shift?: boolean;
  alt?: boolean;
}

export function decideEdgeKind(mods: ModifierState): EdgeKind {
  if (mods.shift) return 'yarn_flow';
  if (mods.alt) return 'join';
  return 'anchor';
}

export interface ConnectionAttempt {
  pattern: Pattern;
  source: StitchId;
  target: StitchId;
  kind: EdgeKind;
}

export type ValidationResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

function existsAnchorEdge(pattern: Pattern, from: StitchId, to: StitchId): boolean {
  return pattern.edges.some(
    (e) => isAnchorEdge(e) && e.from === from && isStitchAnchor(e.to) && e.to.id === to,
  );
}

function wouldCreateYarnFlowCycle(pattern: Pattern, from: StitchId, to: StitchId): boolean {
  // Walk from `to` along yarn_flow edges. If we reach `from`, the new edge would close a cycle.
  const next = new Map<StitchId, StitchId>();
  for (const e of pattern.edges) {
    if (isYarnFlowEdge(e)) next.set(e.from, e.to);
  }
  let cursor: StitchId | undefined = to;
  const visited = new Set<StitchId>();
  while (cursor !== undefined) {
    if (cursor === from) return true;
    if (visited.has(cursor)) return false;
    visited.add(cursor);
    cursor = next.get(cursor);
  }
  return false;
}

export function validateConnection(attempt: ConnectionAttempt): ValidationResult {
  const { pattern, source, target, kind } = attempt;
  if (source === target) {
    return { kind: 'error', message: 'Cannot connect a stitch to itself.' };
  }
  if (kind === 'anchor' && existsAnchorEdge(pattern, source, target)) {
    return { kind: 'error', message: 'Anchor edge already exists.' };
  }
  if (kind === 'yarn_flow' && wouldCreateYarnFlowCycle(pattern, source, target)) {
    return { kind: 'error', message: 'Yarn flow connection would create a cycle.' };
  }
  return { kind: 'ok' };
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/editor/interactions/connectEdge.test.ts
```
Expected: 8 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/interactions/connectEdge.ts src/editor/interactions/connectEdge.test.ts
git commit -m "feat(editor): connectEdge — decide edge kind + validate connections"
```

---

## Task 11: NodePalette + CustomStitchModal

**Files:**
- Create: `src/editor/NodePalette.tsx`
- Create: `src/editor/NodePalette.test.tsx`
- Create: `src/editor/CustomStitchModal.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/editor/NodePalette.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodePalette } from './NodePalette';

describe('NodePalette', () => {
  it('renders all built-in stitch tiles', () => {
    render(<NodePalette onSelect={() => {}} onAddCustom={() => {}} customStitches={[]} colors={[]} />);
    expect(screen.getByText('sc')).toBeInTheDocument();
    expect(screen.getByText('dc')).toBeInTheDocument();
    expect(screen.getByText('ch')).toBeInTheDocument();
    expect(screen.getByText('ring')).toBeInTheDocument();
  });

  it('calls onSelect when a built-in tile is clicked', () => {
    const onSelect = vi.fn();
    render(<NodePalette onSelect={onSelect} onAddCustom={() => {}} customStitches={[]} colors={[]} />);
    fireEvent.click(screen.getByText('sc'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'builtin', type: 'sc' });
  });

  it('calls onAddCustom when the + button is clicked', () => {
    const onAddCustom = vi.fn();
    render(<NodePalette onSelect={() => {}} onAddCustom={onAddCustom} customStitches={[]} colors={[]} />);
    fireEvent.click(screen.getByText(/\+ custom/i));
    expect(onAddCustom).toHaveBeenCalled();
  });

  it('lists custom stitches by shortCode', () => {
    render(
      <NodePalette
        onSelect={() => {}}
        onAddCustom={() => {}}
        customStitches={[
          {
            id: 'cs1',
            shortCode: 'HC',
            nameByLanguage: { pl: 'P', en: 'H' },
            symbol: { kind: 'svgPath', path: 'M0 0' },
          },
        ]}
        colors={[]}
      />,
    );
    expect(screen.getByText('HC')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/NodePalette.test.tsx
```

- [ ] **Step 3: Implement NodePalette**

```tsx
// src/editor/NodePalette.tsx
import type { CustomStitch, Color, StitchTypeRef, BuiltinStitchType } from '../domain/graph/types';
import { editorTheme } from './theme';

const BUILTIN_TYPES: Array<{ type: BuiltinStitchType; label: string; symbol: string }> = [
  { type: 'magic_ring', label: 'ring', symbol: '○' },
  { type: 'ch',         label: 'ch',   symbol: '∞' },
  { type: 'sl_st',      label: 'sl',   symbol: '•' },
  { type: 'sc',         label: 'sc',   symbol: '×' },
  { type: 'hdc',        label: 'hdc',  symbol: 'Ŧ' },
  { type: 'dc',         label: 'dc',   symbol: '⊤' },
  { type: 'tr',         label: 'tr',   symbol: '⊤' },
  { type: 'gr_st',      label: 'gr',   symbol: '≣' },
  { type: 'fasten_off', label: 'off',  symbol: '↗' },
];

interface Props {
  onSelect: (typeRef: StitchTypeRef) => void;
  onAddCustom: () => void;
  customStitches: ReadonlyArray<CustomStitch>;
  colors: ReadonlyArray<Color>;
}

const tileStyle = {
  background: editorTheme.color.paperHi,
  border: `1px solid ${editorTheme.color.rule}`,
  borderRadius: editorTheme.radius.s,
  padding: '6px 8px',
  marginBottom: 3,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: editorTheme.color.ink,
  fontFamily: editorTheme.font.body,
};

export function NodePalette({ onSelect, onAddCustom, customStitches, colors }: Props) {
  return (
    <aside
      style={{
        width: 120,
        background: editorTheme.color.paper,
        borderRight: `1px solid ${editorTheme.color.rule}`,
        padding: 10,
        overflow: 'auto',
        height: '100%',
      }}
    >
      <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '0 0 6px 0' }}>
        Sploty
      </h3>
      {BUILTIN_TYPES.map(({ type, label, symbol }) => (
        <button
          key={type}
          type="button"
          style={{ ...tileStyle, width: '100%' }}
          onClick={() => onSelect({ kind: 'builtin', type })}
        >
          <span style={{ fontSize: 14 }}>{symbol}</span>
          <span>{label}</span>
        </button>
      ))}

      <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '14px 0 6px 0' }}>
        Custom
      </h3>
      {customStitches.map((c) => (
        <button
          key={c.id}
          type="button"
          style={{ ...tileStyle, width: '100%' }}
          onClick={() => onSelect({ kind: 'custom', id: c.id })}
        >
          <span style={{ fontStyle: 'italic' }}>{c.shortCode}</span>
        </button>
      ))}
      <button
        type="button"
        style={{
          ...tileStyle,
          width: '100%',
          background: 'transparent',
          color: editorTheme.color.inkSoft,
          textAlign: 'center',
          justifyContent: 'center',
        }}
        onClick={onAddCustom}
      >
        + custom
      </button>

      {colors.length > 0 && (
        <>
          <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '14px 0 6px 0' }}>
            Kolory
          </h3>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {colors.map((c) => (
              <div
                key={c.id}
                title={c.nameByLanguage?.pl ?? c.id}
                style={{
                  width: 18,
                  height: 18,
                  background: c.hex,
                  border: `1px solid ${editorTheme.color.inkSoft}`,
                  borderRadius: editorTheme.radius.s,
                }}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 4: Implement CustomStitchModal**

```tsx
// src/editor/CustomStitchModal.tsx
import { useState } from 'react';
import { EMPTY_DRAFT, type CustomStitchDraft } from '../domain/customStitch/types';
import { finalizeDraft, isShortCodeAvailable } from '../domain/customStitch/registry';
import type { CustomStitch } from '../domain/graph/types';
import { editorTheme } from './theme';

interface Props {
  existing: ReadonlyArray<CustomStitch>;
  onCancel: () => void;
  onCreate: (stitch: CustomStitch) => void;
}

const PRESET_SYMBOLS = [
  { id: 'shell',    label: 'Shell ∨' },
  { id: 'popcorn',  label: 'Popcorn ○' },
  { id: 'puff',     label: 'Puff ◇' },
  { id: 'picot',    label: 'Picot ⁂' },
  { id: 'v_stitch', label: 'V-stitch ∨' },
  { id: 'fpdc',     label: 'FPdc ⊥' },
  { id: 'bpdc',     label: 'BPdc ⊤' },
];

export function CustomStitchModal({ existing, onCancel, onCreate }: Props) {
  const [draft, setDraft] = useState<CustomStitchDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);
  const codeFree = isShortCodeAvailable(existing, draft.shortCode);

  function update<K extends keyof CustomStitchDraft>(k: K, v: CustomStitchDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors([]);
  }

  function submit() {
    const r = finalizeDraft(draft);
    if (r.kind === 'error') return setErrors(r.messages);
    if (!codeFree) return setErrors(['shortCode collides with built-in or existing']);
    onCreate(r.value);
  }

  return (
    <div
      role="dialog"
      aria-label="Custom stitch"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(58, 47, 29, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: editorTheme.color.paperHi,
          padding: editorTheme.spacing.xl,
          borderRadius: editorTheme.radius.l,
          minWidth: 380,
          fontFamily: editorTheme.font.body,
          color: editorTheme.color.ink,
        }}
      >
        <h2 style={{ margin: 0, fontStyle: 'italic' }}>Nowy splot</h2>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            ShortCode (1–3 letters)
            <input
              value={draft.shortCode}
              onChange={(e) => update('shortCode', e.target.value)}
              style={{ display: 'block', width: '100%' }}
            />
            {!codeFree && draft.shortCode && (
              <span style={{ color: editorTheme.color.accent, fontSize: 11 }}>collides</span>
            )}
          </label>
          <label>
            Nazwa (PL)
            <input value={draft.namePl} onChange={(e) => update('namePl', e.target.value)} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Name (EN)
            <input value={draft.nameEn} onChange={(e) => update('nameEn', e.target.value)} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Symbol
            <select
              value={draft.symbolPresetId ?? ''}
              onChange={(e) => update('symbolPresetId', e.target.value || undefined)}
              style={{ display: 'block', width: '100%' }}
            >
              <option value="">(choose…)</option>
              {PRESET_SYMBOLS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        {errors.length > 0 && (
          <ul style={{ color: editorTheme.color.accent, fontSize: 12 }}>
            {errors.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel}>Anuluj</button>
          <button type="button" onClick={submit}>Dodaj</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Pass**

```bash
npm test -- src/editor/NodePalette.test.tsx
```
Expected: 4 passing.

- [ ] **Step 6: Full suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/editor/NodePalette.tsx src/editor/NodePalette.test.tsx src/editor/CustomStitchModal.tsx
git commit -m "feat(editor): NodePalette and CustomStitchModal"
```

---

## Task 12: Inspector

**Files:**
- Create: `src/editor/Inspector.tsx`
- Create: `src/editor/Inspector.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/editor/Inspector.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inspector } from './Inspector';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';

describe('Inspector', () => {
  it('renders an empty state when no stitch is selected', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    render(<Inspector pattern={p} selectedStitchId={null} />);
    expect(screen.getByText(/no stitch selected/i)).toBeInTheDocument();
  });

  it('renders details for the selected stitch', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
    const sc = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
    const populated = {
      ...p,
      stitches: [ring, sc],
      edges: [newAnchorEdge(sc.id, { kind: 'stitch', id: ring.id })],
    };
    render(<Inspector pattern={populated} selectedStitchId={sc.id} />);
    expect(screen.getByText(/sc/i)).toBeInTheDocument();
    expect(screen.getByText(/round 1/i)).toBeInTheDocument();
  });

  it('shows validator warnings when present', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const orphan = newStitch({ kind: 'builtin', type: 'sc' });
    const populated = { ...p, stitches: [orphan], edges: [] };
    render(<Inspector pattern={populated} selectedStitchId={orphan.id} />);
    expect(screen.getByText(/orphan/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/Inspector.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/editor/Inspector.tsx
import { useMemo } from 'react';
import type { Pattern, StitchId } from '../domain/graph/types';
import { validateGraph } from '../domain/validation/graph';
import { editorTheme } from './theme';

interface Props {
  pattern: Pattern;
  selectedStitchId: StitchId | null;
}

export function Inspector({ pattern, selectedStitchId }: Props) {
  const stitch = useMemo(
    () => pattern.stitches.find((s) => s.id === selectedStitchId) ?? null,
    [pattern, selectedStitchId],
  );

  const issuesForStitch = useMemo(() => {
    if (!stitch) return [];
    return validateGraph(pattern).filter((i) => i.stitchId === stitch.id);
  }, [pattern, stitch]);

  return (
    <aside
      style={{
        width: 220,
        background: editorTheme.color.paperHi,
        borderLeft: `1px solid ${editorTheme.color.rule}`,
        padding: editorTheme.spacing.m,
        fontSize: 12,
        color: editorTheme.color.ink,
        fontFamily: editorTheme.font.body,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontStyle: 'italic', color: editorTheme.color.inkSoft }}>Inspector</h3>
      {!stitch ? (
        <div style={{ color: editorTheme.color.inkSoft, fontStyle: 'italic' }}>no stitch selected</div>
      ) : (
        <>
          <div><strong>Type:</strong> {stitch.typeRef.kind === 'builtin' ? stitch.typeRef.type : `custom: ${stitch.typeRef.id}`}</div>
          {stitch.round !== undefined && <div><strong>Round:</strong> Round {stitch.round}</div>}
          {stitch.colorRef && <div><strong>Color:</strong> {stitch.colorRef}</div>}
          {stitch.position && (
            <div><strong>Pos:</strong> ({Math.round(stitch.position.x)}, {Math.round(stitch.position.y)})</div>
          )}
          {stitch.attachments?.photoIds && stitch.attachments.photoIds.length > 0 && (
            <div><strong>Photos:</strong> {stitch.attachments.photoIds.length}</div>
          )}
          {stitch.attachments?.note && (
            <div style={{ marginTop: 6, padding: 6, background: editorTheme.color.accentHi, fontStyle: 'italic' }}>
              {stitch.attachments.note}
            </div>
          )}
          {issuesForStitch.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: '0 0 4px 0', fontStyle: 'italic', color: editorTheme.color.inkSoft }}>Walidator</h4>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {issuesForStitch.map((i, idx) => (
                  <li key={idx} style={{ color: i.severity === 'critical' ? editorTheme.color.accent : editorTheme.color.inkSoft }}>
                    {i.kind}: {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/editor/Inspector.test.tsx
```
Expected: 3 passing.

- [ ] **Step 5: Full suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/Inspector.tsx src/editor/Inspector.test.tsx
git commit -m "feat(editor): Inspector showing selected stitch and validator badges"
```

---

## Task 13: GraphEditorShell (top-level 3-column layout)

**Files:**
- Create: `src/editor/GraphEditorShell.tsx`
- Create: `src/editor/GraphEditorShell.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/editor/GraphEditorShell.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphEditorShell } from './GraphEditorShell';
import { usePatternGraphStore } from '../stores/patternGraphStore';
import { emptyPatternV3 } from '../domain/graph/build';

describe('GraphEditorShell', () => {
  beforeEach(() => {
    usePatternGraphStore.getState().reset();
  });

  it('renders the top toolbar with editor brand', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    render(<GraphEditorShell />);
    expect(screen.getByText(/crochet-designer/i)).toBeInTheDocument();
  });

  it('renders palette and inspector when pattern is loaded', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    render(<GraphEditorShell />);
    expect(screen.getByText('sc')).toBeInTheDocument(); // palette
    expect(screen.getByText(/inspector/i)).toBeInTheDocument(); // inspector heading
  });

  it('renders an empty state when no pattern is loaded', () => {
    render(<GraphEditorShell />);
    expect(screen.getByText(/load or create a pattern/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
npm test -- src/editor/GraphEditorShell.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/editor/GraphEditorShell.tsx
import { useState } from 'react';
import { GraphCanvas } from './canvas/GraphCanvas';
import { NodePalette } from './NodePalette';
import { Inspector } from './Inspector';
import { CustomStitchModal } from './CustomStitchModal';
import { usePatternGraphStore } from '../stores/patternGraphStore';
import { useDocumentStore } from '../stores/documentStore';
import { newStitch } from '../domain/graph/build';
import { addCustomStitch } from '../domain/customStitch/registry';
import type { StitchTypeRef, CustomStitch } from '../domain/graph/types';
import { editorTheme } from './theme';

export function GraphEditorShell() {
  const pattern = usePatternGraphStore((s) => s.pattern);
  const selectedStitchId = usePatternGraphStore((s) => s.selectedStitchId);
  const setPattern = usePatternGraphStore((s) => s.setPattern);
  const addStitch = usePatternGraphStore((s) => s.addStitch);
  const selectStitch = usePatternGraphStore((s) => s.selectStitch);
  const switchToRectMode = () => useDocumentStore.getState().setMode('rectangular');
  const [showCustomModal, setShowCustomModal] = useState(false);

  function handlePaletteSelect(typeRef: StitchTypeRef) {
    if (!pattern) return;
    // Add a stitch at a default position in the center of the canvas (0,0).
    addStitch(newStitch(typeRef, { position: { x: 0, y: 0 } }));
  }

  function handleCustomCreated(stitch: CustomStitch) {
    if (!pattern) return;
    setPattern({ ...pattern, customStitches: addCustomStitch(pattern.customStitches, stitch) });
    setShowCustomModal(false);
  }

  if (!pattern) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: editorTheme.color.paper,
          fontFamily: editorTheme.font.body,
          color: editorTheme.color.inkSoft,
          fontStyle: 'italic',
        }}
      >
        Load or create a pattern to begin.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: editorTheme.color.paper }}>
      <header
        style={{
          height: 40,
          background: editorTheme.color.paperHi,
          borderBottom: `1px solid ${editorTheme.color.rule}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: editorTheme.font.display,
            fontStyle: 'italic',
            fontSize: 18,
            color: editorTheme.color.inkSoft,
          }}
        >
          crochet-designer
        </span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => { try { switchToRectMode(); } catch { /* no-op when no v2 pattern */ } }}>
          Switch to rectangular
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NodePalette
          onSelect={handlePaletteSelect}
          onAddCustom={() => setShowCustomModal(true)}
          customStitches={pattern.customStitches}
          colors={pattern.colors}
        />
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <GraphCanvas onNodeClick={selectStitch} />
        </div>
        <Inspector pattern={pattern} selectedStitchId={selectedStitchId} />
      </div>
      <footer
        style={{
          height: 28,
          background: editorTheme.color.paperHi,
          borderTop: `1px solid ${editorTheme.color.rule}`,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: editorTheme.color.inkSoft,
        }}
      >
        <span>Stitches: {pattern.stitches.length}</span>
        <span>Edges: {pattern.edges.length}</span>
        <span>Custom: {pattern.customStitches.length}</span>
      </footer>
      {showCustomModal && (
        <CustomStitchModal
          existing={pattern.customStitches}
          onCancel={() => setShowCustomModal(false)}
          onCreate={handleCustomCreated}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Pass**

```bash
npm test -- src/editor/GraphEditorShell.test.tsx
```
Expected: 3 passing.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run typecheck && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/editor/GraphEditorShell.tsx src/editor/GraphEditorShell.test.tsx
git commit -m "feat(editor): GraphEditorShell — 3-column layout with palette/canvas/inspector"
```

---

## Task 14: Mode switching + welcome screen integration + draft PR update

**Files:**
- Create: `src/views/GraphEditorView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/views/EmptyView.tsx`
- Modify: `package.json` (version bump 0.4.0-alpha.0)

- [ ] **Step 1: Create GraphEditorView**

```tsx
// src/views/GraphEditorView.tsx
import { useEffect } from 'react';
import { GraphEditorShell } from '../editor/GraphEditorShell';
import { useDocumentStore } from '../stores/documentStore';
import { usePatternGraphStore } from '../stores/patternGraphStore';

export function GraphEditorView() {
  const pattern = useDocumentStore((s) => s.graphPattern);
  const setStorePattern = usePatternGraphStore((s) => s.setPattern);

  useEffect(() => {
    setStorePattern(pattern);
  }, [pattern, setStorePattern]);

  return <GraphEditorShell />;
}
```

- [ ] **Step 2: Wire mode switcher in App.tsx**

Open `src/App.tsx`. After the existing `usePatternStore` selector lines, add:

```tsx
import { GraphEditorView } from './views/GraphEditorView';
const documentMode = useDocumentStore((s) => s.mode);
```

Inside the JSX return, before the existing `{pattern ? <EditorView ... /> : <EmptyView ... />}` block, wrap it:

Replace the existing block:
```tsx
{pattern ? (
  <EditorView ... />
) : (
  <EmptyView ... />
)}
```

with:
```tsx
{documentMode === 'graph' ? (
  <GraphEditorView />
) : pattern ? (
  <EditorView
    onOpenSettings={() => setIsSettingsOpen(true)}
    onOpenShortcuts={() => setIsShortcutsOpen(true)}
  />
) : (
  <EmptyView
    onNew={handleNew}
    onOpen={() => void handleOpen()}
    onOpenSettings={() => setIsSettingsOpen(true)}
    onOpenShortcuts={() => setIsShortcutsOpen(true)}
  />
)}
```

This routes `documentStore.mode === 'graph'` to the new editor, otherwise falls back to the existing v2 flow.

- [ ] **Step 3: Add "Stwórz wzór radialny" affordance to EmptyView**

Open `src/views/EmptyView.tsx`. Add an import:

```tsx
import { useDocumentStore } from '../stores/documentStore';
import { emptyPatternV3 } from '../domain/graph/build';
```

Add an action button somewhere visible in the layout (e.g. near the existing "New pattern" affordance — match the existing UI patterns in `EmptyState`). Concretely, in the JSX, place a button like:

```tsx
<button
  type="button"
  onClick={() => {
    const p = emptyPatternV3({ title: { pl: 'Nowy wzór', en: 'New pattern' }, author: '' });
    useDocumentStore.getState().loadGraphPattern(p);
  }}
>
  Stwórz wzór radialny
</button>
```

Place it where it fits visually (the existing component structure may already have an `EmptyState` component receiving an `onNew` callback — adding a sibling button under that callsite is the cleanest path). If you cannot place it cleanly in 1 minute, add it just outside the `EmptyState` invocation as a temporary, plainly-styled button — Phase 4 cleans up styling.

- [ ] **Step 4: Bump version**

Open `package.json`. Change `"version"` from `"0.3.0-alpha.0"` to `"0.4.0-alpha.0"`.

- [ ] **Step 5: Run everything**

```bash
npm test && npm run typecheck && npm run build
```
Expected: all green; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/views/GraphEditorView.tsx src/App.tsx src/views/EmptyView.tsx package.json
git commit -m "feat(editor): wire graph editor into App with mode switcher and radial start button (0.4.0-alpha.0)"
```

- [ ] **Step 7: Push and update draft PR**

```bash
git push
gh pr edit feature/pdf-pattern-designer --title "feat: Phase 1+2 — multigraph foundations and graph editor" --body "$(cat <<'EOF'
## Summary
**Phase 1 (foundations):**
- Pattern v3 multigraph types, builders, walk helpers, validator
- v2 → v3 migration with legacyGrid shadow
- parsePatternAsV3 unifies v1/v2/v3 parsing paths
- v3 load/save helpers next to existing v2 API
- documentStore for switching between rectangular and graph modes
- Dev-only GraphInspector behind `?devtools`

**Phase 2 (graph editor):**
- ReactFlow-based 3-column editor (palette / canvas / inspector)
- Custom stitch creation modal with shortcode collision check
- Radial / linear / freeform auto-layout engine
- Connection interactions with Shift (yarn_flow) / Alt (join) modifiers
- patternGraphStore (Zustand) with edge pruning on stitch removal
- "Stwórz wzór radialny" affordance on welcome screen
- App-level mode switcher routes between rectangular (v2) and graph (v3) editors

Spec: docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md
Plans: docs/superpowers/plans/2026-05-11-phase-1-foundations.md, docs/superpowers/plans/2026-05-12-phase-2-editor.md

## Test plan
- [x] npm test --run (all passing)
- [x] npm run typecheck (clean)
- [x] npm run build (vite build succeeds)
- [x] Migration of 4 bundled examples: zero critical issues
- [ ] Manual smoke: open existing v2 .wzor (rectangular editor works), create new radial pattern, drag from palette, verify stitch appears, connect anchor edge

## What's NOT in this PR
- Chart rendering (Phase 3)
- PDF export (Phase 3)
- Photos (Phase 3)
- Educational layer, animated yarn path, garment templates (Phase 4)

EOF
)"
```

If the PR doesn't exist or has a different identifier, run `gh pr view feature/pdf-pattern-designer` first to find it.

---

## Self-review

**Spec coverage check** (§3.2 + §5):
- ReactFlow integration → Task 1 (install) + Task 9 (GraphCanvas)
- Custom node + edge components → Task 7 + Task 8
- Palette + drag-and-drop creation → Task 11 (palette click adds stitch; full drag-and-drop is deferred to Phase 4 polish but click-to-add achieves the same effect)
- Inspector → Task 12
- Auto-layout for radial + linear → Tasks 3, 4, 5
- Mode switcher → Task 14
- Custom stitch modal → Task 11

**Placeholder scan:** No TBDs. The EmptyView modification in Task 14 step 3 has a deliberate "place it where it fits" note — the file structure varies in the existing codebase so the implementer must read EmptyState first. The placement guidance is concrete (sibling to existing EmptyState invocation).

**Type consistency:**
- `Position` type promoted from inline shape to exported type in Task 6 step 3. All later tasks use it consistently.
- `StitchTypeRef` discriminator (`builtin | custom`) matches Phase 1's definition.
- `EdgeKind` in Task 10 matches `Edge.kind` from Phase 1.
- ReactFlow `Node<Data, Type>` typing in `graphMapping.ts` matches the `nodeTypes` keys (`stitch`, `chainSpace`) in `GraphCanvas`.

**Known gaps (intentionally deferred):**
- Drag-and-drop from palette to canvas (Task 11 uses click instead — same effect, less work).
- Yarn-path animation overlay → Phase 4.
- Educational tooltips → Phase 4.
- Garment template picker → Phase 4.
- Mode switch from graph back to rectangular requires the rectangular pattern store to have a pattern — the `try/catch` in `GraphEditorShell.tsx` swallows the error silently if there's no v2 pattern. Acceptable for Phase 2; Phase 4 wires a cleaner UX (probably a confirmation dialog).
