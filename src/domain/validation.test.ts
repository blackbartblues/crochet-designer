import { describe, it, expect } from 'vitest';
import { parsePatternJson, serializePattern, PatternFileError } from './validation';
import { createEmptyPattern } from './pattern';

describe('serializePattern + parsePatternJson round-trip', () => {
  it('round-trips a freshly created pattern', () => {
    const original = createEmptyPattern('Test', 5);
    const json = serializePattern(original);
    const parsed = parsePatternJson(json);
    expect(parsed).toEqual(original);
  });

  it('round-trips a pattern with painted cells', () => {
    const original = createEmptyPattern('With cells', 4);
    original.rows[0]!.cells[0] = { stitch: 'sc', colorId: 'base' };
    original.rows[0]!.cells[3] = { stitch: 'dc', colorId: 'base' };
    const parsed = parsePatternJson(serializePattern(original));
    expect(parsed.rows[0]?.cells).toEqual(original.rows[0]?.cells);
  });
});

describe('parsePatternJson rejection cases', () => {
  it('throws on invalid JSON', () => {
    expect(() => parsePatternJson('not json {')).toThrow(PatternFileError);
  });

  it('throws on unknown schemaVersion', () => {
    const pattern = createEmptyPattern('T', 3);
    const bad = { ...pattern, schemaVersion: 999 };
    expect(() => parsePatternJson(JSON.stringify(bad))).toThrow(PatternFileError);
  });

  it('throws when colors[] is empty', () => {
    const pattern = createEmptyPattern('T', 3);
    const bad = { ...pattern, colors: [] };
    expect(() => parsePatternJson(JSON.stringify(bad))).toThrow(PatternFileError);
  });

  it('throws when colors[0] is not the base color', () => {
    const pattern = createEmptyPattern('T', 3);
    const bad = {
      ...pattern,
      colors: [{ ...pattern.colors[0]!, isBase: false }],
    };
    expect(() => parsePatternJson(JSON.stringify(bad))).toThrow(PatternFileError);
  });

  it('throws when a non-zero color claims isBase', () => {
    const pattern = createEmptyPattern('T', 3);
    const bad = {
      ...pattern,
      colors: [
        pattern.colors[0]!,
        { id: 'x', name: 'Bad', hex: '#FF0000', isBase: true },
      ],
    };
    expect(() => parsePatternJson(JSON.stringify(bad))).toThrow(PatternFileError);
  });

  it('throws when rows have inconsistent length', () => {
    const pattern = createEmptyPattern('T', 3);
    pattern.rows.push({ id: 'r2', direction: 'ltr', cells: [null, null] }); // wrong length
    expect(() => parsePatternJson(JSON.stringify(pattern))).toThrow(/różne długości/i);
  });

  it('throws when a cell references unknown colorId', () => {
    const pattern = createEmptyPattern('T', 3);
    pattern.rows[0]!.cells[0] = { stitch: 'sc', colorId: 'no-such-color' };
    expect(() => parsePatternJson(JSON.stringify(pattern))).toThrow(/nieistniejącego koloru/i);
  });

  it('throws on invalid hex color', () => {
    const pattern = createEmptyPattern('T', 3);
    const bad = {
      ...pattern,
      colors: [{ ...pattern.colors[0]!, hex: 'not-a-hex' }],
    };
    expect(() => parsePatternJson(JSON.stringify(bad))).toThrow(PatternFileError);
  });

  it('throws on missing required fields', () => {
    expect(() => parsePatternJson(JSON.stringify({ schemaVersion: 1 }))).toThrow(PatternFileError);
  });
});

describe('schemaVersion 1 → 2 migration', () => {
  function v1Pattern() {
    const v2 = createEmptyPattern('Migrated', 4);
    // Strip v2-only fields and downgrade schemaVersion
    const { customStitches: _drop, ...rest } = v2;
    return { ...rest, schemaVersion: 1 as const };
  }

  it('accepts a valid v1 file and migrates it to v2', () => {
    const parsed = parsePatternJson(JSON.stringify(v1Pattern()));
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.customStitches).toEqual([]);
  });

  it('preserves rows, colors, and displayMode through migration', () => {
    const orig = v1Pattern();
    const parsed = parsePatternJson(JSON.stringify(orig));
    expect(parsed.rows).toEqual(orig.rows);
    expect(parsed.colors).toEqual(orig.colors);
    expect(parsed.displayMode).toBe(orig.displayMode);
  });

  it('migration is idempotent (re-serializing yields v2)', () => {
    const v1Json = JSON.stringify(v1Pattern());
    const once = parsePatternJson(v1Json);
    const twice = parsePatternJson(serializePattern(once));
    expect(twice.schemaVersion).toBe(2);
    expect(twice).toEqual(once);
  });
});

describe('custom stitches in v2 schema', () => {
  it('accepts a pattern with valid customStitches', () => {
    const p = createEmptyPattern('Custom', 3);
    p.customStitches.push({
      key: 'custom:abc',
      code: 'X',
      labelPl: 'mój',
      labelEn: 'mine',
      createdAt: new Date().toISOString(),
    });
    const round = parsePatternJson(serializePattern(p));
    expect(round.customStitches.length).toBe(1);
    expect(round.customStitches[0]?.code).toBe('X');
  });

  it('rejects duplicate custom keys', () => {
    const p = createEmptyPattern('T', 3);
    const now = new Date().toISOString();
    p.customStitches.push(
      { key: 'custom:abc', code: 'X', createdAt: now },
      { key: 'custom:abc', code: 'Y', createdAt: now },
    );
    expect(() => parsePatternJson(serializePattern(p))).toThrow(/Zduplikowany klucz/);
  });

  it('rejects custom code colliding with built-in', () => {
    const p = createEmptyPattern('T', 3);
    p.customStitches.push({
      key: 'custom:abc',
      code: 'sc',
      createdAt: new Date().toISOString(),
    });
    expect(() => parsePatternJson(serializePattern(p))).toThrow(/koliduje z wbudowanym/);
  });

  it('rejects duplicate custom codes', () => {
    const p = createEmptyPattern('T', 3);
    const now = new Date().toISOString();
    p.customStitches.push(
      { key: 'custom:a', code: 'X', createdAt: now },
      { key: 'custom:b', code: 'x', createdAt: now }, // case-insensitive collision
    );
    expect(() => parsePatternJson(serializePattern(p))).toThrow(/Zduplikowany skrót/);
  });

  it('clears orphaned custom-stitch references in cells (does not throw)', () => {
    const p = createEmptyPattern('T', 3);
    // No customStitches declared, but a cell references custom:ghost
    p.rows[0]!.cells[0] = { stitch: 'custom:ghost' as never, colorId: 'base' };
    const report = { orphanedCellsCleared: 0 };
    const parsed = parsePatternJson(serializePattern(p), report);
    expect(report.orphanedCellsCleared).toBe(1);
    expect(parsed.rows[0]?.cells[0]).toBeNull();
  });

  it('strips unknown symbolRef values (renderer falls back)', () => {
    const p = createEmptyPattern('T', 3);
    p.customStitches.push({
      key: 'custom:abc',
      code: 'X',
      symbolRef: 'lib-does-not-exist',
      createdAt: new Date().toISOString(),
    });
    const parsed = parsePatternJson(serializePattern(p));
    expect(parsed.customStitches[0]?.symbolRef).toBeUndefined();
  });
});
