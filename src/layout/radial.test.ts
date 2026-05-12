import { describe, it, expect } from 'vitest';
import { computeRadialLayout, RADIAL_RING_SPACING } from './radial';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function ringPattern(ringSize: number): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
  const stitches = [ring];
  const edges = [];
  let prev = ring.id;
  for (let i = 0; i < ringSize; i++) {
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 1 });
    stitches.push(s);
    edges.push(newAnchorEdge(s.id, { kind: 'magic_ring' }));
    edges.push(newYarnFlowEdge(prev, s.id));
    prev = s.id;
  }
  return { ...p, shape: 'radial', stitches, edges };
}

describe('computeRadialLayout', () => {
  it('returns an empty map for an empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const layout = computeRadialLayout(p);
    expect(layout.size).toBe(0);
  });

  it('places the magic_ring at the origin', () => {
    const p = ringPattern(3);
    const layout = computeRadialLayout(p);
    const ringId = p.stitches[0]!.id;
    expect(layout.get(ringId)).toEqual({ x: 0, y: 0 });
  });

  it('places round 1 stitches on a circle of radius RADIAL_RING_SPACING', () => {
    const p = ringPattern(6);
    const layout = computeRadialLayout(p);
    for (let i = 1; i <= 6; i++) {
      const pos = layout.get(p.stitches[i]!.id);
      expect(pos).toBeDefined();
      const r = Math.sqrt(pos!.x ** 2 + pos!.y ** 2);
      expect(r).toBeCloseTo(RADIAL_RING_SPACING, 3);
    }
  });

  it('distributes round N stitches evenly around the circle', () => {
    const p = ringPattern(4);
    const layout = computeRadialLayout(p);
    const angles = [1, 2, 3, 4]
      .map((i) => layout.get(p.stitches[i]!.id)!)
      .map((pos) => Math.atan2(pos.y, pos.x));
    for (let i = 0; i < angles.length - 1; i++) {
      const diff = (angles[i + 1]! - angles[i]! + 2 * Math.PI) % (2 * Math.PI);
      expect(diff).toBeCloseTo(Math.PI / 2, 3);
    }
  });

  it('expands outward — round 2 radius > round 1 radius', () => {
    const p = ringPattern(3);
    const extra = newStitch({ kind: 'builtin', type: 'sc' }, { round: 2 });
    const r2: Pattern = {
      ...p,
      stitches: [...p.stitches, extra],
      edges: [
        ...p.edges,
        newAnchorEdge(extra.id, { kind: 'stitch', id: p.stitches[1]!.id }),
      ],
    };
    const layout = computeRadialLayout(r2);
    const r1pos = layout.get(p.stitches[1]!.id)!;
    const r2pos = layout.get(extra.id)!;
    const r1 = Math.sqrt(r1pos.x ** 2 + r1pos.y ** 2);
    const r2dist = Math.sqrt(r2pos.x ** 2 + r2pos.y ** 2);
    expect(r2dist).toBeGreaterThan(r1);
  });
});
