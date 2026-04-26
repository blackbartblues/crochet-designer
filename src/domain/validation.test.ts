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
