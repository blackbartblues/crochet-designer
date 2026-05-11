# PDF Pattern Designer — design spec

- **Status:** draft (auto-generated during brainstorming session 2026-05-11)
- **Branch target:** `feature/pdf-pattern-designer`
- **Scope:** major feature extension of `crochet-designer` from rectangular-grid editor to a multigraph-based pattern designer with professional PDF export for Etsy/Ravelry sale.
- **Reference artifact:** `/home/blacku/Downloads/Hexagonshirt.pdf` (Caroline Zuschlag, *Hexagon Shirt*, 2022) — purchased on Etsy, used as visual/structural inspiration only.

---

## 1. Context and motivation

### 1.1 Who this is for

The primary user is the developer's mother. She has been crocheting for years and uses **custom modified stitches** that do not appear in standard stitch libraries — for example, what she describes as a *"podwójne przewinięcie z wyciągnięciem"* (double yarn-over with pull-through). She wants to publish and sell her patterns on **Etsy / Ravelry**, but does not have a tool that can:

1. Represent her own custom stitches with consistent symbols and explanations.
2. Produce a polished, professional, sale-ready PDF document (title page, gauge, abbreviations, chart, customization, copyright) without manual layout work in Pages / InDesign / Word.
3. Show photos of her own hands performing each stitch — the part that gives her patterns real teaching value because her stitches are non-standard.

The current `crochet-designer` v0.2.0 is a rectangular grid editor with Excel export. It is a strong starting point but covers only a subset of her needs.

### 1.2 What the reference PDF teaches us

The Hexagon Shirt PDF is a 13-page A4 document with the following structure:

| Page(s) | Section | Notable elements |
|---|---|---|
| 1 | Title | Designer wordmark (CL), hand-lettered title, model photo |
| 2 | Thanks | Copyright statement, social tags, contact, brand URL |
| 3 | Information | Yarn brand + weight + amounts per size, hook size, gauge, US abbreviations, hand-drawn symbol legend |
| 4–5 | Pattern | Round-by-round textual instructions with video timestamps, side-by-side hand-drawn radial chart, edge-straightening diagram |
| 5–6 | Customization | 3D-style hand-drawn garment sketch with numbered measurement points, body-specific math |
| 7+ | Assembly / Finishing | Joining, button band, collar (not fully read in this session) |

Three observations drive the architecture:

1. **The chart is the heart.** A hand-drawn radial diagram of the hexagonal granny square, showing magic ring → 6 "fishbone" `gr_st` clusters → expanding rounds. This is **not** representable on a rectangular grid.
2. **Each stitch participates in three different relationships at once** — anchored *into* something below, flowing *to* something next in yarn order, and (for closing/joining stitches) bridging *to* something elsewhere. The model has to be a multigraph, not a 2D grid and not a tree.
3. **The aesthetic is a brand.** Caroline's hand-lettered, two-color, paper-feel pages are a visible identity. Mom needs her own *equivalent* — a coherent vintage / cottagecore aesthetic that says "this is a real pattern from a real maker."

### 1.3 Decisions captured during brainstorming

| # | Decision | Choice |
|---|---|---|
| D1 | Supported pattern shapes | Rectangular **and** radial (both first-class in MVP). |
| D2 | Primary use case | Etsy / Ravelry sale → professional polish, copyright, branding required. |
| D3 | Visual direction | Vintage / cottagecore — warm paper background, serif typography (Cormorant Garamond + Georgia), brown/cream palette, ornamental rules. |
| D4 | MVP scope | Radial editor **and** PDF generator delivered together; defer no major feature. Estimate 5–8 weeks. |
| D5 | Chart engine | Algorithmic SVG generated from structured data, with Rough.js applied for a subtle hand-drawn wobble. No drawing canvas, no photo embed. |
| D6 | Input UX | Node graph editor (ReactFlow). Multigraph data model under the hood. Future-friendly for LLM-generated patterns. |
| D7 | Data relationships | Four kinds: `anchor` (1-to-many for increases), `yarn_flow` (1-to-1 chain), `join` (many-to-one for `sl st`/seaming), `anchor → chain-space` (anchor target is a gap, not a stitch). |
| D8 | Educational layer | Tool actively helps non-expert readers: hover-highlight of "everything anchored here", animated yarn-path playback, auto-generated text instructions for cross-check, structural validator, contextual tooltips, first-run tutorial overlay. |
| D9 | Photo upload | Built into MVP. Photos attach to individual stitches, rounds, or PDF sections. 300 DPI for print path, downsampled for live preview. |
| D10 | Custom stitches | Defined as a sub-graph of nodes plus a symbol and short letter code; reusable across patterns; stored with the pattern so files are portable. |
| D11 | Customization page | In MVP. Use a small template library of garment shapes (hexagon shirt, rectangle sweater, beanie, blanket). Mom positions measurement points on the template. Auto-construction from the stitch graph is a v2 goal. |
| D12 | Node graph library | ReactFlow (battle-tested, used by n8n / ComfyUI, MIT). |
| D13 | PDF library | `@react-pdf/renderer` — pure React → PDF, no Chromium sidecar, fonts/SVG/images supported, keeps Tauri bundle small. |
| D14 | Trust delegation | After D1–D13 the user explicitly delegated remaining design decisions. The rest of this document is the assistant's recommendation, not a series of further votes. |

### 1.4 Non-goals (out of MVP)

