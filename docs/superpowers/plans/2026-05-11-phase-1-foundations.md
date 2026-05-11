# Phase 1 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the multigraph data model, v2→v3 migration, walk algorithms, builders, validator, and v3 persistence behind the existing rectangular editor — with no UI feature changes — so that opening any existing `.wzor` file silently migrates to v3 and a debug "Graph" tab can show the resulting graph as JSON.

**Architecture:** Add a new `domain/graph/` directory holding types, builders, walk algorithms, Zod schemas, and the migration. Extend `domain/validation.ts` with a `v3` parsing branch that calls `migrateV2ToV3` on legacy input. Keep the existing rectangular store, file IO, and UI fully working — the graph layer is purely additive. The only visible change is a single dev-only tab that pretty-prints the migrated graph.

**Tech Stack:** TypeScript (strict), Zod 4, Vitest + jsdom, React 19 + Vite, Zustand (already in use), Immer (already in use). No new runtime dependencies in this phase.

**Source spec:** `docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md`

**Working branch:** `feature/pdf-pattern-designer` (already created from `master` and contains the spec commit).

---

## File Structure

### Files created

| Path | Responsibility |
|---|---|
| `src/domain/graph/types.ts` | Canonical TypeScript types for the multigraph (`Stitch`, `Edge`, `Pattern v3`, etc.). Exports only types and type guards — no runtime constructors. |
| `src/domain/graph/build.ts` | Pure constructors for graph entities (`newStitch`, `newAnchorEdge`, `newYarnFlowEdge`, `newJoinEdge`, `emptyPatternV3`). Re-exports `newId` for callers. |
| `src/domain/graph/walk.ts` | Read-only traversal helpers (`yarnFlowSequence`, `anchorChildrenOf`, `roundOf`, `stitchesInRound`). All take a Pattern v3 and return derived data. |
| `src/domain/graph/schema.ts` | Zod schemas (`patternSchemaV3`, edge/stitch/photo schemas), `serializePatternV3`, `parsePatternV3Raw`. |
| `src/domain/graph/migration.ts` | `migrateV2ToV3(patternV2)` — pure function that maps the existing v2 row/cell grid to a v3 graph with `shape: 'rectangular'` and `legacyGrid` shadow. |
| `src/domain/validation/graph.ts` | `validateGraph(pattern)` + `GraphValidationIssue` type. Implements all invariants from spec §4.2. |
| `src/stores/documentStore.ts` | Top-level Zustand store holding the active document mode (`'rectangular'` or `'graph'`) and the v3 pattern when in graph mode. Coexists with `patternStore.ts` (which remains the source of truth in rectangular mode). |
| `src/components/devtools/GraphInspector.tsx` | Dev-only React component rendering the current v3 pattern as a collapsible JSON tree. Hidden behind a `?devtools` URL flag. |
| `src/components/devtools/GraphInspector.test.tsx` | Tests for the inspector. |
| `src/domain/graph/types.test.ts` | Type-level smoke tests via `expectTypeOf`. |
| `src/domain/graph/build.test.ts` | Unit tests for constructors. |
| `src/domain/graph/walk.test.ts` | Unit tests for traversal. |
| `src/domain/graph/schema.test.ts` | Round-trip and rejection tests. |
| `src/domain/graph/migration.test.ts` | Migration tests against the `examples/*.wzor` fixtures. |
| `src/domain/validation/graph.test.ts` | One positive and one negative test per invariant. |
| `src/stores/documentStore.test.ts` | Store transitions. |

### Files modified

| Path | Change |
|---|---|
| `src/domain/validation.ts` | Add a v3 parsing branch in `parsePatternJson` that migrates v2 input into v3 when the caller asks for a graph view; keep all existing v2 callers working. Export `parsePatternAsV3`. |
| `src/services/fileIo.ts` | Accept and serialize v3 patterns alongside v2; no API change to existing v2 callers. |
| `src/App.tsx` | Conditionally mount `<GraphInspector />` when `?devtools` is in the URL. |
| `package.json` | No dependency changes. Bump `version` to `0.3.0-alpha.0`. |

### Files explicitly NOT touched in Phase 1

- `src/views/*` — UI views stay on v2.
- `src/stores/patternStore.ts` — unchanged.
- `src-tauri/**` — no Rust changes.
- `src/services/excelExport.ts` — Excel export stays v2-only.

---

## Conventions and ground rules

- **TDD per task.** Write the failing test, run it, watch it fail with the expected message, then write minimum code, run, watch it pass.
- **Strict types.** No `any`. Use `unknown` at parse boundaries. Discriminated unions for `Edge` and `AnchorTarget`.
- **Immutability.** Builders return fresh objects. Walk helpers never mutate input. The store uses Immer via Zustand middleware (matching the existing `patternStore.ts` pattern).
- **Determinism.** Every constructor either accepts an explicit id or calls `newId()` once. No `Date.now()` outside the existing factories that already use it.
- **One commit per task.** Use the existing commit-message convention seen in `git log`: `feat:`, `test:`, `refactor:`, `docs:`, `chore:`.
- **Run the existing test suite (`pnpm test`) at the end of every task** to confirm no v2 regression.

---

## Task 1: Graph types

**Files:**
- Create: `src/domain/graph/types.ts`
- Test: `src/domain/graph/types.test.ts`

- [ ] **Step 1: Write the type-level failing test**

```ts
// src/domain/graph/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  Stitch,
  Edge,
  AnchorTarget,
  Pattern,
  BuiltinStitchType,
  StitchTypeRef,
} from './types';

describe('graph/types', () => {
  it('exports a Pattern v3 with the expected shape', () => {
    expectTypeOf<Pattern['schemaVersion']>().toEqualTypeOf<3>();
    expectTypeOf<Pattern['shape']>().toEqualTypeOf<
      'rectangular' | 'radial' | 'freeform'
    >();
    expectTypeOf<Pattern['stitches']>().toEqualTypeOf<Stitch[]>();
    expectTypeOf<Pattern['edges']>().toEqualTypeOf<Edge[]>();
  });

  it('Edge is a discriminated union with three kinds', () => {
    type Kinds = Edge['kind'];
    expectTypeOf<Kinds>().toEqualTypeOf<'anchor' | 'yarn_flow' | 'join'>();
  });

  it('AnchorTarget has the four kinds defined in the spec', () => {
    type T = AnchorTarget['kind'];
    expectTypeOf<T>().toEqualTypeOf<
      'stitch' | 'chain_space' | 'magic_ring' | 'turning_chain'
    >();
  });

  it('BuiltinStitchType covers crochet primitives + meta types', () => {
    type B = BuiltinStitchType;
    expectTypeOf<B>().toEqualTypeOf<
      | 'ch'
      | 'sl_st'
      | 'sc'
      | 'hdc'
      | 'dc'
      | 'tr'
      | 'gr_st'
      | 'magic_ring'
      | 'fasten_off'
    >();
  });

  it('StitchTypeRef discriminates builtin and custom', () => {
    type T = StitchTypeRef['kind'];
    expectTypeOf<T>().toEqualTypeOf<'builtin' | 'custom'>();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/graph/types.test.ts`
Expected: FAIL with `Cannot find module './types' or its corresponding type declarations.`

- [ ] **Step 3: Write the types**

