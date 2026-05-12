# Phase 4 — PDF Builder Architecture Inversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invert the architecture so the PDF document is the primary canvas of the app, and the pattern (graph) editor becomes one section type among many that can live inside a document. Mom opens the program and sees an editable PDF outline (title / thanks / info / pattern / photos / special stitches / text) with a live preview — the chart editor is reached by clicking a "Pattern" section.

**Architecture:** Introduce a new `PdfDocument` data model with a `sections: Section[]` array of tagged-union content blocks. Add `pdfDocumentStore` (Zustand) holding the active document. Build a new `PdfBuilderView` with 3 columns: section outline (left), section editor router (middle), live PDF preview (right). Refactor existing `src/pdf/pages/*` to accept section data instead of full `Pattern`, and rewrite `PatternDocument` to walk `PdfDocument.sections`. Pattern (graph) editing now happens inside a `PatternSectionEditor` that embeds the existing `GraphEditorShell` for the section's nested `Pattern`. Default landing route becomes `PdfBuilderView`; legacy rectangular v2 editor is kept accessible from the Settings menu but no longer the default.

**Tech Stack:** Existing — React 19, TypeScript strict, Zustand + Immer, react-pdf, vitest. No new runtime deps.

**Source spec:** `docs/superpowers/specs/2026-05-11-pdf-pattern-designer-design.md` + user's "PDF as main system" pivot (2026-05-12). Stitch reference: `docs/references/2026-05-11-symbols-and-hood-stitch.pdf`.

