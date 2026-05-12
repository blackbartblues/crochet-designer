import { describe, it, expect } from 'vitest';
import { applyLayout } from './applyLayout';
import { emptyPatternV3, newStitch } from '../domain/graph/build';
import type { Pattern } from '../domain/graph/types';

describe('applyLayout', () => {
  it('returns a new pattern with positions filled in (radial)', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'magic_ring' }, { round: 0 });
    const populated: Pattern = { ...p, stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
    expect(populated.stitches[0]!.position).toBeUndefined(); // input unchanged
  });

  it('uses linear layout when shape is rectangular', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch({ kind: 'builtin', type: 'sc' }, { round: 0 });
    const populated: Pattern = { ...p, shape: 'rectangular', stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
  });

  it('preserves existing positions when option keepExisting is set', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch(
      { kind: 'builtin', type: 'sc' },
      { round: 0, position: { x: 999, y: 999 } },
    );
    const populated: Pattern = { ...p, shape: 'radial', stitches: [s] };
    const out = applyLayout(populated, { keepExisting: true });
    expect(out.stitches[0]!.position).toEqual({ x: 999, y: 999 });
  });

  it('overrides existing positions when keepExisting is false (default)', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const s = newStitch(
      { kind: 'builtin', type: 'magic_ring' },
      { round: 0, position: { x: 999, y: 999 } },
    );
    const populated: Pattern = { ...p, shape: 'radial', stitches: [s] };
    const out = applyLayout(populated);
    expect(out.stitches[0]!.position).toEqual({ x: 0, y: 0 });
  });
});
