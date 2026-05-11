import { describe, it, expect } from 'vitest';
import { symbolForBuiltin, symbolForCustom } from './symbols';
import type { CustomStitch } from '../domain/graph/types';

describe('symbolForBuiltin', () => {
  it('returns a glyph for sc', () => {
    const g = symbolForBuiltin('sc');
    expect(g.text).toBe('×');
    expect(g.width).toBeGreaterThan(0);
    expect(g.height).toBeGreaterThan(0);
  });

  it('returns the dc T-glyph', () => {
    expect(symbolForBuiltin('dc').text).toBe('⊤');
  });

  it('returns the magic_ring glyph (small circle)', () => {
    expect(symbolForBuiltin('magic_ring').text).toBe('○');
  });

  it('returns a glyph for every builtin type', () => {
    const types = ['ch', 'sl_st', 'sc', 'hdc', 'dc', 'tr', 'gr_st', 'magic_ring', 'fasten_off'] as const;
    for (const t of types) {
      expect(symbolForBuiltin(t)).toBeTruthy();
      expect(symbolForBuiltin(t).text.length).toBeGreaterThan(0);
    }
  });
});

describe('symbolForCustom', () => {
  it('uses the shortCode when no preset/svg path is given', () => {
    const cs: CustomStitch = {
      id: 'cs-1',
      shortCode: 'HC',
      nameByLanguage: { pl: 'X', en: 'Y' },
      symbol: { kind: 'preset', presetId: 'shell' },
    };
    const g = symbolForCustom(cs);
    expect(g.text.toLowerCase()).toContain('hc');
  });
});
