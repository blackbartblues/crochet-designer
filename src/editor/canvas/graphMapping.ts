import type { Node as RfNode, Edge as RfEdge } from 'reactflow';
import type { Pattern, BuiltinStitchType, StitchTypeRef } from '../../domain/graph/types';
import { isAnchorEdge, isYarnFlowEdge, isJoinEdge, isStitchAnchor } from '../../domain/graph/types';
import type { StitchNodeData } from './StitchNode';

const BUILTIN_SYMBOL: Record<BuiltinStitchType, string> = {
  ch: '∞',
  sl_st: '•',
  sc: '×',
  hdc: 'Ŧ',
  dc: '⊤',
  tr: '⊤',
  gr_st: '≣',
  magic_ring: '○',
  fasten_off: '↗',
};

const BUILTIN_LABEL: Record<BuiltinStitchType, string> = {
  ch: 'ch',
  sl_st: 'sl',
  sc: 'sc',
  hdc: 'hdc',
  dc: 'dc',
  tr: 'tr',
  gr_st: 'gr',
  magic_ring: 'ring',
  fasten_off: 'off',
};

function symbolFor(typeRef: StitchTypeRef, pattern: Pattern): { symbol: string; label: string } {
  if (typeRef.kind === 'builtin') {
    return { symbol: BUILTIN_SYMBOL[typeRef.type], label: BUILTIN_LABEL[typeRef.type] };
  }
  const custom = pattern.customStitches.find((c) => c.id === typeRef.id);
  return { symbol: '?', label: custom?.shortCode ?? '??' };
}

function colorFor(colorRef: string | undefined, pattern: Pattern): string | undefined {
  if (!colorRef) return undefined;
  return pattern.colors.find((c) => c.id === colorRef)?.hex;
}

export interface MappedGraph {
  nodes: RfNode<StitchNodeData>[];
  edges: RfEdge[];
}

export function patternToReactFlow(pattern: Pattern): MappedGraph {
  const nodes: RfNode<StitchNodeData>[] = pattern.stitches.map((s) => {
    const { symbol, label } = symbolFor(s.typeRef, pattern);
    return {
      id: s.id,
      type: 'stitch',
      position: s.position ?? { x: 0, y: 0 },
      data: { label, symbol, color: colorFor(s.colorRef, pattern) },
    };
  });

  const edges: RfEdge[] = [];
  for (const e of pattern.edges) {
    if (isAnchorEdge(e)) {
      if (!isStitchAnchor(e.to)) continue;
      edges.push({
        id: e.id,
        type: 'anchor',
        source: e.to.id,
        target: e.from,
        sourceHandle: 'anchor',
        targetHandle: 'anchored-by',
      });
    } else if (isYarnFlowEdge(e)) {
      edges.push({
        id: e.id,
        type: 'yarn_flow',
        source: e.from,
        target: e.to,
        sourceHandle: 'out',
        targetHandle: 'in',
      });
    } else if (isJoinEdge(e)) {
      for (const target of e.targets) {
        edges.push({
          id: `${e.id}--${target}`,
          type: 'join',
          source: e.stitch,
          target,
        });
      }
    }
  }
  return { nodes, edges };
}
