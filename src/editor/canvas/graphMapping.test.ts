import { describe, it, expect } from 'vitest';
import { patternToReactFlow } from './graphMapping';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from '../../domain/graph/build';
import type { Pattern } from '../../domain/graph/types';

function withMagicRingAndChild(): Pattern {
  const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' }, { position: { x: 0, y: 0 } });
  const sc = newStitch({ kind: 'builtin', type: 'sc' }, { position: { x: 50, y: -50 } });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, sc],
    edges: [
      newAnchorEdge(sc.id, { kind: 'stitch', id: ring.id }),
      newYarnFlowEdge(ring.id, sc.id),
    ],
  };
}

describe('patternToReactFlow', () => {
  it('returns empty arrays for empty pattern', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const { nodes, edges } = patternToReactFlow(p);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('maps stitches to ReactFlow nodes with positions', () => {
    const p = withMagicRingAndChild();
    const { nodes } = patternToReactFlow(p);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.position).toEqual({ x: 0, y: 0 });
    expect(nodes[0]!.type).toBe('stitch');
  });

  it('maps anchor edges with type "anchor"', () => {
    const p = withMagicRingAndChild();
    const { edges } = patternToReactFlow(p);
    const anchorEdge = edges.find((e) => e.type === 'anchor');
    expect(anchorEdge).toBeDefined();
  });

  it('maps yarn_flow edges with type "yarn_flow"', () => {
    const p = withMagicRingAndChild();
    const { edges } = patternToReactFlow(p);
    const yarnEdge = edges.find((e) => e.type === 'yarn_flow');
    expect(yarnEdge).toBeDefined();
  });

  it('skips anchor edges to magic_ring (no stitch source to connect to)', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const a = newStitch({ kind: 'builtin', type: 'sc' }, { position: { x: 0, y: 0 } });
    const populated: Pattern = {
      ...p,
      shape: 'radial',
      stitches: [a],
      edges: [newAnchorEdge(a.id, { kind: 'magic_ring' })],
    };
    const { edges } = patternToReactFlow(populated);
    expect(edges).toEqual([]);
  });
});