**Working branch:** `feature/phase-4-pdf-builder` (new, branched off `master` after PR #1 was merged).

---

## File Structure

### Files created

| Path | Responsibility |
|---|---|
| `src/pdf/document/types.ts` | `PdfDocument`, `Section`, `SectionKind`, and per-section data types. |
| `src/pdf/document/build.ts` | `emptyPdfDocument`, `newSection`, `defaultSectionLayout` factories. |
| `src/pdf/document/schema.ts` | Zod schema + `serializePdfDocument` + `parsePdfDocumentRaw`. |
| `src/stores/pdfDocumentStore.ts` | Zustand store: document, selectedSectionId, addSection, removeSection, reorderSection, updateSection, setDocument, reset. |
| `src/pdf-builder/PdfBuilderView.tsx` | Top-level view — 3-column shell + top toolbar (export + project meta). |
| `src/pdf-builder/SectionOutline.tsx` | Left column — list of sections with reorder + add + select + delete. |
| `src/pdf-builder/SectionEditorRouter.tsx` | Middle column — dispatches based on `section.kind`. |
| `src/pdf-builder/editors/TitleSectionEditor.tsx` | Form for title, author, hero photo. |
| `src/pdf-builder/editors/ThanksSectionEditor.tsx` | Form for copyright + social tag. |
| `src/pdf-builder/editors/InformationSectionEditor.tsx` | Form for yarn / hook / gauge. |
| `src/pdf-builder/editors/PhotosSectionEditor.tsx` | Photo upload grid for the section. |
| `src/pdf-builder/editors/SpecialStitchesSectionEditor.tsx` | List of custom stitches with descriptions + photos. |
| `src/pdf-builder/editors/TextSectionEditor.tsx` | Free-form multiline text block. |
| `src/pdf-builder/editors/PatternSectionEditor.tsx` | Embeds existing `GraphEditorShell` for the section's nested `Pattern`. |
| `src/pdf-builder/LivePdfPreview.tsx` | Right column — react-pdf `PDFViewer` of the current document. |
| Tests | One `.test.ts(x)` per source file (typed factories, store mutations, component render smoke tests). |

### Files modified

| Path | Change |
|---|---|
| `src/pdf/pages/TitlePage.tsx` | Take `{ section: TitleSection, meta: PdfDocumentMeta }` instead of `pattern: Pattern`. |
| `src/pdf/pages/ThanksPage.tsx` | Take `{ section: ThanksSection, meta }`. |
| `src/pdf/pages/InformationPage.tsx` | Take `{ section: InformationSection, meta, abbreviationsFromPatterns: BuiltinStitchType[] }`. |
| `src/pdf/pages/PatternPage.tsx` | Take `{ section: PatternSection }` and derive instructions from `section.pattern`. |
| `src/pdf/pages/LegendPage.tsx` | Take `{ customStitches: CustomStitch[] }` derived from pattern sections. |
| `src/pdf/PatternDocument.tsx` | Rename to `src/pdf/PdfDocumentRenderer.tsx`; walk `pdfDocument.sections` and route to page components. |
| `src/pdf/exportPdf.tsx` | Take `PdfDocument` instead of `Pattern`; render via `PdfDocumentRenderer`. |
| `src/App.tsx` | Default route is `PdfBuilderView`. Legacy `EditorView` / `GraphEditorView` remain reachable via "Legacy editors" menu in Settings. |
| `src/views/EmptyView.tsx` | Replace 3-button welcome with a single "Stwórz nowy wzór PDF" + "Otwórz". v2 access is moved to an "Advanced" sub-link. |
| `package.json` | Bump to `0.6.0-alpha.0` at the end. |

### Files explicitly NOT touched

- `src/domain/graph/*` — Pattern v3 multigraph stays as-is.
- `src/editor/*` — graph editor stays as-is; `PatternSectionEditor` embeds `GraphEditorShell` without modifying it.
- `src/chart/*`, `src/photos/*`, `src/instructions/*` — Phase 3 building blocks remain.

---

## Conventions

- TDD per task.
- Strict types; no `any`.
- ES2020 target — no `.at()`.
- Inline styles where pragmatic; CSS classes for non-trivial layouts.
- Existing v2 editor (`EditorView`) stays callable but isn't the default landing.

---

## Task 1: PdfDocument types + section taxonomy

**Files:**
- Create: `src/pdf/document/types.ts`
- Create: `src/pdf/document/types.test.ts`

- [ ] **Step 1: Failing type-level tests**

```ts
// src/pdf/document/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  PdfDocument,
  Section,
  SectionKind,
  TitleSection,
  PatternSection,
} from './types';

describe('PdfDocument types', () => {
  it('PdfDocument has schemaVersion 1', () => {
    expectTypeOf<PdfDocument['schemaVersion']>().toEqualTypeOf<1>();
  });

  it('Section is a tagged union with the expected kinds', () => {
    type K = SectionKind;
    expectTypeOf<K>().toEqualTypeOf<
      'title' | 'thanks' | 'information' | 'pattern' | 'photos' | 'special' | 'text' | 'pagebreak'
    >();
  });

  it('TitleSection carries the expected data', () => {
    expectTypeOf<TitleSection['kind']>().toEqualTypeOf<'title'>();
    expectTypeOf<TitleSection['title']>().toEqualTypeOf<{ pl: string; en: string }>();
  });

  it('PatternSection embeds a Pattern', () => {
    expectTypeOf<PatternSection['kind']>().toEqualTypeOf<'pattern'>();
    expectTypeOf<PatternSection['pattern']>().not.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

`npm test -- src/pdf/document/types.test.ts` → fails with module not found.

- [ ] **Step 3: Implement**

```ts
// src/pdf/document/types.ts
import type { Pattern, Photo, CustomStitch } from '../../domain/graph/types';

export type SectionId = string;

export interface PdfDocumentMeta {
  title: { pl: string; en: string };
  author: string;
  language: 'pl' | 'en' | 'pl-en';
  copyrightLine?: string;
  socialTag?: string;
  designedAt: string;  // ISO
}

export interface TitleSection {
  id: SectionId;
  kind: 'title';
  /** Override of doc-level title for this title page, optional. */
  title?: { pl: string; en: string };
  heroPhotoId?: string;
  showYear: boolean;
}

export interface ThanksSection {
  id: SectionId;
  kind: 'thanks';
  message: string;
  copyrightOverride?: string;
}

export interface InformationSection {
  id: SectionId;
  kind: 'information';
  yarn: { brand?: string; weight?: string; fiber?: string; meterage?: string };
  hook: string;
  gauge: { stitches: number; rows: number; squareCm: number };
  termsSystem: 'US' | 'UK';
  notes?: string;
}

export interface PatternSection {
  id: SectionId;
  kind: 'pattern';
  /** Section heading shown in the PDF, e.g. "Pattern" or "Body". */
  heading: string;
  /** The nested graph pattern (full v3 multigraph). */
  pattern: Pattern;
}

export interface PhotosSection {
  id: SectionId;
  kind: 'photos';
  heading: string;
  photos: Photo[];
  caption?: string;
}

export interface SpecialStitchesSection {
  id: SectionId;
  kind: 'special';
  heading: string;
  /** Custom-stitch entries with explanation + step photos. */
  entries: Array<{ stitch: CustomStitch; photos: Photo[] }>;
}

export interface TextSection {
  id: SectionId;
  kind: 'text';
  heading?: string;
  body: string;
}

export interface PageBreakSection {
  id: SectionId;
  kind: 'pagebreak';
}

export type Section =
  | TitleSection
  | ThanksSection
  | InformationSection
  | PatternSection
  | PhotosSection
  | SpecialStitchesSection
  | TextSection
  | PageBreakSection;

export type SectionKind = Section['kind'];

export interface PdfDocument {
  schemaVersion: 1;
  meta: PdfDocumentMeta;
  sections: Section[];
}

// Type guards
export function isPatternSection(s: Section): s is PatternSection {
  return s.kind === 'pattern';
}
export function isPhotosSection(s: Section): s is PhotosSection {
  return s.kind === 'photos';
}
export function isSpecialSection(s: Section): s is SpecialStitchesSection {
  return s.kind === 'special';
}
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git checkout -b feature/phase-4-pdf-builder
git add src/pdf/document/types.ts src/pdf/document/types.test.ts
git commit -m "feat(pdf-document): PdfDocument + Section tagged union types"
```

---

## Task 2: PdfDocument builders + default document

**Files:**
- Create: `src/pdf/document/build.ts`
- Create: `src/pdf/document/build.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/pdf/document/build.test.ts
import { describe, it, expect } from 'vitest';
import {
  emptyPdfDocument,
  newSection,
  defaultStarterSections,
} from './build';

describe('PdfDocument builders', () => {
  it('emptyPdfDocument returns schemaVersion 1 with defaults', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    expect(d.schemaVersion).toBe(1);
    expect(d.meta.title.pl).toBe('X');
    expect(d.meta.language).toBe('pl');
    expect(d.sections.length).toBeGreaterThan(0);
  });

  it('defaultStarterSections includes title, thanks, info, pattern, special, photos', () => {
    const kinds = defaultStarterSections().map((s) => s.kind);
    expect(kinds).toContain('title');
    expect(kinds).toContain('thanks');
    expect(kinds).toContain('information');
    expect(kinds).toContain('pattern');
  });

  it('newSection produces a section with a unique id and correct kind', () => {
    const a = newSection('text');
    const b = newSection('text');
    expect(a.kind).toBe('text');
    expect(a.id).not.toBe(b.id);
  });

  it('newSection for pattern includes an empty Pattern v3 with shape radial', () => {
    const s = newSection('pattern');
    if (s.kind !== 'pattern') throw new Error('wrong kind');
    expect(s.pattern.schemaVersion).toBe(3);
    expect(s.pattern.shape).toBe('radial');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

`npm test -- src/pdf/document/build.test.ts`

- [ ] **Step 3: Implement**

```ts
// src/pdf/document/build.ts
import { newId } from '../../utils/id';
import { emptyPatternV3 } from '../../domain/graph/build';
import type {
  PdfDocument,
  PdfDocumentMeta,
  Section,
  SectionKind,
  TitleSection,
  ThanksSection,
  InformationSection,
  PatternSection,
  PhotosSection,
  SpecialStitchesSection,
  TextSection,
  PageBreakSection,
} from './types';

export interface EmptyPdfDocumentInput {
  title: { pl: string; en: string };
  author: string;
  language?: PdfDocumentMeta['language'];
}

export function newSection(kind: SectionKind): Section {
  const id = newId();
  switch (kind) {
    case 'title':
      return { id, kind, showYear: true } as TitleSection;
    case 'thanks':
      return {
        id,
        kind,
        message:
          "Thank you for supporting my small business. I hope you'll enjoy this pattern as much as I did making it.",
      } as ThanksSection;
    case 'information':
      return {
        id,
        kind,
        yarn: {},
        hook: '3 mm',
        gauge: { stitches: 5, rows: 11, squareCm: 10 },
        termsSystem: 'US',
      } as InformationSection;
    case 'pattern': {
      const pattern = emptyPatternV3({
        title: { pl: 'Pattern', en: 'Pattern' },
        author: '',
        language: 'pl',
      });
      return { id, kind, heading: 'Pattern', pattern: { ...pattern, shape: 'radial' } } as PatternSection;
    }
    case 'photos':
      return { id, kind, heading: 'Process photos', photos: [] } as PhotosSection;
    case 'special':
      return { id, kind, heading: 'Special Stitches', entries: [] } as SpecialStitchesSection;
    case 'text':
      return { id, kind, body: '' } as TextSection;
    case 'pagebreak':
      return { id, kind } as PageBreakSection;
  }
}

export function defaultStarterSections(): Section[] {
  return [
    newSection('title'),
    newSection('thanks'),
    newSection('information'),
    newSection('pattern'),
    newSection('special'),
    newSection('photos'),
  ];
}

export function emptyPdfDocument(input: EmptyPdfDocumentInput): PdfDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    meta: {
      title: input.title,
      author: input.author,
      language: input.language ?? 'pl',
      designedAt: now,
    },
    sections: defaultStarterSections(),
  };
}
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/pdf/document/build.ts src/pdf/document/build.test.ts
git commit -m "feat(pdf-document): builders + default starter sections"
```

---

## Task 3: pdfDocumentStore (Zustand)

**Files:**
- Create: `src/stores/pdfDocumentStore.ts`
- Create: `src/stores/pdfDocumentStore.test.ts`

- [ ] **Step 1: Failing tests**

```ts
// src/stores/pdfDocumentStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePdfDocumentStore } from './pdfDocumentStore';
import { emptyPdfDocument, newSection } from '../pdf/document/build';

describe('pdfDocumentStore', () => {
  beforeEach(() => {
    usePdfDocumentStore.getState().reset();
  });

  it('starts with no document', () => {
    expect(usePdfDocumentStore.getState().document).toBeNull();
  });

  it('setDocument stores a document', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    expect(usePdfDocumentStore.getState().document?.schemaVersion).toBe(1);
  });

  it('addSection appends a new section', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const initialCount = d.sections.length;
    usePdfDocumentStore.getState().addSection(newSection('text'));
    expect(usePdfDocumentStore.getState().document!.sections).toHaveLength(initialCount + 1);
  });

  it('removeSection filters by id', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const idToRemove = d.sections[0]!.id;
    usePdfDocumentStore.getState().removeSection(idToRemove);
    const after = usePdfDocumentStore.getState().document!;
    expect(after.sections.find((s) => s.id === idToRemove)).toBeUndefined();
  });

  it('updateSection replaces the section by id', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const text = newSection('text');
    usePdfDocumentStore.getState().addSection(text);
    if (text.kind !== 'text') throw new Error();
    usePdfDocumentStore.getState().updateSection({ ...text, body: 'hello' });
    const after = usePdfDocumentStore.getState().document!.sections.find((s) => s.id === text.id);
    expect(after?.kind).toBe('text');
    if (after?.kind === 'text') expect(after.body).toBe('hello');
  });

  it('moveSection swaps positions', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const firstId = d.sections[0]!.id;
    const secondId = d.sections[1]!.id;
    usePdfDocumentStore.getState().moveSection(firstId, 1);
    const after = usePdfDocumentStore.getState().document!.sections;
    expect(after[0]!.id).toBe(secondId);
    expect(after[1]!.id).toBe(firstId);
  });

  it('selectSection updates selectedSectionId', () => {
    usePdfDocumentStore.getState().selectSection('s-1');
    expect(usePdfDocumentStore.getState().selectedSectionId).toBe('s-1');
  });

  it('updateMeta merges metadata', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    usePdfDocumentStore.getState().updateMeta({ author: 'Mama' });
    expect(usePdfDocumentStore.getState().document!.meta.author).toBe('Mama');
  });

  it('reset clears the store', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    usePdfDocumentStore.getState().reset();
    expect(usePdfDocumentStore.getState().document).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement**

```ts
// src/stores/pdfDocumentStore.ts
import { create } from 'zustand';
import { produce } from 'immer';
import type { PdfDocument, PdfDocumentMeta, Section, SectionId } from '../pdf/document/types';

interface PdfDocumentState {
  document: PdfDocument | null;
  selectedSectionId: SectionId | null;
  setDocument(d: PdfDocument | null): void;
  addSection(s: Section): void;
  removeSection(id: SectionId): void;
  updateSection(s: Section): void;
  moveSection(id: SectionId, toIndex: number): void;
  selectSection(id: SectionId | null): void;
  updateMeta(patch: Partial<PdfDocumentMeta>): void;
  reset(): void;
}

export const usePdfDocumentStore = create<PdfDocumentState>((set) => ({
  document: null,
  selectedSectionId: null,

  setDocument(d) {
    set({ document: d, selectedSectionId: d?.sections[0]?.id ?? null });
  },

  addSection(s) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        draft.document.sections.push(s);
        draft.selectedSectionId = s.id;
      }),
    );
  },

  removeSection(id) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        draft.document.sections = draft.document.sections.filter((s) => s.id !== id);
        if (draft.selectedSectionId === id) draft.selectedSectionId = null;
      }),
    );
  },

  updateSection(s) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        const idx = draft.document.sections.findIndex((x) => x.id === s.id);
        if (idx >= 0) draft.document.sections[idx] = s;
      }),
    );
  },

  moveSection(id, toIndex) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        const from = draft.document.sections.findIndex((s) => s.id === id);
        if (from < 0 || toIndex < 0 || toIndex >= draft.document.sections.length) return;
        const [removed] = draft.document.sections.splice(from, 1);
        if (removed) draft.document.sections.splice(toIndex, 0, removed);
      }),
    );
  },

  selectSection(id) {
    set({ selectedSectionId: id });
  },

  updateMeta(patch) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        Object.assign(draft.document.meta, patch);
      }),
    );
  },

  reset() {
    set({ document: null, selectedSectionId: null });
  },
}));
```

- [ ] **Step 4: Pass + suite + typecheck** → green.

- [ ] **Step 5: Commit**

```bash
git add src/stores/pdfDocumentStore.ts src/stores/pdfDocumentStore.test.ts
git commit -m "feat(stores): pdfDocumentStore with sections + meta + selection"
```

---

## Task 4: Refactor PDF pages to accept section data

**Files:**
- Modify: `src/pdf/pages/TitlePage.tsx`
- Modify: `src/pdf/pages/ThanksPage.tsx`
- Modify: `src/pdf/pages/InformationPage.tsx`
- Modify: `src/pdf/pages/PatternPage.tsx`
- Modify: `src/pdf/pages/LegendPage.tsx`

This task changes the prop shapes from `{ pattern: Pattern }` to section-specific data. After this task, the **old** `PatternDocument.tsx` will be broken — that's intentional; Task 5 rewrites it.

- [ ] **Step 1: Update TitlePage**

Read the current `src/pdf/pages/TitlePage.tsx`. Replace its `Props` and body:

```tsx
// src/pdf/pages/TitlePage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { TitleSection, PdfDocumentMeta } from '../document/types';
import { pdfTheme } from '../theme';

