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
