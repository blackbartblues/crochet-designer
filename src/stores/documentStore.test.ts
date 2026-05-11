import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './documentStore';
import { emptyPatternV3 } from '../domain/graph/build';

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  it('starts with mode "rectangular" and no graph pattern', () => {
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('rectangular');
    expect(state.graphPattern).toBeNull();
  });

  it('switching to graph mode requires a v3 pattern', () => {
    const state = useDocumentStore.getState();
    expect(() => state.setMode('graph')).toThrow(/graph pattern/i);
  });

  it('loadGraphPattern sets the pattern and switches mode to graph', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    useDocumentStore.getState().loadGraphPattern(p);
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('graph');
    expect(state.graphPattern).toEqual(p);
  });

  it('reset returns the store to its initial state', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    useDocumentStore.getState().loadGraphPattern(p);
    useDocumentStore.getState().reset();
    const state = useDocumentStore.getState();
    expect(state.mode).toBe('rectangular');
    expect(state.graphPattern).toBeNull();
  });
});
