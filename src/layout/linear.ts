import type { Pattern } from '../domain/graph/types';
import type { LayoutResult } from './types';

export const LINEAR_CELL_W = 60;
export const LINEAR_CELL_H = 70;

/**
 * Place stitches on a rectangular grid. Each row is anchored to y = -row * H
 * (so row 0 is at bottom, higher rows stack upward — matching how crochet
 * is usually read). Within a row, stitches are spaced left-to-right by W in
 * the order they appear in `pattern.stitches` for that round.
 */
export function computeLinearLayout(pattern: Pattern): LayoutResult {
  const result: LayoutResult = new Map();
  const byRound = new Map<number, string[]>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const ids = byRound.get(s.round) ?? [];
    ids.push(s.id);
    byRound.set(s.round, ids);
  }

  for (const [round, ids] of byRound) {
    const y = round === 0 ? 0 : -round * LINEAR_CELL_H;
    for (let i = 0; i < ids.length; i++) {
      result.set(ids[i]!, { x: i * LINEAR_CELL_W, y });
    }
  }

  return result;
}
