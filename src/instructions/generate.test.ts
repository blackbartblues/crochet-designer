import { describe, it, expect } from 'vitest';
import { generateInstructions } from './generate';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

function magicRingRound1(stitchType: 'sc' | 'dc' = 'sc', count = 6): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
  const stitches = [ring];
  const edges = [];
  for (let i = 0; i < count; i++) {
    const s = newStitch({ kind: 'builtin', type: stitchType }, { round: 1 });
    stitches.push(s);
    edges.push(newAnchorEdge(s.id, { kind: 'magic_ring' }));
  }
  return { ...p, shape: 'radial', stitches, edges };
}

describe('generateInstructions', () => {
  it('returns one entry per non-zero round', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out).toHaveLength(2);
  });

  it('round 0 (magic_ring) reads as start-of-pattern', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out[0]!.round).toBe(0);
    expect(out[0]!.textEn.toLowerCase()).toContain('magic ring');
  });

  it('round 1 reports the stitch count', () => {
    const p = magicRingRound1('sc', 6);
    const out = generateInstructions(p);
    expect(out[1]!.stitchCount).toBe(6);
    expect(out[1]!.textEn).toContain('6');
  });

  it('groups consecutive same-type stitches', () => {
    const p = magicRingRound1('dc', 12);
    const out = generateInstructions(p);
    expect(out[1]!.textEn.toLowerCase()).toContain('dc');
    expect(out[1]!.textEn).toContain('12');
  });

  it('returns empty array for empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    expect(generateInstructions(p)).toEqual([]);
  });
});
