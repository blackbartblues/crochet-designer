import { describe, it, expect } from 'vitest';
import {
  createEmptyPattern,
  createEmptyRow,
  flipDirection,
  isPatternValid,
  countStitches,
} from './pattern';

describe('createEmptyRow', () => {
  it('creates a row with N null cells', () => {
    const row = createEmptyRow(8);
    expect(row.cells.length).toBe(8);
    expect(row.cells.every((c) => c === null)).toBe(true);
  });

  it('defaults direction to rtl', () => {
    expect(createEmptyRow(4).direction).toBe('rtl');
  });

  it('respects explicit direction', () => {
    expect(createEmptyRow(4, 'ltr').direction).toBe('ltr');
  });

  it('assigns a unique id to each row', () => {
    const a = createEmptyRow(3);
    const b = createEmptyRow(3);
    expect(a.id).not.toBe(b.id);
  });
});

describe('createEmptyPattern', () => {
  it('creates a pattern with one rtl row of N empty cells', () => {
    const p = createEmptyPattern('Test', 12);
    expect(p.rows.length).toBe(1);
    expect(p.rows[0]?.cells.length).toBe(12);
    expect(p.rows[0]?.direction).toBe('rtl');
  });

  it('always includes the base color as colors[0]', () => {
    const p = createEmptyPattern('Test', 5);
    expect(p.colors[0]?.isBase).toBe(true);
    expect(p.colors[0]?.id).toBe('base');
  });

  it('falls back to a default name when given empty/whitespace name', () => {
    expect(createEmptyPattern('   ', 5).name).toBe('Wzór bez nazwy');
    expect(createEmptyPattern('', 5).name).toBe('Wzór bez nazwy');
  });

  it('stores ISO 8601 timestamps for createdAt/updatedAt', () => {
    const p = createEmptyPattern('Test', 5);
    expect(p.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(p.updatedAt).toBe(p.createdAt);
  });
});

describe('flipDirection', () => {
  it('rtl ↔ ltr', () => {
    expect(flipDirection('rtl')).toBe('ltr');
    expect(flipDirection('ltr')).toBe('rtl');
  });
});

describe('isPatternValid', () => {
  it('accepts a freshly created pattern', () => {
    const p = createEmptyPattern('Test', 5);
    expect(isPatternValid(p)).toBe(true);
  });

  it('rejects when colors is empty', () => {
    const p = createEmptyPattern('Test', 5);
    expect(isPatternValid({ ...p, colors: [] })).toBe(false);
  });

  it('rejects when colors[0] is not the base', () => {
    const p = createEmptyPattern('Test', 5);
    const swapped = { ...p, colors: [...p.colors].reverse() };
    expect(isPatternValid(swapped)).toBe(false);
  });

  it('rejects when a non-zero color claims isBase', () => {
    const p = createEmptyPattern('Test', 5);
    const corrupt = {
      ...p,
      colors: [
        p.colors[0]!,
        { ...p.colors[1]!, isBase: true },
      ],
    };
    expect(isPatternValid(corrupt)).toBe(false);
  });
});

describe('countStitches', () => {
  it('returns 0 for an empty pattern', () => {
    const p = createEmptyPattern('Test', 5);
    expect(countStitches(p)).toBe(0);
  });

  it('counts only non-null cells', () => {
    const p = createEmptyPattern('Test', 4);
    p.rows[0]!.cells[0] = { stitch: 'sc', colorId: 'base' };
    p.rows[0]!.cells[2] = { stitch: 'dc', colorId: 'base' };
    expect(countStitches(p)).toBe(2);
  });
});
