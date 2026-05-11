import {
  isAnchorEdge,
  isJoinEdge,
  isYarnFlowEdge,
  type Pattern,
  type StitchId,
  type EdgeId,
} from '../graph/types';

export type GraphIssueKind =
  | 'missing_anchor'
  | 'missing_join_target'
  | 'missing_photo'
  | 'missing_custom_stitch'
  | 'missing_color'
  | 'orphan_stitch'
  | 'yarn_flow_branching'
  | 'yarn_flow_cycle'
  | 'invalid_round_membership';

export interface GraphValidationIssue {
  kind: GraphIssueKind;
  severity: 'critical' | 'warning';
  message: string;
  stitchId?: StitchId;
  edgeId?: EdgeId;
}

const ANCHOR_OPTIONAL_TYPES = new Set(['magic_ring', 'ch']);

export function validateGraph(pattern: Pattern): GraphValidationIssue[] {
  const issues: GraphValidationIssue[] = [];

  const stitchIds = new Set(pattern.stitches.map((s) => s.id));
  const photoIds = new Set(pattern.photos.map((p) => p.id));
  const customIds = new Set(pattern.customStitches.map((c) => c.id));
  const colorIds = new Set(pattern.colors.map((c) => c.id));

  // 1. Anchor existence
  for (const edge of pattern.edges) {
    if (!isAnchorEdge(edge)) continue;
    const target = edge.to;
    if (target.kind === 'stitch' && !stitchIds.has(target.id)) {
      issues.push({
        kind: 'missing_anchor',
        severity: 'critical',
        message: `Anchor edge ${edge.id} targets a missing stitch (${target.id}).`,
        edgeId: edge.id,
      });
    }
    if (target.kind === 'chain_space') {
      if (!stitchIds.has(target.betweenA) || !stitchIds.has(target.betweenB)) {
        issues.push({
          kind: 'missing_anchor',
          severity: 'critical',
          message: `Anchor edge ${edge.id} references a chain_space between missing stitches.`,
          edgeId: edge.id,
        });
      }
    }
    if (target.kind === 'turning_chain' && !stitchIds.has(target.ofStitch)) {
      issues.push({
        kind: 'missing_anchor',
        severity: 'critical',
        message: `Anchor edge ${edge.id} references a turning_chain of a missing stitch.`,
        edgeId: edge.id,
      });
    }
  }

  // 2. Orphan stitches (need exactly one anchor unless magic_ring or ch)
  const anchorByStitch = new Map<StitchId, number>();
  for (const edge of pattern.edges) {
    if (isAnchorEdge(edge)) {
      anchorByStitch.set(
        edge.from,
        (anchorByStitch.get(edge.from) ?? 0) + 1,
      );
    }
  }
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'builtin' && ANCHOR_OPTIONAL_TYPES.has(s.typeRef.type)) {
      continue;
    }
    if (!anchorByStitch.has(s.id)) {
      issues.push({
        kind: 'orphan_stitch',
        severity: 'critical',
        message: `Stitch ${s.id} has no anchor edge.`,
        stitchId: s.id,
      });
    }
  }

  // 3. Yarn flow: no branching, no cycles
  const yarnEdges = pattern.edges.filter(isYarnFlowEdge);
  const nextOf = new Map<StitchId, StitchId>();
  for (const e of yarnEdges) {
    if (nextOf.has(e.from)) {
      issues.push({
        kind: 'yarn_flow_branching',
        severity: 'critical',
        message: `Stitch ${e.from} has multiple outgoing yarn flow edges.`,
        stitchId: e.from,
        edgeId: e.id,
      });
    } else {
      nextOf.set(e.from, e.to);
    }
  }
  for (const startId of nextOf.keys()) {
    const seen = new Set<StitchId>();
    let cursor: StitchId | undefined = startId;
    while (cursor !== undefined) {
      if (seen.has(cursor)) {
        issues.push({
          kind: 'yarn_flow_cycle',
          severity: 'critical',
          message: `Yarn flow cycle detected at stitch ${cursor}.`,
          stitchId: cursor,
        });
        break;
      }
      seen.add(cursor);
      cursor = nextOf.get(cursor);
    }
  }

  // 4. Joins reference existing stitches
  for (const edge of pattern.edges) {
    if (!isJoinEdge(edge)) continue;
    if (!stitchIds.has(edge.stitch)) {
      issues.push({
        kind: 'missing_join_target',
        severity: 'critical',
        message: `Join edge ${edge.id} originates from a missing stitch.`,
        edgeId: edge.id,
      });
    }
    for (const t of edge.targets) {
      if (!stitchIds.has(t)) {
        issues.push({
          kind: 'missing_join_target',
          severity: 'critical',
          message: `Join edge ${edge.id} targets a missing stitch (${t}).`,
          edgeId: edge.id,
        });
      }
    }
  }

  // 5. Attachments resolve
  for (const s of pattern.stitches) {
    const ids = s.attachments?.photoIds ?? [];
    for (const photoId of ids) {
      if (!photoIds.has(photoId)) {
        issues.push({
          kind: 'missing_photo',
          severity: 'warning',
          message: `Stitch ${s.id} references a missing photo (${photoId}).`,
          stitchId: s.id,
        });
      }
    }
  }

  // 6. Custom typeRef ids resolve
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'custom' && !customIds.has(s.typeRef.id)) {
      issues.push({
        kind: 'missing_custom_stitch',
        severity: 'critical',
        message: `Stitch ${s.id} references a missing custom stitch (${s.typeRef.id}).`,
        stitchId: s.id,
      });
    }
  }

  // 7. Color refs resolve
  for (const s of pattern.stitches) {
    if (s.colorRef && !colorIds.has(s.colorRef)) {
      issues.push({
        kind: 'missing_color',
        severity: 'warning',
        message: `Stitch ${s.id} references a missing color (${s.colorRef}).`,
        stitchId: s.id,
      });
    }
  }

  return issues;
}