- Auto-construction of the 3D-style garment isometric from the stitch graph (D11 — template library instead).
- Knitting, Tunisian crochet, hairpin lace, or any non-standard-crochet craft.
- A web/SaaS deployment. This stays a desktop Tauri app.
- Multi-user collaboration / cloud sync. Files are local `.wzor` documents.
- LLM-driven pattern generation. (The data model is designed to make it feasible later; not built in MVP.)
- AI photo editing / hand-detection / pose overlays. Photos are uploaded as-is.

---

## 2. Goals and success criteria

### 2.1 Functional goals

| ID | Goal | Acceptance signal |
|---|---|---|
| G1 | Mom can build a hexagonal granny square (round 1 magic ring → round N) in the node editor without typing code. | A guided session produces a valid 4-round hexagon in under 15 minutes. |
| G2 | The same pattern, exported to PDF, looks comparable in polish to the Hexagon Shirt reference. | Side-by-side review: title page, information page, pattern page, customization page, copyright — all present and visually coherent. |
| G3 | Mom can define a custom stitch with her own symbol + letter code + short description + sub-graph. | Custom stitch appears in palette, in PDF legend, and renders correctly inside the diagram. |
| G4 | Mom can attach photos of her hands to specific stitches / rounds / steps. | Photos appear in the PDF inline with the relevant instruction text. |
| G5 | The auto-generated instruction text matches what a human pattern reader expects. | Round-by-round prose in PDF reads like Caroline's pattern, with stitch counts and totals. |
| G6 | The educational layer prevents mom from publishing a broken pattern. | The validator flags missing anchors, broken yarn flow, and orphan stitches before PDF export is allowed. |
| G7 | Existing `.wzor` v2 files continue to open and save without data loss. | All `examples/*.wzor` round-trip through v3 with byte-equal grid after migration. |

### 2.2 Quality and performance targets

- **Editor responsiveness**: dragging a node, panning the canvas, or opening a 100-stitch pattern stays at 60 fps on a 4-year-old laptop.
- **Auto-save latency**: under 200 ms after the last edit.
- **PDF export time**: a 4-page pattern with 10 photos and one chart renders in under 8 seconds on the same hardware.
- **Validator runtime**: under 50 ms for a 500-stitch pattern.
- **Test coverage** (per project rules): 80 % minimum across unit + integration + E2E.
- **Bundle size impact**: ReactFlow + react-pdf + Rough.js together add no more than ~600 KB to the gzipped renderer bundle. (Tauri ships its own webview, so the cost is install size, not network.)
- **Memory**: a 1000-stitch pattern with 30 attached photos uses less than 500 MB resident.

### 2.3 Out-of-scope quality targets (deferred)

