import { describe, it, expect } from 'vitest';
import { isDarkHex, BASE_COLOR, DEFAULT_PALETTE } from './colors';

describe('isDarkHex', () => {
  it('classifies black as dark', () => {
    expect(isDarkHex('#000000')).toBe(true);
  });

  it('classifies white as light', () => {
    expect(isDarkHex('#FFFFFF')).toBe(false);
  });

  it('classifies cream as light', () => {
    expect(isDarkHex('#F5EDE0')).toBe(false);
  });

  it('classifies dark burgundy/rose as dark-ish (under 0.5 lum)', () => {
    expect(isDarkHex('#4A4A4A')).toBe(true);
  });

  it('returns false for malformed hex', () => {
    expect(isDarkHex('not-a-hex')).toBe(false);
    expect(isDarkHex('#abc')).toBe(false);
  });

  it('handles missing leading hash', () => {
    expect(isDarkHex('000000')).toBe(true);
    expect(isDarkHex('ffffff')).toBe(false);
  });
});

describe('BASE_COLOR', () => {
  it('is the locked base sentinel', () => {
    expect(BASE_COLOR.isBase).toBe(true);
    expect(BASE_COLOR.id).toBe('base');
  });
});

describe('DEFAULT_PALETTE', () => {
  it('starts with the base color', () => {
    expect(DEFAULT_PALETTE[0]).toBe(BASE_COLOR);
  });

  it('contains no other base-flagged colors', () => {
    const others = DEFAULT_PALETTE.slice(1);
    expect(others.every((c) => !c.isBase)).toBe(true);
  });
});
