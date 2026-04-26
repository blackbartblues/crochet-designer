import { describe, it, expect, beforeEach } from 'vitest';
import { usePatternStore } from './patternStore';

beforeEach(() => {
  // Reset state for isolation between tests
  usePatternStore.getState().closePattern();
});

describe('newPattern', () => {
  it('creates a pattern and positions cursor at right edge of rtl row 1', () => {
    usePatternStore.getState().newPattern('Test', 10);
    const s = usePatternStore.getState();
    expect(s.pattern?.name).toBe('Test');
    expect(s.pattern?.rows.length).toBe(1);
    expect(s.cursor).toEqual({ row: 0, col: 9 });
  });

  it('clears history and dirty flag', () => {
    usePatternStore.getState().newPattern('Test', 10);
    usePatternStore.getState().paintCell(0, 9, 'sc', 'base');
    usePatternStore.getState().newPattern('Other', 5);
    const s = usePatternStore.getState();
    expect(s.past.length).toBe(0);
    expect(s.future.length).toBe(0);
    expect(s.isDirty).toBe(false);
  });
});

describe('paintCell', () => {
  it('paints the cell and advances cursor in rtl direction', () => {
    usePatternStore.getState().newPattern('T', 5);
    usePatternStore.getState().paintCell(0, 4, 'sc', 'base');
    const s = usePatternStore.getState();
    expect(s.pattern?.rows[0]?.cells[4]).toEqual({ stitch: 'sc', colorId: 'base' });
    expect(s.cursor).toEqual({ row: 0, col: 3 });
  });

  it('grows leftward and parks cursor at new col 0 when painting at RTL edge', () => {
    usePatternStore.getState().newPattern('T', 3);
    // RTL row 1, cursor starts at col 2 (right edge)
    usePatternStore.getState().paintCell(0, 0, 'sc', 'base');
    const s = usePatternStore.getState();
    // After grow: row should be 4 cells wide; original cell shifted to col 1
    expect(s.pattern?.rows[0]?.cells.length).toBe(4);
    expect(s.pattern?.rows[0]?.cells[0]).toBe(null);
    expect(s.pattern?.rows[0]?.cells[1]).toEqual({ stitch: 'sc', colorId: 'base' });
    expect(s.cursor).toEqual({ row: 0, col: 0 });
  });

  it('grows rightward in LTR row when painting at last col', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().toggleRowDirection(0); // ltr
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base'); // last col
    const s = usePatternStore.getState();
    expect(s.pattern?.rows[0]?.cells.length).toBe(4);
    expect(s.pattern?.rows[0]?.cells[2]).toEqual({ stitch: 'sc', colorId: 'base' });
    expect(s.pattern?.rows[0]?.cells[3]).toBe(null);
    expect(s.cursor).toEqual({ row: 0, col: 3 });
  });

  it('expands ALL rows uniformly when growing', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().newRow(); // ltr
    usePatternStore.getState().newRow(); // rtl
    // Now 3 rows, all 3 cols. Toggle row 0 to LTR for predictable growth direction.
    usePatternStore.getState().toggleRowDirection(0);
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base');
    const s = usePatternStore.getState();
    for (const r of s.pattern!.rows) {
      expect(r.cells.length).toBe(4);
    }
  });

  it('stops growing at MAX_COLS cap', () => {
    // Use a small starter and run many grow steps; we just need to verify it caps.
    usePatternStore.getState().newPattern('T', 1);
    usePatternStore.getState().toggleRowDirection(0); // ltr for predictable rightward growth
    // Paint repeatedly at the rightmost cell — should grow until cap
    for (let i = 0; i < 600; i++) {
      const cur = usePatternStore.getState().cursor!;
      usePatternStore.getState().paintCell(cur.row, cur.col, 'sc', 'base');
    }
    expect(usePatternStore.getState().pattern!.rows[0]!.cells.length).toBeLessThanOrEqual(500);
  });

  it('advances cursor in ltr direction', () => {
    usePatternStore.getState().newPattern('T', 5);
    usePatternStore.getState().toggleRowDirection(0);
    usePatternStore.getState().paintCell(0, 0, 'sc', 'base');
    const s = usePatternStore.getState();
    expect(s.cursor).toEqual({ row: 0, col: 1 });
  });

  it('rejects unknown color id', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().paintCell(0, 0, 'sc', 'no-such-color');
    expect(usePatternStore.getState().pattern?.rows[0]?.cells[0]).toBe(null);
  });

  it('marks the pattern dirty', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base');
    expect(usePatternStore.getState().isDirty).toBe(true);
  });
});

describe('newRow', () => {
  it('appends a row with flipped direction and cursor at appropriate edge', () => {
    usePatternStore.getState().newPattern('T', 5);
    usePatternStore.getState().newRow();
    const s = usePatternStore.getState();
    expect(s.pattern?.rows.length).toBe(2);
    expect(s.pattern?.rows[1]?.direction).toBe('ltr');
    expect(s.cursor).toEqual({ row: 1, col: 0 });
  });

  it('alternates rtl → ltr → rtl across multiple rows', () => {
    usePatternStore.getState().newPattern('T', 4);
    usePatternStore.getState().newRow(); // ltr
    usePatternStore.getState().newRow(); // rtl
    const dirs = usePatternStore.getState().pattern?.rows.map((r) => r.direction);
    expect(dirs).toEqual(['rtl', 'ltr', 'rtl']);
  });
});