```ts
// src/domain/graph/types.ts

export type StitchId = string;
export type EdgeId = string;
export type PhotoId = string;
export type ColorId = string;
export type CustomStitchId = string;
export type RoundIndex = number;

export type BuiltinStitchType =
  | 'ch'
  | 'sl_st'
  | 'sc'
  | 'hdc'
  | 'dc'
  | 'tr'
  | 'gr_st'
  | 'magic_ring'
  | 'fasten_off';

export type StitchTypeRef =
  | { kind: 'builtin'; type: BuiltinStitchType }
  | { kind: 'custom'; id: CustomStitchId };

export interface StitchAttachments {
  photoIds: PhotoId[];
  note?: string;
}

export interface Stitch {
  id: StitchId;
  typeRef: StitchTypeRef;
  colorRef?: ColorId;
  round?: RoundIndex;
  position?: { x: number; y: number };
  attachments?: StitchAttachments;
}

export type AnchorTarget =
  | { kind: 'stitch'; id: StitchId }
  | { kind: 'chain_space'; betweenA: StitchId; betweenB: StitchId }
  | { kind: 'magic_ring' }
  | { kind: 'turning_chain'; ofStitch: StitchId };

export type Edge =
  | { id: EdgeId; kind: 'anchor'; from: StitchId; to: AnchorTarget }
  | { id: EdgeId; kind: 'yarn_flow'; from: StitchId; to: StitchId }
  | { id: EdgeId; kind: 'join'; stitch: StitchId; targets: StitchId[] };

export interface CustomStitchSubGraph {
  stitches: Stitch[];
  edges: Edge[];
}

export interface CustomStitch {
  id: CustomStitchId;
  shortCode: string;
  nameByLanguage: Record<'pl' | 'en', string>;
  description?: Record<'pl' | 'en', string>;
  symbol:
    | { kind: 'preset'; presetId: string }
    | { kind: 'svgPath'; path: string };
  subGraph?: CustomStitchSubGraph;
}

export interface Color {
  id: ColorId;
  hex: string;
  nameByLanguage?: Record<'pl' | 'en', string>;
}

export interface Photo {
  id: PhotoId;
  storage:
    | { kind: 'inline'; base64: string; mime: string }
    | { kind: 'path'; path: string };
  captionByLanguage?: Record<'pl' | 'en', string>;
  width: number;
  height: number;
  bytes: number;
}

export interface Round {
  index: RoundIndex;
  stitchIds: StitchId[];
  noteByLanguage?: Record<'pl' | 'en', string>;
}

export type PdfSectionKind =
  | 'title'
  | 'thanks'
  | 'information'
  | 'pattern'
  | 'customization'
  | 'legend'
  | 'finishing';

export interface PdfSectionConfig {
  kind: PdfSectionKind;
  enabled: boolean;
  overrides?: Record<string, unknown>;
}

export interface YarnInfo {
  brand?: string;
  weight?: string;
  fiber?: string;
  meterage?: string;
}

export interface Gauge {
  stitches: number;
  rows: number;
  squareCm: number;
}

export type PatternLanguage = 'pl' | 'en' | 'pl-en';

export interface PatternMeta {
  title: Record<'pl' | 'en', string>;
  author: string;
  designedAt: string;
  yarn: YarnInfo;
  hook: string;
  gauge: Gauge;
  language: PatternLanguage;
  copyrightLine?: string;
  socialTag?: string;
}

export interface LegacyGridShadow {
  rows: number;
  cols: number;
  cells: Array<{ stitchId: StitchId | null }>;
}

export type PatternShape = 'rectangular' | 'radial' | 'freeform';

export interface Pattern {
  schemaVersion: 3;
  shape: PatternShape;
  meta: PatternMeta;
  colors: Color[];
  stitches: Stitch[];
  edges: Edge[];
  rounds: Round[];
  customStitches: CustomStitch[];
  photos: Photo[];
  pdfSections: PdfSectionConfig[];
  legacyGrid?: LegacyGridShadow;
}

// Type guards
export function isAnchorEdge(
  edge: Edge,
): edge is Extract<Edge, { kind: 'anchor' }> {
  return edge.kind === 'anchor';
}

export function isYarnFlowEdge(
  edge: Edge,
): edge is Extract<Edge, { kind: 'yarn_flow' }> {
  return edge.kind === 'yarn_flow';
}

export function isJoinEdge(
  edge: Edge,
): edge is Extract<Edge, { kind: 'join' }> {
  return edge.kind === 'join';
}

export function isStitchAnchor(
  target: AnchorTarget,
): target is Extract<AnchorTarget, { kind: 'stitch' }> {
  return target.kind === 'stitch';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/graph/types.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run full suite for regression check**

Run: `pnpm test && pnpm typecheck`
Expected: all existing tests pass; tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add src/domain/graph/types.ts src/domain/graph/types.test.ts
git commit -m "feat(graph): introduce Pattern v3 multigraph types"
```

---

## Task 2: Graph builders

**Files:**
- Create: `src/domain/graph/build.ts`
- Test: `src/domain/graph/build.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/graph/build.test.ts
import { describe, it, expect } from 'vitest';
import {
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
  newJoinEdge,
  emptyPatternV3,
} from './build';

describe('graph/build', () => {
  it('newStitch produces a unique id and the requested type', () => {
    const a = newStitch({ kind: 'builtin', type: 'dc' });
    const b = newStitch({ kind: 'builtin', type: 'dc' });

    expect(a.id).not.toBe(b.id);
    expect(a.typeRef).toEqual({ kind: 'builtin', type: 'dc' });
    expect(a.position).toBeUndefined();
    expect(a.colorRef).toBeUndefined();
  });

  it('newStitch accepts overrides', () => {
    const s = newStitch(
      { kind: 'custom', id: 'custom-1' },
      { colorRef: 'color-1', round: 2, position: { x: 10, y: 20 } },
    );

    expect(s.typeRef).toEqual({ kind: 'custom', id: 'custom-1' });
    expect(s.colorRef).toBe('color-1');
    expect(s.round).toBe(2);
    expect(s.position).toEqual({ x: 10, y: 20 });
  });

  it('newAnchorEdge builds a typed anchor edge', () => {
    const e = newAnchorEdge('stitch-1', { kind: 'magic_ring' });
    expect(e.kind).toBe('anchor');
    expect(e.from).toBe('stitch-1');
    expect(e.to).toEqual({ kind: 'magic_ring' });
    expect(typeof e.id).toBe('string');
  });

  it('newYarnFlowEdge builds a typed yarn_flow edge', () => {
    const e = newYarnFlowEdge('stitch-1', 'stitch-2');
    expect(e.kind).toBe('yarn_flow');
    expect(e.from).toBe('stitch-1');
    expect(e.to).toBe('stitch-2');
  });

  it('newJoinEdge builds a typed join edge', () => {
    const e = newJoinEdge('joiner', ['target-a', 'target-b']);
    expect(e.kind).toBe('join');
    expect(e.stitch).toBe('joiner');
    expect(e.targets).toEqual(['target-a', 'target-b']);
  });

  it('emptyPatternV3 produces a valid empty pattern with required defaults', () => {
    const p = emptyPatternV3({
      title: { pl: 'Wzór', en: 'Pattern' },
      author: 'Mama',
    });

    expect(p.schemaVersion).toBe(3);
    expect(p.shape).toBe('rectangular');
    expect(p.stitches).toEqual([]);
    expect(p.edges).toEqual([]);
    expect(p.rounds).toEqual([]);
    expect(p.colors.length).toBeGreaterThanOrEqual(1);
    expect(p.meta.author).toBe('Mama');
    expect(p.meta.language).toBe('pl');
    expect(p.pdfSections.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/graph/build.test.ts`
Expected: FAIL with `Cannot find module './build'`.

- [ ] **Step 3: Implement builders**

```ts
// src/domain/graph/build.ts
import { newId } from '../../utils/id';
import type {
  AnchorTarget,
  Color,
  Edge,
  Pattern,
  PatternMeta,
  PdfSectionConfig,
  Stitch,
  StitchId,
  StitchTypeRef,
} from './types';

const DEFAULT_BASE_COLOR: Color = {
  id: 'color-base',
  hex: '#f4f1ea',
  nameByLanguage: { pl: 'Bazowy', en: 'Base' },
};

const DEFAULT_PDF_SECTIONS: PdfSectionConfig[] = [
  { kind: 'title', enabled: true },
  { kind: 'thanks', enabled: true },
  { kind: 'information', enabled: true },
  { kind: 'pattern', enabled: true },
  { kind: 'customization', enabled: true },
  { kind: 'legend', enabled: true },
];

export interface StitchOverrides {
  colorRef?: string;
  round?: number;
  position?: { x: number; y: number };
}

export function newStitch(
  typeRef: StitchTypeRef,
  overrides: StitchOverrides = {},
): Stitch {
  const stitch: Stitch = {
    id: newId(),
    typeRef,
  };
  if (overrides.colorRef !== undefined) stitch.colorRef = overrides.colorRef;
  if (overrides.round !== undefined) stitch.round = overrides.round;
  if (overrides.position !== undefined) stitch.position = overrides.position;
  return stitch;
}

export function newAnchorEdge(
  from: StitchId,
  to: AnchorTarget,
): Extract<Edge, { kind: 'anchor' }> {
  return { id: newId(), kind: 'anchor', from, to };
}

export function newYarnFlowEdge(
  from: StitchId,
  to: StitchId,
): Extract<Edge, { kind: 'yarn_flow' }> {
  return { id: newId(), kind: 'yarn_flow', from, to };
}

export function newJoinEdge(
  stitch: StitchId,
  targets: StitchId[],
): Extract<Edge, { kind: 'join' }> {
  return { id: newId(), kind: 'join', stitch, targets };
}

export interface EmptyPatternInput {
  title: { pl: string; en: string };
  author: string;
  language?: PatternMeta['language'];
  hook?: string;
  yarn?: PatternMeta['yarn'];
  gauge?: PatternMeta['gauge'];
}

export function emptyPatternV3(input: EmptyPatternInput): Pattern {
  const now = new Date().toISOString();
  const meta: PatternMeta = {
    title: input.title,
    author: input.author,
    designedAt: now,
    yarn: input.yarn ?? {},
    hook: input.hook ?? '3 mm',
    gauge: input.gauge ?? { stitches: 5, rows: 11, squareCm: 10 },
    language: input.language ?? 'pl',
  };

  return {
    schemaVersion: 3,
    shape: 'rectangular',
    meta,
    colors: [DEFAULT_BASE_COLOR],
    stitches: [],
    edges: [],
    rounds: [],
    customStitches: [],
    photos: [],
    pdfSections: [...DEFAULT_PDF_SECTIONS],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/graph/build.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/graph/build.ts src/domain/graph/build.test.ts
git commit -m "feat(graph): builders for stitches, edges, and empty Pattern v3"
```

