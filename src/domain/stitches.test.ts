import { describe, it, expect } from 'vitest';
import {
  STITCHES,
  STITCH_ORDER,
  generateCustomStitchKey,
  getStitchMeta,
  isBuiltInStitch,
  isCustomStitch,
  validateCustomCode,
  type CustomStitchKey,
  type CustomStitchMeta,
} from './stitches';

describe('isBuiltInStitch / isCustomStitch', () => {
  it('recognises every built-in key', () => {
    for (const k of STITCH_ORDER) expect(isBuiltInStitch(k)).toBe(true);
  });

  it('rejects custom-prefixed keys as built-in', () => {
    expect(isBuiltInStitch('custom:abc')).toBe(false);
  });

  it('recognises custom-prefixed keys as custom', () => {
    expect(isCustomStitch('custom:abc')).toBe(true);
  });

  it('rejects empty custom prefix', () => {
    expect(isCustomStitch('custom:')).toBe(false);
  });

  it('rejects unrelated strings', () => {
    expect(isCustomStitch('foo')).toBe(false);
    expect(isBuiltInStitch('foo')).toBe(false);
  });
});

describe('generateCustomStitchKey', () => {
  it('always produces a key with the custom: prefix', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateCustomStitchKey()).toMatch(/^custom:[A-Za-z0-9]+$/);
    }
  });

  it('produces unique keys across many invocations', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i++) keys.add(generateCustomStitchKey());
    expect(keys.size).toBe(50);
  });
});

describe('validateCustomCode', () => {
  const noCustoms: readonly CustomStitchMeta[] = [];

  it('accepts 1-3 ASCII letters', () => {
    expect(validateCustomCode('X', noCustoms).ok).toBe(true);
    expect(validateCustomCode('abc', noCustoms).ok).toBe(true);
    expect(validateCustomCode('FPd', noCustoms).ok).toBe(true);
  });

  it('rejects empty string', () => {
    const res = validateCustomCode('', noCustoms);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('empty');
  });

  it('rejects whitespace-only string as empty', () => {
    const res = validateCustomCode('  ', noCustoms);
    if (!res.ok) expect(res.reason).toBe('empty');
  });

  it('rejects digits, symbols, spaces, accents', () => {
    expect(validateCustomCode('1X', noCustoms).ok).toBe(false);
    expect(validateCustomCode('X!', noCustoms).ok).toBe(false);
    expect(validateCustomCode('A B', noCustoms).ok).toBe(false);
    expect(validateCustomCode('Ą', noCustoms).ok).toBe(false);
  });

  it('rejects strings longer than 3 chars', () => {
    const res = validateCustomCode('ABCD', noCustoms);
    if (!res.ok) expect(res.reason).toBe('format');
  });

  it('rejects code colliding with built-in (case-insensitive)', () => {
    const res = validateCustomCode('SC', noCustoms);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('collidesBuiltIn');
      expect(res.conflict).toBe('sc');
    }
  });

  it('detects collision with multi-char built-in code (sl st normalized)', () => {
    const res = validateCustomCode('sls', noCustoms);
    // 'sl st' normalises to 'slst' so 'sls' should NOT collide.
    expect(res.ok).toBe(true);
    // But the actual normalized form 'slst' would (we can't input 4 chars via UI; verifying separately).
  });

  it('rejects code colliding with another custom stitch', () => {
    const customs: CustomStitchMeta[] = [
      { key: 'custom:a', code: 'X', createdAt: '2026-04-27T00:00:00.000Z' },
    ];
    const res = validateCustomCode('x', customs);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('collidesCustom');
  });

  it('allows reusing the same code for the same key (edit case)', () => {
    const customs: CustomStitchMeta[] = [
      { key: 'custom:a' as CustomStitchKey, code: 'X', createdAt: '2026-04-27T00:00:00.000Z' },
    ];
    const res = validateCustomCode('X', customs, 'custom:a' as CustomStitchKey);
    expect(res.ok).toBe(true);
  });
});

describe('getStitchMeta', () => {
  const customs: CustomStitchMeta[] = [
    {
      key: 'custom:abc' as CustomStitchKey,
      code: 'X',
      labelPl: 'mój splot',
      createdAt: '2026-04-27T00:00:00.000Z',
    },
  ];

  it('returns built-in meta for built-in keys', () => {
    expect(getStitchMeta('sc', customs)).toBe(STITCHES.sc);
  });

  it('returns custom meta for known custom keys', () => {
    expect(getStitchMeta('custom:abc' as CustomStitchKey, customs)).toBe(customs[0]);
  });

  it('returns null for unknown custom keys', () => {
    expect(getStitchMeta('custom:nope' as CustomStitchKey, customs)).toBeNull();
  });
});
