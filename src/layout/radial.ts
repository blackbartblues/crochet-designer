import type { Pattern } from '../domain/graph/types';
import type { LayoutResult } from './types';

export const RADIAL_RING_SPACING = 80;

/**
 * Place stitches on concentric circles based on their `round` field.
 *
 * Round 0 (magic_ring) is placed at origin. Round N stitches are placed on a
 * circle of radius N * RADIAL_RING_SPACING, distributed evenly around the
 * circle in yarn-flow order.
 *
 * Stitches without a `round` field are skipped (no position assigned).
 */
export function computeRadialLayout(pattern: Pattern): LayoutResult {
  const result: LayoutResult = new Map();
  const byRound = new Map<number, string[]>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const ids = byRound.get(s.round) ?? [];
    ids.push(s.id);
    byRound.set(s.round, ids);
  }

  for (const [round, ids] of byRound) {
    if (round === 0) {
      for (const id of ids) result.set(id, { x: 0, y: 0 });
      continue;
    }
    const radius = round * RADIAL_RING_SPACING;
    const count = ids.length;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      result.set(ids[i]!, { x, y });
    }
  }

  return result;
}