interface Props {
  section: TitleSection;
  meta: PdfDocumentMeta;
}

export function TitlePage({ section, meta }: Props) {
  const title = (section.title ?? meta.title).en || (section.title ?? meta.title).pl;
  const year = section.showYear ? new Date(meta.designedAt).getFullYear() : null;
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
          {title}
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
          design by {meta.author || 'unknown'}
        </Text>
        {year !== null && (
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
        )}
      </View>
    </Page>
  );
}
```

- [ ] **Step 2: Update ThanksPage**

```tsx
// src/pdf/pages/ThanksPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { ThanksSection, PdfDocumentMeta } from '../document/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  section: ThanksSection;
  meta: PdfDocumentMeta;
}

export function ThanksPage({ section, meta }: Props) {
  const copyright =
    section.copyrightOverride ??
    meta.copyrightLine ??
    `© ${new Date(meta.designedAt).getFullYear()} ${meta.author}. This pattern is for private use only. It's not allowed to copy, sell or distribute in any way, either wholly or in part.`;
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
          {section.message}
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
          {copyright}
        </Text>
        {meta.socialTag && (
          <Text
            style={{
              fontFamily: pdfTheme.fonts.accent,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
              marginTop: 24,
            }}
          >
            tag {meta.socialTag}
          </Text>
        )}
      </View>
    </Page>
  );
}
```

- [ ] **Step 3: Update InformationPage**

```tsx
// src/pdf/pages/InformationPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { InformationSection, PdfDocumentMeta } from '../document/types';
import type { BuiltinStitchType, CustomStitch } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
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
  section: InformationSection;
  meta: PdfDocumentMeta;
  usedStitchTypes: BuiltinStitchType[];
  customStitches: CustomStitch[];
}

export function InformationPage({ section, meta, usedStitchTypes, customStitches }: Props) {
  const _ = meta;
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
          {section.termsSystem} terms
        </Text>
      </View>

      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Yarn
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.yarn.brand ?? '—'} · {section.yarn.weight ?? '—'} · {section.yarn.fiber ?? '—'}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Hook
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.hook}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Gauge
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.gauge.stitches} st × {section.gauge.rows} rows = {section.gauge.squareCm}×{section.gauge.squareCm} cm
        </Text>
      </View>

      <Heading kind="section">Abbreviations</Heading>
      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        {usedStitchTypes.map((t) => (
          <View key={t} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink, width: 60 }}>
              {EN_ABBREV[t].abbrev}
            </Text>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.inkSoft }}>
              = {EN_ABBREV[t].full}
            </Text>
          </View>
        ))}
        {customStitches.map((c) => (
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

      {section.notes && (
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink, marginTop: 16 }}>
          {section.notes}
        </Text>
      )}
    </Page>
  );
}
```

- [ ] **Step 4: Update PatternPage**

```tsx
// src/pdf/pages/PatternPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { PatternSection } from '../document/types';
import { Heading } from '../components/Heading';
import { generateInstructions } from '../../instructions/generate';
import { pdfTheme } from '../theme';

interface Props {
  section: PatternSection;
}

export function PatternPage({ section }: Props) {
  const instructions = generateInstructions(section.pattern);
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>{section.heading.toUpperCase()}</Heading>
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
    </Page>
  );
}
```

- [ ] **Step 5: Update LegendPage**

```tsx
// src/pdf/pages/LegendPage.tsx
import { Page, Text, View } from '@react-pdf/renderer';
import type { CustomStitch } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  customStitches: CustomStitch[];
}

