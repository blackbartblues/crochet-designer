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
    expect(seq[seq.length - 1]).toBe(p.stitches[3]!.id); // last sc
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