- Accessibility audit for screen readers in the node editor (canvas-based; deferred to v2 with a separate textual mode).
- Localization beyond Polish + English (mom's market is mostly EU; more languages later).

---

## 3. Architecture overview

### 3.1 Stack and tooling

Existing (kept as-is):
- **Tauri 2** desktop wrapper (Rust backend, system webview).
- **React 19** + **TypeScript** + **Vite** renderer.
- **Zustand** for state stores, **Immer** for immutable updates.
- **Zod 4** for runtime schema validation.
- **i18next** for UI translations.
- **Tailwind CSS 3** + custom styles.
- **Vitest** + React Testing Library + jsdom for tests.
- **ExcelJS** for the existing `.xlsx` export (kept; new PDF path is additive).

Added for this feature:
- **ReactFlow** (`reactflow`) — graph editor library. Provides node + edge primitives, handles, panning, zoom, mini-map. MIT licensed.
- **Rough.js** (`roughjs`) — converts SVG paths to hand-drawn-looking equivalents. Used by the chart renderer for the wobble effect. MIT licensed.
- **`@react-pdf/renderer`** — React → PDF document model. Supports fonts, SVG, images, page layouts. MIT licensed.
- **Dagre** or **ELK.js** — graph auto-layout for the "freeform" mode and as a fallback when no positional metadata exists. Pick one during implementation; Dagre is lighter, ELK is more capable.
- **Sharp (Rust crate `image`)** in Tauri sidecar for photo resize / compression (300 DPI print path, 72 DPI preview path).

### 3.2 Module layout (renderer)

The existing tree gains the following directories, each a clear bounded module:

```
src/
  domain/
    graph/                  # NEW — multigraph types, schema, walk algorithms
      types.ts              # Stitch, Edge, Pattern v3, AnchorTarget
      schema.ts             # Zod schemas + version migrations (v2 → v3)
      walk.ts               # yarn-flow traversal, anchor traversal, round grouping
      build.ts              # higher-level constructors (newHexagon, addRound, etc.)
    customStitch/           # NEW — sub-graph definition for mom's stitches
      types.ts
      registry.ts           # built-ins + user-defined
    stitches/
      glossary.ts           # NEW — type → short pl/en explanations for tooltips
    validation/             # exists; gains rules for graph integrity
  layout/                   # NEW — auto-layout from graph → 2D coords
    radial.ts               # hex / circle layout
    linear.ts               # row-wise layout for rectangular mode
    forceDirected.ts        # fallback for freeform mode
  editor/                   # NEW — ReactFlow-based node editor
    EditorView.tsx          # 3-column layout shell
    NodePalette.tsx
    Inspector.tsx
    canvas/
      StitchNode.tsx        # ReactFlow custom node
      AnchorEdge.tsx
      YarnFlowEdge.tsx
      JoinEdge.tsx
      ChainSpaceNode.tsx
    interactions/
      dragStitch.ts
      connectEdge.ts        # enforces edge-kind validity
      shiftMode.ts          # Shift = yarn-flow edit, plain = anchor edit
  chart/                    # NEW — SVG renderer for printable diagrams
    SymbolLibrary.ts        # × ⊤ • ∞ ≣ and custom mapping
    renderRadial.tsx
    renderLinear.tsx
    roughen.ts              # Rough.js application + theme
    theme.ts                # vintage palette tokens
  instructions/             # NEW — graph → human-readable prose
    generate.ts             # walks graph, emits "Round 2: 6 gr_st with 1 ch between"
    formatPL.ts
    formatEN.ts
  photos/                   # NEW — upload, store, attach
    types.ts
    importer.ts             # drag-drop, file dialog
    store.ts                # zustand slice; references via id
    thumbnails.ts           # render-time downsample
  pdf/                      # NEW — react-pdf composition
    PatternDocument.tsx     # top-level <Document>
    pages/
      TitlePage.tsx
      ThanksPage.tsx
      InformationPage.tsx
      PatternPage.tsx
      CustomizationPage.tsx
      LegendPage.tsx
    components/
      Heading.tsx
      RuleOrnament.tsx
      DiagramFigure.tsx
      AbbreviationsTable.tsx
      PhotoFigure.tsx
    theme.ts                # fonts, colors, spacing tokens — shared with chart theme
    export.ts               # invoke react-pdf → save via Tauri fs
  garment/                  # NEW — measurement-overlay templates
    templates/
      hexagonShirt.svg
      rectangleSweater.svg
      beanie.svg
      blanket.svg
    GarmentTemplatePicker.tsx
    MeasurementOverlayEditor.tsx
  views/
    NewPatternView.tsx      # exists; gains "radial" branch
    EditorView.tsx          # gains mode switcher (Rect / Radial / Freeform)
    PdfPreviewView.tsx      # NEW — live preview pane
  services/
    pdfExport.ts            # NEW — orchestrates pdf/export.ts with progress events
```

### 3.3 Module layout (Tauri / Rust)

```
src-tauri/src/
  lib.rs                    # exists; gains new command registrations
  main.rs                   # exists
  photos.rs                 # NEW — image::resize, encode, write to .wzor or cache
  pdf_io.rs                 # NEW — write generated PDF blob to disk path
```

Photos live in two states:
- **Inside the pattern file**: encoded base64 in `.wzor` v3 so the pattern is portable in one file. Size budget: warn over 25 MB, hard limit 100 MB.
- **External cache**: optional reference-by-path mode for users who don't want bloated files; resolved at export time.

### 3.4 State management

A new Zustand store `patternGraphStore` lives alongside the existing `patternStore`:

- `patternStore` continues to drive the rectangular grid editor unchanged.
- `patternGraphStore` drives the radial / freeform graph editor.
- A top-level `documentStore` holds the union (which mode is active for the open document) and is the single source of truth for save/load.

This separation keeps the rectangular editor untouched and avoids one giant store with conditional branches.

---

## 4. Data model (the multigraph)

### 4.1 Core types (TypeScript)

```typescript
// schemaVersion is bumped from 2 → 3.

export type StitchId    = string  // ULID
export type EdgeId      = string
export type PhotoId     = string
export type ColorId     = string
export type CustomStitchId = string
export type RoundIndex  = number  // 0 = foundation / magic ring

export type BuiltinStitchType =
  | 'ch' | 'sl_st' | 'sc' | 'hdc' | 'dc' | 'tr'
  | 'gr_st'      // granny stitch = 3 dc into one anchor
  | 'magic_ring'
  | 'fasten_off'

export type StitchTypeRef =
  | { kind: 'builtin'; type: BuiltinStitchType }
  | { kind: 'custom';  id: CustomStitchId }

export interface Stitch {
  id: StitchId
  typeRef: StitchTypeRef
  colorRef?: ColorId
  round?: RoundIndex
  position?: { x: number; y: number }   // null = auto-layout
  attachments?: { photoIds: PhotoId[]; note?: string }
}

export type AnchorTarget =
  | { kind: 'stitch'; id: StitchId }
  | { kind: 'chain_space'; betweenA: StitchId; betweenB: StitchId }
  | { kind: 'magic_ring' }
  | { kind: 'turning_chain'; ofStitch: StitchId }

export type Edge =
  | { id: EdgeId; kind: 'anchor';    from: StitchId; to: AnchorTarget }
  | { id: EdgeId; kind: 'yarn_flow'; from: StitchId; to: StitchId }
  | { id: EdgeId; kind: 'join';      stitch: StitchId; targets: StitchId[] }

export interface CustomStitch {
  id: CustomStitchId
  shortCode: string         // 1–3 letters, no clash with built-ins
  nameByLanguage: Record<'pl' | 'en', string>
  description?: Record<'pl' | 'en', string>
  symbol: { kind: 'preset'; presetId: string } | { kind: 'svgPath'; path: string }
  // Optional sub-graph definition (advanced)
  subGraph?: { stitches: Stitch[]; edges: Edge[] }
}

export interface Color {
  id: ColorId
  hex: string
  nameByLanguage?: Record<'pl' | 'en', string>
}

export interface Photo {
  id: PhotoId
  storage: { kind: 'inline'; base64: string; mime: string }
            | { kind: 'path'; path: string }
  captionByLanguage?: Record<'pl' | 'en', string>
  width: number
  height: number
  bytes: number
}

export interface Round {
  index: RoundIndex
  stitchIds: StitchId[]   // ordered by yarn flow
  noteByLanguage?: Record<'pl' | 'en', string>
}

export interface PdfSectionConfig {
  kind: 'title' | 'thanks' | 'information' | 'pattern' | 'customization' | 'legend' | 'finishing'
  enabled: boolean
  overrides?: Record<string, unknown>  // section-specific knobs
}

export interface PatternMeta {
  title: Record<'pl' | 'en', string>
  author: string
  designedAt: string   // ISO date
  yarn: { brand?: string; weight?: string; fiber?: string; meterage?: string }
  hook: string
  gauge: { stitches: number; rows: number; squareCm: number }
  language: 'pl' | 'en' | 'pl-en'
  copyrightLine?: string
  socialTag?: string
}

export interface Pattern {
  schemaVersion: 3
  shape: 'rectangular' | 'radial' | 'freeform'
  meta: PatternMeta
  colors: Color[]
  stitches: Stitch[]
  edges: Edge[]
  rounds: Round[]
  customStitches: CustomStitch[]
  photos: Photo[]
  pdfSections: PdfSectionConfig[]
  // Backward-compat shadow for v2 grid (filled only after migration)
  legacyGrid?: {
    rows: number
    cols: number
    cells: Array<{ stitchId: StitchId | null }>
  }
}
```

### 4.2 Invariants

The validator (and the Zod schema) guarantee:

- **Anchor presence**: every stitch except `magic_ring` and the first `ch` of a chain foundation has exactly one outgoing `anchor` edge (joins layer additional `join` edges on top).
- **Anchor existence**: every `AnchorTarget` referring to a stitch by id resolves to an existing stitch.
- **Yarn flow connectivity**: yarn_flow edges form a single linear chain from the start node to one `fasten_off` (or end-of-round `sl st` for rounds).
- **Acyclic yarn flow**: no cycles in the yarn_flow subgraph.
- **Round consistency**: every stitch with `round = N` is reachable from the start of round N via yarn flow.
- **Photo references valid**: every `photoIds[i]` resolves to a photo in `pattern.photos`.
- **Custom stitch references valid**: every `StitchTypeRef.custom` resolves to a `CustomStitch`.
- **Color references valid**: every `colorRef` resolves to a `Color`.

Validation runs on every edit (cheap, in-store) and before PDF export (blocking).

### 4.3 Migration from v2

`v2` files have a `grid: { rows, cols, cells: Cell[] }`. Migration:

1. For each row r, for each column c with a non-empty cell, create a `Stitch` with `round = r`.
2. For each row r, connect stitches in column order with `yarn_flow` edges (zig-zag if alternating rows turn, matching v2 row-turn metadata).
3. Each non-foundation stitch gets an `anchor` edge into the stitch at the same column in row r−1, when present.
4. The whole pattern is saved with `shape: 'rectangular'`.
5. `legacyGrid` is retained as a shadow for one release so the migration is reversible.

### 4.4 Serialization

`.wzor` files remain JSON. Photos default to inline base64. Files >25 MB trigger a UI warning suggesting a switch to external photo refs. Compression at save time uses a single `gzip` over the JSON (suffix stays `.wzor` since current files are uncompressed; we detect by magic byte and fall back).

---

## 5. Editor UX

### 5.1 Top-level views

The existing welcome screen gains a third entry alongside *"Stwórz nowy wzór"* and *"Otwórz z dysku"*: **"Wybierz kształt"** opens a chooser:

- ▦ Prostokątny — opens the current grid editor (unchanged).
- ⬡ Radialny — opens the new graph editor seeded with a magic ring.
- ✎ Freeform — opens the graph editor with an empty canvas.

After creation, the user can switch shapes from the top toolbar without losing data. Switching from rectangular → radial keeps stitches and edges; the layout switches from `linear` to `radial`. The reverse direction warns if non-grid geometry would be lost.

### 5.2 Graph editor workspace (3 columns)

A mockup is in `.superpowers/brainstorm/124111-1778532308/content/editor-workspace.html`. The layout:

| Column | Width | Contents |
|---|---|---|
| Left | 120 px | Palette: built-in stitches, custom stitches (with `+` to define), photo/note tools, color swatches. |
| Center | flex | ReactFlow canvas with vintage paper background, dashed round indicators, magic ring at center, panning + zoom + minimap. |
| Right | 200 px | Inspector for the selected node: type, color, round, anchor info, yarn flow neighbors, attached photos, note, validator hints. |

A top toolbar carries mode switch (Rect / Radial / Freeform), Play-yarn-path, Photos manager, Auto-instructions preview, Export PDF. A bottom status bar shows stitch / edge / round counts and auto-save timestamp.

### 5.3 Interactions

- **Drag from palette → drop on canvas**: creates a new stitch node. If dropped *on* an existing node, an `anchor` edge is created automatically with the target as anchor.
- **Drag from one node's handle → another node's handle**: explicit `anchor` edge by default; with `Shift` held, creates a `yarn_flow` edge instead; with `Alt` held, creates a `join`.
- **Click on a node**: selects, fills the inspector, applies a vintage orange highlight stroke.
- **Hover a node**: educational tooltip appears (e.g. *"gr_st = 3 × dc into the same anchor"*); all stitches anchored *into* the hovered node receive a subtle peach background to teach the 1-to-many relation.
- **Hover the "Play yarn path" toolbar button**: an animated dashed green line traces yarn flow from start to current end at ~5 stitches/sec; clickable to pause/scrub. This is the "GPS for crochet" mode and the strongest educational affordance.
- **Right-click a node**: context menu (Add photo, Add note, Convert to custom stitch, Delete with cascade, Duplicate round).
- **Shift+R**: adds a new round modelled after the previous (handy for radial — adds 6 corners + sides matching the prior structure).

### 5.4 Auto-layout

Layout is recomputed when:

- The user opens a pattern that lacks `position` data.
- The user toggles "Re-layout" in the toolbar.
- The shape mode changes.

Algorithms:

- **Radial**: place magic ring at origin; place each round N stitches on a circle of radius `R * N` (where R is the configurable round spacing); evenly distribute around the circle by yarn-flow order; corners on hexagonal patterns snap to 60° increments.
- **Linear**: rows stacked vertically, stitches per row by yarn-flow order, alternating row direction matches turn metadata.
- **Freeform**: Dagre layered layout as a starting point; user is expected to nudge.

Manual `position` overrides are preserved; auto-layout only fills in nulls unless the user explicitly chooses "Re-layout all".

### 5.5 The educational layer (D8)

The educational layer is a cross-cutting concern, not a single module. Concrete behaviours:

1. **Hover highlight** — described above.
2. **Yarn path animation** — described above. Implementation: `instructions/walk.ts` emits the yarn-flow sequence as an array of `StitchId`; canvas overlay animates a dashed path through their positions at a configurable speed.
3. **Auto-instruction panel** — opens on demand from the toolbar as a side panel; renders the human-readable text generated from the graph. Reading the prose is the user's manual cross-check against the diagram they built. Updates live as the graph changes.
4. **Validator** — `domain/validation/graph.ts` runs every store update; surfaces inline warnings (orange dot) on offending nodes; lists all issues in the inspector when one is selected. Export-to-PDF is disabled while critical issues exist.
5. **Contextual tooltips** — `domain/stitches/glossary.ts` keys stitch type → short pl/en explanation; rendered on hover throughout the UI.
6. **First-run tutorial overlay** — a guided 6-step tour the first time the radial editor opens: place a magic ring, drag a `gr_st` onto it (see the fishbone appear), connect another, see the yarn flow form a ring, attach a photo, export a preview. Skippable. Replays available from the help menu.

---

## 6. Chart rendering

### 6.1 Pipeline

```
Pattern  →  layout (positions)  →  SymbolLibrary mapping  →  base SVG paths
                                                                    │
                                                                    ▼
                                                         Rough.js wobble pass
                                                                    │
                                                                    ▼
                                                       themed colors + strokes
                                                                    │
                                                                    ▼
                                              Final SVG for screen + PDF embed
```

### 6.2 Symbol library

Built-in symbols come from the existing `domain/symbolLibrary.ts` (already ~50 symbols across crochet, knitting, cross-stitch, embroidery, geometry, decorative motifs). For the PDF legend and chart we add a mapping table that picks a *vintage-aesthetic* variant for each crochet type:

| Type | Symbol | Notes |
|---|---|---|
| `sc` | `×` | Single-stroke cross. |
| `hdc` | `Ŧ` | Crossed-T variant. |
| `dc` | `⊤` (T) | Vertical with top crossbar. |
| `tr` | `⊤` with two bars | Two crossbars. |
| `sl_st` | `•` | Filled dot. |
| `ch` | `∞` or `8` | Hand-drawn chain glyph; Rough.js gives the wobble. |
| `gr_st` | three radiating `⊤`s | Rendered as a fishbone group, *not* a single symbol — the three child `dc` stitches are drawn individually and the cluster is the visual gestalt. |
| `magic_ring` | small spiral | SVG arc. |
| `fasten_off` | `↗` | Arrow off-piece. |
| custom | user-defined SVG path or preset id | See §7. |

### 6.3 Hand-drawn wobble (Rough.js)

Rough.js options are tuned once in `chart/roughen.ts`:

```ts
const ROUGHNESS = 1.2        // 0 = clean, 4 = very sketchy
const BOWING    = 0.8        // line bowing factor
const SEED      = stitchId   // deterministic per stitch — same pattern renders the same every time
```

Determinism by `stitchId` matters: regenerating the PDF must produce a visually identical result so customers cannot tell two purchased copies apart by accident.

### 6.4 Round indicators

Light dashed concentric circles per round are rendered behind the stitches in the chart preview *but stripped out* of the PDF export (Caroline's reference does not show them). A user toggle in the inspector controls this.

---

## 7. Custom stitches (mom's "twist")

A custom stitch is, in effect, a named macro: a symbol + short letter code + (optionally) a sub-graph of how it expands.

**Creation flow**:

1. User clicks `+ custom` in the palette.
2. Modal opens: pick a symbol (from library), pick or type a 1–3 letter shortcode, type a Polish + English short name, optional description.
3. Optionally enter the "sub-graph" tab and visually compose what the stitch *is* in primitive terms (e.g., "podwójne przewinięcie" = `ch` + `sc` + `pull-through` macro), or leave it as opaque if mom doesn't want to commit to a definition.
4. Stitch appears in the palette and can be used immediately in the canvas.

**Storage**: lives inside the pattern under `customStitches`. Patterns are portable: opening someone else's `.wzor` on a different computer brings the custom stitches with it. A global "stitch library" (cross-document) is a v2 enhancement.

**Rendering in chart**: drawn as the chosen symbol with Rough.js wobble; sub-graph definition is *not* expanded in the chart — the symbol is the visual representation, mirroring how `gr_st` is drawn as a fishbone group conceptually but as one named entity.

**Rendering in PDF legend**: a row per used custom stitch — symbol, shortcode, name in both languages, optional description, and (if the user provides it) one of the attached photos.

---

## 8. Photos and media

### 8.1 Where photos appear

- **Editor**: thumbnails in inspector when a node is selected; mini-overlay badge on canvas when a node has photos.
- **PDF pattern page**: instructions for round N can include any photos attached to stitches in round N, arranged as `instruction text` + `photo grid` (1–4 photos per row depending on count).
- **PDF custom stitch legend**: one photo per custom stitch.
- **PDF title page**: hero photo (the finished garment) — selected separately from the per-stitch attachments.

### 8.2 Upload flow

- Drag-and-drop onto canvas / inspector / PDF section.
- File-picker via `@tauri-apps/plugin-dialog`.
- Sources: local files (jpg, png, webp, heic via conversion).
- On import: Tauri sidecar resizes to two variants — `print` (max 3000 px long edge, 90 % quality JPEG, ~300 DPI at A4) and `preview` (max 800 px long edge, 80 % quality, for the live editor / PDF preview).
- Both variants are kept; only the active one is loaded into memory for the editor; print is loaded only when exporting.

### 8.3 Captions

Each photo has optional `pl` / `en` captions. The default heuristic is: when attached to a stitch, suggest the stitch's localized name as a starting caption.

---

## 9. PDF generation

### 9.1 Document model

Implemented with `@react-pdf/renderer`. The PDF is a `<Document>` of `<Page>` elements in A4 portrait. Pages are composed from the enabled `PdfSectionConfig` entries, in this default order:

1. **Title** — hand-style display title from `meta.title`, hero photo (if provided), author byline, year.
2. **Thanks** — copyright statement (template + customizations), social tag, contact, brand URL.
3. **Information** — yarn block, hook, gauge, abbreviations table (auto from used stitch types), inline symbol legend.
4. **Pattern** — round-by-round instructions auto-generated from the graph + the radial chart figure + inline photos for relevant steps.
5. **Customization** — garment template SVG + measurement annotations + body-specific math text.
6. **Legend** — full table of custom stitches used: symbol, shortcode, name, description, photo.
7. **Finishing** (optional in MVP) — free-text section the user writes.

### 9.2 Vintage theme tokens

```ts
export const pdfTheme = {
  fonts: {
    display: 'Cormorant Garamond',   // headlines
    body:    'Georgia',              // body text
    accent:  'Cormorant Garamond Italic'
  },
  colors: {
    paper:    '#f7f3e8',
    ink:      '#3a2f1d',
    inkSoft:  '#5a4730',
    rule:     '#b8a87a',
    accent:   '#d4831a',
    yarnSeam: '#a89466'
  },
  spacing: {
    page:    32,
    section: 24,
    rule:    16
  },
  rules: {
    thin:  0.5,
    thick: 1.0
  }
}
```

Fonts are bundled with the app (Cormorant Garamond is OFL-licensed; Georgia is system-available on all Tauri-supported OSes — we still ship a fallback). The exact same theme is consumed by the on-screen chart preview, so what you see is what you get.

### 9.3 Layout primitives

Repeated visual elements live in `pdf/components/`:

- **`<Heading kind="display">`** — large display heading with the optional underline rule beneath (matches Caroline's `THANKS`, `INFORMATION`, etc.).
- **`<RuleOrnament>`** — short centered horizontal rule, used as section separator.
- **`<AbbreviationsTable>`** — two-column list of abbreviation → expansion, auto-populated from the stitches present in the pattern plus all `customStitches`.
- **`<DiagramFigure>`** — SVG embed of the radial chart, with a caption and the page-margin discipline matching the reference.
- **`<PhotoFigure>`** — photo + caption, 1-up or grid.

### 9.4 Live preview

A `PdfPreviewView` opens in a tab next to the editor. It renders the same `<Document>` via react-pdf's `<PDFViewer>` in development; in production we render to a blob and display an embedded preview. The preview updates on every commit to the pattern store (debounced by 750 ms).

### 9.5 Export

The Export PDF action:

1. Runs the validator. Blocks if there are critical issues.
2. Generates the radial chart SVG via `chart/`.
3. Asks Rust sidecar for `print`-variant photos.
4. Renders the `<Document>` to a Blob.
5. Uses `@tauri-apps/plugin-dialog` to ask for a save path.
6. Saves the file via `@tauri-apps/plugin-fs`.
7. Surfaces success toast + an "Open folder" affordance.

### 9.6 Language handling

`meta.language` controls which text the PDF uses:

- `pl` — all auto-generated text in Polish. Symbols and abbreviations use Polish conventions if available; otherwise US abbreviations with a Polish translation.
- `en` — US conventions throughout (matches the Etsy default audience).
- `pl-en` — bilingual: Polish primary, English in italic below each instruction line.

Mom's market is largely European; the `pl-en` mode is the default suggestion for Etsy listings.

---

## 10. Customization page (garment templates)

### 10.1 Template library

Four templates in MVP, stored as hand-drawn-style SVGs in `garment/templates/`:

| Template | Description |
|---|---|
| Hexagon shirt | Two hexagons joined at shoulders, sleeves wrapping around — matches the reference garment. |
| Rectangle sweater | Boxy crop with sleeves stitched on — most common starter pattern. |
| Beanie | Crown + body cylinder. |
| Blanket | Plain rectangle — measurement points are length/width corners. |

Each template ships with **anchor points** (named positions on the SVG, like `chest_front`, `armhole`, `sleeve_length`).

### 10.2 Measurement overlay editor

A simple UI: user picks a template; the SVG renders in a paper-textured frame; mom drags numbered labels (1, 2, 3...) onto anchor points; for each label, she enters the measurement formula in plain text (e.g., *"chest measurement (cm) / 2 − 8 / 2"*).

The PDF customization page renders: template SVG + labelled points + a side panel of the formulas, mimicking the reference page 5.

### 10.3 Why not auto-construct?

Auto-constructing the 3D-style isometric from the actual stitch graph is a research-grade task: you'd have to compute how the radial pattern lies on a 3D body, infer joins between pieces, project the result. Out of scope for MVP. The template library covers >80 % of mom's catalog while keeping the work tractable.

---

## 11. Internationalization

Existing `i18next` is reused for the UI. Two new locales:

- `pl` (default).
- `en`.

PDF text uses the same translation files (under a `pdf.*` namespace), keeping the UI and the document linguistically consistent.

Auto-instructions generation uses small per-language templates in `instructions/formatPL.ts` and `instructions/formatEN.ts`. These templates are *intentionally not* using `i18next` because they need positional formatting (counts, parens, units) that's awkward through `t()` keys.

---

## 12. Performance considerations

### 12.1 Hotspots

- **Graph traversal** on every edit. Cached: an in-memory `yarnFlowSequence: StitchId[]` and `anchorChildren: Map<StitchId, StitchId[]>` are rebuilt only on structural changes (additions / removals / edge changes), not on cosmetic ones (color, position).
- **Auto-layout** for >500 stitches: the radial layout is O(n) and is fine; force-directed for freeform is O(n²) per iteration — capped at 200 iterations, with a "Stop" button surfaced for very large patterns.
- **react-pdf rendering**: each page is independent and can be parallelized; we render in a Web Worker to avoid blocking the main thread.
- **Rough.js**: deterministic but not free. The chart is cached and only recomputed when the diagram's underlying SVG changes.

### 12.2 Memory

- Photos load `preview` variant by default. `print` variant is loaded lazily on PDF export only.
- A pattern with 1000 stitches and 30 photos at preview resolution lives comfortably under 250 MB.

---

## 13. Testing strategy

Follows project rules (`rules/common/testing.md`, 80 % coverage):

### 13.1 Unit (Vitest)

- `domain/graph/walk.ts` — yarn-flow traversal, anchor traversal, round grouping.
- `domain/graph/build.ts` — constructors produce valid graphs.
- `domain/validation/graph.ts` — every invariant has positive and negative cases.
- `layout/radial.ts` — hexagonal coordinate math, deterministic positions.
- `chart/renderRadial.tsx` — snapshot tests on SVG output for fixed seeds.
- `instructions/generate.ts` — known patterns produce expected prose strings (PL + EN).
- `pdf/pages/*.tsx` — snapshot tests on the rendered react-pdf tree.
- `domain/graph/schema.ts` — v2→v3 migration round-trips losslessly for all `examples/*.wzor`.

### 13.2 Integration

- Loading an `examples/*.wzor` file → opening in editor → exporting to PDF → resulting PDF has all expected pages and no validator errors.
- Creating a hexagon from scratch via store API → migrating → reopening produces an identical graph.

### 13.3 E2E (Playwright on the Tauri preview)

Two critical journeys:

1. **Build-and-export a hexagon**: open new radial pattern → drag 6 `gr_st` onto magic ring → connect yarn flow → add one custom stitch → upload one photo → export PDF. Verify the PDF opens and contains the expected page structure (probed via `pdf-parse`).
2. **Migrate v2 file**: open `examples/granny-square.wzor` (v2) → tool prompts migration → file saves as v3 → reopen → no data loss.

### 13.4 Visual regression

Chart and PDF page renders are sensitive to look. We snapshot SVGs and the rendered first-page PNG of the PDF and compare with a tolerance threshold (`pixelmatch` at 0.1 % mismatch). Snapshots are committed and updated only when the change is intentional.

---

## 14. Phased roadmap

The 5–8 week MVP is broken into four phases. Each phase ends in a usable state.

### Phase 1 — Foundations (≈1.5 weeks)

- Multigraph types + Zod schema + v2→v3 migration with full test coverage.
- Validator with all invariants.
- `graph/walk.ts`, `graph/build.ts`, basic round grouping.
- Persisting v3 documents alongside v2.
- No UI changes yet — existing rectangular editor continues to work.

**Demo:** load any existing `.wzor`, see it migrate to v3, save it back, reload it. Inspector tab shows the underlying graph as a JSON tree.

### Phase 2 — Editor (≈2 weeks)

- ReactFlow integration with the 3-column layout.
- Custom node and edge components.
- Palette + drag-and-drop creation.
- Inspector with selection details + validator badges.
- Auto-layout for radial and linear.
- Mode switcher (Rect / Radial / Freeform) at the top.
- Custom stitch creation modal.

**Demo:** build a hexagonal granny square in the editor from scratch, save, reopen.

### Phase 3 — Chart + PDF + Photos (≈2 weeks)

- Chart SVG renderer with Rough.js theme.
- Photo upload + Tauri sidecar resize + caption editor.
- react-pdf scaffolding with vintage theme tokens.
- All six PDF pages (Title, Thanks, Information, Pattern, Customization, Legend).
- Auto-instructions generator (PL + EN + bilingual).
- Live preview pane.
- Export to disk via Tauri.

**Demo:** open the hexagon pattern, attach two photos to two stitches, export a four-page PDF that looks like a Caroline-style pattern in vintage palette.

### Phase 4 — Educational layer + polish (≈1–1.5 weeks)

- Hover-highlight of anchored children.
- Yarn path animation overlay.
- Contextual tooltips and glossary.
- First-run tutorial overlay.
- Garment template library + measurement overlay editor.
- Customization page in PDF using the template.
- Final accessibility/contrast pass on PDF and editor.

**Demo:** a user who has never used the tool follows the tutorial, builds and exports a pattern, the tutorial closes, they then build a second pattern unaided.

### Phase 5 — Hardening (≈0.5–1 week)

- Performance tuning for 500+ stitch patterns.
- Bundle size review.
- 80 % coverage target met across all new modules.
- Visual regression baselines committed.
- README + LLM_PATTERN_GUIDE updates.
- Release notes for v0.3.0.

**Demo:** open ten reference `.wzor` fixtures, build PDF for each in batch, all pass CI.

### What we explicitly do not build in MVP

| Deferred | Reason |
|---|---|
| Auto-isometric garment construction | Research-grade. Templates cover 80 %. |
| LLM-driven generation from prose | Worth doing once data model is stable. |
| Cross-document custom stitch library | Useful once mom has many patterns. |
| Knitting / Tunisian / non-crochet | Different graph semantics. |
| Cloud sync / multi-user | Not requested. |
| Mobile (Tauri mobile) | Not requested. |
| AI photo enhancement | Not requested. |

---

## 15. Risks and open questions

### 15.1 Risks

| Risk | Mitigation |
|---|---|
| Rough.js wobble looks gimmicky at small sizes (legend symbols). | Apply roughness lower in legend; tune per-context. Visual-regression tests catch drift. |
| react-pdf font rendering differs from screen, breaks layout. | Bundle Cormorant Garamond; pin react-pdf version; run the Phase 3 demo on real hardware before committing the theme tokens. |
| Mom's "podwójne przewinięcie" doesn't decompose cleanly into a sub-graph. | The sub-graph field is optional. The custom-stitch symbol is enough on its own; sub-graph is for future LLM use. |
| ReactFlow performance with large patterns (1000+ nodes). | Benchmark in Phase 2 with a synthetic 1000- and 2000-stitch fixture. If frame time exceeds 16 ms, ship a "render simplification" mode that hides edge markers, animation, and tooltips above a configurable threshold. |
| Migration of v2 grids with custom turn metadata loses subtle yarn-flow information. | Keep `legacyGrid` shadow for one release; provide a "revert to v2" escape hatch. |
| Garment templates feel limiting. | Ship 4 in MVP; structure the template format as user-editable SVG with named anchor points so power users can author their own. |
| PDF file sizes balloon when many photos are embedded inline. | Default to print/preview split; warn at 25 MB; offer external photo refs. |
| Vintage palette + Rough.js combined looks "AI-art generic". | Pick concrete typography (Cormorant Garamond + Georgia) and stick with it; run two real test patterns through the pipeline before locking. |

### 15.2 Open questions for follow-up

These do not block writing the implementation plan, but should be settled before Phase 3 ships:

- **Photo storage default**: inline base64 (portable but bloated) vs external paths (lean but fragile). Recommendation: inline default, switch to external when file >25 MB. Confirm with user once they have one real pattern in hand.
- **Language default in PDF**: `pl` or `pl-en`. Recommendation: `pl-en` since Etsy market is international. Confirm.
- **Hero photo aspect ratio enforcement**: 4:5 portrait like Caroline's, or freeform. Recommendation: suggest 4:5 but allow any. Confirm.
- **Print bleed / margin policy**: A4 with 18 mm margins everywhere matches the reference. Confirm before locking PDF page template.

---

## 16. Glossary

- **anchor** — the stitch (or chain-space, or magic ring) into which a new stitch is worked. Every stitch has one (joins layer extras on top).
- **chain space (`ch-sp`)** — the gap created by one or more `ch` stitches. Anchoring into a ch-sp is common in granny stitches.
- **fishbone** — the visual cluster of three radiating stitches that a `gr_st` produces; named after the way the three child `dc` stitches appear in the chart.
- **granny stitch (`gr_st`)** — three `dc` stitches worked into the same anchor.
- **magic ring** — an adjustable starting loop used as the central anchor for radial patterns.
- **multigraph** — a graph where multiple edges of different kinds can exist between the same two nodes; the data model used here for stitches and their three relationship kinds.
- **schemaVersion** — the integer in `.wzor` files indicating the data-model version; bumps from 2 to 3 in this work.
- **yarn flow** — the linear sequence of stitches in the order they are worked.

---

## 17. Document health

- All sections have concrete content; no `TBD` markers.
- Sections 1–4 (motivation, decisions, architecture, data model) are upstream of everything else and are deliberately the most detailed.
- Sections 5–11 (UX, chart, PDF, customization, i18n, photos, custom stitches) are mid-detail — implementation plan will fill in the rest.
- Sections 12–15 (perf, testing, roadmap, risks) are scoped at "decision-grade", not "ticket-grade".
- This spec assumes the implementation plan (next step, via `writing-plans`) will derive tickets, files, and ordering.