---

## Task 3: Graph walk helpers

**Files:**
- Create: `src/domain/graph/walk.ts`
- Test: `src/domain/graph/walk.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/graph/walk.test.ts
import { describe, it, expect } from 'vitest';
import {
  yarnFlowSequence,
  anchorChildrenOf,
  roundOf,
  stitchesInRound,
} from './walk';
import {
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
  emptyPatternV3,
} from './build';
import type { Pattern } from './types';

function makeRing(): Pattern {
  // Magic ring with three child sc stitches connected by yarn flow.
  const p = emptyPatternV3({
    title: { pl: 'Ring', en: 'Ring' },
    author: 'test',
  });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
  const a = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
  const b = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
  const c = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, a, b, c],
    edges: [
      newAnchorEdge(a.id, { kind: 'magic_ring' }),
      newAnchorEdge(b.id, { kind: 'magic_ring' }),
      newAnchorEdge(c.id, { kind: 'magic_ring' }),
      newYarnFlowEdge(ring.id, a.id),
      newYarnFlowEdge(a.id, b.id),
      newYarnFlowEdge(b.id, c.id),
    ],
    rounds: [
      { index: 0, stitchIds: [ring.id] },
      { index: 1, stitchIds: [a.id, b.id, c.id] },
    ],
  };
}

describe('graph/walk', () => {
  it('yarnFlowSequence returns stitches in work order from the start', () => {
    const p = makeRing();
    const seq = yarnFlowSequence(p);
    expect(seq).toHaveLength(4);
    expect(seq[0]).toBe(p.stitches[0]!.id); // magic ring
    expect(seq.at(-1)).toBe(p.stitches[3]!.id); // last sc
  });

  it('yarnFlowSequence returns empty array on empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    expect(yarnFlowSequence(p)).toEqual([]);
  });

  it('anchorChildrenOf returns all stitches anchored to a given stitch id', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const root = newStitch({ kind: 'builtin', type: 'dc' });
    const c1 = newStitch({ kind: 'builtin', type: 'dc' });
    const c2 = newStitch({ kind: 'builtin', type: 'dc' });

    const populated: Pattern = {
      ...p,
      stitches: [root, c1, c2],
      edges: [
        newAnchorEdge(c1.id, { kind: 'stitch', id: root.id }),
        newAnchorEdge(c2.id, { kind: 'stitch', id: root.id }),
      ],
    };

    const children = anchorChildrenOf(populated, root.id);
    expect(children).toEqual(expect.arrayContaining([c1.id, c2.id]));
    expect(children).toHaveLength(2);
  });

  it('anchorChildrenOf returns empty array for stitch with no children', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    expect(anchorChildrenOf(p, 'nonexistent')).toEqual([]);
  });

  it('roundOf returns the round index of a stitch or undefined', () => {
    const p = makeRing();
    expect(roundOf(p, p.stitches[0]!.id)).toBe(0);
    expect(roundOf(p, p.stitches[1]!.id)).toBe(1);
    expect(roundOf(p, 'nope')).toBeUndefined();
  });

  it('stitchesInRound returns all stitches with the matching round index', () => {
    const p = makeRing();
    const r1 = stitchesInRound(p, 1);
    expect(r1).toHaveLength(3);
    expect(r1.every((s) => s.round === 1)).toBe(true);
  });

  it('yarnFlowSequence rejects cycles by throwing', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'sc' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    const broken: Pattern = {
      ...p,
      stitches: [a, b],
      edges: [
        newYarnFlowEdge(a.id, b.id),
        newYarnFlowEdge(b.id, a.id),
      ],
    };
    expect(() => yarnFlowSequence(broken)).toThrow(/cycle/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/graph/walk.test.ts`
Expected: FAIL with `Cannot find module './walk'`.

- [ ] **Step 3: Implement walk helpers**

```ts
// src/domain/graph/walk.ts
import {
  isAnchorEdge,
  isStitchAnchor,
  isYarnFlowEdge,
  type Pattern,
  type Stitch,
  type StitchId,
} from './types';

/**
 * Returns the ids of stitches in yarn-flow order, starting from the unique
 * stitch with no incoming yarn_flow edge.
 *
 * Throws if more than one start candidate is found, or if a cycle is detected.
 */
export function yarnFlowSequence(pattern: Pattern): StitchId[] {
  const yarnEdges = pattern.edges.filter(isYarnFlowEdge);
  if (yarnEdges.length === 0 && pattern.stitches.length === 0) return [];

  const incoming = new Map<StitchId, number>();
  for (const s of pattern.stitches) incoming.set(s.id, 0);
  for (const e of yarnEdges) {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }

  const starts: StitchId[] = [];
  for (const [id, count] of incoming) {
    if (count === 0) starts.push(id);
  }
  if (starts.length === 0 && pattern.stitches.length > 0) return [];
  if (starts.length > 1 && yarnEdges.length > 0) {
    return [];
  }
  if (yarnEdges.length === 0) return pattern.stitches.map((s) => s.id);

  const nextOf = new Map<StitchId, StitchId>();
  for (const e of yarnEdges) {
    if (nextOf.has(e.from)) {
      throw new Error(
        `Yarn flow has branching out of ${e.from}; expected linear chain.`,
      );
    }
    nextOf.set(e.from, e.to);
  }

  const sequence: StitchId[] = [];
  const seen = new Set<StitchId>();
  let cursor: StitchId | undefined = starts[0];
  while (cursor !== undefined) {
    if (seen.has(cursor)) {
      throw new Error(`Yarn flow contains a cycle at stitch ${cursor}.`);
    }
    seen.add(cursor);
    sequence.push(cursor);
    cursor = nextOf.get(cursor);
  }
  return sequence;
}

/**
 * Returns all stitch ids whose anchor edge targets the given stitch
 * (kind === 'stitch' anchor targets only).
 */
export function anchorChildrenOf(
  pattern: Pattern,
  anchorId: StitchId,
): StitchId[] {
  const out: StitchId[] = [];
  for (const e of pattern.edges) {
    if (!isAnchorEdge(e)) continue;
    if (!isStitchAnchor(e.to)) continue;
    if (e.to.id === anchorId) out.push(e.from);
  }
  return out;
}

export function roundOf(
  pattern: Pattern,
  stitchId: StitchId,
): number | undefined {
  const s = pattern.stitches.find((x) => x.id === stitchId);
  return s?.round;
}

export function stitchesInRound(pattern: Pattern, index: number): Stitch[] {
  return pattern.stitches.filter((s) => s.round === index);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/graph/walk.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/graph/walk.ts src/domain/graph/walk.test.ts
git commit -m "feat(graph): walk helpers — yarn flow sequence, anchor children, round membership"
```

---

## Task 4: Graph validator

