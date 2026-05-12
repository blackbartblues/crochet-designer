import type { Pattern, StitchId } from '../../domain/graph/types';
import { isAnchorEdge, isYarnFlowEdge, isStitchAnchor } from '../../domain/graph/types';

export type EdgeKind = 'anchor' | 'yarn_flow' | 'join';

export interface ModifierState {
  shift?: boolean;
  alt?: boolean;
}

export function decideEdgeKind(mods: ModifierState): EdgeKind {
  if (mods.shift) return 'yarn_flow';
  if (mods.alt) return 'join';
  return 'anchor';
}

export interface ConnectionAttempt {
  pattern: Pattern;
  source: StitchId;
  target: StitchId;
  kind: EdgeKind;
}

export type ValidationResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

function existsAnchorEdge(
  pattern: Pattern,
  anchorTarget: StitchId,
  anchoredStitch: StitchId,
): boolean {
  return pattern.edges.some(
    (e) =>
      isAnchorEdge(e) &&
      e.from === anchoredStitch &&
      isStitchAnchor(e.to) &&
      e.to.id === anchorTarget,
  );
}

function wouldCreateYarnFlowCycle(pattern: Pattern, from: StitchId, to: StitchId): boolean {
  const next = new Map<StitchId, StitchId>();
  for (const e of pattern.edges) {
    if (isYarnFlowEdge(e)) next.set(e.from, e.to);
  }
  let cursor: StitchId | undefined = to;
  const visited = new Set<StitchId>();
  while (cursor !== undefined) {
    if (cursor === from) return true;
    if (visited.has(cursor)) return false;
    visited.add(cursor);
    cursor = next.get(cursor);
  }
  return false;
}

export function validateConnection(attempt: ConnectionAttempt): ValidationResult {
  const { pattern, source, target, kind } = attempt;
  if (source === target) {
    return { kind: 'error', message: 'Cannot connect a stitch to itself.' };
  }
  if (kind === 'anchor' && existsAnchorEdge(pattern, source, target)) {
    return { kind: 'error', message: 'Anchor edge already exists.' };
  }
  if (kind === 'yarn_flow' && wouldCreateYarnFlowCycle(pattern, source, target)) {
    return { kind: 'error', message: 'Yarn flow connection would create a cycle.' };
  }
  return { kind: 'ok' };
}
