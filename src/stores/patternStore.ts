import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import type { Pattern, Cursor, RowDirection, CellContent } from '../domain/pattern';
import type { StitchKey, DisplayMode } from '../domain/stitches';
import type { YarnColor, ColorId } from '../domain/colors';
import { createEmptyPattern, createEmptyRow, flipDirection } from '../domain/pattern';
import { newId } from '../utils/id';

const HISTORY_CAP = 50;
const MAX_COLS = 500;

interface PatternState {
  pattern: Pattern | null;
  cursor: Cursor | null;
  filePath: string | null;
  isDirty: boolean;

  // History snapshots — full Pattern copies (cap 50)
  past: Pattern[];
  future: Pattern[];

  // ===== Lifecycle =====
  newPattern: (name: string, cols: number) => void;
  loadPattern: (pattern: Pattern, filePath: string | null) => void;
  closePattern: () => void;

  // ===== Cell editing =====
  paintCell: (row: number, col: number, stitch: StitchKey, colorId: ColorId) => void;
  clearCell: (row: number, col: number) => void;
  setCursor: (row: number, col: number) => void;
  advanceCursor: () => void;

  // ===== Row operations =====
  newRow: () => void;
  clearRow: (row: number) => void;
  toggleRowDirection: (row: number) => void;

  // ===== Color CRUD =====
  addColor: (name: string, hex: string) => ColorId;
  updateColor: (id: ColorId, patch: Partial<Pick<YarnColor, 'name' | 'hex'>>) => void;
  removeColor: (id: ColorId) => void;
  /** True if the color is referenced by any cell in the current pattern. */
  isColorInUse: (id: ColorId) => boolean;

