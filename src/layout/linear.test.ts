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
    expect(layout.get(p.stitches[0]!.id)!.y).toEqual(0);
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
