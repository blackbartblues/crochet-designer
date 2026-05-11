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

      // For first row, anchor to magic_ring. For subsequent rows, anchor to cell beneath.
      if (r === 0) {
        edges.push(newAnchorEdge(id, { kind: 'magic_ring' }));
      } else {
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

    const thisRowStitches = orderThis
      .map((c) => cellMap[r]?.[c])
      .filter((id): id is StitchId => !!id);

    const nextRowStitches = orderNext
      .map((c) => cellMap[r + 1]?.[c])
      .filter((id): id is StitchId => !!id);

    const lastThis = thisRowStitches.length > 0 ? thisRowStitches[thisRowStitches.length - 1] : null;
    const firstNext = nextRowStitches.length > 0 ? nextRowStitches[0] : null;

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