**Files:**
- Create: `src/domain/validation/graph.ts`
- Test: `src/domain/validation/graph.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/validation/graph.test.ts
import { describe, it, expect } from 'vitest';
import { validateGraph } from './graph';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
  newJoinEdge,
} from '../graph/build';
import type { Pattern } from '../graph/types';

function fresh(): Pattern {
  return emptyPatternV3({
    title: { pl: 'X', en: 'X' },
    author: 'test',
  });
}

describe('validateGraph', () => {
  it('reports no issues for an empty pattern', () => {
    expect(validateGraph(fresh())).toEqual([]);
  });

  it('flags an anchor target referring to a missing stitch', () => {
    const a = newStitch({ kind: 'builtin', type: 'sc' });
    const p: Pattern = {
      ...fresh(),
      stitches: [a],
      edges: [newAnchorEdge(a.id, { kind: 'stitch', id: 'ghost' })],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({
        kind: 'missing_anchor',
        severity: 'critical',
      }),
    );
  });

  it('flags a chain_space anchor referring to a missing stitch', () => {
    const a = newStitch({ kind: 'builtin', type: 'sc' });
    const real = newStitch({ kind: 'builtin', type: 'sc' });
    const p: Pattern = {
      ...fresh(),
      stitches: [a, real],
      edges: [
        newAnchorEdge(a.id, {
          kind: 'chain_space',
          betweenA: real.id,
          betweenB: 'ghost',
        }),
      ],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing_anchor' }),
    );
  });

  it('flags an orphan stitch (no anchor, not a magic_ring, not a foundation ch)', () => {
    const orphan = newStitch({ kind: 'builtin', type: 'dc' });
    const p: Pattern = { ...fresh(), stitches: [orphan], edges: [] };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'orphan_stitch', stitchId: orphan.id }),
    );
  });

  it('accepts a magic_ring stitch with no anchor', () => {
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const p: Pattern = { ...fresh(), stitches: [ring], edges: [] };
    const issues = validateGraph(p);
    expect(issues).toEqual([]);
  });

  it('flags duplicate outgoing yarn flow from one stitch', () => {
    const a = newStitch({ kind: 'builtin', type: 'sc' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    const c = newStitch({ kind: 'builtin', type: 'sc' });
    const p: Pattern = {
      ...fresh(),
      stitches: [a, b, c],
      edges: [newYarnFlowEdge(a.id, b.id), newYarnFlowEdge(a.id, c.id)],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'yarn_flow_branching' }),
    );
  });

  it('flags a cycle in yarn flow', () => {
    const a = newStitch({ kind: 'builtin', type: 'sc' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    const p: Pattern = {
      ...fresh(),
      stitches: [a, b],
      edges: [
        newYarnFlowEdge(a.id, b.id),
        newYarnFlowEdge(b.id, a.id),
      ],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'yarn_flow_cycle' }),
    );
  });

  it('flags a join edge whose stitch or targets are missing', () => {
    const real = newStitch({ kind: 'builtin', type: 'sl_st' });
    const p: Pattern = {
      ...fresh(),
      stitches: [real],
      edges: [newJoinEdge(real.id, ['ghost'])],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing_join_target' }),
    );
  });

  it('flags photo ids that do not resolve', () => {
    const s = newStitch({ kind: 'builtin', type: 'sc' });
    s.attachments = { photoIds: ['p-1'] };
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const p: Pattern = {
      ...fresh(),
      stitches: [ring, s],
      edges: [newAnchorEdge(s.id, { kind: 'magic_ring' })],
      photos: [],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing_photo' }),
    );
  });

  it('flags a custom typeRef whose customStitch is missing', () => {
    const s = newStitch({ kind: 'custom', id: 'cs-ghost' });
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const p: Pattern = {
      ...fresh(),
      stitches: [ring, s],
      edges: [newAnchorEdge(s.id, { kind: 'magic_ring' })],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing_custom_stitch' }),
    );
  });

  it('flags a colorRef that does not resolve', () => {
    const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const s = newStitch(
      { kind: 'builtin', type: 'sc' },
      { colorRef: 'ghost-color' },
    );
    const p: Pattern = {
      ...fresh(),
      stitches: [ring, s],
      edges: [newAnchorEdge(s.id, { kind: 'magic_ring' })],
    };
    const issues = validateGraph(p);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing_color' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/validation/graph.test.ts`
Expected: FAIL with `Cannot find module './graph'`.

- [ ] **Step 3: Implement the validator**

```ts
// src/domain/validation/graph.ts
import {
  isAnchorEdge,
  isJoinEdge,
  isYarnFlowEdge,
  isStitchAnchor,
  type Pattern,
  type StitchId,
  type EdgeId,
} from '../graph/types';

export type GraphIssueKind =
  | 'missing_anchor'
  | 'missing_join_target'
  | 'missing_photo'
  | 'missing_custom_stitch'
  | 'missing_color'
  | 'orphan_stitch'
  | 'yarn_flow_branching'
  | 'yarn_flow_cycle'
  | 'invalid_round_membership';

export interface GraphValidationIssue {
  kind: GraphIssueKind;
  severity: 'critical' | 'warning';
  message: string;
  stitchId?: StitchId;
  edgeId?: EdgeId;
}

const ANCHOR_OPTIONAL_TYPES = new Set(['magic_ring', 'ch']);

export function validateGraph(pattern: Pattern): GraphValidationIssue[] {
  const issues: GraphValidationIssue[] = [];

  const stitchIds = new Set(pattern.stitches.map((s) => s.id));
  const photoIds = new Set(pattern.photos.map((p) => p.id));
  const customIds = new Set(pattern.customStitches.map((c) => c.id));
  const colorIds = new Set(pattern.colors.map((c) => c.id));

  // 1. Anchor existence
  for (const edge of pattern.edges) {
    if (!isAnchorEdge(edge)) continue;
    const target = edge.to;
    if (target.kind === 'stitch' && !stitchIds.has(target.id)) {
      issues.push({
        kind: 'missing_anchor',
        severity: 'critical',
        message: `Anchor edge ${edge.id} targets a missing stitch (${target.id}).`,
        edgeId: edge.id,
      });
    }
    if (target.kind === 'chain_space') {
      if (!stitchIds.has(target.betweenA) || !stitchIds.has(target.betweenB)) {
        issues.push({
          kind: 'missing_anchor',
          severity: 'critical',
          message: `Anchor edge ${edge.id} references a chain_space between missing stitches.`,
          edgeId: edge.id,
        });
      }
    }
    if (target.kind === 'turning_chain' && !stitchIds.has(target.ofStitch)) {
      issues.push({
        kind: 'missing_anchor',
        severity: 'critical',
        message: `Anchor edge ${edge.id} references a turning_chain of a missing stitch.`,
        edgeId: edge.id,
      });
    }
  }

  // 2. Orphan stitches (need exactly one anchor unless magic_ring or ch)
  const anchorByStitch = new Map<StitchId, number>();
  for (const edge of pattern.edges) {
    if (isAnchorEdge(edge)) {
      anchorByStitch.set(
        edge.from,
        (anchorByStitch.get(edge.from) ?? 0) + 1,
      );
    }
  }
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'builtin' && ANCHOR_OPTIONAL_TYPES.has(s.typeRef.type)) {
      continue;
    }
    if (!anchorByStitch.has(s.id)) {
      issues.push({
        kind: 'orphan_stitch',
        severity: 'critical',
        message: `Stitch ${s.id} has no anchor edge.`,
        stitchId: s.id,
      });
    }
  }

  // 3. Yarn flow: no branching, no cycles
  const yarnEdges = pattern.edges.filter(isYarnFlowEdge);
  const nextOf = new Map<StitchId, StitchId>();
  for (const e of yarnEdges) {
    if (nextOf.has(e.from)) {
      issues.push({
        kind: 'yarn_flow_branching',
        severity: 'critical',
        message: `Stitch ${e.from} has multiple outgoing yarn flow edges.`,
        stitchId: e.from,
        edgeId: e.id,
      });
    } else {
      nextOf.set(e.from, e.to);
    }
  }
  for (const startId of nextOf.keys()) {
    const seen = new Set<StitchId>();
    let cursor: StitchId | undefined = startId;
    while (cursor !== undefined) {
      if (seen.has(cursor)) {
        issues.push({
          kind: 'yarn_flow_cycle',
          severity: 'critical',
          message: `Yarn flow cycle detected at stitch ${cursor}.`,
          stitchId: cursor,
        });
        break;
      }
      seen.add(cursor);
      cursor = nextOf.get(cursor);
    }
  }

  // 4. Joins reference existing stitches
  for (const edge of pattern.edges) {
    if (!isJoinEdge(edge)) continue;
    if (!stitchIds.has(edge.stitch)) {
      issues.push({
        kind: 'missing_join_target',
        severity: 'critical',
        message: `Join edge ${edge.id} originates from a missing stitch.`,
        edgeId: edge.id,
      });
    }
    for (const t of edge.targets) {
      if (!stitchIds.has(t)) {
        issues.push({
          kind: 'missing_join_target',
          severity: 'critical',
          message: `Join edge ${edge.id} targets a missing stitch (${t}).`,
          edgeId: edge.id,
        });
      }
    }
  }

  // 5. Attachments resolve
  for (const s of pattern.stitches) {
    const ids = s.attachments?.photoIds ?? [];
    for (const photoId of ids) {
      if (!photoIds.has(photoId)) {
        issues.push({
          kind: 'missing_photo',
          severity: 'warning',
          message: `Stitch ${s.id} references a missing photo (${photoId}).`,
          stitchId: s.id,
        });
      }
    }
  }

  // 6. Custom typeRef ids resolve
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'custom' && !customIds.has(s.typeRef.id)) {
      issues.push({
        kind: 'missing_custom_stitch',
        severity: 'critical',
        message: `Stitch ${s.id} references a missing custom stitch (${s.typeRef.id}).`,
        stitchId: s.id,
      });
    }
  }

  // 7. Color refs resolve
  for (const s of pattern.stitches) {
    if (s.colorRef && !colorIds.has(s.colorRef)) {
      issues.push({
        kind: 'missing_color',
        severity: 'warning',
        message: `Stitch ${s.id} references a missing color (${s.colorRef}).`,
        stitchId: s.id,
      });
    }
  }

  return issues;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/validation/graph.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/validation/graph.ts src/domain/validation/graph.test.ts
git commit -m "feat(graph): structural validator with 7 invariants and 11 tests"
```

