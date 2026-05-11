import { describe, it, expect } from 'vitest';
import { decideEdgeKind, validateConnection } from './connectEdge';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../../domain/graph/build';
import type { Pattern } from '../../domain/graph/types';

describe('decideEdgeKind', () => {
  it('returns "yarn_flow" when shift is held', () => {
    expect(decideEdgeKind({ shift: true })).toBe('yarn_flow');
  });

  it('returns "join" when alt is held', () => {
    expect(decideEdgeKind({ alt: true })).toBe('join');
  });

  it('returns "anchor" by default', () => {
    expect(decideEdgeKind({})).toBe('anchor');
    expect(decideEdgeKind({ shift: false, alt: false })).toBe('anchor');
  });

  it('prefers shift over alt when both are pressed', () => {
    expect(decideEdgeKind({ shift: true, alt: true })).toBe('yarn_flow');
  });
});

describe('validateConnection', () => {
  function withTwoStitches(): { pattern: Pattern; a: string; b: string } {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    return { pattern: { ...p, stitches: [a, b] }, a: a.id, b: b.id };
  }

  it('accepts a valid anchor connection', () => {
    const { pattern, a, b } = withTwoStitches();
    const r = validateConnection({ pattern, source: a, target: b, kind: 'anchor' });
    expect(r.kind).toBe('ok');
  });

  it('rejects self-connection', () => {
    const { pattern, a } = withTwoStitches();
    const r = validateConnection({ pattern, source: a, target: a, kind: 'anchor' });
    expect(r.kind).toBe('error');
  });

  it('rejects a duplicate anchor edge', () => {
    const { pattern, a, b } = withTwoStitches();
    const populated: Pattern = {
      ...pattern,
      edges: [newAnchorEdge(b, { kind: 'stitch', id: a })],
    };
    const r = validateConnection({ pattern: populated, source: a, target: b, kind: 'anchor' });
    expect(r.kind).toBe('error');
  });

  it('rejects yarn_flow that would create a cycle', () => {
    const { pattern, a, b } = withTwoStitches();
    const populated: Pattern = {
      ...pattern,
      edges: [newYarnFlowEdge(a, b)],
    };
    const r = validateConnection({ pattern: populated, source: b, target: a, kind: 'yarn_flow' });
    expect(r.kind).toBe('error');
  });
});