export function LegendPage({ customStitches }: Props) {
  if (customStitches.length === 0) return null;
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
        {customStitches.map((c) => (
          <View key={c.id} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 13, color: pdfTheme.colors.accent }}>
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

- [ ] **Step 6: Update existing tests**

The existing `src/pdf/pages/pages.test.tsx` checks `typeof TitlePage === 'function'` — should still pass. Same for `pattern-legend.test.tsx`. Run `npm test -- src/pdf/pages/` and expect green.

If existing tests imported these page components and rendered them with `pattern` prop, those need updating. Most existing tests only check `typeof`, which is unaffected by prop changes.

- [ ] **Step 7: Run full suite — expect FAILURE for `PatternDocument.test.tsx` because `PatternDocument` still uses the old API**

That's intentional. Task 5 fixes it. Skip the whole `PatternDocument.test.tsx` for now:

```bash
npm test -- --exclude '**/PatternDocument.test.tsx'
```

Should pass everything else.

- [ ] **Step 8: Commit**

```bash
git add src/pdf/pages/
git commit -m "refactor(pdf): pages take section data + meta (decoupled from Pattern)"
```

---

## Task 5: PdfDocumentRenderer + exportPdf rewrite

**Files:**
- Create: `src/pdf/PdfDocumentRenderer.tsx`
- Modify: `src/pdf/exportPdf.tsx`
- Delete: `src/pdf/PatternDocument.tsx` and `src/pdf/PatternDocument.test.tsx`

- [ ] **Step 1: Implement PdfDocumentRenderer**

```tsx
// src/pdf/PdfDocumentRenderer.tsx
import { Document } from '@react-pdf/renderer';
import type { PdfDocument } from './document/types';
import type { BuiltinStitchType, CustomStitch } from '../domain/graph/types';
import { TitlePage } from './pages/TitlePage';
import { ThanksPage } from './pages/ThanksPage';
import { InformationPage } from './pages/InformationPage';
import { PatternPage } from './pages/PatternPage';
import { LegendPage } from './pages/LegendPage';

interface Props {
  document: PdfDocument;
}

function collectStitchData(document: PdfDocument): {
  usedStitchTypes: BuiltinStitchType[];
  customStitches: CustomStitch[];
} {
  const types = new Set<BuiltinStitchType>();
  const customById = new Map<string, CustomStitch>();
  for (const s of document.sections) {
    if (s.kind === 'pattern') {
      for (const st of s.pattern.stitches) {
        if (st.typeRef.kind === 'builtin') types.add(st.typeRef.type);
      }
      for (const cs of s.pattern.customStitches) customById.set(cs.id, cs);
    }
    if (s.kind === 'special') {
      for (const e of s.entries) customById.set(e.stitch.id, e.stitch);
    }
  }
  return { usedStitchTypes: [...types], customStitches: [...customById.values()] };
}

export function PdfDocumentRenderer({ document }: Props) {
  const { usedStitchTypes, customStitches } = collectStitchData(document);
  return (
    <Document>
      {document.sections.map((s) => {
        switch (s.kind) {
          case 'title':
            return <TitlePage key={s.id} section={s} meta={document.meta} />;
          case 'thanks':
            return <ThanksPage key={s.id} section={s} meta={document.meta} />;
          case 'information':
            return (
              <InformationPage
                key={s.id}
                section={s}
                meta={document.meta}
                usedStitchTypes={usedStitchTypes}
                customStitches={customStitches}
              />
            );
          case 'pattern':
            return <PatternPage key={s.id} section={s} />;
          case 'special':
            return customStitches.length > 0 ? <LegendPage key={s.id} customStitches={customStitches} /> : null;
          // photos / text / pagebreak are not yet rendered as separate pages — they're inlined elsewhere in Phase 4+
          default:
            return null;
        }
      })}
    </Document>
  );
}
```

- [ ] **Step 2: Update exportPdf.tsx**

```tsx
// src/pdf/exportPdf.tsx
import { pdf } from '@react-pdf/renderer';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { PdfDocument } from './document/types';
import { PdfDocumentRenderer } from './PdfDocumentRenderer';
import { suggestPdfFilename } from './filename';

export type ExportResult =
  | { kind: 'ok'; path: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

export async function exportPdfDocument(document: PdfDocument): Promise<ExportResult> {
  try {
    const picked = await saveDialog({
      title: 'Save PDF',
      defaultPath: suggestPdfFilename(document),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!picked) return { kind: 'cancelled' };

    const blob = await pdf(<PdfDocumentRenderer document={document} />).toBlob();
    const buffer = await blob.arrayBuffer();
    await writeFile(picked, new Uint8Array(buffer));
    return { kind: 'ok', path: picked };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: 'error', message };
  }
}

export { suggestPdfFilename };
```

- [ ] **Step 3: Update filename.ts to take PdfDocument**

Read current `src/pdf/filename.ts` and update:

```ts
// src/pdf/filename.ts
import type { PdfDocument } from './document/types';

export function suggestPdfFilename(doc: PdfDocument): string {
  const raw = (doc.meta.title.en || doc.meta.title.pl || 'pattern').trim();
  const safe = raw.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '').slice(0, 80) || 'pattern';
  return `${safe}.pdf`;
}
```

Update `src/pdf/filename.test.ts` to use `emptyPdfDocument` instead of `emptyPatternV3`:

```ts
// src/pdf/filename.test.ts
import { describe, it, expect } from 'vitest';
import { suggestPdfFilename } from './filename';
import { emptyPdfDocument } from './document/build';

describe('suggestPdfFilename', () => {
  it('returns a sanitized filename derived from the title', () => {
    const d = emptyPdfDocument({ title: { pl: 'Wzór mamy', en: 'Mama Pattern' }, author: 'M' });
    const name = suggestPdfFilename(d);
    expect(name.toLowerCase()).toContain('mama');
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('falls back when title is empty', () => {
    const d = emptyPdfDocument({ title: { pl: '', en: '' }, author: '' });
    const name = suggestPdfFilename(d);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('strips dangerous filesystem characters', () => {
    const d = emptyPdfDocument({ title: { pl: 'a/b?c*d', en: 'a/b?c*d' }, author: '' });
    const name = suggestPdfFilename(d);
    expect(name).not.toMatch(/[<>:"/\\|?*]/);
  });
});
```

- [ ] **Step 4: Delete old PatternDocument files**

```bash
rm src/pdf/PatternDocument.tsx src/pdf/PatternDocument.test.tsx
```

- [ ] **Step 5: Find and update any leftover references**

```bash
grep -rn "PatternDocument\|exportPatternPdf" src/
```

The only remaining references should be in `src/editor/GraphEditorShell.tsx` (Export PDF button) and `src/views/PdfPreviewView.tsx`. Update both:

In `GraphEditorShell.tsx`, find the `exportPatternPdf(pattern)` call and replace with a fallback that wraps the pattern in a one-section document:

```tsx
import { exportPdfDocument } from '../pdf/exportPdf';
import { emptyPdfDocument } from '../pdf/document/build';
import { newSection } from '../pdf/document/build';

// In the onClick:
onClick={async () => {
  if (!pattern) return;
  const doc = emptyPdfDocument({ title: pattern.meta.title, author: pattern.meta.author });
  const patternSection = newSection('pattern');
  if (patternSection.kind === 'pattern') patternSection.pattern = pattern;
  doc.sections.push(patternSection);
  const r = await exportPdfDocument(doc);
  // ...
}}
```

Actually simpler: defer the Export PDF on `GraphEditorShell` for now — remove it, since the new `PdfBuilderView` is where export lives. The graph editor inside a section just edits the pattern. Replace the Export PDF button text with "Done editing pattern" or remove entirely. The Phase 4 view handles export.

Read `GraphEditorShell.tsx` and either remove the export button or change it to a no-op. For Phase 4 the graph editor only edits — the parent (PdfBuilderView) handles export.

In `PdfPreviewView.tsx`, change to take a `PdfDocument`:

```tsx
// src/views/PdfPreviewView.tsx
import { PDFViewer } from '@react-pdf/renderer';
import type { PdfDocument } from '../pdf/document/types';
import { PdfDocumentRenderer } from '../pdf/PdfDocumentRenderer';

interface Props {
  document: PdfDocument;
  onClose: () => void;
}

export function PdfPreviewView({ document, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', zIndex: 10000 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#f7f3e8', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3a2f1d' }}>
        <span>PDF Preview — {document.meta.title.en || document.meta.title.pl}</span>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PDFViewer width="100%" height="100%" showToolbar>
          <PdfDocumentRenderer document={document} />
        </PDFViewer>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Pass + suite + typecheck + build**

`npm test && npm run typecheck && npm run build` — all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(pdf): PdfDocumentRenderer walks sections; exportPdfDocument takes PdfDocument"
```

---

## Task 6: Welcome screen redesign

**Files:**
- Modify: `src/views/EmptyView.tsx`
- Modify: `src/components/empty/EmptyState.tsx`

- [ ] **Step 1: Update EmptyState to a single-primary affordance**

Replace the existing 3-button row with one primary "New PDF pattern" + secondary "Open from disk". Drop the `onNewRadial` prop introduced earlier; we no longer need both rectangular and radial buttons — both flows go through the new builder.

Read `src/components/empty/EmptyState.tsx`. Replace the relevant section:

```tsx
// Replace the existing `<div className="empty-actions">` block with:
<div className="empty-actions">
  <button className="btn-primary" onClick={onNew}>
    <Icon name="ui-file-new" size="md" />
    Stwórz nowy wzór PDF
  </button>
  <button className="btn-secondary" onClick={onOpen}>
    <Icon name="ui-folder-open" size="md" />
    {t('empty.openFromDisk')}
  </button>
</div>
<p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted, #7a6347)', fontStyle: 'italic', textAlign: 'center' }}>
  Edytor PDF z gotowymi sekcjami (tytuł, copyright, informacje, wzór, zdjęcia, special stitches).<br/>
  Legacy edytor prostokątny dostępny z menu Settings.
</p>
```

Remove the `onNewRadial` prop from the props interface.

- [ ] **Step 2: Update EmptyView**

Read `src/views/EmptyView.tsx`. Update `handleCreateRadial` → rename to `handleNewPdf`. It should call `usePdfDocumentStore.setDocument(emptyPdfDocument(...))` (introduced in Task 3) and switch mode appropriately.

```tsx
// Top of file:
import { emptyPdfDocument } from '../pdf/document/build';
import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { useDocumentStore } from '../stores/documentStore';

// Replace handleCreateRadial:
const handleNewPdf = () => {
  const doc = emptyPdfDocument({
    title: { pl: 'Nowy wzór', en: 'New pattern' },
    author: '',
  });
  usePdfDocumentStore.getState().setDocument(doc);
  useDocumentStore.getState().setMode('pdf-builder');
};
```

In the JSX, pass `onNew={handleNewPdf}` to EmptyState (replacing the existing `onNew` from props, which still creates a v2 rectangular pattern). The original `onNew` prop becomes "legacy access" — wire it to Settings menu later. For now, the primary button replaces the v2 flow.

Add to the `documentStore` types: a third mode `'pdf-builder'` alongside `'rectangular'` and `'graph'`. Read `src/stores/documentStore.ts`:

```ts
// src/stores/documentStore.ts
export type DocumentMode = 'rectangular' | 'graph' | 'pdf-builder';
```

And update the `setMode` validator: `pdf-builder` doesn't require a graphPattern; it requires a `pdfDocument` in `usePdfDocumentStore`. Adjust:

```ts
setMode(mode) {
  if (mode === 'graph' && get().graphPattern === null) {
    throw new Error('Cannot switch to graph mode without a graph pattern.');
  }
  // pdf-builder validation happens in pdfDocumentStore (presence of document)
  set({ mode });
},
```

- [ ] **Step 3: Pass + suite + typecheck** → green.

- [ ] **Step 4: Commit**

```bash
git add src/views/EmptyView.tsx src/components/empty/EmptyState.tsx src/stores/documentStore.ts
git commit -m "feat(welcome): primary 'Stwórz nowy wzór PDF' button + DocumentMode 'pdf-builder'"
```

---

## Task 7: PdfBuilderView shell + SectionOutline + SectionEditorRouter scaffolding

**Files:**
- Create: `src/pdf-builder/PdfBuilderView.tsx`
- Create: `src/pdf-builder/SectionOutline.tsx`
- Create: `src/pdf-builder/SectionEditorRouter.tsx`
- Create: `src/pdf-builder/PdfBuilderView.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// src/pdf-builder/PdfBuilderView.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdfBuilderView } from './PdfBuilderView';
import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { emptyPdfDocument } from '../pdf/document/build';

describe('PdfBuilderView', () => {
  beforeEach(() => {
    usePdfDocumentStore.getState().reset();
  });

  it('renders an empty state when no document is loaded', () => {
    render(<PdfBuilderView />);
    expect(screen.getByText(/load or create/i)).toBeInTheDocument();
  });

  it('renders the outline and editor when a document is loaded', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    render(<PdfBuilderView />);
    expect(screen.getByText(/title/i)).toBeInTheDocument();   // section in outline
    expect(screen.getByText(/thanks/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify fail** → `npm test -- src/pdf-builder/PdfBuilderView.test.tsx`

- [ ] **Step 3: Implement SectionOutline**

```tsx
// src/pdf-builder/SectionOutline.tsx
import type { Section, SectionKind } from '../pdf/document/types';

const KIND_LABEL: Record<SectionKind, string> = {
  title: 'Title',
  thanks: 'Thanks',
  information: 'Information',
  pattern: 'Pattern',
  photos: 'Photos',
  special: 'Special Stitches',
  text: 'Text',
  pagebreak: '— page break —',
};

interface Props {
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (kind: SectionKind) => void;
  onRemove: (id: string) => void;
}

const KIND_OPTIONS: SectionKind[] = ['title', 'thanks', 'information', 'pattern', 'photos', 'special', 'text', 'pagebreak'];

export function SectionOutline({ sections, selectedId, onSelect, onAdd, onRemove }: Props) {
  return (
    <aside
      style={{
        width: 220,
        background: '#f4f1ea',
        borderRight: '1px solid #b8a87a',
        padding: 12,
        overflow: 'auto',
        height: '100%',
        fontFamily: 'Georgia, serif',
        color: '#3a2f1d',
      }}
    >
      <h3 style={{ fontStyle: 'italic', margin: '0 0 8px 0', fontSize: 14 }}>Outline</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sections.map((s, i) => (
          <li
            key={s.id}
            style={{
              padding: '6px 8px',
              marginBottom: 3,
              background: s.id === selectedId ? '#fffcef' : 'transparent',
              border: s.id === selectedId ? '1px solid #d4831a' : '1px solid transparent',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => onSelect(s.id)}
          >
            <span style={{ flex: 1 }}>
              {i + 1}. {KIND_LABEL[s.kind]}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(s.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#7a6347', cursor: 'pointer' }}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: '#5a4730', fontStyle: 'italic' }}>+ add section</summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {KIND_OPTIONS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onAdd(k)}
              style={{
                textAlign: 'left',
                padding: '4px 8px',
                background: '#fafaf7',
                border: '1px solid #b8a87a',
                borderRadius: 3,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
```

- [ ] **Step 4: Implement SectionEditorRouter (placeholder dispatch)**

```tsx
// src/pdf-builder/SectionEditorRouter.tsx
import type { Section } from '../pdf/document/types';

interface Props {
  section: Section | null;
}

export function SectionEditorRouter({ section }: Props) {
  if (!section) {
    return (
      <div style={{ padding: 24, fontStyle: 'italic', color: '#7a6347', fontFamily: 'Georgia, serif' }}>
        Select a section from the outline to edit it.
      </div>
    );
  }
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
      <h2 style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>
        Editor: {section.kind}
      </h2>
      <p style={{ color: '#7a6347', fontSize: 13 }}>
        The specific editor for "{section.kind}" sections is implemented in subsequent tasks.
      </p>
    </div>
  );
}
```

The router will be extended in Tasks 8–11 to import and dispatch the actual editor components.

- [ ] **Step 5: Implement PdfBuilderView shell**

```tsx
// src/pdf-builder/PdfBuilderView.tsx
import { usePdfDocumentStore } from '../stores/pdfDocumentStore';
import { newSection } from '../pdf/document/build';
import type { SectionKind } from '../pdf/document/types';
import { SectionOutline } from './SectionOutline';
import { SectionEditorRouter } from './SectionEditorRouter';

export function PdfBuilderView() {
  const document = usePdfDocumentStore((s) => s.document);
  const selectedId = usePdfDocumentStore((s) => s.selectedSectionId);
  const select = usePdfDocumentStore((s) => s.selectSection);
  const add = usePdfDocumentStore((s) => s.addSection);
  const remove = usePdfDocumentStore((s) => s.removeSection);

  if (!document) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Georgia, serif', color: '#7a6347', fontStyle: 'italic' }}>
        Load or create a PDF pattern to begin.
      </div>
    );
  }

  const selected = document.sections.find((s) => s.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f1ea' }}>
      <header
        style={{
          height: 40,
          background: '#fafaf7',
          borderBottom: '1px solid #b8a87a',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          fontFamily: 'Georgia, serif',
          color: '#3a2f1d',
        }}
      >
        <span style={{ fontStyle: 'italic', fontSize: 18, color: '#5a4730' }}>
          {document.meta.title.en || document.meta.title.pl || '(untitled)'}
        </span>
        <span style={{ flex: 1 }} />
        <button type="button">Preview PDF</button>
        <button type="button">Export PDF</button>
      </header>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <SectionOutline
          sections={document.sections}
          selectedId={selectedId}
          onSelect={select}
          onAdd={(k: SectionKind) => add(newSection(k))}
          onRemove={remove}
        />
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <SectionEditorRouter section={selected} />
        </div>
        <div
          style={{
            width: 360,
            background: '#fafaf7',
            borderLeft: '1px solid #b8a87a',
            padding: 12,
            fontFamily: 'Georgia, serif',
            color: '#7a6347',
            fontStyle: 'italic',
            fontSize: 12,
          }}
        >
          Live PDF preview (Task 12).
        </div>
      </div>
    </div>
  );
}
```

The Preview/Export buttons + live-preview pane are wired in Task 12.

- [ ] **Step 6: Pass + suite + typecheck** → green.

- [ ] **Step 7: Commit**

```bash
git add src/pdf-builder/
git commit -m "feat(pdf-builder): shell + SectionOutline + SectionEditorRouter scaffolding"
```

---

## Task 8: Simple section editors — Title, Thanks, Information

**Files:**
- Create: `src/pdf-builder/editors/TitleSectionEditor.tsx`
- Create: `src/pdf-builder/editors/ThanksSectionEditor.tsx`
- Create: `src/pdf-builder/editors/InformationSectionEditor.tsx`
- Create: `src/pdf-builder/editors/editors.test.tsx`
- Modify: `src/pdf-builder/SectionEditorRouter.tsx` (dispatch to these three)

- [ ] **Step 1: Failing test**

```tsx
// src/pdf-builder/editors/editors.test.tsx
import { describe, it, expect } from 'vitest';
import { TitleSectionEditor } from './TitleSectionEditor';
import { ThanksSectionEditor } from './ThanksSectionEditor';
import { InformationSectionEditor } from './InformationSectionEditor';

describe('simple editors', () => {
  it('export function components', () => {
    expect(typeof TitleSectionEditor).toBe('function');
    expect(typeof ThanksSectionEditor).toBe('function');
    expect(typeof InformationSectionEditor).toBe('function');
  });
});
```

- [ ] **Step 2: Implement TitleSectionEditor**

```tsx
// src/pdf-builder/editors/TitleSectionEditor.tsx
import type { TitleSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: TitleSection;
}

export function TitleSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const updateMeta = usePdfDocumentStore((s) => s.updateMeta);
  const doc = usePdfDocumentStore((s) => s.document);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Title page</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Title (English)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.title.en ?? ''}
          onChange={(e) => updateMeta({ title: { pl: doc?.meta.title.pl ?? '', en: e.target.value } })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Title (Polish)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.title.pl ?? ''}
          onChange={(e) => updateMeta({ title: { pl: e.target.value, en: doc?.meta.title.en ?? '' } })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Author
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.author ?? ''}
          onChange={(e) => updateMeta({ author: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={section.showYear}
          onChange={(e) => update({ ...section, showYear: e.target.checked })}
        />{' '}
        Show year on the title page
      </label>
    </div>
  );
}
```

- [ ] **Step 3: Implement ThanksSectionEditor**

```tsx
// src/pdf-builder/editors/ThanksSectionEditor.tsx
import type { ThanksSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: ThanksSection;
}

export function ThanksSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const updateMeta = usePdfDocumentStore((s) => s.updateMeta);
  const doc = usePdfDocumentStore((s) => s.document);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Thanks / Copyright</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Thank you message
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 80, fontFamily: 'inherit' }}
          value={section.message}
          onChange={(e) => update({ ...section, message: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Copyright line (override)
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 60, fontFamily: 'inherit' }}
          value={section.copyrightOverride ?? ''}
          onChange={(e) => update({ ...section, copyrightOverride: e.target.value || undefined })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Social tag (@handle or #hashtag)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.socialTag ?? ''}
          onChange={(e) => updateMeta({ socialTag: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Implement InformationSectionEditor**

```tsx
// src/pdf-builder/editors/InformationSectionEditor.tsx
import type { InformationSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: InformationSection;
}

export function InformationSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Information</h2>
      <fieldset style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
        <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>Yarn</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Brand
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.brand ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, brand: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Weight (e.g. "Super fine")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.weight ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, weight: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Fiber (e.g. "100% cotton")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.fiber ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, fiber: e.target.value || undefined } })} />
        </label>
        <label style={{ display: 'block' }}>
          Meterage per ball (e.g. "170 m")
          <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.yarn.meterage ?? ''} onChange={(e) => update({ ...section, yarn: { ...section.yarn, meterage: e.target.value || undefined } })} />
        </label>
      </fieldset>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Hook (e.g. "3 mm")
        <input style={{ display: 'block', width: '100%', padding: 6 }} value={section.hook} onChange={(e) => update({ ...section, hook: e.target.value })} />
      </label>
      <fieldset style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
        <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>Gauge</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Stitches
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.stitches} onChange={(e) => update({ ...section, gauge: { ...section.gauge, stitches: Number(e.target.value) || 0 } })} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Rows
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.rows} onChange={(e) => update({ ...section, gauge: { ...section.gauge, rows: Number(e.target.value) || 0 } })} />
        </label>
        <label style={{ display: 'block' }}>
          Square (cm)
          <input type="number" style={{ display: 'block', width: '100%', padding: 6 }} value={section.gauge.squareCm} onChange={(e) => update({ ...section, gauge: { ...section.gauge, squareCm: Number(e.target.value) || 0 } })} />
        </label>
      </fieldset>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Terms system
        <select style={{ display: 'block', width: '100%', padding: 6 }} value={section.termsSystem} onChange={(e) => update({ ...section, termsSystem: (e.target.value as 'US' | 'UK') })}>
          <option value="US">US terms</option>
          <option value="UK">UK terms</option>
        </select>
      </label>
      <label style={{ display: 'block' }}>
        Notes
        <textarea style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }} value={section.notes ?? ''} onChange={(e) => update({ ...section, notes: e.target.value || undefined })} />
      </label>
    </div>
  );
}
```

- [ ] **Step 5: Wire into SectionEditorRouter**

Replace `src/pdf-builder/SectionEditorRouter.tsx`:

```tsx
import type { Section } from '../pdf/document/types';
import { TitleSectionEditor } from './editors/TitleSectionEditor';
import { ThanksSectionEditor } from './editors/ThanksSectionEditor';
import { InformationSectionEditor } from './editors/InformationSectionEditor';

interface Props {
  section: Section | null;
}

export function SectionEditorRouter({ section }: Props) {
  if (!section) {
    return (
      <div style={{ padding: 24, fontStyle: 'italic', color: '#7a6347', fontFamily: 'Georgia, serif' }}>
        Select a section from the outline to edit it.
      </div>
    );
  }
  switch (section.kind) {
    case 'title':       return <TitleSectionEditor section={section} />;
    case 'thanks':      return <ThanksSectionEditor section={section} />;
    case 'information': return <InformationSectionEditor section={section} />;
    default:
      return (
        <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
          <h2 style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>Editor: {section.kind}</h2>
          <p style={{ color: '#7a6347', fontSize: 13 }}>
            Editor for "{section.kind}" is implemented in a subsequent task.
          </p>
        </div>
      );
  }
}
```

- [ ] **Step 6: Pass + suite + typecheck** → green.

- [ ] **Step 7: Commit**

```bash
git add src/pdf-builder/editors/TitleSectionEditor.tsx src/pdf-builder/editors/ThanksSectionEditor.tsx src/pdf-builder/editors/InformationSectionEditor.tsx src/pdf-builder/editors/editors.test.tsx src/pdf-builder/SectionEditorRouter.tsx
git commit -m "feat(pdf-builder): Title/Thanks/Information section editors + router dispatch"
```

---

## Task 9: Photos / Special / Text editors

**Files:**
- Create: `src/pdf-builder/editors/PhotosSectionEditor.tsx`
- Create: `src/pdf-builder/editors/SpecialStitchesSectionEditor.tsx`
- Create: `src/pdf-builder/editors/TextSectionEditor.tsx`
- Modify: `src/pdf-builder/SectionEditorRouter.tsx`

- [ ] **Step 1: PhotosSectionEditor**

```tsx
// src/pdf-builder/editors/PhotosSectionEditor.tsx
import { useRef } from 'react';
import type { PhotosSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { readImageFile, buildPhotoFromBase64 } from '../../photos/importer';

interface Props {
  section: PhotosSection;
}

export function PhotosSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    const newPhotos = [];
    for (const f of Array.from(files)) {
      const data = await readImageFile(f);
      newPhotos.push(buildPhotoFromBase64(data));
    }
    update({ ...section, photos: [...section.photos, ...newPhotos] });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Photos</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading}
          onChange={(e) => update({ ...section, heading: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Caption
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.caption ?? ''}
          onChange={(e) => update({ ...section, caption: e.target.value || undefined })}
        />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 16 }}>
        {section.photos.map((p) => (
          <div key={p.id} style={{ border: '1px solid #b8a87a', padding: 4, position: 'relative' }}>
            {p.storage.kind === 'inline' && (
              <img
                src={`data:${p.storage.mime};base64,${p.storage.base64}`}
                alt=""
                style={{ width: '100%', height: 100, objectFit: 'cover' }}
              />
            )}
            <button
              type="button"
              onClick={() => update({ ...section, photos: section.photos.filter((x) => x.id !== p.id) })}
              style={{ position: 'absolute', top: 4, right: 4, background: '#fff', border: '1px solid #d4831a', borderRadius: 3, cursor: 'pointer' }}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => void handleUpload(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        style={{ marginTop: 16, padding: '8px 16px', background: '#5a4730', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        + Upload photos
      </button>
    </div>
  );
}
```

- [ ] **Step 2: SpecialStitchesSectionEditor**

```tsx
// src/pdf-builder/editors/SpecialStitchesSectionEditor.tsx
import type { SpecialStitchesSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { newId } from '../../utils/id';
import type { CustomStitch } from '../../domain/graph/types';

interface Props {
  section: SpecialStitchesSection;
}

function emptyCustomStitch(): CustomStitch {
  return {
    id: newId(),
    shortCode: 'HC',
    nameByLanguage: { pl: 'Pęczek kapturowy', en: 'Hood cluster' },
    description: {
      pl: 'Narzuć włóczkę na szydełko, wkłuj w następne oczko, wyciągnij pętelkę (3 pętle). Wkłuj w kolejne oczko, wyciągnij pętelkę (4 pętle). Przeciągnij włóczkę przez wszystkie 4 pętle.',
      en: 'Yarn over, insert hook in next stitch, draw up a loop (3 loops). Insert hook in following stitch, draw up a loop (4 loops). Draw yarn through all 4 loops on hook.',
    },
    symbol: { kind: 'preset', presetId: 'shell' },
  };
}

export function SpecialStitchesSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);

  function addEntry() {
    update({ ...section, entries: [...section.entries, { stitch: emptyCustomStitch(), photos: [] }] });
  }
  function removeEntry(id: string) {
    update({ ...section, entries: section.entries.filter((e) => e.stitch.id !== id) });
  }
  function updateEntry(id: string, patch: Partial<CustomStitch>) {
    update({
      ...section,
      entries: section.entries.map((e) =>
        e.stitch.id === id ? { ...e, stitch: { ...e.stitch, ...patch } } : e,
      ),
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Special Stitches</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading}
          onChange={(e) => update({ ...section, heading: e.target.value })}
        />
      </label>
      {section.entries.map((entry) => (
        <fieldset key={entry.stitch.id} style={{ marginBottom: 16, border: '1px solid #b8a87a', padding: 12 }}>
          <legend style={{ fontStyle: 'italic', padding: '0 8px' }}>
            {entry.stitch.shortCode} — {entry.stitch.nameByLanguage.en}
          </legend>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Short code
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.shortCode}
              onChange={(e) => updateEntry(entry.stitch.id, { shortCode: e.target.value })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Name (EN)
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.nameByLanguage.en}
              onChange={(e) => updateEntry(entry.stitch.id, { nameByLanguage: { pl: entry.stitch.nameByLanguage.pl, en: e.target.value } })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Name (PL)
            <input
              style={{ display: 'block', width: '100%', padding: 6 }}
              value={entry.stitch.nameByLanguage.pl}
              onChange={(e) => updateEntry(entry.stitch.id, { nameByLanguage: { pl: e.target.value, en: entry.stitch.nameByLanguage.en } })}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Description (EN)
            <textarea
              style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }}
              value={entry.stitch.description?.en ?? ''}
              onChange={(e) => updateEntry(entry.stitch.id, { description: { pl: entry.stitch.description?.pl ?? '', en: e.target.value } })}
            />
          </label>
          <label style={{ display: 'block' }}>
            Description (PL)
            <textarea
              style={{ display: 'block', width: '100%', padding: 6, minHeight: 60, fontFamily: 'inherit' }}
              value={entry.stitch.description?.pl ?? ''}
              onChange={(e) => updateEntry(entry.stitch.id, { description: { pl: e.target.value, en: entry.stitch.description?.en ?? '' } })}
            />
          </label>
          <button
            type="button"
            onClick={() => removeEntry(entry.stitch.id)}
            style={{ marginTop: 8, padding: '4px 8px', background: 'transparent', border: '1px solid #d4831a', color: '#d4831a', borderRadius: 3, cursor: 'pointer' }}
          >
            Remove this stitch
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={addEntry}
        style={{ marginTop: 8, padding: '8px 16px', background: '#5a4730', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        + Add special stitch
      </button>
    </div>
  );
}
```

- [ ] **Step 3: TextSectionEditor**

```tsx
// src/pdf-builder/editors/TextSectionEditor.tsx
import type { TextSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: TextSection;
}

export function TextSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Text block</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading (optional)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading ?? ''}
          onChange={(e) => update({ ...section, heading: e.target.value || undefined })}
        />
      </label>
      <label style={{ display: 'block' }}>
        Body
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 200, fontFamily: 'inherit' }}
          value={section.body}
          onChange={(e) => update({ ...section, body: e.target.value })}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Update SectionEditorRouter to dispatch these three**

Add imports + cases:

```tsx
import { PhotosSectionEditor } from './editors/PhotosSectionEditor';
import { SpecialStitchesSectionEditor } from './editors/SpecialStitchesSectionEditor';
import { TextSectionEditor } from './editors/TextSectionEditor';

// inside switch:
case 'photos':  return <PhotosSectionEditor section={section} />;
case 'special': return <SpecialStitchesSectionEditor section={section} />;
case 'text':    return <TextSectionEditor section={section} />;
```

- [ ] **Step 5: Pass + suite + typecheck** → green.

- [ ] **Step 6: Commit**

```bash
git add src/pdf-builder/editors/PhotosSectionEditor.tsx src/pdf-builder/editors/SpecialStitchesSectionEditor.tsx src/pdf-builder/editors/TextSectionEditor.tsx src/pdf-builder/SectionEditorRouter.tsx
git commit -m "feat(pdf-builder): Photos / Special / Text section editors"
```

---

## Task 10: PatternSectionEditor — embed graph editor

**Files:**
- Create: `src/pdf-builder/editors/PatternSectionEditor.tsx`
- Modify: `src/pdf-builder/SectionEditorRouter.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/pdf-builder/editors/PatternSectionEditor.tsx
import { useEffect } from 'react';
import type { PatternSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { usePatternGraphStore } from '../../stores/patternGraphStore';
import { GraphEditorShell } from '../../editor/GraphEditorShell';

interface Props {
  section: PatternSection;
}

export function PatternSectionEditor({ section }: Props) {
  const updateSection = usePdfDocumentStore((s) => s.updateSection);

  // Push section.pattern into the graph store on mount / when section.id changes.
  useEffect(() => {
    usePatternGraphStore.getState().setPattern(section.pattern);
    return () => {
      // On unmount, sync any in-store changes back to the document section.
      const current = usePatternGraphStore.getState().pattern;
      if (current) {
        updateSection({ ...section, pattern: current });
      }
      usePatternGraphStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  // Also write back continuously so the live preview stays current.
  const livePattern = usePatternGraphStore((s) => s.pattern);
  useEffect(() => {
    if (livePattern && livePattern !== section.pattern) {
      updateSection({ ...section, pattern: livePattern });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePattern]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #b8a87a', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
        <input
          style={{ background: 'transparent', border: 'none', fontSize: 16, fontStyle: 'italic', width: '60%' }}
          value={section.heading}
          onChange={(e) => updateSection({ ...section, heading: e.target.value })}
          placeholder="Section heading (e.g. Pattern, Body, Sleeves)"
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <GraphEditorShell />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into router**

```tsx
import { PatternSectionEditor } from './editors/PatternSectionEditor';
// inside switch:
case 'pattern': return <PatternSectionEditor section={section} />;
```

- [ ] **Step 3: Pass + suite + typecheck**

NOTE: GraphEditorShell currently has a "Switch to rectangular" button that may misbehave when embedded. That's acceptable for Phase 4 — the button stays but does nothing harmful when there's no v2 pattern. A polish pass in Phase 5 hides the embedded toolbar.

- [ ] **Step 4: Commit**

```bash
git add src/pdf-builder/editors/PatternSectionEditor.tsx src/pdf-builder/SectionEditorRouter.tsx
git commit -m "feat(pdf-builder): PatternSectionEditor embeds GraphEditorShell"
```

---

## Task 11: Live PDF preview in PdfBuilderView

**Files:**
- Modify: `src/pdf-builder/PdfBuilderView.tsx`

- [ ] **Step 1: Implement preview**

In `PdfBuilderView.tsx`, replace the placeholder right column with a real preview using react-pdf's `PDFViewer`. Add imports:

```tsx
import { PDFViewer } from '@react-pdf/renderer';
import { PdfDocumentRenderer } from '../pdf/PdfDocumentRenderer';
```

Replace the right-column placeholder div:

```tsx
<div style={{ width: 360, background: '#fafaf7', borderLeft: '1px solid #b8a87a', display: 'flex', flexDirection: 'column' }}>
  <div style={{ padding: '8px 12px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#5a4730', fontSize: 12, borderBottom: '1px solid #b8a87a' }}>
    Live preview
  </div>
  <div style={{ flex: 1, minHeight: 0 }}>
    <PDFViewer width="100%" height="100%" showToolbar={false}>
      <PdfDocumentRenderer document={document} />
    </PDFViewer>
  </div>
</div>
```

- [ ] **Step 2: Pass + suite + typecheck + build**

`npm test && npm run typecheck && npm run build` — green.

- [ ] **Step 3: Commit**

```bash
git add src/pdf-builder/PdfBuilderView.tsx
git commit -m "feat(pdf-builder): live PDF preview in right column"
```

---

## Task 12: Export PDF action + app routing + version bump + PR

**Files:**
- Modify: `src/pdf-builder/PdfBuilderView.tsx` (Preview + Export buttons)
- Modify: `src/App.tsx` (route to PdfBuilderView when mode is `pdf-builder`)
- Modify: `package.json` (0.6.0-alpha.0)
- Create: `feature/phase-4-pdf-builder` PR

- [ ] **Step 1: Wire Export button**

In `PdfBuilderView.tsx`, add state + handlers:

```tsx
import { useState } from 'react';
import { exportPdfDocument } from '../pdf/exportPdf';
import { PdfPreviewView } from '../views/PdfPreviewView';

// inside component:
const [showPreview, setShowPreview] = useState(false);
const [exportStatus, setExportStatus] = useState<string | null>(null);
```

Replace the two header buttons:

```tsx
<button type="button" onClick={() => setShowPreview(true)}>Preview PDF</button>
<button
  type="button"
  onClick={async () => {
    if (!document) return;
    const r = await exportPdfDocument(document);
    if (r.kind === 'ok') setExportStatus(`Saved to ${r.path}`);
    else if (r.kind === 'error') setExportStatus(`Error: ${r.message}`);
    else setExportStatus(null);
    setTimeout(() => setExportStatus(null), 4000);
  }}
>
  Export PDF
</button>
```

Add overlays before the final `</div>`:

```tsx
{showPreview && (
  <PdfPreviewView document={document} onClose={() => setShowPreview(false)} />
)}
{exportStatus && (
  <div
    style={{
      position: 'fixed',
      bottom: 40,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#fffcef',
      border: '1px solid #d4831a',
      padding: '8px 16px',
      borderRadius: 4,
      fontSize: 12,
      color: '#3a2f1d',
      zIndex: 9999,
    }}
  >
    {exportStatus}
  </div>
)}
```

- [ ] **Step 2: Route from App.tsx**

Read `src/App.tsx`. Find the routing block and add a `pdf-builder` branch BEFORE the existing branches:

```tsx
import { PdfBuilderView } from './pdf-builder/PdfBuilderView';

// inside the return JSX:
{documentMode === 'pdf-builder' ? (
  <PdfBuilderView />
) : documentMode === 'graph' ? (
  <GraphEditorView />
) : pattern ? (
  <EditorView ... />
) : (
  <EmptyView ... />
)}
```

- [ ] **Step 3: Bump version**

`package.json` → `"version": "0.6.0-alpha.0"`.

- [ ] **Step 4: Run everything**

```bash
npm test
npm run typecheck
npm run build
```

All green.

- [ ] **Step 5: Commit + push + PR**

```bash
git add src/pdf-builder/PdfBuilderView.tsx src/App.tsx package.json
git commit -m "feat(pdf-builder): wire Export + Preview + route from App (0.6.0-alpha.0)"

git push -u origin feature/phase-4-pdf-builder

gh pr create --draft --base master --title "feat: Phase 4 — PDF Builder architecture inversion" --body "$(cat <<'EOF'
## Summary

Inverts the app architecture: PDF document becomes the primary canvas; pattern (graph) editor becomes one section type among many that can live inside a document.

**New:**
- \`PdfDocument\` data model with \`sections: Section[]\` tagged union (title / thanks / information / pattern / photos / special / text / pagebreak)
- \`pdfDocumentStore\` (Zustand) with add/remove/reorder/update section operations
- \`PdfBuilderView\` — 3-column shell: outline (left) | section editor (middle) | live PDF preview (right)
- Section editors for all 7 content kinds
- \`PatternSectionEditor\` embeds the existing \`GraphEditorShell\` for the section's nested graph pattern
- \`PdfDocumentRenderer\` walks sections, produces a multi-page \`<Document>\`
- Welcome screen: single primary "Stwórz nowy wzór PDF" button

**Refactored:**
- \`src/pdf/pages/*\` now take section data + meta instead of full \`Pattern\`
- \`exportPdfDocument\` (was \`exportPatternPdf\`) takes \`PdfDocument\`
- \`PdfPreviewView\` takes \`PdfDocument\`

**Removed:**
- \`src/pdf/PatternDocument.tsx\` (replaced by \`PdfDocumentRenderer\`)

**Test plan:**
- [x] npm test (all green)
- [x] npm run typecheck (clean)
- [x] npm run build (succeeds)
- [ ] Manual smoke: open app → "Stwórz nowy wzór PDF" → outline shows 6 default sections → click Pattern → graph editor opens → add stitches → click Title → live preview updates → Export PDF works
EOF
)"
```

- [ ] **Step 6: Self-check**

- All tests green
- typecheck + build clean
- Branch pushed
- Draft PR opened

---

## Self-review

**Spec coverage:**
- User pivot "PDF as main system, pattern is addon" → entire Phase 4 implements this inversion.
- §9 PDF generation continues to work — the rendering layer is reused.
- §7 Custom stitches → SpecialStitchesSectionEditor.
- §8 Photos → PhotosSectionEditor.

**Placeholder scan:** No TBDs. All code blocks are concrete.

**Type consistency:**
- `PdfDocument` schemaVersion is `1`, used consistently in tests and code.
- `Section` discriminator `kind` matches in all editors and the router.
- `PdfDocumentMeta` shape consistent across pages, editors, store, and renderer.
- `exportPdfDocument` and `PdfDocumentRenderer` consume the same data shape.

**Known simplifications / deferrals:**
- `PhotosSection` and `TextSection` are not yet rendered as separate PDF pages — they appear as section editors only. Phase 5 adds dedicated PhotosPage and TextPage renderers.
- The embedded `GraphEditorShell` keeps its own toolbar including a "Switch to rectangular" button that's a no-op in the embed context. Phase 5 hides the toolbar when embedded.
- Customization page (garment templates) is still deferred — was originally Phase 4 but the architecture inversion took its slot. Garment templates land in Phase 5.
- Save/load `.wzor` v3 files now need adaptation to the new `PdfDocument` wrapper — for Phase 4, fresh files are created in the builder; loading an existing pattern wraps it in a single-section document. A proper migration adapter lands in Phase 5.