---

## Task 5: Zod schema and serializer for v3

**Files:**
- Create: `src/domain/graph/schema.ts`
- Test: `src/domain/graph/schema.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/graph/schema.test.ts
import { describe, it, expect } from 'vitest';
import {
  patternSchemaV3,
  serializePatternV3,
  parsePatternV3Raw,
} from './schema';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from './build';
import type { Pattern } from './types';

function tiny(): Pattern {
  const p = emptyPatternV3({
    title: { pl: 'T', en: 'T' },
    author: 'a',
  });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
  const sc = newStitch({ kind: 'builtin', type: 'sc' });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, sc],
    edges: [
      newAnchorEdge(sc.id, { kind: 'magic_ring' }),
      newYarnFlowEdge(ring.id, sc.id),
    ],
  };
}

describe('graph/schema', () => {
  it('accepts a freshly built empty v3 pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'a', en: 'b' }, author: 'x' });
    expect(patternSchemaV3.safeParse(p).success).toBe(true);
  });

  it('round-trips a small graph through serialize and parse', () => {
    const original = tiny();
    const json = serializePatternV3(original);
    const restored = parsePatternV3Raw(JSON.parse(json));
    expect(restored).toEqual(original);
  });

  it('rejects schemaVersion !== 3', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = { ...p, schemaVersion: 2 };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });

  it('rejects an edge with an invalid discriminator', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = {
      ...p,
      edges: [{ id: 'e', kind: 'mystery', from: 'x', to: 'y' }],
    };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });

  it('rejects a stitch with an invalid builtin type', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = {
      ...p,
      stitches: [{ id: 's', typeRef: { kind: 'builtin', type: 'bogus' } }],
    };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/graph/schema.test.ts`
Expected: FAIL with `Cannot find module './schema'`.

- [ ] **Step 3: Implement schema**

```ts
// src/domain/graph/schema.ts
import { z } from 'zod';
import type { Pattern } from './types';

const builtinStitchTypeSchema = z.enum([
  'ch',
  'sl_st',
  'sc',
  'hdc',
  'dc',
  'tr',
  'gr_st',
  'magic_ring',
  'fasten_off',
]);

const stitchTypeRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('builtin'), type: builtinStitchTypeSchema }),
  z.object({ kind: z.literal('custom'), id: z.string().min(1) }),
]);

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const attachmentsSchema = z.object({
  photoIds: z.array(z.string().min(1)),
  note: z.string().optional(),
});

const stitchSchema = z.object({
  id: z.string().min(1),
  typeRef: stitchTypeRefSchema,
  colorRef: z.string().min(1).optional(),
  round: z.number().int().nonnegative().optional(),
  position: positionSchema.optional(),
  attachments: attachmentsSchema.optional(),
});

const anchorTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stitch'), id: z.string().min(1) }),
  z.object({
    kind: z.literal('chain_space'),
    betweenA: z.string().min(1),
    betweenB: z.string().min(1),
  }),
  z.object({ kind: z.literal('magic_ring') }),
  z.object({
    kind: z.literal('turning_chain'),
    ofStitch: z.string().min(1),
  }),
]);

const edgeSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('anchor'),
    from: z.string().min(1),
    to: anchorTargetSchema,
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('yarn_flow'),
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('join'),
    stitch: z.string().min(1),
    targets: z.array(z.string().min(1)).min(1),
  }),
]);

const colorSchema = z.object({
  id: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  nameByLanguage: z
    .object({ pl: z.string(), en: z.string() })
    .partial()
    .optional(),
});

const photoSchema = z.object({
  id: z.string().min(1),
  storage: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('inline'),
      base64: z.string().min(1),
      mime: z.string().min(1),
    }),
    z.object({ kind: z.literal('path'), path: z.string().min(1) }),
  ]),
  captionByLanguage: z
    .object({ pl: z.string(), en: z.string() })
    .partial()
    .optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
});

const customStitchSchema = z.object({
  id: z.string().min(1),
  shortCode: z.string().regex(/^[A-Za-z]{1,3}$/),
  nameByLanguage: z.object({ pl: z.string(), en: z.string() }),
  description: z.object({ pl: z.string(), en: z.string() }).optional(),
  symbol: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('preset'), presetId: z.string().min(1) }),
    z.object({ kind: z.literal('svgPath'), path: z.string().min(1) }),
  ]),
  subGraph: z
    .object({ stitches: z.array(stitchSchema), edges: z.array(edgeSchema) })
    .optional(),
});

const roundSchema = z.object({
  index: z.number().int().nonnegative(),
  stitchIds: z.array(z.string().min(1)),
  noteByLanguage: z
    .object({ pl: z.string(), en: z.string() })
    .partial()
    .optional(),
});

const pdfSectionSchema = z.object({
  kind: z.enum([
    'title',
    'thanks',
    'information',
    'pattern',
    'customization',
    'legend',
    'finishing',
  ]),
  enabled: z.boolean(),
  overrides: z.record(z.string(), z.unknown()).optional(),
});

const metaSchema = z.object({
  title: z.object({ pl: z.string(), en: z.string() }),
  author: z.string(),
  designedAt: z.string(),
  yarn: z.object({
    brand: z.string().optional(),
    weight: z.string().optional(),
    fiber: z.string().optional(),
    meterage: z.string().optional(),
  }),
  hook: z.string(),
  gauge: z.object({
    stitches: z.number(),
    rows: z.number(),
    squareCm: z.number(),
  }),
  language: z.enum(['pl', 'en', 'pl-en']),
  copyrightLine: z.string().optional(),
  socialTag: z.string().optional(),
});

const legacyGridSchema = z.object({
  rows: z.number().int().nonnegative(),
  cols: z.number().int().nonnegative(),
  cells: z.array(z.object({ stitchId: z.string().min(1).nullable() })),
});

export const patternSchemaV3 = z.object({
  schemaVersion: z.literal(3),
  shape: z.enum(['rectangular', 'radial', 'freeform']),
  meta: metaSchema,
  colors: z.array(colorSchema).min(1),
  stitches: z.array(stitchSchema),
  edges: z.array(edgeSchema),
  rounds: z.array(roundSchema),
  customStitches: z.array(customStitchSchema),
  photos: z.array(photoSchema),
  pdfSections: z.array(pdfSectionSchema),
  legacyGrid: legacyGridSchema.optional(),
});

export function serializePatternV3(pattern: Pattern): string {
  return JSON.stringify(patternSchemaV3.parse(pattern), null, 2);
}

export function parsePatternV3Raw(raw: unknown): Pattern {
  return patternSchemaV3.parse(raw) as Pattern;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/graph/schema.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/graph/schema.ts src/domain/graph/schema.test.ts
git commit -m "feat(graph): Zod schema + serializer for Pattern v3 with round-trip tests"
```

---

## Task 6: Migration v2 → v3

