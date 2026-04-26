import type { StitchKey, DisplayMode } from './stitches';
import type { ColorId, YarnColor } from './colors';
import { DEFAULT_PALETTE, BASE_COLOR } from './colors';
import { newId } from '../utils/id';

/** A single grid cell — null means unfilled. */
export type CellContent = null | {
  stitch: StitchKey;
  colorId: ColorId;
};

/** Reading direction for a single row. */
export type RowDirection = 'rtl' | 'ltr';

export interface Row {
  id: string;
  direction: RowDirection;
  /** Always indexed left-to-right (0..cols-1). Display reverses for rtl rows. */
  cells: CellContent[];
}

export interface Pattern {
  id: string;
  name: string;
  schemaVersion: 1;
  /** ISO 8601 strings */
  createdAt: string;
  updatedAt: string;
  /** colors[0] is always the base color (isBase: true). Invariant. */
  colors: YarnColor[];
  rows: Row[];
  displayMode: DisplayMode;
}

/** Cursor position in the grid. */
export interface Cursor {
  row: number; // 0-indexed
  col: number; // 0-indexed
}

// ============================================================
// Factories — produce immutable values; mutate only via store.
// ============================================================

/** Create a row of `cols` empty cells with the given direction. */
export function createEmptyRow(cols: number, direction: RowDirection = 'rtl'): Row {
  const cells: CellContent[] = [];
  for (let i = 0; i < cols; i++) cells.push(null);
  return { id: newId(), direction, cells };
}

/**
 * Create a fresh pattern with one empty row.
 * Invariant: colors[0] is always the base color (isBase: true).
 * Per spec decision: row 1 starts as 'rtl' (P→L), subsequent rows alternate.
 */
export function createEmptyPattern(name: string, cols: number): Pattern {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: name.trim() || 'Wzór bez nazwy',
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    colors: [...DEFAULT_PALETTE],
    rows: [createEmptyRow(cols, 'rtl')],
    displayMode: 'symbol',
  };
}

/** The opposite of a given direction (for row-by-row alternation). */
export function flipDirection(d: RowDirection): RowDirection {
  return d === 'rtl' ? 'ltr' : 'rtl';
}

/**
 * Validate the BASE color invariant: colors[0] must exist, have isBase=true,
 * and no other color may have isBase=true. Returns true if valid.
 */
export function isPatternValid(pattern: Pattern): boolean {
  if (pattern.colors.length === 0) return false;
  if (!pattern.colors[0]?.isBase) return false;
  for (let i = 1; i < pattern.colors.length; i++) {
    if (pattern.colors[i]?.isBase) return false;
  }
  return true;
}

/** Total stitches across all rows. */
export function countStitches(pattern: Pattern): number {
  let total = 0;
  for (const row of pattern.rows) {
    for (const cell of row.cells) {
      if (cell !== null) total++;
    }
  }
  return total;
}

/** Re-export base color for convenience. */
export { BASE_COLOR };