  // ===== Pattern meta =====
  renamePattern: (name: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;

  // ===== History =====
  undo: () => void;
  redo: () => void;

  // ===== Save markers =====
  markSaved: (filePath: string) => void;
}

/** Push a snapshot of the current pattern onto the history past stack. */
function pushHistory(state: PatternState): void {
  if (!state.pattern) return;
  state.past.push(current(state.pattern));
  if (state.past.length > HISTORY_CAP) state.past.shift();
  state.future = [];
  state.isDirty = true;
  state.pattern.updatedAt = new Date().toISOString();
}

/** Returns clamped cursor or null if grid is empty. */
function clampCursor(pattern: Pattern, cursor: Cursor): Cursor | null {
  const rows = pattern.rows.length;
  if (rows === 0) return null;
  const row = Math.max(0, Math.min(cursor.row, rows - 1));
  const cols = pattern.rows[row]?.cells.length ?? 0;
  if (cols === 0) return null;
  const col = Math.max(0, Math.min(cursor.col, cols - 1));
  return { row, col };
}

export const usePatternStore = create<PatternState>()(
  immer((set, get) => ({
    pattern: null,
    cursor: null,
    filePath: null,
    isDirty: false,
    past: [],
    future: [],

    // ===== Lifecycle =====
    newPattern: (name, cols) =>
      set((s) => {
        s.pattern = createEmptyPattern(name, cols);
        s.cursor = { row: 0, col: cols - 1 }; // rtl row 1 starts at right edge
        s.filePath = null;
        s.isDirty = false;
        s.past = [];
        s.future = [];
      }),

    loadPattern: (pattern, filePath) =>
      set((s) => {
        s.pattern = pattern;
        s.filePath = filePath;
        s.isDirty = false;
        s.past = [];
        s.future = [];
        const cols = pattern.rows[0]?.cells.length ?? 0;
        s.cursor = cols > 0 ? { row: 0, col: pattern.rows[0]?.direction === 'ltr' ? 0 : cols - 1 } : null;
      }),

    closePattern: () =>
      set((s) => {
        s.pattern = null;
        s.cursor = null;
        s.filePath = null;
        s.isDirty = false;
        s.past = [];
        s.future = [];
      }),

    // ===== Cell editing =====
    paintCell: (row, col, stitch, colorId) =>
      set((s) => {
        if (!s.pattern) return;
        const targetRow = s.pattern.rows[row];
        if (!targetRow) return;
        if (col < 0 || col >= targetRow.cells.length) return;
        // Validate color exists in pattern
        if (!s.pattern.colors.some((c) => c.id === colorId)) return;

        pushHistory(s);
        targetRow.cells[col] = { stitch, colorId };

        // Advance cursor in row's reading direction.
        // If we'd go off-edge AND there's room to grow, extend ALL rows by 1.
        // LTR rows grow rightward (push to end); RTL rows grow leftward (unshift).
        const dir = targetRow.direction;
        const cols = targetRow.cells.length;
        const next = dir === 'ltr' ? col + 1 : col - 1;

        if (next >= 0 && next < cols) {
          s.cursor = { row, col: next };
          return;
        }

        if (cols >= MAX_COLS) {
          // Hit the cap — cursor parks at the painted cell.
          s.cursor = { row, col };
          return;
        }

        if (dir === 'ltr') {
          // Append empty cell to every row; cursor goes to the new last col.
          for (const r of s.pattern.rows) r.cells.push(null);
          s.cursor = { row, col: cols }; // new last index
        } else {
          // Prepend empty cell to every row; existing cells shift +1.
          // The just-painted cell at col 0 is now at col 1; cursor lands on
          // the new empty cell at col 0 (which is "next" in RTL reading).
          for (const r of s.pattern.rows) r.cells.unshift(null);
          s.cursor = { row, col: 0 };
        }
      }),

    clearCell: (row, col) =>
      set((s) => {
        if (!s.pattern) return;
        const targetRow = s.pattern.rows[row];
        if (!targetRow) return;
        if (col < 0 || col >= targetRow.cells.length) return;
        if (targetRow.cells[col] === null) return;
        pushHistory(s);
        targetRow.cells[col] = null;
      }),

    setCursor: (row, col) =>
      set((s) => {
        if (!s.pattern) return;
        const clamped = clampCursor(s.pattern, { row, col });
        s.cursor = clamped;
      }),

    advanceCursor: () =>
      set((s) => {
        if (!s.pattern || !s.cursor) return;
        const targetRow = s.pattern.rows[s.cursor.row];
        if (!targetRow) return;
        const dir = targetRow.direction;
        const next = dir === 'ltr' ? s.cursor.col + 1 : s.cursor.col - 1;
        if (next >= 0 && next < targetRow.cells.length) {
          s.cursor = { row: s.cursor.row, col: next };
        }
      }),

    // ===== Row operations =====
    newRow: () =>
      set((s) => {
        if (!s.pattern) return;
        const cols = s.pattern.rows[0]?.cells.length ?? 0;
        if (cols === 0) return;
        const lastDir: RowDirection = s.pattern.rows[s.pattern.rows.length - 1]?.direction ?? 'rtl';
        const newDir = flipDirection(lastDir);

        pushHistory(s);
        s.pattern.rows.push(createEmptyRow(cols, newDir));
        const newRowIdx = s.pattern.rows.length - 1;
        s.cursor = { row: newRowIdx, col: newDir === 'ltr' ? 0 : cols - 1 };
      }),

    clearRow: (row) =>
      set((s) => {
        if (!s.pattern) return;
        const targetRow = s.pattern.rows[row];
        if (!targetRow) return;
        const hasContent = targetRow.cells.some((c) => c !== null);
        if (!hasContent) return;

        pushHistory(s);
        for (let i = 0; i < targetRow.cells.length; i++) {
          targetRow.cells[i] = null as CellContent;
        }
      }),

    toggleRowDirection: (row) =>
      set((s) => {
        if (!s.pattern) return;
        const targetRow = s.pattern.rows[row];
        if (!targetRow) return;
        pushHistory(s);
        targetRow.direction = flipDirection(targetRow.direction);
      }),

    // ===== Color CRUD =====
    addColor: (name, hex) => {
      const id = newId();
      set((s) => {
        if (!s.pattern) return;
        pushHistory(s);
        s.pattern.colors.push({ id, name: name.trim() || 'Nowy kolor', hex, isBase: false });
      });
      return id;
    },

    updateColor: (id, patch) =>
      set((s) => {
        if (!s.pattern) return;
        const color = s.pattern.colors.find((c) => c.id === id);
        if (!color) return;
        // Reject any attempt to mutate the base color (UI also blocks this, defense-in-depth)
        if (color.isBase) return;

        pushHistory(s);
        if (patch.name !== undefined) color.name = patch.name.trim() || color.name;
        if (patch.hex !== undefined) color.hex = patch.hex;
      }),

    removeColor: (id) =>
      set((s) => {
        if (!s.pattern) return;
        const color = s.pattern.colors.find((c) => c.id === id);
        if (!color || color.isBase) return;
        // User decision (Opcja A): block removal if in use; component shows toast.
        const inUse = s.pattern.rows.some((r) => r.cells.some((c) => c?.colorId === id));
        if (inUse) return;

        pushHistory(s);
        s.pattern.colors = s.pattern.colors.filter((c) => c.id !== id);
      }),

    isColorInUse: (id) => {
      const p = get().pattern;
      if (!p) return false;
      return p.rows.some((r) => r.cells.some((c) => c?.colorId === id));
    },

    // ===== Pattern meta =====
    renamePattern: (name) =>
      set((s) => {
        if (!s.pattern) return;
        const trimmed = name.trim();
        if (!trimmed || trimmed === s.pattern.name) return;
        pushHistory(s);
        s.pattern.name = trimmed;
      }),

    setDisplayMode: (mode) =>
      set((s) => {
        if (!s.pattern) return;
        if (s.pattern.displayMode === mode) return;
        pushHistory(s);
        s.pattern.displayMode = mode;
      }),

    // ===== History =====
    undo: () =>
      set((s) => {
        if (!s.pattern || s.past.length === 0) return;
        const previous = s.past.pop()!;
        s.future.push(current(s.pattern));
        if (s.future.length > HISTORY_CAP) s.future.shift();
        s.pattern = previous;
        s.isDirty = true;
        // Reclamp cursor to new pattern bounds
        if (s.cursor) s.cursor = clampCursor(s.pattern, s.cursor);
      }),

    redo: () =>
      set((s) => {
        if (!s.pattern || s.future.length === 0) return;
        const next = s.future.pop()!;
        s.past.push(current(s.pattern));
        if (s.past.length > HISTORY_CAP) s.past.shift();
        s.pattern = next;
        s.isDirty = true;
        if (s.cursor) s.cursor = clampCursor(s.pattern, s.cursor);
      }),

    // ===== Save markers =====
    markSaved: (filePath) =>
      set((s) => {
        s.filePath = filePath;
        s.isDirty = false;
      }),
  })),
);

/** Selectors — small helpers to keep components terse. */
export const selectCanUndo = (s: PatternState): boolean => s.past.length > 0;
export const selectCanRedo = (s: PatternState): boolean => s.future.length > 0;
