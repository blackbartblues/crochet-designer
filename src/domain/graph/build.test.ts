import { describe, it, expect } from 'vitest';
import {
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
  newJoinEdge,
  emptyPatternV3,
} from './build';

describe('graph/build', () => {
  it('newStitch produces a unique id and the requested type', () => {
    const a = newStitch({ kind: 'builtin', type: 'dc' });
    const b = newStitch({ kind: 'builtin', type: 'dc' });

    expect(a.id).not.toBe(b.id);
    expect(a.typeRef).toEqual({ kind: 'builtin', type: 'dc' });
    expect(a.position).toBeUndefined();
    expect(a.colorRef).toBeUndefined();
  });

  it('newStitch accepts overrides', () => {
    const s = newStitch(
      { kind: 'custom', id: 'custom-1' },
      { colorRef: 'color-1', round: 2, position: { x: 10, y: 20 } },
    );

    expect(s.typeRef).toEqual({ kind: 'custom', id: 'custom-1' });
    expect(s.colorRef).toBe('color-1');
    expect(s.round).toBe(2);
    expect(s.position).toEqual({ x: 10, y: 20 });
  });

  it('newAnchorEdge builds a typed anchor edge', () => {
    const e = newAnchorEdge('stitch-1', { kind: 'magic_ring' });
    expect(e.kind).toBe('anchor');
    expect(e.from).toBe('stitch-1');
    expect(e.to).toEqual({ kind: 'magic_ring' });
    expect(typeof e.id).toBe('string');
  });

  it('newYarnFlowEdge builds a typed yarn_flow edge', () => {
    const e = newYarnFlowEdge('stitch-1', 'stitch-2');
    expect(e.kind).toBe('yarn_flow');
    expect(e.from).toBe('stitch-1');
    expect(e.to).toBe('stitch-2');
  });

  it('newJoinEdge builds a typed join edge', () => {
    const e = newJoinEdge('joiner', ['target-a', 'target-b']);
    expect(e.kind).toBe('join');
    expect(e.stitch).toBe('joiner');
    expect(e.targets).toEqual(['target-a', 'target-b']);
  });

  it('emptyPatternV3 produces a valid empty pattern with required defaults', () => {
    const p = emptyPatternV3({
      title: { pl: 'Wzór', en: 'Pattern' },
      author: 'Mama',
    });

    expect(p.schemaVersion).toBe(3);
    expect(p.shape).toBe('rectangular');
    expect(p.stitches).toEqual([]);
    expect(p.edges).toEqual([]);
    expect(p.rounds).toEqual([]);
    expect(p.colors.length).toBeGreaterThanOrEqual(1);
    expect(p.meta.author).toBe('Mama');
    expect(p.meta.language).toBe('pl');
    expect(p.pdfSections.length).toBeGreaterThan(0);
  });
});
