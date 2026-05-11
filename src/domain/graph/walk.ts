import {
  isAnchorEdge,
  isStitchAnchor,
  isYarnFlowEdge,
  type Pattern,
  type Stitch,
  type StitchId,
} from './types';

/**
 * Returns the ids of stitches in yarn-flow order, starting from the unique
 * stitch with no incoming yarn_flow edge.
 *
 * Throws if more than one start candidate is found, or if a cycle is detected.
 */
export function yarnFlowSequence(pattern: Pattern): StitchId[] {
  const yarnEdges = pattern.edges.filter(isYarnFlowEdge);
  if (yarnEdges.length === 0 && pattern.stitches.length === 0) return [];

  const incoming = new Map<StitchId, number>();
  for (const s of pattern.stitches) incoming.set(s.id, 0);
  for (const e of yarnEdges) {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }

  const starts: StitchId[] = [];
  for (const [id, count] of incoming) {
    if (count === 0) starts.push(id);
  }

  if (yarnEdges.length === 0) return pattern.stitches.map((s) => s.id);

  // If there are yarn edges but no start found, there's a cycle
  if (starts.length === 0) {
    throw new Error(
      `Yarn flow contains a cycle; no stitch with zero incoming edges found.`,
    );
  }

  if (starts.length > 1) {
    return [];
  }

  const nextOf = new Map<StitchId, StitchId>();
  for (const e of yarnEdges) {
    if (nextOf.has(e.from)) {
      throw new Error(
        `Yarn flow has branching out of ${e.from}; expected linear chain.`,
      );
    }
    nextOf.set(e.from, e.to);
  }

  const sequence: StitchId[] = [];
  const seen = new Set<StitchId>();
  let cursor: StitchId | undefined = starts[0];
  while (cursor !== undefined) {
    if (seen.has(cursor)) {
      throw new Error(`Yarn flow contains a cycle at stitch ${cursor}.`);
    }
    seen.add(cursor);
    sequence.push(cursor);
    cursor = nextOf.get(cursor);
  }
  return sequence;
}

/**
 * Returns all stitch ids whose anchor edge targets the given stitch
 * (kind === 'stitch' anchor targets only).
 */
export function anchorChildrenOf(
  pattern: Pattern,
  anchorId: StitchId,
): StitchId[] {
  const out: StitchId[] = [];
  for (const e of pattern.edges) {
    if (!isAnchorEdge(e)) continue;
    if (!isStitchAnchor(e.to)) continue;
    if (e.to.id === anchorId) out.push(e.from);
  }
  return out;
}

export function roundOf(
  pattern: Pattern,
  stitchId: StitchId,
): number | undefined {
  const s = pattern.stitches.find((x) => x.id === stitchId);
  return s?.round;
}

export function stitchesInRound(pattern: Pattern, index: number): Stitch[] {
  return pattern.stitches.filter((s) => s.round === index);
}