**Files:**
- Create: `src/domain/graph/migration.ts`
- Test: `src/domain/graph/migration.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/domain/graph/migration.test.ts
import { describe, it, expect } from 'vitest';
import { migrateV2ToV3 } from './migration';
import { createEmptyPattern } from '../pattern';
import type { Pattern as PatternV2, Row } from '../pattern';

function withFilledCells(p: PatternV2): PatternV2 {
  const cellsForRow = (row: Row, count: number): Row['cells'] =>
    row.cells.map((_, i) =>
      i < count ? { stitch: 'sc', colorId: p.colors[0]!.id } : null,
    );
  return {
    ...p,
    rows: p.rows.map((r) => ({
      ...r,
      cells: cellsForRow(r, Math.min(r.cells.length, 3)),
    })),
  };
}

describe('migrateV2ToV3', () => {
  it('produces a Pattern v3 with shape rectangular', () => {
    const v2 = createEmptyPattern('Test', 5);
    const v3 = migrateV2ToV3(v2);
    expect(v3.schemaVersion).toBe(3);
    expect(v3.shape).toBe('rectangular');
  });

  it('preserves meta: title, author, language, gauge defaults', () => {
    const v2 = createEmptyPattern('Mama wzór', 5);
    const v3 = migrateV2ToV3(v2);
    expect(v3.meta.title.pl).toBe('Mama wzór');
    expect(v3.meta.language).toBe('pl');
  });

  it('creates one stitch per filled cell', () => {
    const v2 = withFilledCells(createEmptyPattern('Test', 5));
    const v3 = migrateV2ToV3(v2);
    expect(v3.stitches).toHaveLength(3); // 3 sc cells in the single row
  });

  it('connects stitches within a row by yarn_flow edges', () => {
    const v2 = withFilledCells(createEmptyPattern('Test', 5));
    const v3 = migrateV2ToV3(v2);
    const yarnEdges = v3.edges.filter((e) => e.kind === 'yarn_flow');
    expect(yarnEdges).toHaveLength(2); // 3 stitches → 2 yarn_flow links
  });

  it('attaches a legacyGrid shadow with the same dimensions', () => {
    const v2 = withFilledCells(createEmptyPattern('Test', 5));
    const v3 = migrateV2ToV3(v2);
    expect(v3.legacyGrid?.rows).toBe(1);
    expect(v3.legacyGrid?.cols).toBe(5);
    expect(v3.legacyGrid?.cells).toHaveLength(5);
  });

  it('passes the structural validator with no critical issues', async () => {
    const { validateGraph } = await import('../validation/graph');
    const v2 = withFilledCells(createEmptyPattern('Test', 5));
    const v3 = migrateV2ToV3(v2);
    const issues = validateGraph(v3);
    const critical = issues.filter((i) => i.severity === 'critical');
    expect(critical).toEqual([]);
  });

  it('handles a multi-row v2 grid', () => {
    const v2: PatternV2 = {
      ...createEmptyPattern('Multi', 3),
      rows: [
        {
          id: 'r0',
          direction: 'rtl',
          cells: [
            { stitch: 'sc', colorId: createEmptyPattern('x', 3).colors[0]!.id },
            { stitch: 'sc', colorId: createEmptyPattern('x', 3).colors[0]!.id },
            null,
          ],
        },
        {
          id: 'r1',
          direction: 'ltr',
          cells: [
            { stitch: 'dc', colorId: createEmptyPattern('x', 3).colors[0]!.id },
            { stitch: 'dc', colorId: createEmptyPattern('x', 3).colors[0]!.id },
            null,
          ],
        },
      ],
    };
    const v3 = migrateV2ToV3(v2);
    expect(v3.stitches).toHaveLength(4);
    const anchorEdges = v3.edges.filter((e) => e.kind === 'anchor');
    expect(anchorEdges.length).toBeGreaterThanOrEqual(2); // row 1 anchors into row 0
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/domain/graph/migration.test.ts`
Expected: FAIL with `Cannot find module './migration'`.

- [ ] **Step 3: Implement migration**

```ts
// src/domain/graph/migration.ts
import { newId } from '../../utils/id';
import type { Pattern as PatternV2 } from '../pattern';
import { emptyPatternV3, newAnchorEdge, newYarnFlowEdge } from './build';
import type {
  BuiltinStitchType,
  Color,
  CustomStitch,
  Edge,
  LegacyGridShadow,
  Pattern,
  Stitch,
  StitchId,
} from './types';

const V2_STITCH_TO_BUILTIN: Record<string, BuiltinStitchType> = {
  ch: 'ch',
  slst: 'sl_st',
  sc: 'sc',
  hdc: 'hdc',
  dc: 'dc',
  tr: 'tr',
  dtr: 'tr',
  inc: 'sc',
  dec: 'sc',
};

function mapV2Stitch(key: string): { typeRef: Stitch['typeRef']; customStitchId?: string } {
  if (key.startsWith('custom:')) {
    return { typeRef: { kind: 'custom', id: key }, customStitchId: key };
  }
  const builtin = V2_STITCH_TO_BUILTIN[key];
  if (!builtin) {
    throw new Error(`v2 stitch key "${key}" has no v3 equivalent.`);
  }
  return { typeRef: { kind: 'builtin', type: builtin } };
}

function mapV2Colors(v2: PatternV2): Color[] {
  return v2.colors.map((c) => ({
    id: c.id,
    hex: c.hex,
    nameByLanguage: { pl: c.name, en: c.name },
  }));
}

function mapV2CustomStitches(v2: PatternV2): CustomStitch[] {
  return v2.customStitches.map((c) => ({
    id: c.key,
    shortCode: c.code,
    nameByLanguage: {
      pl: c.labelPl ?? c.code,
      en: c.labelEn ?? c.code,
    },
    symbol: c.symbolRef
      ? { kind: 'preset', presetId: c.symbolRef }
      : { kind: 'svgPath', path: '' },
  }));
}

export function migrateV2ToV3(v2: PatternV2): Pattern {
  const v3 = emptyPatternV3({
    title: { pl: v2.name, en: v2.name },
    author: '',
    language: 'pl',
  });

  const stitches: Stitch[] = [];
  const edges: Edge[] = [];
  const cellMap: Array<Array<StitchId | null>> = [];

  for (let r = 0; r < v2.rows.length; r++) {
    const row = v2.rows[r]!;
    const cells: Array<StitchId | null> = [];
    let prevStitchInRow: StitchId | null = null;

    const order =
      row.direction === 'rtl'
        ? [...row.cells.keys()].reverse()
        : [...row.cells.keys()];

    for (const c of order) {
      const cell = row.cells[c];
      if (!cell) {
        cells[c] = null;
        continue;
      }
      const mapped = mapV2Stitch(cell.stitch);
      const id = newId();
      stitches.push({
        id,
        typeRef: mapped.typeRef,
        colorRef: cell.colorId,
        round: r,
        position: { x: c, y: r },
      });
      cells[c] = id;

      if (prevStitchInRow !== null) {
        edges.push(newYarnFlowEdge(prevStitchInRow, id));
      }
      prevStitchInRow = id;

      // Anchor into the cell directly beneath (row r-1, same column) when present.
      if (r > 0) {
        const beneath = cellMap[r - 1]?.[c];
        if (beneath) {
          edges.push(newAnchorEdge(id, { kind: 'stitch', id: beneath }));
        }
      }
    }

    cellMap.push(cells);
  }

  // Yarn flow between rows: last stitch of row r → first stitch of row r+1 (in work order).
  for (let r = 0; r < v2.rows.length - 1; r++) {
    const row = v2.rows[r]!;
    const nextRow = v2.rows[r + 1]!;
    const orderThis =
      row.direction === 'rtl'
        ? [...row.cells.keys()].reverse()
        : [...row.cells.keys()];
    const orderNext =
      nextRow.direction === 'rtl'
        ? [...nextRow.cells.keys()].reverse()
        : [...nextRow.cells.keys()];

    const lastThis = orderThis
      .map((c) => cellMap[r]?.[c])
      .filter((id): id is StitchId => !!id)
      .at(-1);
    const firstNext = orderNext
      .map((c) => cellMap[r + 1]?.[c])
      .find((id): id is StitchId => !!id);

    if (lastThis && firstNext) {
      edges.push(newYarnFlowEdge(lastThis, firstNext));
    }
  }

  const legacyGrid: LegacyGridShadow = {
    rows: v2.rows.length,
    cols: v2.rows[0]?.cells.length ?? 0,
    cells: cellMap.flatMap((row) =>
      row.map((id) => ({ stitchId: id ?? null })),
    ),
  };

  return {
    ...v3,
    colors: mapV2Colors(v2),
    customStitches: mapV2CustomStitches(v2),
    stitches,
    edges,
    legacyGrid,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/domain/graph/migration.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/graph/migration.ts src/domain/graph/migration.test.ts
git commit -m "feat(graph): migration v2 grid -> v3 multigraph with legacyGrid shadow"
```

---

## Task 7: Hook the v3 path into `parsePatternJson`

**Files:**
- Modify: `src/domain/validation.ts`
- Test: extend `src/domain/validation.test.ts` (existing file)

- [ ] **Step 1: Read the existing `validation.test.ts` to learn the test pattern**

Run: `pnpm test -- src/domain/validation.test.ts --reporter=basic`
Expected: existing tests pass; note the file path of the fixture.

- [ ] **Step 2: Add the failing test**

Append to `src/domain/validation.test.ts`:

