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
