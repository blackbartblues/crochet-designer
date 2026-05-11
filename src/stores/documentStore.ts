import { create } from 'zustand';
import type { Pattern as PatternV3 } from '../domain/graph/types';

export type DocumentMode = 'rectangular' | 'graph';

interface DocumentStore {
  mode: DocumentMode;
  graphPattern: PatternV3 | null;
  setMode(mode: DocumentMode): void;
  loadGraphPattern(pattern: PatternV3): void;
  reset(): void;
}

const INITIAL: Pick<DocumentStore, 'mode' | 'graphPattern'> = {
  mode: 'rectangular',
  graphPattern: null,
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...INITIAL,
  setMode(mode) {
    if (mode === 'graph' && get().graphPattern === null) {
      throw new Error('Cannot switch to graph mode without a graph pattern.');
    }
    set({ mode });
  },
  loadGraphPattern(pattern) {
    set({ mode: 'graph', graphPattern: pattern });
  },
  reset() {
    set({ ...INITIAL });
  },
}));