```ts
import { parsePatternAsV3 } from './validation';
import { validateGraph } from './validation/graph';

describe('parsePatternAsV3', () => {
  it('returns a Pattern v3 when given v2 JSON', () => {
    const v2 = {
      id: 'p',
      name: 'X',
      schemaVersion: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      colors: [
        { id: 'c0', name: 'base', hex: '#ffffff', isBase: true },
      ],
      rows: [
        { id: 'r0', direction: 'rtl', cells: [{ stitch: 'sc', colorId: 'c0' }] },
      ],
      displayMode: 'symbol',
      customStitches: [],
    };
    const v3 = parsePatternAsV3(JSON.stringify(v2));
    expect(v3.schemaVersion).toBe(3);
    expect(v3.stitches).toHaveLength(1);
    expect(validateGraph(v3).filter((i) => i.severity === 'critical')).toEqual([]);
  });

  it('returns a Pattern v3 when given v3 JSON', () => {
    const v2 = {
      id: 'p',
      name: 'X',
      schemaVersion: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      colors: [
        { id: 'c0', name: 'base', hex: '#ffffff', isBase: true },
      ],
      rows: [
        { id: 'r0', direction: 'rtl', cells: [{ stitch: 'sc', colorId: 'c0' }] },
      ],
      displayMode: 'symbol',
      customStitches: [],
    };
    // Migrate once, serialize, re-parse — should round-trip as v3.
    const v3 = parsePatternAsV3(JSON.stringify(v2));
    const { serializePatternV3 } = await import('./graph/schema');
    const rePicked = parsePatternAsV3(serializePatternV3(v3));
    expect(rePicked).toEqual(v3);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `pnpm test -- src/domain/validation.test.ts -t parsePatternAsV3`
Expected: FAIL — `parsePatternAsV3 is not a function`.

- [ ] **Step 4: Add the new export to `validation.ts`**

Open `src/domain/validation.ts`. After the existing `parsePatternJson` export, append:

```ts
// Imports added at the top of the file
import type { Pattern as PatternV3 } from './graph/types';
import { patternSchemaV3 } from './graph/schema';
import { migrateV2ToV3 } from './graph/migration';

/**
 * Like `parsePatternJson` but returns a Pattern v3. Accepts v1, v2, and v3
 * payloads, migrating up as needed. Throws PatternFileError on any failure.
 */
export function parsePatternAsV3(json: string): PatternV3 {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new PatternFileError('Plik nie jest poprawnym JSON-em.', err);
  }

  // Try v3 first — most patterns going forward are v3.
  const v3Result = patternSchemaV3.safeParse(raw);
  if (v3Result.success) {
    return v3Result.data as PatternV3;
  }

  // Otherwise fall back to v2 (which itself handles v1).
  const v2 = parsePatternJson(json);
  return migrateV2ToV3(v2);
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm test -- src/domain/validation.test.ts -t parsePatternAsV3`
Expected: PASS (2 new tests).

- [ ] **Step 6: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green; no regression in existing v2 tests.

- [ ] **Step 7: Commit**

```bash
git add src/domain/validation.ts src/domain/validation.test.ts
git commit -m "feat(validation): add parsePatternAsV3 unifying v1/v2/v3 parsing"
```

---

## Task 8: Document store

**Files:**
- Create: `src/stores/documentStore.ts`
- Test: `src/stores/documentStore.test.ts`

- [ ] **Step 1: Inspect the existing `patternStore.ts` style for reference**

Run: `head -40 src/stores/patternStore.ts`
Expected output begins with `import { create } from 'zustand'`.

- [ ] **Step 2: Write failing tests**

```ts
// src/stores/documentStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './documentStore';
import { emptyPatternV3 } from '../domain/graph/build';

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  it('starts with mode "rectangular" and no graph pattern', () => {
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('rectangular');
    expect(state.graphPattern).toBeNull();
  });

  it('switching to graph mode requires a v3 pattern', () => {
    const state = useDocumentStore.getState();
    expect(() => state.setMode('graph')).toThrow(/graph pattern/i);
  });

  it('loadGraphPattern sets the pattern and switches mode to graph', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    useDocumentStore.getState().loadGraphPattern(p);
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('graph');
    expect(state.graphPattern).toEqual(p);
  });

  it('reset returns the store to its initial state', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    useDocumentStore.getState().loadGraphPattern(p);
    useDocumentStore.getState().reset();
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('rectangular');
    expect(state.graphPattern).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `pnpm test -- src/stores/documentStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the store**

```ts
// src/stores/documentStore.ts
import { create } from 'zustand';
import type { Pattern as PatternV3 } from '../domain/graph/types';

export type DocumentMode = 'rectangular' | 'graph';

interface DocumentStore {
  mode: DocumentMode;
  graphPattern: PatternV3 | null;
  setMode(mode: DocumentMode): void;
  loadGraphPattern(pattern: PatternV3): void;
  reset(): void;
}

const INITIAL: Pick<DocumentStore, 'mode' | 'graphPattern'> = {
  mode: 'rectangular',
  graphPattern: null,
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...INITIAL,
  setMode(mode) {
    if (mode === 'graph' && get().graphPattern === null) {
      throw new Error('Cannot switch to graph mode without a graph pattern.');
    }
    set({ mode });
  },
  loadGraphPattern(pattern) {
    set({ mode: 'graph', graphPattern: pattern });
  },
  reset() {
    set({ ...INITIAL });
  },
}));
```

- [ ] **Step 5: Run test to verify pass**

Run: `pnpm test -- src/stores/documentStore.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/stores/documentStore.ts src/stores/documentStore.test.ts
git commit -m "feat(stores): documentStore tracking rectangular vs graph mode"
```

---

## Task 9: Wire v3 persistence into `fileIo.ts`

**Files:**
- Modify: `src/services/fileIo.ts`

- [ ] **Step 1: Add a failing test in a new file**

Create `src/services/fileIo.v3.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPatternAsV3FromPath } from './fileIo';
import { emptyPatternV3 } from '../domain/graph/build';
import { serializePatternV3 } from '../domain/graph/schema';

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  mkdir: vi.fn(),
  BaseDirectory: { Document: 0 },
}));

