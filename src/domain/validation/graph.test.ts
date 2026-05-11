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
