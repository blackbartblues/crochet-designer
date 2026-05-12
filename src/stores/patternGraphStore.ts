import { create } from 'zustand';
import { produce } from 'immer';
import type {
  Edge,
  Pattern,
  Position,
  Stitch,
  StitchId,
} from '../domain/graph/types';

interface PatternGraphState {
  pattern: Pattern | null;
  selectedStitchId: StitchId | null;
  setPattern(pattern: Pattern | null): void;
  addStitch(stitch: Stitch): void;
  removeStitch(stitchId: StitchId): void;
  addEdge(edge: Edge): void;
  removeEdge(edgeId: string): void;
  updateStitchPosition(stitchId: StitchId, position: Position): void;
  selectStitch(stitchId: StitchId | null): void;
  reset(): void;
}

function pruneOrphanEdges(pattern: Pattern, removedStitchId: StitchId): Edge[] {
  return pattern.edges.filter((e) => {
    if (e.kind === 'anchor') {
      if (e.from === removedStitchId) return false;
      if (e.to.kind === 'stitch' && e.to.id === removedStitchId) return false;
      if (
        e.to.kind === 'chain_space' &&
        (e.to.betweenA === removedStitchId || e.to.betweenB === removedStitchId)
      ) {
        return false;
      }
      if (e.to.kind === 'turning_chain' && e.to.ofStitch === removedStitchId) {
        return false;
      }
    }
    if (e.kind === 'yarn_flow') {
      if (e.from === removedStitchId || e.to === removedStitchId) return false;
    }
    if (e.kind === 'join') {
      if (e.stitch === removedStitchId) return false;
      if (e.targets.includes(removedStitchId)) return false;
    }
    return true;
  });
}

export const usePatternGraphStore = create<PatternGraphState>((set) => ({
  pattern: null,
  selectedStitchId: null,

  setPattern(pattern) {
    set({ pattern, selectedStitchId: null });
  },

  addStitch(stitch) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.stitches.push(stitch);
      }),
    );
  },

  removeStitch(stitchId) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        const prunedEdges = pruneOrphanEdges(draft.pattern as Pattern, stitchId);
        draft.pattern.stitches = draft.pattern.stitches.filter(
          (x) => x.id !== stitchId,
        );
        draft.pattern.edges = prunedEdges;
        if (draft.selectedStitchId === stitchId) draft.selectedStitchId = null;
      }),
    );
  },

  addEdge(edge) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.edges.push(edge);
      }),
    );
  },

  removeEdge(edgeId) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        draft.pattern.edges = draft.pattern.edges.filter((e) => e.id !== edgeId);
      }),
    );
  },

  updateStitchPosition(stitchId, position) {
    set((s) =>
      produce(s, (draft) => {
        if (!draft.pattern) return;
        const found = draft.pattern.stitches.find((x) => x.id === stitchId);
        if (found) found.position = position;
      }),
    );
  },

  selectStitch(stitchId) {
    set({ selectedStitchId: stitchId });
  },

  reset() {
    set({ pattern: null, selectedStitchId: null });
  },
}));