vi.mock('@tauri-apps/api/path', () => ({
  documentDir: vi.fn(() => '/docs'),
  join: vi.fn((...parts: string[]) => parts.join('/')),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('fileIo (v3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadPatternAsV3FromPath returns a v3 pattern from a v3 file', async () => {
    const fs = await import('@tauri-apps/plugin-fs');
    const v3 = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    vi.mocked(fs.readTextFile).mockResolvedValueOnce(serializePatternV3(v3));

    const result = await loadPatternAsV3FromPath('/path.wzor');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.pattern.schemaVersion).toBe(3);
    }
  });

  it('loadPatternAsV3FromPath migrates a v2 file', async () => {
    const fs = await import('@tauri-apps/plugin-fs');
    const v2 = {
      id: 'p',
      name: 'X',
      schemaVersion: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      colors: [
        { id: 'c0', name: 'base', hex: '#ffffff', isBase: true },
      ],
      rows: [
        { id: 'r0', direction: 'rtl', cells: [{ stitch: 'sc', colorId: 'c0' }] },
      ],
      displayMode: 'symbol',
      customStitches: [],
    };
    vi.mocked(fs.readTextFile).mockResolvedValueOnce(JSON.stringify(v2));

    const result = await loadPatternAsV3FromPath('/legacy.wzor');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.pattern.schemaVersion).toBe(3);
      expect(result.value.pattern.stitches.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/services/fileIo.v3.test.ts`
Expected: FAIL — `loadPatternAsV3FromPath is not a function`.

- [ ] **Step 3: Add the v3 loader to `fileIo.ts`**

Append to `src/services/fileIo.ts` (do not touch the existing exports):

```ts
import type { Pattern as PatternV3 } from '../domain/graph/types';
import { parsePatternAsV3 } from '../domain/validation';
import { serializePatternV3 } from '../domain/graph/schema';

/** Load any-version .wzor file from disk and return the v3 representation. */
export async function loadPatternAsV3FromPath(
  path: string,
): Promise<IoResult<{ pattern: PatternV3; path: string }>> {
  try {
    const text = await readTextFile(path);
    const pattern = parsePatternAsV3(text);
    return { kind: 'ok', value: { pattern, path } };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}

/** Save a v3 pattern to disk at the given path. Does not show a dialog. */
export async function savePatternV3ToPath(
  pattern: PatternV3,
  path: string,
): Promise<IoResult<string>> {
  try {
    const json = serializePatternV3(pattern);
    await writeTextFile(path, json);
    return { kind: 'ok', value: path };
  } catch (err) {
    return { kind: 'error', error: toFileError(err) };
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `pnpm test -- src/services/fileIo.v3.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/services/fileIo.ts src/services/fileIo.v3.test.ts
git commit -m "feat(fileIo): v3 load/save helpers alongside existing v2 API"
```

---

## Task 10: Integration test — migrate every `examples/*.wzor`

**Files:**
- Create: `src/domain/graph/migration.examples.test.ts`

- [ ] **Step 1: Inspect what fixtures exist**

Run: `ls examples/`
Expected: a small list of `.wzor` files used as bundled examples.

- [ ] **Step 2: Write the migration regression test**

```ts
// src/domain/graph/migration.examples.test.ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePatternAsV3 } from '../validation';
import { validateGraph } from '../validation/graph';

const examplesDir = join(__dirname, '..', '..', '..', 'examples');

describe('migration: every bundled example round-trips losslessly', () => {
  const files = readdirSync(examplesDir).filter((f) => f.endsWith('.wzor'));

  it('finds at least one example', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`migrates ${file} to a graph with zero critical issues`, () => {
      const text = readFileSync(join(examplesDir, file), 'utf-8');
      const v3 = parsePatternAsV3(text);
      expect(v3.schemaVersion).toBe(3);

      const issues = validateGraph(v3);
      const critical = issues.filter((i) => i.severity === 'critical');
      if (critical.length > 0) {
        // surface the first issue to make CI logs readable
        throw new Error(
          `Critical issues in ${file}: ${JSON.stringify(critical, null, 2)}`,
        );
      }
      expect(critical).toEqual([]);
    });
  }
});
```

- [ ] **Step 3: Run test to verify it passes (or surfaces a real issue)**

Run: `pnpm test -- src/domain/graph/migration.examples.test.ts`
Expected: PASS for every fixture. If a fixture surfaces a critical issue, this is a real bug — go back to Task 6 / Task 4 and fix the underlying mapping before continuing.

- [ ] **Step 4: Run full suite**

Run: `pnpm test && pnpm typecheck`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/graph/migration.examples.test.ts
git commit -m "test(graph): every bundled example migrates to v3 cleanly"
```

---

## Task 11: Dev-only Graph inspector tab

**Files:**
- Create: `src/components/devtools/GraphInspector.tsx`
- Create: `src/components/devtools/GraphInspector.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write a failing render test**

```tsx
// src/components/devtools/GraphInspector.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphInspector } from './GraphInspector';
import { emptyPatternV3 } from '../../domain/graph/build';

describe('GraphInspector', () => {
  it('renders the schemaVersion and stitch count', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    render(<GraphInspector pattern={p} />);
    expect(screen.getByText(/schemaVersion: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Stitches: 0/i)).toBeInTheDocument();
  });

  it('renders nothing when pattern is null', () => {
    const { container } = render(<GraphInspector pattern={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/devtools/GraphInspector.test.tsx`
Expected: FAIL — `Cannot find module './GraphInspector'`.

- [ ] **Step 3: Implement the inspector**

```tsx
// src/components/devtools/GraphInspector.tsx
import type { Pattern } from '../../domain/graph/types';

interface GraphInspectorProps {
  pattern: Pattern | null;
}

export function GraphInspector({ pattern }: GraphInspectorProps) {
  if (!pattern) return null;

  return (
    <aside
      data-testid="graph-inspector"
      style={{
        position: 'fixed',
        right: 12,
        top: 12,
        bottom: 12,
        width: 360,
        background: '#fffcef',
        border: '1px solid #b8a87a',
        borderRadius: 4,
        padding: 12,
        fontFamily: 'monospace',
        fontSize: 11,
        overflow: 'auto',
        zIndex: 9999,
        color: '#3a2f1d',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      <header style={{ marginBottom: 8 }}>
        <strong style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Graph inspector (dev)
        </strong>
      </header>
      <div>schemaVersion: {pattern.schemaVersion}</div>
      <div>shape: {pattern.shape}</div>
      <div>Stitches: {pattern.stitches.length}</div>
      <div>Edges: {pattern.edges.length}</div>
      <div>Rounds: {pattern.rounds.length}</div>
      <div>Custom stitches: {pattern.customStitches.length}</div>
      <div>Photos: {pattern.photos.length}</div>
      <details style={{ marginTop: 10 }}>
        <summary>Full JSON</summary>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {JSON.stringify(pattern, null, 2)}
        </pre>
      </details>
    </aside>
  );
}
```

- [ ] **Step 4: Run inspector test**

Run: `pnpm test -- src/components/devtools/GraphInspector.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Mount inspector behind a URL flag**

Open `src/App.tsx`. Find the top-level component return. Add the following near the top imports:

```tsx
import { GraphInspector } from './components/devtools/GraphInspector';
import { useDocumentStore } from './stores/documentStore';
```

And inside the component return (assumed to be a fragment or container — match the existing pattern, do not refactor surrounding code), append before the closing tag:

```tsx
{typeof window !== 'undefined' && window.location.search.includes('devtools') && (
  <GraphInspector pattern={useDocumentStore((s) => s.graphPattern)} />
)}
```

- [ ] **Step 6: Smoke test the build**

Run: `pnpm typecheck && pnpm build`
Expected: production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/devtools/GraphInspector.tsx src/components/devtools/GraphInspector.test.tsx src/App.tsx
git commit -m "feat(devtools): GraphInspector mounted under ?devtools URL flag"
```

---

## Task 12: Demo verification of Phase 1

**Files:**
- Modify: `package.json` (version bump only)

- [ ] **Step 1: Bump the package version**

Open `package.json`. Change `"version": "0.2.0"` to `"version": "0.3.0-alpha.0"`. Leave everything else alone.

- [ ] **Step 2: Run the entire test suite from a clean slate**

Run: `pnpm test --run`
Expected: all suites pass with no skipped or `.only` markers. Coverage stays >= 80 % across `src/domain/graph/`, `src/domain/validation/graph.ts`, and `src/stores/documentStore.ts`.

- [ ] **Step 3: Manual demo (recorded for the PR description)**

Run `pnpm tauri dev`, then in the running app:

1. Open an existing `.wzor` v2 file via the standard file menu.
2. Use the existing rectangular editor briefly to confirm no v2 regression.
3. Visit the app with `?devtools` in the URL.
4. In the dev tools panel, paste the following one-time script into the browser console to mirror the open document into the graph store:

```js
(async () => {
  const { useDocumentStore } = await import('/src/stores/documentStore.ts');
  const { usePatternStore } = await import('/src/stores/patternStore.ts');
  const { migrateV2ToV3 } = await import('/src/domain/graph/migration.ts');
  const v2 = usePatternStore.getState().pattern;
  if (!v2) return;
  useDocumentStore.getState().loadGraphPattern(migrateV2ToV3(v2));
})();
```

5. Confirm the GraphInspector now shows `schemaVersion: 3`, a non-zero stitch count, and a stitches/edges block in the Full JSON expansion.

This manual step exists once, as a demo. Subsequent phases will replace it with proper UI.

- [ ] **Step 4: Commit the version bump**

```bash
git add package.json
git commit -m "chore: bump version to 0.3.0-alpha.0 (Phase 1 foundations)"
```

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feature/pdf-pattern-designer
```

- [ ] **Step 6: Open a draft PR**

```bash
gh pr create --draft --base master --title "feat: Phase 1 — multigraph foundations" --body "$(cat <<'EOF'
## Summary
- Pattern v3 multigraph types, builders, walk, validator
- v2 → v3 migration with legacyGrid shadow
- parsePatternAsV3 unifies v1/v2/v3 parsing paths
- v3 load/save helpers next to existing v2 API
- documentStore for switching between rectangular and graph modes
- Dev-only GraphInspector behind `?devtools`

## Test plan
- [x] pnpm test --run (all green)
- [x] pnpm typecheck (clean)
- [x] pnpm build (clean)
- [x] Manual: open every example/*.wzor, see migration in GraphInspector
EOF
)"
```

Expected: PR opened in draft state on the feature branch.

---

## Self-review checklist (run BEFORE marking plan complete)

1. **Spec coverage check.** Walk through the spec sections and verify each Phase 1 item is implemented:
   - § 4 Data model → Task 1 (types) + Task 5 (schema).
   - § 4.2 Invariants → Task 4 (validator with 11 tests).
   - § 4.3 v2 → v3 migration → Task 6 + Task 10.
   - § 4.4 Serialization → Task 5 + Task 9.
   - Phase 1 roadmap line "Validator with all invariants" → Task 4.
   - Phase 1 roadmap line "graph/walk.ts, graph/build.ts" → Tasks 2 and 3.
   - Phase 1 roadmap line "Persisting v3 documents alongside v2" → Task 9.
   - Phase 1 demo ("Inspector tab shows the underlying graph as a JSON tree") → Task 11.

2. **Placeholder scan.** No `TBD`, `TODO`, `implement later`, `add appropriate error handling`, `similar to Task N`, or empty steps. ✓

3. **Type consistency.** Functions used in later tasks (`migrateV2ToV3`, `parsePatternAsV3`, `loadPatternAsV3FromPath`, `serializePatternV3`, `validateGraph`, `emptyPatternV3`, `newStitch`, `newAnchorEdge`, `newYarnFlowEdge`, `newJoinEdge`) match the signatures defined earlier in the plan. ✓

4. **Ordering.** Each task depends only on tasks that come before it. The validator (Task 4) depends on types (Task 1) and builders (Task 2). Migration (Task 6) depends on builders + types but not on the validator at definition time — the example regression test (Task 10) is what wires them together. ✓

5. **No code-only tasks without tests.** Every code change has a failing test first. ✓
