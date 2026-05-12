import { describe, it, expect, beforeEach } from 'vitest';
import { usePatternGraphStore } from './patternGraphStore';
import {
  emptyPatternV3,
  newStitch,
  newAnchorEdge,
} from '../domain/graph/build';

describe('patternGraphStore', () => {
  beforeEach(() => {
    usePatternGraphStore.getState().reset();
  });

  it('starts with null pattern and no selection', () => {
    const s = usePatternGraphStore.getState();
    expect(s.pattern).toBeNull();
    expect(s.selectedStitchId).toBeNull();
  });

  it('setPattern stores a pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    expect(usePatternGraphStore.getState().pattern?.schemaVersion).toBe(3);
  });

  it('addStitch appends a stitch to the pattern', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    const stitch = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().addStitch(stitch);
    expect(usePatternGraphStore.getState().pattern!.stitches).toHaveLength(1);
  });

  it('removeStitch removes by id and prunes orphan edges', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({
      ...p,
      stitches: [a, b],
      edges: [newAnchorEdge(b.id, { kind: 'stitch', id: a.id })],
    });
    usePatternGraphStore.getState().removeStitch(a.id);
    const after = usePatternGraphStore.getState().pattern!;
    expect(after.stitches).toHaveLength(1);
    expect(after.edges).toHaveLength(0);
  });

  it('addEdge appends an edge', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({
      ...p,
      stitches: [a, b],
    });
    const e = newAnchorEdge(b.id, { kind: 'stitch', id: a.id });
    usePatternGraphStore.getState().addEdge(e);
    expect(usePatternGraphStore.getState().pattern!.edges).toHaveLength(1);
  });

  it('updateStitchPosition mutates only the targeted stitch', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    const a = newStitch({ kind: 'builtin', type: 'magic_ring' });
    const b = newStitch({ kind: 'builtin', type: 'sc' });
    usePatternGraphStore.getState().setPattern({ ...p, stitches: [a, b] });
    usePatternGraphStore.getState().updateStitchPosition(b.id, { x: 50, y: 60 });
    const after = usePatternGraphStore.getState().pattern!;
    expect(after.stitches.find((s) => s.id === b.id)!.position).toEqual({
      x: 50,
      y: 60,
    });
    expect(after.stitches.find((s) => s.id === a.id)!.position).toBeUndefined();
  });

  it('selectStitch updates the selection', () => {
    usePatternGraphStore.getState().selectStitch('xyz');
    expect(usePatternGraphStore.getState().selectedStitchId).toBe('xyz');
    usePatternGraphStore.getState().selectStitch(null);
    expect(usePatternGraphStore.getState().selectedStitchId).toBeNull();
  });

  it('reset clears the store', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    usePatternGraphStore.getState().selectStitch('x');
    usePatternGraphStore.getState().reset();
    expect(usePatternGraphStore.getState().pattern).toBeNull();
    expect(usePatternGraphStore.getState().selectedStitchId).toBeNull();
  });
});