describe('clearRow', () => {
  it('clears all cells in the row', () => {
    usePatternStore.getState().newPattern('T', 4);
    usePatternStore.getState().paintCell(0, 3, 'sc', 'base');
    usePatternStore.getState().paintCell(0, 1, 'dc', 'base');
    usePatternStore.getState().clearRow(0);
    expect(usePatternStore.getState().pattern?.rows[0]?.cells.every((c) => c === null)).toBe(true);
  });

  it('is a no-op for an already-empty row (does not push history)', () => {
    usePatternStore.getState().newPattern('T', 4);
    const before = usePatternStore.getState().past.length;
    usePatternStore.getState().clearRow(0);
    expect(usePatternStore.getState().past.length).toBe(before);
  });
});

describe('toggleRowDirection', () => {
  it('flips the direction of the target row', () => {
    usePatternStore.getState().newPattern('T', 4);
    usePatternStore.getState().toggleRowDirection(0);
    expect(usePatternStore.getState().pattern?.rows[0]?.direction).toBe('ltr');
  });
});

describe('color CRUD', () => {
  it('adds a non-base color', () => {
    usePatternStore.getState().newPattern('T', 4);
    const before = usePatternStore.getState().pattern!.colors.length;
    const id = usePatternStore.getState().addColor('Czerwony', '#FF0000');
    const after = usePatternStore.getState().pattern!.colors;
    expect(after.length).toBe(before + 1);
    expect(after.find((c) => c.id === id)?.isBase).toBe(false);
  });

  it('updateColor refuses to mutate the base color', () => {
    usePatternStore.getState().newPattern('T', 4);
    usePatternStore.getState().updateColor('base', { name: 'Hacked', hex: '#000000' });
    const base = usePatternStore.getState().pattern?.colors[0];
    expect(base?.name).toBe('Kremowy');
    expect(base?.hex).toBe('#F5EDE0');
  });

  it('removeColor refuses to remove the base color', () => {
    usePatternStore.getState().newPattern('T', 4);
    const before = usePatternStore.getState().pattern!.colors.length;
    usePatternStore.getState().removeColor('base');
    expect(usePatternStore.getState().pattern!.colors.length).toBe(before);
  });

  it('removeColor refuses to remove a color that is in use (Opcja A)', () => {
    usePatternStore.getState().newPattern('T', 4);
    const id = usePatternStore.getState().addColor('Czerwony', '#FF0000');
    usePatternStore.getState().paintCell(0, 0, 'sc', id);
    const beforeLen = usePatternStore.getState().pattern!.colors.length;
    usePatternStore.getState().removeColor(id);
    expect(usePatternStore.getState().pattern!.colors.length).toBe(beforeLen);
  });

  it('removeColor succeeds for an unused non-base color', () => {
    usePatternStore.getState().newPattern('T', 4);
    const id = usePatternStore.getState().addColor('Czerwony', '#FF0000');
    usePatternStore.getState().removeColor(id);
    expect(usePatternStore.getState().pattern!.colors.find((c) => c.id === id)).toBeUndefined();
  });

  it('isColorInUse reports correctly', () => {
    usePatternStore.getState().newPattern('T', 4);
    const id = usePatternStore.getState().addColor('Czerwony', '#FF0000');
    expect(usePatternStore.getState().isColorInUse(id)).toBe(false);
    usePatternStore.getState().paintCell(0, 0, 'sc', id);
    expect(usePatternStore.getState().isColorInUse(id)).toBe(true);
  });
});

describe('history (undo/redo)', () => {
  it('undo restores the previous pattern', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base');
    usePatternStore.getState().undo();
    expect(usePatternStore.getState().pattern?.rows[0]?.cells[2]).toBe(null);
  });

  it('redo re-applies an undone change', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base');
    usePatternStore.getState().undo();
    usePatternStore.getState().redo();
    expect(usePatternStore.getState().pattern?.rows[0]?.cells[2]).toEqual({ stitch: 'sc', colorId: 'base' });
  });

  it('new edit clears the future stack (branching)', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().paintCell(0, 2, 'sc', 'base');
    usePatternStore.getState().undo();
    expect(usePatternStore.getState().future.length).toBe(1);
    usePatternStore.getState().paintCell(0, 1, 'dc', 'base');
    expect(usePatternStore.getState().future.length).toBe(0);
  });

  it('caps history at 50 entries', () => {
    usePatternStore.getState().newPattern('T', 60);
    for (let i = 59; i >= 0; i--) usePatternStore.getState().paintCell(0, i, 'sc', 'base');
    expect(usePatternStore.getState().past.length).toBeLessThanOrEqual(50);
  });

  it('undo with empty past is a no-op', () => {
    usePatternStore.getState().newPattern('T', 3);
    const before = usePatternStore.getState().pattern;
    usePatternStore.getState().undo();
    expect(usePatternStore.getState().pattern).toBe(before);
  });
});

describe('renamePattern', () => {
  it('updates name when different', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().renamePattern('Nowy');
    expect(usePatternStore.getState().pattern?.name).toBe('Nowy');
  });

  it('ignores empty/whitespace names', () => {
    usePatternStore.getState().newPattern('T', 3);
    usePatternStore.getState().renamePattern('   ');
    expect(usePatternStore.getState().pattern?.name).toBe('T');
  });
});
