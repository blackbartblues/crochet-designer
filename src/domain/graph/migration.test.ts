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
    const colorId = createEmptyPattern('x', 3).colors[0]!.id;
    const v2: PatternV2 = {
      ...createEmptyPattern('Multi', 3),
      rows: [
        {
          id: 'r0',
          direction: 'rtl',
          cells: [
            { stitch: 'sc', colorId },
            { stitch: 'sc', colorId },
            null,
          ],
        },
        {
          id: 'r1',
          direction: 'ltr',
          cells: [
            { stitch: 'dc', colorId },
            { stitch: 'dc', colorId },
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
