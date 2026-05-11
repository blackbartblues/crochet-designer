import { describe, it, expect } from 'vitest';
import {
  patternSchemaV3,
  serializePatternV3,
  parsePatternV3Raw,
} from './schema';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
  newYarnFlowEdge,
} from './build';
import type { Pattern } from './types';

function tiny(): Pattern {
  const p = emptyPatternV3({
    title: { pl: 'T', en: 'T' },
    author: 'a',
  });
  const ring = newStitch({ kind: 'builtin', type: 'magic_ring' });
  const sc = newStitch({ kind: 'builtin', type: 'sc' });
  return {
    ...p,
    shape: 'radial',
    stitches: [ring, sc],
    edges: [
      newAnchorEdge(sc.id, { kind: 'magic_ring' }),
      newYarnFlowEdge(ring.id, sc.id),
    ],
  };
}

describe('graph/schema', () => {
  it('accepts a freshly built empty v3 pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'a', en: 'b' }, author: 'x' });
    expect(patternSchemaV3.safeParse(p).success).toBe(true);
  });

  it('round-trips a small graph through serialize and parse', () => {
    const original = tiny();
    const json = serializePatternV3(original);
    const restored = parsePatternV3Raw(JSON.parse(json));
    expect(restored).toEqual(original);
  });

  it('rejects schemaVersion !== 3', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = { ...p, schemaVersion: 2 };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });

  it('rejects an edge with an invalid discriminator', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = {
      ...p,
      edges: [{ id: 'e', kind: 'mystery', from: 'x', to: 'y' }],
    };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });

  it('rejects a stitch with an invalid builtin type', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const broken = {
      ...p,
      stitches: [{ id: 's', typeRef: { kind: 'builtin', type: 'bogus' } }],
    };
    expect(patternSchemaV3.safeParse(broken).success).toBe(false);
  });
});
